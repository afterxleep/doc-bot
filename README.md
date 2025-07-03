# docbot

[![npm version](https://img.shields.io/npm/v/docbot)](https://www.npmjs.com/package/docbot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A generic, open-source MCP (Model Context Protocol) server that provides intelligent documentation access for any project. Works with AI agents like Claude Code, Cursor, and any other MCP-compatible tools.

## 🚀 Features

- **🔍 Smart Documentation Search**: Full-text search across all documentation
- **🧠 Intelligent Inference**: Context-aware documentation suggestions based on your current work
- **📋 Global Rules**: Always-apply documentation that's relevant to every interaction
- **🎯 Contextual Docs**: File-specific documentation based on patterns and file types
- **📦 Zero Config**: Works out of the box with a simple `docbot/` folder
- **🔄 Hot Reload**: Automatically updates when documentation changes
- **🛠️ Universal**: Works with any project, any language, any framework

## 📦 Installation & Usage

### Quick Start

1. **Install and run in your project:**
   ```bash
   # Navigate to your project directory
   cd your-project
   
   # Run the server (installs automatically)
   npx docbot
   ```

2. **Create your documentation structure:**
   ```bash
   mkdir docbot
   echo '{"name": "My Project Documentation", "globalRules": []}' > docbot/manifest.json
   echo "# Getting Started" > docbot/README.md
   ```

3. **Add to your Claude Code configuration:**
   ```json
   {
     "mcpServers": {
       "docs": {
         "command": "npx",
         "args": ["docbot"]
       }
     }
   }
   ```

4. **Restart Claude Code and start using intelligent documentation!**

### Global Installation

```bash
# Install globally
npm install -g docbot

# Run in any project
docbot
```

## 📁 Project Structure

Create a `docbot/` folder in your project root:

```
your-project/
├── docbot/
│   ├── manifest.json          # Configuration and rules
│   ├── core/
│   │   ├── architecture.md    # Always-apply architecture guidelines
│   │   ├── coding-standards.md # Coding standards for all files
│   │   └── security.md        # Security guidelines
│   ├── guides/
│   │   ├── testing.md         # Testing strategies
│   │   ├── deployment.md      # Deployment procedures
│   │   └── api-development.md # API development guide
│   └── reference/
│       ├── troubleshooting.md # Common issues and solutions
│       └── best-practices.md  # Best practices by topic
└── package.json
```

## ⚙️ Configuration

### Manifest File (`docbot/manifest.json`)

```json
{
  "name": "My Project Documentation",
  "version": "1.0.0",
  "description": "AI-powered documentation for My Project",
  "globalRules": [
    "core/coding-standards.md",
    "core/security.md"
  ],
  "contextualRules": {
    "*.test.js": ["guides/testing.md"],
    "*.spec.js": ["guides/testing.md"],
    "src/components/*": ["guides/react-components.md"],
    "src/api/*": ["guides/api-development.md"],
    "*.md": ["guides/documentation.md"],
    "package.json": ["guides/dependencies.md"]
  },
  "inference": {
    "keywords": {
      "testing": ["guides/testing.md"],
      "deployment": ["guides/deployment.md"],
      "api": ["guides/api-development.md"],
      "security": ["core/security.md"],
      "performance": ["guides/performance.md"]
    },
    "patterns": {
      "describe(": ["guides/testing.md"],
      "it(": ["guides/testing.md"],
      "fetch(": ["guides/api-development.md"],
      "console.error": ["reference/troubleshooting.md"],
      "try {": ["reference/error-handling.md"]
    }
  }
}
```

### Configuration Options

- **`globalRules`**: Documentation that applies to all interactions
- **`contextualRules`**: Documentation triggered by specific file patterns
- **`inference.keywords`**: Documentation triggered by keywords in queries
- **`inference.patterns`**: Documentation triggered by code patterns

## 🔧 CLI Options

```bash
docbot [options]

Options:
  -p, --port <port>        Port to run server on (default: 3000)
  -d, --docs <path>        Path to docs folder (default: ./docbot)
  -c, --config <path>      Path to manifest file (default: ./docbot/manifest.json)
  -v, --verbose           Enable verbose logging
  -w, --watch             Watch for file changes
  -h, --help              Show help
```

## 🎯 How It Works

### 1. Global Rules (Always Apply)
Documents listed in `globalRules` are automatically included in every AI interaction:

```json
{
  "globalRules": [
    "core/coding-standards.md",
    "core/security.md"
  ]
}
```

### 2. Contextual Rules (File-Based)
When you're working on specific files, relevant documentation is automatically suggested:

```json
{
  "contextualRules": {
    "*.test.js": ["guides/testing.md"],
    "src/components/*": ["guides/react-components.md"]
  }
}
```

### 3. Smart Inference
The server analyzes your queries and code to suggest relevant documentation:

- **Keywords**: "testing" → `guides/testing.md`
- **Code Patterns**: `describe(` → `guides/testing.md`
- **File Extensions**: `.py` → Python-related docs

## 📖 Documentation Format

### Frontmatter Support
Add metadata to your documentation:

```markdown
---
title: Testing Guide
description: Comprehensive testing strategies
category: guides
tags: [testing, jest, react]
alwaysApply: false
---

# Testing Guide

Your documentation content here...
```

### Supported Formats
- **Markdown** (`.md`)
- **MDX** (`.mdx`)
- **Cursor Rules** (`.mdc`)

## 🛠️ Available Tools

When using with Claude Code or other MCP clients:

### `search_documentation`
```javascript
// Search all documentation
search_documentation({ query: "testing best practices" })
```

### `get_relevant_docs`
```javascript
// Get context-aware suggestions
get_relevant_docs({ 
  context: {
    query: "How to test React components",
    filePath: "src/components/UserProfile.test.tsx",
    codeSnippet: "describe('UserProfile', () => {"
  }
})
```

### `get_global_rules`
```javascript
// Get always-apply documentation
get_global_rules()
```

### `get_file_docs`
```javascript
// Get file-specific documentation
get_file_docs({ filePath: "src/api/users.js" })
```

## 🌟 Examples

### React Project
```json
{
  "globalRules": ["core/react-standards.md"],
  "contextualRules": {
    "src/components/*": ["guides/components.md"],
    "*.test.tsx": ["guides/testing.md"]
  },
  "inference": {
    "keywords": {
      "hook": ["guides/hooks.md"],
      "state": ["guides/state-management.md"]
    },
    "patterns": {
      "useState": ["guides/hooks.md"],
      "useEffect": ["guides/hooks.md"]
    }
  }
}
```

### Node.js API Project
```json
{
  "globalRules": ["core/api-standards.md", "core/security.md"],
  "contextualRules": {
    "routes/*": ["guides/routing.md"],
    "middleware/*": ["guides/middleware.md"],
    "*.test.js": ["guides/testing.md"]
  },
  "inference": {
    "keywords": {
      "authentication": ["guides/auth.md"],
      "database": ["guides/database.md"]
    },
    "patterns": {
      "app.get": ["guides/routing.md"],
      "app.post": ["guides/routing.md"]
    }
  }
}
```

## 🔄 Integration with IDEs

### Claude Code
1. Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "docs": {
         "command": "npx",
         "args": ["docbot"]
       }
     }
   }
   ```

### Cursor
Configure MCP server integration (coming soon)

### VS Code
Use with Claude Code extension or MCP-compatible extensions

## 🧪 Testing Your Setup

1. **Create test documentation:**
   ```bash
   mkdir docbot
   echo '{"name": "Test Docs", "globalRules": ["test.md"]}' > docbot/manifest.json
   echo "# Test Document\nThis is a test." > docbot/test.md
   ```

2. **Run the server:**
   ```bash
   npx docbot --verbose
   ```

3. **Test with Claude Code:**
   - Ask: "What documentation is available?"
   - Try: "Show me the global rules"

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/docbot.git
cd docbot

# Install dependencies
npm install

# Run tests
npm test

# Run in development mode
npm run dev
```

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on the [Model Context Protocol](https://github.com/modelcontextprotocol/specification)
- Inspired by the need for intelligent, context-aware documentation
- Thanks to the Claude Code and Cursor teams for MCP support

## 🔗 Links

- [npm package](https://www.npmjs.com/package/docbot)
- [GitHub repository](https://github.com/yourusername/docbot)
- [Model Context Protocol](https://github.com/modelcontextprotocol/specification)
- [Claude Code documentation](https://docs.anthropic.com/claude/docs/claude-code)

---

**Made with ❤️ for developers who want intelligent documentation at their fingertips.**