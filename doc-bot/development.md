---
alwaysApply: false
title: "Development Guide"
description: "Development setup, testing, and workflow for doc-bot project"
keywords: ["development", "testing", "workflow", "setup", "CLI"]
filePatterns: ["*.js"]
---

# Development Guide

## Project Structure

```
doc-bot/
├── package.json              # NPM package configuration
├── bin/
│   └── doc-bot.js           # CLI entry point
├── src/
│   ├── index.js             # Main MCP server
│   └── services/
│       ├── DocumentationService.js
│       ├── InferenceEngine.js
│       └── ManifestLoader.js
├── examples/
│   └── sample-project/
│       └── docs.ai/         # Example documentation structure
├── docs/                    # Internal documentation
├── README.md                # User documentation
├── LICENSE                  # MIT License
└── test-server.js          # Test script
```

## Testing

### Running Tests
```bash
npm test
```

### Manual Testing
```bash
# Start the server
npm start

# Or with verbose logging
npm start -- --verbose

# Test with watch mode
npm start -- --watch
```

### Test Script
Use `test-server.js` to test the server functionality:
```bash
node test-server.js
```

## CLI Options

```bash
doc-bot [options]

Options:
  -p, --port <port>        Port to run server on (default: 3000)
  -d, --docs <path>        Path to docs folder (default: ./docs.ai)
  -c, --config <path>      Path to manifest file (default: ./docs.ai/manifest.json)
  -v, --verbose           Enable verbose logging
  -w, --watch             Watch for file changes
  -h, --help              Show help
```

## Publishing

### NPM Package
The package is published as `@afterxleep/doc-bot` on npm.

### Versioning
Follow semantic versioning:
- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

### Release Process
1. Update version in `package.json`
2. Update changelog
3. Commit changes
4. Tag release
5. Publish to npm