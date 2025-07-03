# docs-mcp-server - Generic MCP Documentation Server

## Overview
A generic, open-source MCP server that provides intelligent documentation access for any project. Works with any AI agent that supports the Model Context Protocol.

## Architecture

### Core Concept
- **Universal**: Works with any project/codebase
- **Zero Config**: Automatically discovers `docs.ai/` folder
- **Smart Inference**: Context-aware documentation suggestions
- **NPM Package**: Install with `npx docs-mcp-server`

### Project Structure
```
your-project/
├── docs.ai/
│   ├── manifest.json          # Configuration and rules
│   ├── core/
│   │   ├── architecture.md    # Project architecture
│   │   ├── coding-standards.md
│   │   └── getting-started.md
│   ├── guides/
│   │   ├── contributing.md
│   │   └── deployment.md
│   └── reference/
│       ├── api.md
│       └── troubleshooting.md
└── package.json
```

### Manifest Format
```json
{
  "name": "My Project Documentation",
  "version": "1.0.0",
  "description": "AI-powered documentation for My Project",
  "globalRules": [
    "core/coding-standards.md",
    "core/architecture.md"
  ],
  "contextualRules": {
    "*.test.js": ["guides/testing.md"],
    "src/components/*": ["guides/components.md"],
    "*.md": ["guides/contributing.md"]
  },
  "inference": {
    "keywords": {
      "testing": ["guides/testing.md"],
      "deployment": ["guides/deployment.md"],
      "api": ["reference/api.md"]
    },
    "patterns": {
      "error": ["reference/troubleshooting.md"],
      "performance": ["guides/optimization.md"]
    }
  }
}
```

## NPM Package Design

### Package Name
`docs-mcp-server` or `@ai-docs/mcp-server`

### Usage
```bash
# Run in project directory
npx docs-mcp-server

# Or install globally
npm install -g docs-mcp-server
docs-mcp-server
```

### CLI Options
```bash
docs-mcp-server [options]

Options:
  --port <port>        Port to run server on (default: 3000)
  --docs <path>        Path to docs folder (default: ./docs.ai)
  --config <path>      Path to manifest file (default: ./docs.ai/manifest.json)
  --verbose           Enable verbose logging
  --watch             Watch for file changes
  --help              Show help
```

## MCP Server Features

### Resources
- `docs://search` - Search all documentation
- `docs://global-rules` - Get always-apply rules
- `docs://contextual` - Get context-aware docs
- `docs://inference` - Smart suggestions based on context

### Tools
- `search_documentation(query)` - Full-text search
- `get_relevant_docs(context)` - Context-aware suggestions
- `get_global_rules()` - Always-apply documentation
- `get_file_docs(filepath)` - File-specific documentation

### Smart Inference Engine
- **Keyword Detection**: Matches query keywords to documentation
- **File Path Analysis**: Suggests docs based on file being worked on
- **Code Pattern Recognition**: Detects patterns in code snippets
- **Context Awareness**: Combines multiple signals for better suggestions

## File Structure
```
docs-mcp-server/
├── package.json
├── README.md
├── LICENSE
├── bin/
│   └── docs-mcp-server.js     # CLI entry point
├── src/
│   ├── index.js               # Main server
│   ├── cli.js                 # Command line interface
│   ├── services/
│   │   ├── DocumentationService.js
│   │   ├── InferenceEngine.js
│   │   └── ManifestLoader.js
│   └── types/
│       └── index.js
├── examples/
│   └── sample-project/
│       └── docs.ai/
│           ├── manifest.json
│           └── *.md files
└── tests/
    └── *.test.js
```

## Benefits for Open Source

### For Project Maintainers
- **Standardized**: Common format for AI-accessible documentation
- **Intelligent**: Context-aware suggestions improve development experience
- **Maintainable**: Single source of truth for documentation
- **Extensible**: Easy to add new docs and rules

### For AI Agents
- **Consistent Interface**: Same API across all projects
- **Smart Suggestions**: Get relevant docs without manual searching
- **Always-Apply Rules**: Critical guidelines applied to all interactions
- **Context Awareness**: Suggestions based on current work

### For Developers
- **Easy Setup**: `npx docs-mcp-server` in any project
- **Zero Config**: Works with basic `docs.ai/` folder
- **IDE Integration**: Works with Claude Code, Cursor, etc.
- **Collaborative**: Team shares same documentation source

## Implementation Plan

1. **Core Package**: Create NPM package with MCP server
2. **CLI Interface**: Add command-line interface with npx support
3. **Documentation**: Comprehensive README and examples
4. **Testing**: Unit tests and integration tests
5. **Publishing**: Publish to NPM registry
6. **Examples**: Sample projects showing usage

## Future Enhancements
- **Multiple Formats**: Support for different documentation formats
- **Plugins**: Extensible architecture for custom inference
- **Analytics**: Usage tracking and optimization
- **Integration**: Direct IDE plugins
- **Collaboration**: Team documentation sharing features

This design makes documentation AI-accessible for any project while maintaining the smart inference capabilities we developed for DuckDuckGo.