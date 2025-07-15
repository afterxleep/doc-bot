---
alwaysApply: true
title: "Coding Standards"
description: "Core coding standards that apply to all code"
keywords: ["coding", "standards", "style", "conventions", "best practices"]
---

# Coding Standards

Core coding standards that apply to all code in the doc-bot project.

## General Principles

1. **Clarity over cleverness** - Write code that is easy to understand
2. **Consistency** - Follow existing patterns in the codebase
3. **Error handling** - Always handle errors gracefully
4. **Documentation** - Document complex logic and public APIs

## JavaScript/Node.js Standards

### ES Modules

This project uses ES modules (`"type": "module"` in package.json):

```javascript
// ✅ Good - use .js extension in imports
import { DocumentationService } from './services/DocumentationService.js';

// ❌ Bad - missing extension
import { DocumentationService } from './services/DocumentationService';
```

### Node.js Version

- Minimum supported version: Node.js >= 18.0.0
- Use modern JavaScript features available in Node 18+

### File Naming

- **Classes**: PascalCase (e.g., `DocumentationService.js`)
- **Utilities**: camelCase (e.g., `helpers.js`)
- **Tests**: `*.test.js` or in `__tests__/` directories
- **CLI tools**: kebab-case (e.g., `doc-bot.js`)

### Code Organization

```javascript
// 1. Imports (grouped by type)
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import fs from 'fs-extra';

import { DocumentationService } from './services/DocumentationService.js';
import { logger } from './utils/logger.js';

// 2. Constants
const DEFAULT_DOCS_DIR = 'doc-bot';

// 3. Class/Function definitions
export class DocsServer extends Server {
  // Implementation
}

// 4. Exports (if not using export with declaration)
export { DocsServer };
```

### Async/Await

Always use async/await over callbacks or raw promises:

```javascript
// ✅ Good
async function loadDocuments() {
  try {
    const files = await fs.readdir(docsPath);
    return files;
  } catch (error) {
    logger.error('Failed to load documents:', error);
    throw error;
  }
}

// ❌ Bad
function loadDocuments() {
  return fs.readdir(docsPath)
    .then(files => files)
    .catch(error => {
      logger.error('Failed to load documents:', error);
      throw error;
    });
}
```

### Error Handling

```javascript
// ✅ Good - specific error handling
try {
  const doc = await this.loadDocument(fileName);
  return doc;
} catch (error) {
  if (error.code === 'ENOENT') {
    throw new Error(`Document not found: ${fileName}`);
  }
  throw new Error(`Failed to load document: ${error.message}`);
}

// ❌ Bad - generic error handling
try {
  const doc = await this.loadDocument(fileName);
  return doc;
} catch (error) {
  throw error;
}
```

## Documentation Standards

### Frontmatter

All documentation files must include frontmatter:

```markdown
---
title: Document Title        # Required
keywords: [key1, key2]       # Optional but recommended
topics: [topic1, topic2]     # Optional
filePatterns: ["*.js"]       # Optional
alwaysApply: false          # Optional (default: false)
confidence: 0.9             # Optional (default: 1.0)
---
```

### Code Comments

```javascript
// ✅ Good - explains why, not what
// Use a map for O(1) lookup performance with large document sets
const documentCache = new Map();

// ❌ Bad - explains what (obvious from code)
// Create a new Map
const documentCache = new Map();
```

### JSDoc for Public APIs

```javascript
/**
 * Loads and indexes documentation from the specified directory
 * @param {string} docsPath - Path to documentation directory
 * @param {Object} options - Configuration options
 * @param {boolean} options.watch - Enable file watching
 * @returns {Promise<void>}
 * @throws {Error} If documentation directory doesn't exist
 */
async function loadDocumentation(docsPath, options = {}) {
  // Implementation
}
```

## Testing Standards

### Test Structure

```javascript
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('DocumentationService', () => {
  let service;

  beforeEach(() => {
    service = new DocumentationService();
  });

  describe('loadDocument', () => {
    it('should load a valid markdown file', async () => {
      // Arrange
      const fileName = 'test.md';
      
      // Act
      const result = await service.loadDocument(fileName);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.content).toContain('expected content');
    });
  });
});
```

### Test Naming

- Use descriptive test names that explain the scenario
- Format: "should [expected behavior] when [condition]"

## Anti-Patterns to Avoid

### 1. Modifying Global State

```javascript
// ❌ Bad
global.config = { verbose: true };

// ✅ Good
export class Config {
  constructor(options) {
    this.verbose = options.verbose || false;
  }
}
```

### 2. Synchronous File Operations

```javascript
// ❌ Bad
const content = fs.readFileSync(filePath, 'utf-8');

// ✅ Good
const content = await fs.readFile(filePath, 'utf-8');
```

### 3. Hardcoded Values

```javascript
// ❌ Bad
const timeout = 5000;

// ✅ Good
const DEFAULT_TIMEOUT = 5000;
const timeout = options.timeout || DEFAULT_TIMEOUT;
```

### 4. Nested Callbacks

```javascript
// ❌ Bad
loadFile(file1, (err1, data1) => {
  if (err1) return callback(err1);
  loadFile(file2, (err2, data2) => {
    if (err2) return callback(err2);
    process(data1, data2, callback);
  });
});

// ✅ Good
try {
  const data1 = await loadFile(file1);
  const data2 = await loadFile(file2);
  return await process(data1, data2);
} catch (error) {
  throw new Error(`Processing failed: ${error.message}`);
}
```

## Security Standards

1. **Never commit secrets** - Use environment variables
2. **Validate inputs** - Especially file paths and user-provided data
3. **Sanitize outputs** - Prevent injection attacks
4. **Use secure dependencies** - Keep dependencies updated

## Performance Guidelines

1. **Use caching** - Cache frequently accessed data
2. **Batch operations** - Group multiple operations when possible
3. **Lazy loading** - Load resources only when needed
4. **Efficient algorithms** - Use appropriate data structures

## Git Commit Standards

- Use conventional commits format
- Keep commits focused and atomic
- Write clear commit messages
- Reference issues when applicable

Example:
```
feat: add document indexing for faster search
fix: handle missing frontmatter gracefully
docs: update API documentation
test: add integration tests for inference engine
```