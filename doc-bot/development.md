---
alwaysApply: false
title: "Development Guide"
description: "Development setup, testing, and workflow for doc-bot project"
keywords: ["development", "setup", "testing", "workflow", "debugging", "filePatterns"]
---

# Development Guide

This guide covers the development setup, testing, and workflow for the doc-bot project.

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Git

## Project Setup

1. Clone the repository:
```bash
git clone https://github.com/afterxleep/doc-bot.git
cd doc-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a documentation folder:
```bash
mkdir doc-bot
```

## Project Structure

```
doc-bot/
├── src/                         # Source code
│   ├── index.js                # Main MCP server implementation
│   ├── index.test.js           # Server tests
│   └── services/               # Core services
│       ├── DocumentationService.js
│       ├── InferenceEngine.js
│       ├── DocumentIndex.js
│       └── __tests__/          # Service tests
├── bin/                        # CLI executables
│   └── doc-bot.js             # Main CLI tool
├── prompts/                    # Agent optimization templates
│   ├── agent_integration.md
│   ├── alwaysApply.md
│   ├── checkProjectRules.md
│   ├── getFileDocs.md
│   ├── searchDocumentation.md
│   └── tools.md
├── doc-bot/                    # Documentation directory (default)
├── samples/                    # Example documentation
├── test-*.js                   # Test utilities
├── package.json               # Project configuration
├── AGENT_INTEGRATION_RULE.txt # Agent enforcement rules
└── README.md                  # Project documentation
```

## Development Scripts

```bash
# Start the server
npm start

# Start with file watching (hot reload)
npm run dev
# or
npm run start:watch

# Run with example documentation
npm run start:examples

# Run tests
npm test

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

## CLI Options

The `doc-bot` CLI supports the following options:

- `-d, --docs <path>` - Specify documentation folder (default: "doc-bot")
- `-v, --verbose` - Enable verbose logging
- `-w, --watch` - Enable file watching for hot reload

Example:
```bash
node bin/doc-bot.js --docs ./my-docs --verbose --watch
```

## Writing Documentation

Documentation files should be markdown with frontmatter:

```markdown
---
title: My Documentation
keywords: [keyword1, keyword2]
topics: [topic1, topic2]
filePatterns: ["*.js", "src/**/*.ts"]
alwaysApply: false
confidence: 0.9
---

# Content goes here
```

### Frontmatter Fields

- `title` (required): Document title
- `keywords`: Array of searchable keywords
- `topics`: Array of topics for categorization
- `filePatterns`: Glob patterns for file matching (see below)
- `alwaysApply`: Whether rules always apply (default: false)
- `confidence`: Confidence score for inference (0-1)

### File Patterns

The `filePatterns` field enables contextual documentation that appears only for specific files:

```yaml
# React component documentation
filePatterns: ["*.jsx", "*.tsx", "components/**/*.js"]

# Test file documentation
filePatterns: ["*.test.js", "*.spec.js", "__tests__/**/*"]

# Configuration documentation
filePatterns: ["*.config.js", ".*rc", "*.json"]

# API route documentation
filePatterns: ["api/**/*.js", "routes/**/*.ts"]
```

#### Pattern Syntax

- `*.js` - Matches any JavaScript file
- `**/*.ts` - Matches TypeScript files in any subdirectory
- `src/**/test/*.js` - Matches JS files in any test folder under src
- `[Tt]est.js` - Matches Test.js or test.js (character sets)
- `?.js` - Matches single character (a.js, b.js, etc.)

#### How It Works

1. When the `get_file_docs` tool is called with a file path
2. Doc-bot checks each document's `filePatterns`
3. Documents with matching patterns are returned
4. Patterns are case-insensitive and support glob-like syntax

#### Examples

**Example 1: React Component Guidelines**
```markdown
---
title: React Component Guidelines
keywords: [react, components, jsx]
filePatterns: ["*.jsx", "*.tsx", "src/components/**/*"]
alwaysApply: false
---

# React Component Best Practices
- Use functional components with hooks
- Follow naming conventions (PascalCase)
- Keep components focused and reusable
```

**Example 2: Testing Standards**
```markdown
---
title: Testing Standards
keywords: [testing, jest, test]
filePatterns: ["*.test.js", "*.spec.js", "__tests__/**/*"]
alwaysApply: false
---

# Testing Guidelines
- Write tests alongside source files
- Use descriptive test names
- Follow AAA pattern (Arrange-Act-Assert)
```

**Example 3: Configuration Guide**
```markdown
---
title: Configuration Guide
keywords: [config, setup, environment]
filePatterns: ["*.config.js", ".env*", "config/**/*"]
alwaysApply: false
---

# Configuration Best Practices
- Never commit secrets
- Use environment variables
- Document all configuration options
```

## Testing

The project uses Jest for testing with ES modules support:

```bash
# Run all tests
npm test

# Note: test:watch and test:coverage require ES module configuration
NODE_OPTIONS=--experimental-vm-modules npm test
```

### Test Structure

- Unit tests are located alongside source files
- Integration tests are in `__tests__` directories
- Test utilities are in root `test-*.js` files

### Writing Tests

```javascript
import { describe, it, expect } from '@jest/globals';

describe('MyComponent', () => {
  it('should work correctly', () => {
    // Test implementation
  });
});
```

## Code Style

The project uses ES modules and follows these conventions:

1. **ES Module Imports**: Always use `.js` extensions
   ```javascript
   import { MyClass } from './MyClass.js';
   ```

2. **File Naming**: Use PascalCase for classes, camelCase for utilities

3. **Async/Await**: Prefer async/await over promises

4. **Error Handling**: Always handle errors gracefully

## Debugging

1. Enable verbose logging:
   ```bash
   npm start -- --verbose
   ```

2. Use VS Code debugger with provided launch configuration

3. Check logs for detailed error messages

## Hot Reloading

When developing, use the `--watch` flag:

```bash
npm run dev
```

This will:
- Monitor the documentation directory
- Automatically reload changed documents
- Update indexes in real-time
- No server restart needed

## Common Tasks

### Adding a New Tool

1. Add tool handler in `src/index.js`
2. Update tool list in constructor
3. Add corresponding prompt template in `prompts/`
4. Update documentation

### Updating Documentation Index

1. Modify `src/services/DocumentIndex.js`
2. Add new index types or extraction logic
3. Update inference engine to use new indexes

### Testing MCP Integration

Use an MCP-compatible client to test:
```bash
# Start server
npm start -- --verbose

# In another terminal, connect with MCP client
# The server listens on stdio
```

### Creating Contextual Documentation

1. Identify file patterns for your documentation
2. Add `filePatterns` to frontmatter
3. Set `alwaysApply: false` to enable pattern matching
4. Test with `get_file_docs` tool

## Troubleshooting

### ES Module Issues

If you encounter ES module errors:
1. Ensure Node.js >= 18.0.0
2. Check that `"type": "module"` is in package.json
3. Use `.js` extensions in imports

### File Watching Not Working

1. Check file permissions
2. Ensure chokidar is properly installed
3. Try with explicit paths: `--docs ./doc-bot`

### Documentation Not Loading

1. Check documentation directory exists
2. Verify markdown files have `.md` extension
3. Validate frontmatter syntax (YAML)
4. Run with `--verbose` for detailed logs

### File Patterns Not Matching

1. Test patterns with simple cases first
2. Remember patterns are case-insensitive
3. Use `**` for recursive directory matching
4. Check for typos in patterns

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Release Process

1. Update version in package.json
2. Update CHANGELOG (if exists)
3. Commit changes
4. Create git tag
5. Push to repository
6. Publish to npm (see publishing.md)