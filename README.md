# doc-bot

[![npm version](https://img.shields.io/npm/v/@afterxleep/doc-bot)](https://www.npmjs.com/package/@afterxleep/doc-bot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A generic MCP (Model Context Protocol) server that provides intelligent documentation access for any project. Works with any MCP-compatible AI tools and IDEs.

## What is doc-bot?

doc-bot is an intelligent documentation server that:
- 🔍 **Searches** your project documentation instantly
- 🧠 **Infers** relevant docs based on your current work
- 📋 **Applies** global rules to every AI interaction
- 🎯 **Suggests** contextual documentation based on file patterns
- 🔄 **Updates** automatically when docs change

## Installation

1. **Create your documentation folder** in your project root (see organization section below)

2. **Add doc-bot to your MCP-compatible AI tool configuration**:

   **For Claude Code** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
   ```json
   {
     "mcpServers": {
       "docs": {
         "command": "npx",
         "args": ["@afterxleep/doc-bot", "--docs", "./doc-bot"]
       }
     }
   }
   ```

   **For Cursor or other MCP tools**: Add similar configuration pointing to your documentation folder

3. **Restart your AI tool**

## How to organize your documentation

Create a `doc-bot/` folder in your project root:

```
your-project/
├── doc-bot/
│   ├── manifest.json          # Configuration file
│   ├── core/
│   │   ├── coding-standards.md # Always-apply coding standards
│   │   └── security.md         # Security guidelines
│   ├── guides/
│   │   ├── testing.md          # Testing strategies
│   │   └── api-development.md  # API development guide
│   └── reference/
│       └── troubleshooting.md  # Common issues and solutions
└── package.json
```

**Note:** You can use any folder name - just specify it in your MCP configuration:
```json
"args": ["@afterxleep/doc-bot", "--docs", "./my-custom-docs"]
```

### Documentation types:

- **Core docs** (`core/`): Critical guidelines that should always be considered
- **Guides** (`guides/`): Step-by-step instructions for specific tasks
- **Reference** (`reference/`): Quick lookups and troubleshooting

## The manifest file

The `doc-bot/manifest.json` file controls how your documentation works:

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
    "src/api/*": ["guides/api-development.md"]
  },
  "inference": {
    "keywords": {
      "testing": ["guides/testing.md"],
      "deployment": ["guides/deployment.md"],
      "api": ["guides/api-development.md"]
    },
    "patterns": {
      "describe(": ["guides/testing.md"],
      "it(": ["guides/testing.md"],
      "fetch(": ["guides/api-development.md"]
    }
  }
}
```

### Configuration explained:

- **`globalRules`**: Documents that apply to every AI interaction
- **`contextualRules`**: Documents triggered by specific file patterns (e.g., test files → testing guide)
- **`inference.keywords`**: Documents suggested when certain words appear in queries
- **`inference.patterns`**: Documents suggested when certain code patterns are detected

## Development setup

### Running locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/afterxleep/doc-bot.git
   cd doc-bot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the server:**
   ```bash
   npm start
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

5. **Run with file watching:**
   ```bash
   npm start -- --watch
   ```

### Testing your setup

Ask your AI assistant something like "What documentation is available?" to test that doc-bot is working.

### CLI Options

```bash
doc-bot [options]

Options:
  -d, --docs <path>        Path to docs folder (required)
  -c, --config <path>      Path to manifest file (default: <docs-path>/manifest.json)
  -p, --port <port>        Port to run server on (default: 3000)
  -v, --verbose           Enable verbose logging
  -w, --watch             Watch for file changes
  -h, --help              Show help
```

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- [npm package](https://www.npmjs.com/package/@afterxleep/doc-bot)
- [GitHub repository](https://github.com/afterxleep/doc-bot)
- [Model Context Protocol](https://github.com/modelcontextprotocol/specification)