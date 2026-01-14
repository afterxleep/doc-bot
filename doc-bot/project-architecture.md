---
title: "Doc-Bot Project Architecture"
description: "Overall architecture and design patterns for doc-bot"
keywords: ["architecture", "design", "patterns", "structure", "mcp", "services"]
filePatterns: ["src/**/*.js", "bin/**/*.js"]
---

# Doc-Bot Project Architecture

## Architectural Overview

Doc-bot follows a **Service-Oriented Architecture** with clear separation of concerns:

```
┌─────────────────┐
│   MCP Client    │ (Claude, Cursor, etc.)
└────────┬────────┘
         │ stdio/JSON-RPC
┌────────┴────────┐
│   MCP Server    │ (src/index.js)
├─────────────────┤
│ Service Layer   │
├─────────────────┤
│ Data Layer      │
└─────────────────┘
```

## Design Principles

1. **Separation of Concerns**: Each service has a single, well-defined responsibility
2. **Dependency Injection**: Services receive dependencies through constructors
3. **Graceful Degradation**: Errors in one component don't crash the system
4. **Performance First**: In-memory caching, parallel execution, lazy loading
5. **Extensibility**: Easy to add new tools, services, and search algorithms

## Core Components

### 1. Transport Layer
- **MCP Protocol**: Handles JSON-RPC communication over stdio
- **Request/Response**: Stateless request handling
- **Tool Discovery**: Automatic tool registration and schema validation

### 2. Service Layer
```
DocsServer
├── DocumentationService     # Project docs management
├── InferenceEngine         # Intelligent retrieval
├── UnifiedSearchService    # Combined search logic
├── DocsetService          # Docset discovery
└── MultiDocsetDatabase    # SQLite operations
    └── ParallelSearchManager  # Concurrent search
```

### 3. Data Layer
- **In-Memory Cache**: All project docs loaded on startup
- **SQLite Databases**: Read-only access to docset databases
- **File System**: Direct file access for documentation
- **LRU Cache**: Search result caching

## Key Design Patterns

### Service Pattern
```javascript
class Service {
  constructor(dependencies) {
    this.dep = dependencies;
  }
  
  async initialize() {
    // One-time setup
  }
  
  async operation(params) {
    // Core functionality
  }
}
```

### Error Handling Pattern
```javascript
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  if (this.options.verbose) {
    console.error('Details:', error);
  }
  return { success: false, error: error.message };
}
```

### Search Strategy Pattern
- Different search implementations (local vs docset)
- Unified interface through UnifiedSearchService
- Pluggable scoring algorithms

## Data Flow Architecture

### Search Request Flow
```
1. MCP Client → search_documentation(query)
2. DocsServer → UnifiedSearchService.search(query)
3. UnifiedSearchService:
   ├→ parseQuery() → extract terms
   ├→ searchLocalDocs() → DocumentationService
   └→ searchDocsets() → MultiDocsetDatabase
4. Results → normalize → deduplicate → sort
5. Response → MCP Client
```

### Document Loading Flow
```
1. Server Start → DocumentationService.initialize()
2. Scan directory → find *.md files
3. Load files → parse frontmatter → extract content
4. Build indices → DocumentIndex
5. Cache in memory → Map<fileName, document>
```

## Performance Architecture

### Caching Strategy
1. **Document Cache**: Full documents in memory
2. **Search Cache**: LRU cache with 5-minute TTL
3. **Database Connections**: Persistent SQLite connections
4. **Index Cache**: Pre-built keyword/pattern indices

### Parallel Execution
- Docset searches run concurrently
- Promise.allSettled for error isolation
- Timeout protection (2s per docset)
- Automatic parallel mode for >3 docsets

### Memory Management
- Lazy loading for docsets
- Bounded caches (100 entries max)
- Efficient data structures (Map, Set)
- No memory leaks from event listeners

## Security Architecture

### Input Validation
- JSON Schema validation for all tools
- Path sanitization and validation
- SQL parameterization for queries

### Access Control
- Read-only file system access
- Sandboxed to allowed directories
- No code execution capabilities
- No network access (except MCP)

## Extensibility Points

### Adding New Tools
1. Define in tool schema
2. Add handler method
3. Update documentation

### Adding Search Algorithms
1. Extend relevance scoring
2. Add new indices if needed
3. Update UnifiedSearchService

### Adding Data Sources
1. Create new service class
2. Integrate with UnifiedSearchService
3. Add configuration options

## Scalability Considerations

### Current Limits
- Single process execution
- All docs in memory
- Synchronous file loading
- No horizontal scaling

### Future Architecture
- Worker threads for search
- Streaming results
- Incremental indexing
- Distributed caching

## Testing Architecture

### Test Levels
1. **Unit Tests**: Individual services
2. **Integration Tests**: Service interactions
3. **E2E Tests**: Full MCP flow
4. **Performance Tests**: Search benchmarks

### Test Structure
```
src/
├── services/
│   ├── DocumentationService.js
│   └── __tests__/
│       └── DocumentationService.test.js
```

## Configuration Architecture

### Layered Configuration
1. **CLI Arguments**: Highest priority
2. **Environment Variables**: For deployment
3. **Default Values**: In code

### Configuration Flow
```
CLI Args → Options Object → Service Constructors
```

## Error Recovery Architecture

### Failure Modes
1. **Missing Directory**: Return empty results
2. **Corrupt Docset**: Skip and continue
3. **Parse Error**: Log and skip document
4. **Timeout**: Return partial results

### Recovery Strategies
- Graceful degradation
- Partial result returns
- Error isolation
- Automatic retries (not implemented)

## Monitoring Points

### Key Metrics
- Document load time
- Search response time
- Cache hit rates
- Memory usage
- Error rates

### Logging Strategy
- Verbose mode for debugging
- Error logs always visible
- Performance logs in verbose
- Structured log format (future)