---
alwaysApply: false
title: "Contributing to Doc-Bot"
description: "Guidelines for contributing to the doc-bot project"
keywords: ["contributing", "development", "pull-request", "github", "open-source"]
---

# Contributing to Doc-Bot

Thank you for your interest in contributing to doc-bot! This guide will help you get started with development.

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- A code editor (VS Code recommended)
- Basic understanding of MCP (Model Context Protocol)

### Getting Started

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/doc-bot.git
   cd doc-bot
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Tests**
   ```bash
   npm test
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Code Structure

```
doc-bot/
├── src/
│   ├── index.js                    # Main MCP server
│   └── services/                   # Core services
│       ├── DocumentationService.js # Doc management
│       ├── UnifiedSearchService.js # Search logic
│       ├── InferenceEngine.js      # AI inference
│       ├── DocumentIndex.js        # Indexing
│       └── docset/                 # Docset support
├── bin/
│   └── doc-bot.js                  # CLI entry point
├── prompts/                        # Agent templates
└── test-fixtures/                  # Test files
```

## Development Guidelines

### Code Style

- Use ES modules (import/export)
- Async/await over promises
- Meaningful variable names
- Comment complex logic
- Keep functions focused

### Testing

Write tests for:
- New features
- Bug fixes
- Edge cases
- Error handling

Example test:
```javascript
describe('YourFeature', () => {
  it('should handle normal case', async () => {
    // Test implementation
  });
  
  it('should handle error case', async () => {
    // Error test
  });
});
```

### Commit Messages

Follow conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `test:` Test changes
- `refactor:` Code refactoring
- `chore:` Maintenance

Examples:
```
feat: add support for .mdx files
fix: handle missing frontmatter gracefully
docs: update API reference for new tool
```

## Adding New Features

### 1. Adding a New MCP Tool

1. Define tool in `src/index.js`:
   ```javascript
   {
     name: 'your_tool_name',
     description: 'Clear description',
     inputSchema: {
       type: 'object',
       properties: {
         param: { type: 'string', description: 'Param description' }
       },
       required: ['param']
     }
   }
   ```

2. Implement handler:
   ```javascript
   case 'your_tool_name':
     return await this.handleYourTool(params);
   ```

3. Add method:
   ```javascript
   async handleYourTool(params) {
     // Implementation
   }
   ```

4. Write tests
5. Update API documentation

### 2. Adding Search Features

1. Extend `UnifiedSearchService` or `DocumentationService`
2. Update scoring algorithms if needed
3. Add tests for new search behavior
4. Document changes in architecture guide

### 3. Adding Docset Support

1. Extend `DocsetDatabase` for new query types
2. Update `MultiDocsetDatabase` if needed
3. Consider performance implications
4. Add integration tests

## Testing Your Changes

> **📚 See [Running Tests Guide](running-tests.md) for complete testing instructions**

### Local Testing with Claude

1. Build your changes:
   ```bash
   npm run build  # if build step exists
   ```

2. Update Claude config to use local version:
   ```json
   {
     "mcpServers": {
       "doc-bot-dev": {
         "command": "node",
         "args": ["/path/to/your/doc-bot/bin/doc-bot.js", "--verbose"]
       }
     }
   }
   ```

3. Test all tools work correctly

### Running Tests

```bash
# Run all tests (NODE_OPTIONS handled automatically)
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests only
npm run test:e2e

# Watch mode for development
npm run test:watch

# Run specific test file
NODE_OPTIONS="--experimental-vm-modules" npm test -- UnifiedSearchService.test.js
```

## Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make Changes**
   - Write code
   - Add tests
   - Update documentation

3. **Run Checks**
   ```bash
   npm test
   npm run lint
   ```

4. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feat/your-feature-name
   ```

5. **Create Pull Request**
   - Clear description of changes
   - Link related issues
   - Include test results
   - Update documentation if needed

## Common Development Tasks

### Debugging

1. Use verbose mode:
   ```javascript
   if (this.options.verbose) {
     console.log('Debug info:', data);
   }
   ```

2. Add debug logs temporarily:
   ```javascript
   console.error('[DEBUG]', 'Service method:', params);
   ```

3. Use Node.js debugger:
   ```bash
   node --inspect bin/doc-bot.js --verbose
   ```

### Performance Profiling

```javascript
// Add timing
const start = Date.now();
// ... operation ...
if (this.options.verbose) {
  console.log(`Operation took ${Date.now() - start}ms`);
}
```

### Memory Debugging

```bash
# Run with memory profiling
node --expose-gc --max-old-space-size=4096 bin/doc-bot.js

# Check memory usage
process.memoryUsage()
```

## Architecture Decisions

### Why MCP?

- Standard protocol for AI tools
- Language agnostic
- Supports streaming
- Built-in tool discovery

### Why SQLite for Docsets?

- Dash/Zeal compatibility
- Fast full-text search
- No external dependencies
- Embedded database

### Why In-Memory Caching?

- Fast repeated searches
- Documentation rarely changes
- Reasonable memory footprint
- Simple implementation

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Run all tests
4. Create git tag
5. Push to GitHub
6. npm publish

## Getting Help

- GitHub Issues: Bug reports and features
- Discussions: General questions
- Code Review: PR feedback

## Code of Conduct

- Be respectful
- Welcome newcomers
- Focus on constructive feedback
- Follow project guidelines