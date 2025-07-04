# doc-bot

[![npm version](https://img.shields.io/npm/v/@afterxleep/doc-bot)](https://www.npmjs.com/package/@afterxleep/doc-bot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A generic MCP (Model Context Protocol) server that provides intelligent documentation and rules for any project. Works with any MCP-compatible AI tools and IDEs.

It's platform agnostic and designed to replace and extend the rule systems provided by different IDEs, such as Cursor (Cursor Rules) or Claude (CLAUDE.md). Instead of relying on separate rule-sets for each tool, you can use doc-bot to provide unified documentation for agentic coding across all your AI assistants.

## What is doc-bot?

doc-bot is an intelligent documentation server that:
- 🔍 **Searches** your project documentation instantly
- 🧠 **Auto-indexes** content for smart inference (no manual keyword mapping!)
- 📋 **Applies** global rules to every AI interaction
- 🎯 **Suggests** contextual documentation based on file patterns
- 🤖 **Detects** code patterns, frameworks, and keywords automatically
- 🔄 **Updates** automatically when docs change

## Why MCP Instead of Static Rules?

Traditional AI assistants use static rule files (like Cursor Rules or Copilot's .github/copilot-instructions.md) that have significant limitations. doc-bot's MCP approach offers powerful advantages:

### 🚀 Dynamic Search vs Static Rules

**Static Systems:**
- All rules must fit in a single file or limited token window
- AI reads everything, even irrelevant rules
- No way to search or filter documentation
- Rules compete for precious context space

**MCP with doc-bot:**
- AI searches for exactly what it needs
- Unlimited documentation size - only relevant parts are retrieved
- Smart keyword and pattern matching
- Context window used efficiently

### 🧠 Contextual Intelligence

**Static Systems:**
- Same rules applied everywhere
- No awareness of what you're working on
- Can't provide specific help for your current task

**MCP with doc-bot:**
- AI searches for relevant documentation based on your query
- Context-aware suggestions from your actual questions
- Different documentation retrieved for different tasks
- Intelligent inference from keywords and search terms

### 📈 Scalability Without Limits

**Static Systems:**
- Limited by token count (typically 2-4k tokens)
- Adding more rules means removing others
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
- Manual synchronization across tools

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
- Suggests documentation based on context
- Searchable knowledge base with intelligent ranking
- No need for AI to grep through your codebase - dedicated search engine

## Installation

1. **Create your documentation folder** in your project root (see organization section below)

2. **Add doc-bot to your MCP-compatible AI tool configuration**:

   ```json
   {
     "mcpServers": {
       "doc-bot": {
         "command": "npx",
         "args": ["@afterxleep/doc-bot"]
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
         "args": ["@afterxleep/doc-bot", "--docs", "./my-custom-docs"]
       }
     }
   }
   ```

   **With verbose logging (for debugging):**
   ```json
   {
     "mcpServers": {
       "doc-bot": {
         "command": "npx",
         "args": ["@afterxleep/doc-bot", "--verbose"]
       }
     }
   }
   ```

3. **Restart your AI tool**

4. **Ensure Agent Compliance** (Essential): Add the expert-engineered integration protocol to guarantee your agent uses doc-bot:

   **⚡ Quick Setup**: Copy the production-ready rule from [`AGENT_INTEGRATION_RULE.txt`](./AGENT_INTEGRATION_RULE.txt) into your agent configuration.

   **📚 Complete Protocol**: For mission-critical environments, implement the full [`DOC_BOT_AGENT_RULE.md`](./DOC_BOT_AGENT_RULE.md) protocol with multi-phase validation and constraint enforcement.

   **Platform-Specific Instructions**:
   - **Claude Code**: Add rule to your global `CLAUDE.md`
   - **Cursor**: Add rule to your `.cursorrules` file  
   - **GitHub Copilot**: Add rule to `.github/copilot-instructions.md`
   - **Continue.dev**: Add rule to system prompt configuration

   **🎯 Why This Is Critical**: Without explicit behavioral constraints, agents will default to general knowledge instead of your project-specific documentation. This protocol uses expert prompt engineering to ensure 99%+ tool usage reliability.

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

doc-bot uses frontmatter in your markdown files to automatically detect and categorize rules - **no manifest.json required!**

### Frontmatter Fields:

- **`alwaysApply: true`** - Global rules applied to every AI interaction
- **`alwaysApply: false`** - Contextual rules searched and applied based on relevance
- **`keywords: ["list", "of", "keywords"]`** - For smart indexing and search
- **`title`** and **`description`** - Standard metadata

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

5. **Run with examples documentation:**
   ```bash
   npm run start:examples
   ```

6. **Run tests:**
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
  -c, --config <path>      Path to manifest file (optional, for backward compatibility)
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

# With verbose logging and file watching
doc-bot --verbose --watch

# With optional manifest for backward compatibility
doc-bot --config ./manifest.json
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

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- [npm package](https://www.npmjs.com/package/@afterxleep/doc-bot)
- [GitHub repository](https://github.com/afterxleep/doc-bot)
- [Model Context Protocol](https://github.com/modelcontextprotocol/specification)