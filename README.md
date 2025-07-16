# doc-bot

[![npm version](https://img.shields.io/npm/v/@afterxleep/doc-bot)](https://www.npmjs.com/package/@afterxleep/doc-bot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A generic MCP (Model Context Protocol) server that provides intelligent documentation and rules for any project. Works with any MCP-compatible AI tools and IDEs.

It's platform agnostic and designed to replace and extend the rule systems provided by different IDEs, such as Cursor (Cursor Rules) or Claude (CLAUDE.md). Instead of relying on separate rule-sets for each tool, you can use doc-bot to provide unified documentation for agentic coding across all your AI assistants.

## What is doc-bot?

doc-bot is an intelligent documentation server that:
- 🧠 **Auto-indexes** content for smart inference, based on metadata and keywords
- 🤖 **Provides agentic tools** to query, and update your documentation
- 🔄 **Updates** automatically when docs change
- 📚 **Supports Docsets** for searching official API documentation alongside your custom docs

## Documentation Sets (Docsets) Support

doc-bot now includes powerful support for searching official API documentation through Docsets. This allows your AI assistant to access both your custom project documentation and official API references in a unified search experience.

### What are Docsets?

Docsets are SQLite-based documentation databases used by tools like Dash (macOS) and Zeal (cross-platform). They contain indexed, searchable documentation for programming languages, frameworks, and libraries.

### Key Features

- **Unified Search**: Search both your custom documentation and official API docs with a single command
- **Smart Prioritization**: Project documentation is automatically prioritized over API documentation
- **Parallel Search**: Efficiently searches multiple docsets simultaneously
- **Intelligent Ranking**: Results are ranked by relevance with sophisticated scoring algorithms
- **API Exploration**: Discover related classes, methods, and properties for any API

### Setting Up Docsets

1. **Default Location**: doc-bot looks for docsets in `~/Developer/DocSets` by default

2. **Custom Location**: Specify a custom path when starting doc-bot:
   ```bash
   doc-bot --docsets /path/to/your/docsets
   ```

3. **Configuration**: Add to your MCP client config:
   ```json
   {
     "mcpServers": {
       "doc-bot": {
         "command": "npx",
         "args": ["@afterxleep/doc-bot@latest", "--docsets", "/path/to/docsets"]
       }
     }
   }
   ```

### Getting Docsets

Download docsets from:
- [Dash](https://kapeli.com/dash) (macOS)
- [Zeal](https://zealdocs.org/) (Windows/Linux)
- Direct downloads from [Dash's feed](https://kapeli.com/feeds)

Popular docsets include:
- Swift, iOS, macOS frameworks
- Python, JavaScript, TypeScript
- React, Vue, Angular
- Node.js, Express
- And hundreds more...

### How It Works

When you search for documentation, doc-bot:

1. **Searches your project docs first** with a 5x relevance boost
2. **Searches docsets in parallel** for official API documentation
3. **Deduplicates results** preferring language-specific versions (e.g., Swift)
4. **Returns unified results** with context and relevance scores

### Example Usage

Ask your AI assistant:
- "How do I use AlarmKit?" - Searches both your docs and Apple's AlarmKit documentation
- "Show me URLSession configuration options" - Finds API references and your custom guides
- "What's available in the React framework?" - Explores React API with the `explore_api` tool

### Advanced Features

- **Term-based search**: Breaks queries into terms for better matches (e.g., "URLSession configuration" finds "URLSessionConfiguration")
- **Quality filtering**: Automatically filters out low-relevance results
- **Context snippets**: Provides relevant excerpts from your project documentation
- **Performance optimized**: Uses caching and parallel execution for fast results

## Why MCP Instead of Static Rules?

IDE's use static rule files (like Cursor Rules or Copilot's .github/copilot-instructions.md), and each one has their own format, metadata and approach.

### 🚀 Dynamic Search vs Static Rules

**Static Systems:**
- All rules must fit in a single file or limited token window
- AI reads everything, even irrelevant rules
- No way to search or filter documentation (besides plain 'grep')
- Rules compete for context space

**MCP with doc-bot:**
- AI searches for exactly what it needs
- Unlimited documentation size - only relevant parts are retrieved
- Smart keyword and pattern matching
- Context window used efficiently

### 🧠 Contextual Intelligence

**Static Systems:**
- Duplicate or symlinked rules to work with multiple agents
- Agents use `grep` for basic text-base searching

**MCP with doc-bot:**
- AI searches for relevant documentation based on your query
- Context-aware suggestions from your actual questions
- Different documentation retrieved for different tasks
- Intelligent inference from keywords and search terms

### 📈 Scalability Without Limits

**Static Systems:**
- Limited by token count
- Adding more rules has impact in your context window
- Documentation competes with your actual code for context

**MCP with doc-bot:**
- Store thousands of documentation files
- No token limit - documentation lives outside the context
- AI retrieves only what's needed
- Your context window stays free for actual work

### 🔄 Live Updates

**Static Systems:**
- Changes require restarting your AI/IDE
- No way to know if rules are current
- Manual synchronization across tools and AI agents

**MCP with doc-bot:**
- Hot reload on documentation changes
- Always serves the latest version
- Single source of truth for all AI tools

### 🎯 Smart Discovery

**Static Systems:**
- AI doesn't know what documentation exists
- Users must know to ask specific questions
- No exploration or discovery capabilities
- AI agents rely on basic grep searches through codebases to infer project patterns

**MCP with doc-bot:**
- AI can list all available documentation
- Discovers relevant docs automatically
- Suggests documentation based on relevance
- Searchable knowledge base with intelligent ranking
- No need for AI to grep through your codebase - dedicated search engine

## Documentation

- **[API Reference](doc-bot/api-reference.md)** - Complete reference for all MCP tools
- **[Architecture Guide](doc-bot/architecture.md)** - Technical architecture and components
- **[Configuration Guide](doc-bot/configuration-guide.md)** - All configuration options
- **[Troubleshooting Guide](doc-bot/troubleshooting.md)** - Common issues and solutions
- **[Services Reference](doc-bot/services-reference.md)** - Detailed service documentation
- **[Examples & Best Practices](doc-bot/examples-and-best-practices.md)** - Real-world usage examples
- **[Contributing Guide](doc-bot/contributing.md)** - How to contribute to doc-bot

## Installation

1. **Create your documentation folder** in your project root (see organization section below)

2. **Add doc-bot to your MCP-compatible AI tool configuration**:

   ```json
   {
     "mcpServers": {
       "doc-bot": {
         "command": "npx",
         "args": ["@afterxleep/doc-bot@latest"]
       }
     }
   }
   ```

   **Custom docs folder:**
   ```json
   {
     "mcpServers": {
       "doc-bot": {
         "command": "npx",
         "args": ["@afterxleep/doc-bot@latest", "--docs", "./my-custom-docs"]
       }
     }
   }
   ```
   
   **With Docsets support (for official API documentation):**
   ```json
   {
     "mcpServers": {
       "doc-bot": {
         "command": "npx",
         "args": ["@afterxleep/doc-bot@latest", "--docs", "./docs", "--docsets", "~/MyDocSets"]
       }
     }
   }
   ```
   Note: If a relative path does not work, you can use VSCode `${workspaceFolder}`environment variable `${workspaceFolder}/my-custom-docs`


   **With verbose logging (for debugging):**
   ```json
   {
     "mcpServers": {
       "doc-bot": {
         "command": "npx",
         "args": ["@afterxleep/doc-bot@latest", "--verbose"]
       }
     }
   }
   ```

3. **Restart your AI tool**

4. **Ensure Agent Compliance** (Essential): Add the expert-engineered integration protocol to guarantee your agent uses doc-bot:

   **⚡ Setup**: Copy the rule from [`AGENT_INTEGRATION_RULE.txt`](./AGENT_INTEGRATION_RULE.txt) into your agent configuration.
   **🎯 Why This Matters**: Without this rule, agents may default to general knowledge instead of your doc-bot documentation.

   **Platform-Specific Instructions**:
   - **Claude Code**: Add rule to your global `CLAUDE.md`
   - **Cursor**: Create a `.mdc` file in `.cursor/rules/` directory with `alwaysApply: true`
   - **GitHub Copilot**: Add rule to `.github/copilot-instructions.md`
   - **Continue.dev**: Add rule to system prompt configuration

   

## How to organize your documentation

Create a `doc-bot/` folder in your project root with markdown files using frontmatter:

```
your-project/
├── doc-bot/
│   ├── coding-standards.md     # Global rule (alwaysApply: true)
│   ├── security.md             # Global rule (alwaysApply: true) 
│   ├── testing.md              # Contextual rule (alwaysApply: false)
│   ├── api-development.md      # Contextual rule (alwaysApply: false)
│   └── troubleshooting.md      # Contextual rule (alwaysApply: false)
└── package.json
```

**Note:** The `doc-bot` folder is the default location. You can use any folder name by specifying it with the `--docs` option.

### Documentation types:

- **Global Rules** (`alwaysApply: true`): Critical guidelines applied to every AI interaction
- **Contextual Rules** (`alwaysApply: false`): Rules applied based on file patterns and context

### Example documentation files:

**Global Rule Example** (`doc-bot/coding-standards.md`):
```markdown
---
alwaysApply: true
title: "Coding Standards"
description: "Core coding standards that apply to all code"
keywords: ["code-quality", "standards", "best-practices"]
---

# Coding Standards

- Use 2 spaces for indentation
- Maximum line length: 100 characters
- Always use const/let, never var
- Prefer async/await over promises
- Write descriptive variable names
```

**Contextual Rule Example** (`doc-bot/testing.md`):
```markdown
---
alwaysApply: false
title: "Testing Guide"
description: "How to write and run tests"
keywords: ["testing", "jest", "tdd", "unit-tests"]
filePatterns: ["*.test.js", "*.spec.js", "__tests__/**/*"]
---

# Testing Guide

All test files should:
- Use describe/it blocks for organization
- Include both positive and negative test cases
- Mock external dependencies
- Aim for 80%+ code coverage

Run tests with: `npm test`
```

## Frontmatter-Based Configuration

doc-bot uses frontmatter in your markdown files to automatically detect and categorize rules.

### Frontmatter Fields:

- **`alwaysApply: true`** - Global rules applied to every AI interaction
- **`alwaysApply: false`** - Contextual rules searched and applied based on relevance
- **`keywords: ["list", "of", "keywords"]`** - For smart indexing and search
- **`filePatterns: ["*.js", "src/**/*.ts"]`** - Apply docs to specific files (see below)
- **`title`** and **`description`** - Standard metadata
- **`confidence: 0.9`** - Relevance confidence score (0-1)

### 🎯 Automatic Intelligence

doc-bot automatically analyzes your documentation to provide smart suggestions:

- **Keyword-based search** from frontmatter metadata
- **Multi-term search** with fuzzy matching capabilities
- **Smart inference** from documentation content
- **Automatic indexing** - no manual configuration needed

### Writing effective documentation

For best results, include descriptive frontmatter:

```markdown
---
alwaysApply: false
title: "React Component Guidelines"
description: "Best practices for building React components"
keywords: ["react", "components", "hooks", "jsx"]
---

# React Component Guidelines

Your documentation content here...
```

### File Pattern Matching

doc-bot supports contextual documentation using file patterns. Documentation can be targeted to specific files:

```markdown
---
alwaysApply: false
title: "React Testing Guide"
keywords: ["testing", "jest", "react"]
filePatterns: ["*.test.jsx", "*.test.tsx", "__tests__/**/*"]
---

# React Testing Guide

This documentation appears only when working with test files...
```

**Pattern Examples:**
- `*.js` - All JavaScript files
- `src/**/*.ts` - TypeScript files in src directory
- `[Tt]est.js` - Test.js or test.js
- `*.{jsx,tsx}` - React component files

When AI requests documentation for a specific file (e.g., `Button.test.jsx`), only docs with matching patterns are returned.

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

3. **Run the server (uses built-in doc-bot/ folder):**
   ```bash
   npm start
   ```

4. **Run with file watching (recommended for development):**
   ```bash
   npm run dev
   ```
5. **Run tests:**
   ```bash
   npm test
   ```

**Note:** This is an MCP server that communicates via stdio transport, not HTTP. When running locally, it will start the MCP server and show you the configuration to add to your MCP client (like Claude Code).

### Testing your setup

Ask your AI assistant something like "What documentation is available?" to test that doc-bot is working.

### CLI Options

```bash
doc-bot [options]

Options:
  -d, --docs <path>        Path to docs folder (default: doc-bot)
  -s, --docsets <path>     Path to docsets folder (default: ~/Developer/DocSets)
  -v, --verbose           Enable verbose logging
  -w, --watch             Watch for file changes
  -h, --help              Show help
```

**Example usage:**
```bash
# Basic usage with default doc-bot folder
doc-bot

# Specify a custom docs folder
doc-bot --docs ./my-docs

# With custom docsets location
doc-bot --docsets /Library/Application\ Support/Dash/DocSets

# With verbose logging and file watching
doc-bot --verbose --watch

# All options combined
doc-bot --docs ./my-docs --docsets ~/DocSets --verbose --watch
```

## Publishing and Development

### Local Development

1. **Clone and setup:**
   ```bash
   git clone https://github.com/afterxleep/doc-bot.git
   cd doc-bot
   npm install
   ```

2. **Run locally:**
   ```bash
   npm run dev    # With file watching
   npm start      # Basic run
   npm test       # Run tests
   ```

3. **Test with Claude Code:**
   Add to your Claude Code config:
   ```json
   {
     "mcpServers": {
       "doc-bot": {
         "command": "node",
         "args": ["/path/to/doc-bot/bin/doc-bot.js", "--verbose", "--watch"]
       }
     }
   }
   ```

### Publishing to npm

1. **Test the package:**
   ```bash
   npm run test
   npm run lint
   ```

2. **Update version:**
   ```bash
   npm version patch|minor|major
   ```

3. **Publish:**
   ```bash
   npm publish
   ```

### Push Changes

```bash
git add .
git commit -m "feat: your feature description"
git push origin main
git push --tags  # Push version tags
```

## Docset Support

doc-bot now supports [Docsets](https://kapeli.com/docsets) - pre-indexed documentation used by Dash, Zeal, and Velocity. This allows you to search official API documentation alongside your custom project docs.

### Key Features
- Search iOS, macOS, Swift, and other official documentation
- Install docsets from URLs or local files
- Unified search across both custom docs and official APIs
- No manual HTML parsing required

### Quick Start
1. **Install a docset**: Use the `add_docset` tool with a URL or local path
2. **Search documentation**: Use `search_docsets` for docsets only, or `search_all` for unified results
3. **Manage docsets**: List installed docsets with `list_docsets`, remove with `remove_docset`

See [DOCSETS.md](./DOCSETS.md) for detailed documentation.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- [npm package](https://www.npmjs.com/package/@afterxleep/doc-bot)
- [GitHub repository](https://github.com/afterxleep/doc-bot)
- [Model Context Protocol](https://github.com/modelcontextprotocol/specification)
