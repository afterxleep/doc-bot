---
alwaysApply: false
title: "Doc-Bot Development"
description: "Internal development documentation for the doc-bot project"
keywords: ["development", "internal", "implementation", "code", "architecture"]
filePatterns: ["src/**/*.js", "bin/**/*.js"]
---

# Doc-Bot Development

Internal development documentation for doc-bot maintainers and contributors.

## Core Implementation Details

### MCP Server Implementation

The main server (`src/index.js`) extends the MCP SDK Server class:

```javascript
class DocsServer {
  constructor(options = {}) {
    // Default options
    this.options = {
      docsPath: options.docsPath || './doc-bot',
      docsetsPath: options.docsetsPath || path.join(os.homedir(), 'Developer', 'DocSets'),
      verbose: options.verbose || false,
      watch: options.watch || false
    };
    
    // Initialize MCP server
    this.server = new Server({
      name: 'doc-bot',
      version: '1.12.0',
      description: 'Generic MCP server for intelligent documentation access'
    });
  }
}
```

### Service Initialization Order

Services must be initialized in the correct order due to dependencies:

1. DocumentationService (no dependencies)
2. InferenceEngine (depends on DocumentationService)
3. DocsetService (no dependencies)
4. MultiDocsetDatabase (no dependencies)
5. UnifiedSearchService (depends on DocumentationService and MultiDocsetDatabase)

### Memory Management

#### Document Caching
- All project documentation is loaded into memory on startup
- Documents are stored in a Map: `fileName -> document object`
- Hot reload updates individual documents without full reload

#### Docset Connections
- SQLite connections are opened lazily on first search
- Connections remain open for the server lifetime
- Each docset has its own database connection

#### Search Caching
- ParallelSearchManager uses LRU cache (100 entries max)
- Cache TTL: 5 minutes
- Cache key includes search terms and options

### Performance Considerations

#### Search Optimization
```javascript
// Parallel search triggers for >3 docsets
if (this.databases.size > 3) {
  return this.parallelSearchManager.searchDocsetsParallel(...);
}
```

#### Relevance Scoring
- Project docs get 5x boost to ensure they rank higher
- Minimum relevance threshold: 5%
- Dynamic quality filtering based on top results

#### Timeout Protection
- Individual docset searches timeout after 2 seconds
- Prevents slow docsets from blocking all results

### Error Handling Strategy

#### Graceful Degradation
```javascript
try {
  // Try operation
} catch (error) {
  if (this.options.verbose) {
    console.error('Error details:', error);
  }
  // Return empty result instead of throwing
  return [];
}
```

#### Service Isolation
- Each service handles its own errors
- Failures in one docset don't affect others
- Missing directories return empty results

### Tool Implementation Pattern

Each tool follows this pattern:

```javascript
// 1. Tool definition in setupHandlers()
{
  name: 'tool_name',
  description: 'Clear description',
  inputSchema: { /* JSON Schema */ }
}

// 2. Handler in handleToolCall()
case 'tool_name':
  return await this.handleToolName(params);

// 3. Implementation method
async handleToolName(params) {
  try {
    // Validate params
    // Call appropriate service
    // Format response
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Adding New Search Algorithms

1. Extend scoring in `DocumentationService.calculateAdvancedRelevanceScore()`
2. Add new term extraction in `UnifiedSearchService.parseQuery()`
3. Update `DocsetDatabase.searchWithTerms()` for SQL queries
4. Add tests for edge cases

### Debugging Techniques

#### Verbose Logging
```javascript
if (this.options.verbose) {
  console.log('[ServiceName]', 'Operation:', details);
}
```

#### Performance Timing
```javascript
const start = Date.now();
const result = await operation();
if (this.options.verbose) {
  console.log(`Operation took ${Date.now() - start}ms`);
}
```

#### Search Debugging
```javascript
// Log search internals
console.log('Query terms:', searchTerms);
console.log('Results before filtering:', results.length);
console.log('Results after filtering:', filtered.length);
```

### Testing Strategies

#### Unit Test Pattern
```javascript
describe('Service', () => {
  let service;
  
  beforeEach(() => {
    service = new Service(mockDependencies);
  });
  
  afterEach(() => {
    // Cleanup
  });
  
  it('should handle normal case', async () => {
    // Test
  });
});
```

#### Integration Testing
- Use real SQLite databases in temp directories
- Test full search flow from query to results
- Verify service interactions

#### Performance Testing
```javascript
it('should complete search within timeout', async () => {
  const start = Date.now();
  await service.search('test');
  expect(Date.now() - start).toBeLessThan(2000);
});
```

### Code Patterns and Conventions

#### Async/Await Usage
```javascript
// Good
async function loadDocuments() {
  const files = await glob('**/*.md');
  return Promise.all(files.map(f => this.loadDocument(f)));
}

// Avoid
function loadDocuments() {
  return glob('**/*.md').then(files => {
    return Promise.all(files.map(f => this.loadDocument(f)));
  });
}
```

#### Error Messages
```javascript
// Include context in errors
throw new Error(`Failed to load document: ${fileName} - ${error.message}`);

// Not just
throw new Error('Failed to load document');
```

#### Service Method Naming
- `search*` - Returns search results
- `get*` - Returns specific items
- `load*` - Loads data from disk
- `parse*` - Transforms data
- `calculate*` - Computes values
- `normalize*` - Standardizes format

### Hot Reload Implementation

The file watcher uses chokidar with these events:

```javascript
watcher
  .on('add', path => this.handleFileAdd(path))
  .on('change', path => this.handleFileChange(path))
  .on('unlink', path => this.handleFileRemove(path));
```

Debouncing is not implemented - consider adding for rapid changes.

### Security Considerations

#### Path Validation
- Always resolve to absolute paths
- Check paths are within allowed directories
- Sanitize user input for file operations

#### SQL Injection Prevention
- Use parameterized queries with better-sqlite3
- Never concatenate user input into SQL

#### Resource Limits
- Limit search results to prevent memory issues
- Timeout long-running operations
- Cap cache sizes

### Future Optimization Opportunities

1. **Incremental Indexing**: Only reindex changed documents
2. **Query Result Streaming**: Stream large result sets
3. **Background Index Building**: Build indices asynchronously
4. **Compressed Caches**: Compress cached search results
5. **Docset Preloading**: Load frequently used docsets on startup

### Known Limitations

1. **Memory Usage**: All docs loaded into memory
2. **Single Process**: No worker threads for search
3. **No Persistence**: Caches cleared on restart
4. **SQLite Locking**: Can conflict with Dash/Zeal
5. **Pattern Matching**: Simple glob, no regex support

### Development TODOs

- [ ] Add request ID for tracing
- [ ] Implement search result pagination
- [ ] Add metrics collection
- [ ] Support for encrypted docsets
- [ ] WebSocket transport option
- [ ] Search query autocomplete
- [ ] Document version tracking