---
alwaysApply: false
title: "Testing Guide"
description: "How to write and run tests"
keywords: ["testing", "jest", "unit tests", "integration tests", "test coverage"]
---

# Testing Guide

How to write and run tests for the doc-bot project.

> **📚 For complete instructions on running the test suite, see [Running Tests Guide](running-tests.md)**

## Testing Framework

Doc-bot uses Jest as its testing framework with ES modules support.

### Configuration

Jest is configured in `package.json`:

```json
"jest": {
  "testEnvironment": "node",
  "transform": {}
}
```

## Running Tests

### Basic Test Execution

```bash
# Run all tests
npm test

# With ES modules support (required)
NODE_OPTIONS=--experimental-vm-modules npm test
```

### Test Scripts

The following test scripts are available:

- `npm test` - Run all tests once
- `npm run test:watch` - Watch mode (requires ES module config)
- `npm run test:coverage` - Generate coverage report (requires ES module config)

Note: Due to ES modules, watch and coverage commands need the NODE_OPTIONS flag:
```bash
NODE_OPTIONS=--experimental-vm-modules npm run test:watch
```

## Test Structure

### Directory Organization

```
doc-bot/
├── src/
│   ├── index.test.js              # Main server tests
│   └── services/
│       └── __tests__/             # Service unit tests
│           ├── DocumentationService.test.js
│           ├── InferenceEngine.test.js
│           └── DocumentIndex.test.js
├── test-manifest.js               # Test utility for manifest
├── test-server.js                 # Test server setup
└── test-utils.js                  # Shared test utilities
```

### Test File Naming

- Unit tests: `*.test.js`
- Integration tests: `*.integration.test.js`
- Test utilities: `test-*.js`

## Writing Tests

### Basic Test Structure

```javascript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { DocumentationService } from '../DocumentationService.js';

describe('DocumentationService', () => {
  let service;

  beforeEach(() => {
    service = new DocumentationService();
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('loadDocuments', () => {
    it('should load markdown files from directory', async () => {
      // Arrange
      const docsPath = './test-docs';
      
      // Act
      await service.loadDocuments(docsPath);
      
      // Assert
      expect(service.documents.size).toBeGreaterThan(0);
    });

    it('should handle missing directory gracefully', async () => {
      // Arrange
      const docsPath = './non-existent';
      
      // Act & Assert
      await expect(service.loadDocuments(docsPath))
        .rejects
        .toThrow('Directory not found');
    });
  });
});
```

### Testing Async Operations

```javascript
// Using async/await
it('should process documents asynchronously', async () => {
  const result = await service.processDocument('test.md');
  expect(result).toBeDefined();
});

// Testing rejected promises
it('should reject with error for invalid input', async () => {
  await expect(service.processDocument(null))
    .rejects
    .toThrow('Invalid input');
});
```

### Mocking Dependencies

```javascript
import { jest } from '@jest/globals';
import fs from 'fs-extra';

// Mock fs-extra module
jest.mock('fs-extra');

describe('DocumentationService with mocks', () => {
  beforeEach(() => {
    // Setup mock responses
    fs.readFile.mockResolvedValue('# Test Content');
    fs.readdir.mockResolvedValue(['doc1.md', 'doc2.md']);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should use mocked file system', async () => {
    const service = new DocumentationService();
    await service.loadDocument('test.md');
    
    expect(fs.readFile).toHaveBeenCalledWith(
      expect.stringContaining('test.md'),
      'utf-8'
    );
  });
});
```

## Testing Best Practices

### 1. Test Organization

- **Arrange-Act-Assert** pattern
- One assertion per test when possible
- Descriptive test names

### 2. Test Data

Create test fixtures for consistent testing:

```javascript
// test/fixtures/documents.js
export const mockDocument = {
  fileName: 'test.md',
  metadata: {
    title: 'Test Document',
    keywords: ['test', 'mock']
  },
  content: '# Test Content'
};
```

### 3. Integration Tests

For testing the complete MCP server:

```javascript
// src/index.integration.test.js
import { DocsServer } from './index.js';

describe('DocsServer Integration', () => {
  let server;

  beforeEach(async () => {
    server = new DocsServer();
    await server.initialize('./test-docs');
  });

  it('should handle tool requests', async () => {
    const result = await server.handleTool({
      name: 'search_documentation',
      arguments: { query: 'test' }
    });
    
    expect(result).toBeDefined();
    expect(result.content).toContain('documentation');
  });
});
```

### 4. Testing MCP Protocol

Test the MCP server communication:

```javascript
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

describe('MCP Protocol', () => {
  it('should respond to tool list requests', async () => {
    const transport = new StdioServerTransport();
    const server = new DocsServer();
    
    await server.connect(transport);
    
    const tools = await server.listTools();
    expect(tools).toContain({
      name: 'search_documentation',
      description: expect.any(String)
    });
  });
});
```

## Common Testing Scenarios

### 1. Testing File Operations

```javascript
it('should handle file reading errors', async () => {
  const service = new DocumentationService();
  
  // Force an error condition
  jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('EACCES'));
  
  await expect(service.loadDocument('restricted.md'))
    .rejects
    .toThrow('Permission denied');
});
```

### 2. Testing Document Parsing

```javascript
it('should parse frontmatter correctly', () => {
  const content = `---
title: Test
keywords: [test, sample]
---
# Content`;

  const result = service.parseDocument(content);
  
  expect(result.metadata.title).toBe('Test');
  expect(result.metadata.keywords).toEqual(['test', 'sample']);
});
```

### 3. Testing Search and Indexing

```javascript
describe('InferenceEngine', () => {
  it('should find relevant documents', async () => {
    const engine = new InferenceEngine();
    await engine.indexDocuments(mockDocuments);
    
    const results = engine.search('authentication');
    
    expect(results).toHaveLength(2);
    expect(results[0].confidence).toBeGreaterThan(0.5);
  });
});
```

## Debugging Tests

### 1. Verbose Output

```bash
# Run tests with detailed output
NODE_OPTIONS=--experimental-vm-modules npm test -- --verbose
```

### 2. Debug Specific Tests

```bash
# Run specific test file
NODE_OPTIONS=--experimental-vm-modules npm test -- DocumentationService.test.js

# Run tests matching pattern
NODE_OPTIONS=--experimental-vm-modules npm test -- --testNamePattern="should load"
```

### 3. VS Code Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "env": {
    "NODE_OPTIONS": "--experimental-vm-modules"
  },
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Test Coverage

While coverage commands require ES module configuration, you can generate reports:

```bash
NODE_OPTIONS=--experimental-vm-modules npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## Continuous Integration

For CI environments, ensure Node.js 18+ and set the NODE_OPTIONS:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test
  env:
    NODE_OPTIONS: --experimental-vm-modules
```

## Troubleshooting

### ES Module Errors

If you see errors like "Cannot use import statement outside a module":
1. Ensure `NODE_OPTIONS=--experimental-vm-modules` is set
2. Check that test files use `.js` extensions in imports
3. Verify `"type": "module"` in package.json

### Mock Not Working

1. Clear Jest cache: `jest --clearCache`
2. Ensure mocks are set up before imports
3. Use `jest.mock()` at the top of the test file

### Timeout Issues

For long-running tests:
```javascript
it('should handle large datasets', async () => {
  // Increase timeout to 10 seconds
  jest.setTimeout(10000);
  
  // Test implementation
}, 10000);
```