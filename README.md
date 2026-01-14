# doc-bot

[![npm version](https://img.shields.io/npm/v/@afterxleep/doc-bot)](https://www.npmjs.com/package/@afterxleep/doc-bot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An intelligent MCP (Model Context Protocol) server that gives AI assistants like Claude and Cursor deep understanding of your project through smart documentation management.

## What is doc-bot?

doc-bot is a documentation server that enhances AI coding assistants by providing:
- 🧠 **Smart search** through your project documentation
- 📖 **Contextual docs** that surface guidance based on what you're working on
- 🔄 **Live updates** as your documentation changes
- 📚 **API references** from official documentation (via Docsets)
- 🤖 **MCP tools** for AI agents to query and understand your project
- ✍️ **Agent-driven updates** so new knowledge is captured in docs

## Why doc-bot?

Traditional AI assistants have limited context windows and no understanding of your specific project. doc-bot solves this by:

1. **Providing project-specific knowledge** - Your conventions, patterns, and decisions
2. **Searching intelligently** - AI finds exactly what it needs without cluttering context
3. **Scaling infinitely** - Thousands of docs without token limits
4. **Staying current** - Live reload ensures AI always has latest information

## How It Works

doc-bot acts as a bridge between your documentation and AI assistants:

```
Your Project Documentation → doc-bot → MCP Protocol → AI Assistant (Claude, Cursor, etc.)
```

When you ask your AI assistant to write code, it can:
1. Search for relevant documentation
2. Read project docs for patterns and examples
3. Find API references and examples
4. Update documentation when new patterns are discovered

## Quick Start

### 1. Install doc-bot

Add doc-bot to your AI assistant's configuration:

**For Claude Desktop or Claude Code:**
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

**Location of config file:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**For Cursor:**
- Add an `mcp.json` file with the contents above to your `.cursor` folder

### 2. Create Your Documentation

Create a `doc-bot` folder in your project root and add markdown files:

```
your-project/
├── doc-bot/
│   ├── coding-standards.md
│   ├── api-patterns.md
│   ├── testing-guide.md
│   └── architecture.md
├── src/
└── package.json
```

### 3. Test it!

Ask your AI assistant: "What are the coding standards for this project?"

## Versioning and Compatibility

doc-bot 2.0 is a breaking change. Rule enforcement and `alwaysApply` behavior are removed in favor of documentation-first guidance.

- If you need the legacy rule enforcement flow, pin to `@afterxleep/doc-bot@1` or build from the `1.x` branch.
- New installs should use the latest 2.x line (`@afterxleep/doc-bot@latest`).

## Project Documentation

doc-bot treats your project documentation as a searchable knowledge base for AI assistants.

### Agent-Driven Updates

doc-bot is designed for agents to keep documentation current as they work. When an assistant discovers a new pattern or a change, it can add or update docs directly:

```json
{
  "fileName": "auth-flow.md",
  "title": "Auth Flow",
  "description": "OAuth flow and token handling",
  "keywords": ["auth", "oauth", "tokens"],
  "filePatterns": ["src/auth/**"],
  "content": "# Auth Flow\n\nDocument the new flow here."
}
```

### Agent Documentation Loop

Use this fast loop to extend project knowledge and keep docs current:

1. **Orient quickly**: call `doc_bot(task)` or `get_document_index()` when the project is unfamiliar.
2. **Find specifics**: use `search_documentation` with concrete terms (API names, class names, errors).
3. **Read the full context**: open matches with `read_specific_document` or `get_file_docs`.
4. **Capture new knowledge**: when behavior changes or new patterns emerge, write it with `create_or_update_rule`.
5. **Refresh when needed**: if docs are edited manually, run `refresh_documentation()`.

Keep docs short, scoped, and searchable with clear titles, keywords, and `filePatterns`.

### Documentation Format

Create markdown files with frontmatter metadata:

```markdown
---
title: "React Component Guidelines"
description: "Standards for building React components"
keywords: ["react", "components", "frontend", "jsx"]
---

# React Component Guidelines

- Use functional components with hooks
- Follow PascalCase naming
- Keep components under 200 lines
- Write tests for all components
```

### Frontmatter Options

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `title` | string | Document title (required) | "API Guidelines" |
| `description` | string | Brief description | "REST API design patterns" |
| `keywords` | array | Search keywords | ["api", "rest", "http"] |
| `topics` | array | Optional topical tags | ["architecture", "backend"] |
| `filePatterns` | array | Apply to specific files | ["*.test.js", "**/*.spec.ts"] |

### How Search Works

1. **Intelligent Parsing** - Queries are parsed, stop words removed
2. **Multi-field Matching** - Searches title, description, keywords, and content
3. **Relevance Scoring** - Results ranked by relevance (exact matches score highest)
4. **Context Extraction** - Returns snippets showing matched content

doc-bot surfaces documentation for agents; it does not enforce rules. Agents should update docs when new patterns or changes appear.

### Types of Documentation

#### General Documentation
```markdown
---
title: "Coding Standards"
---
Project-wide guidance and conventions
```

#### Contextual Documentation
```markdown
---
title: "Testing Guide"
filePatterns: ["*.test.js", "*.spec.ts"]
---
Documentation that only applies to test files
```

#### Searchable References
```markdown
---
title: "Database Schema"
keywords: ["database", "postgres", "schema", "migrations"]
---
Documentation found through search queries
```


## Docsets (API Documentation)

doc-bot can also search official API documentation from Docsets, giving your AI assistant access to comprehensive framework and library references.

### What are Docsets?

Docsets are pre-built documentation databases containing official docs for:
- Programming languages (Python, JavaScript, Go, etc.)
- Frameworks (React, Vue, Django, Rails, etc.)
- Libraries (NumPy, Express, jQuery, etc.)
- Platforms (iOS, Android, AWS, etc.)

### Setting Up Docsets

1. **Option A: Ask your AI assistant to install directly**:
   
   From a URL:
   ```
   Use the add_docset tool to install Swift documentation from https://kapeli.com/feeds/Swift.tgz
   ```
   
   From a local file:
   ```
   Use the add_docset tool to install the docset at /Users/me/Downloads/React.docset
   ```

2. **Manage your docsets**:
   ```
   List all installed docsets
   Remove docset with ID abc123
   ```

   Docsets are automatically stored in `~/Developer/DocSets` by default.

### Docset Sources

- **User Contributed Docsets**: https://github.com/Kapeli/Dash-User-Contributions
- **Docset Generation Tools**: https://github.com/Kapeli/docset-generator

Popular docsets available:
- Programming Languages: Python, JavaScript, Go, Rust, Swift
- Web Frameworks: React, Vue, Angular, Django, Rails
- Mobile: iOS, Android, React Native, Flutter
- Databases: PostgreSQL, MySQL, MongoDB, Redis
- Cloud: AWS, Google Cloud, Azure

3. **Configure custom path** (optional):
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

### How Docset Search Works

- **Unified Search**: One query searches both your docs and API docs
- **Smart Prioritization**: Your project docs are boosted 5x in relevance
- **API Exploration**: Use `explore_api` tool to discover related classes, methods
- **Performance**: Parallel search across multiple docsets with caching

## Available Tools

doc-bot provides these tools to AI assistants:

| Tool | Purpose | Example Use |
|------|---------|-------------|
| `doc_bot` | Get documentation guidance | "How should I approach auth?" |
| `search_documentation` | Search all documentation | "How do I implement auth?" |
| `get_file_docs` | Get file-specific docs | "Docs for Button.test.jsx" |
| `read_specific_document` | Read full docs by file name | "Open coding-standards.md" |
| `get_document_index` | List all docs | "Show documentation index" |
| `create_or_update_rule` | Add/update documentation | "Capture auth flow update" |
| `refresh_documentation` | Reload docs from disk | "Refresh the doc store" |
| `explore_api` | Explore API documentation | "Show me URLSession methods" |
| `add_docset` | Install new docset | "Add Swift docs from URL" |
| `remove_docset` | Remove installed docset | "Remove docset abc123" |
| `list_docsets` | List all docsets | "Show installed docsets" |

## Configuration Options

### CLI Options

```bash
doc-bot [options]

Options:
  -d, --docs <path>        Path to docs folder (default: ./doc-bot)
  -s, --docsets <path>     Path to docsets folder (default: ~/Developer/DocSets)
  -v, --verbose           Enable verbose logging
  -w, --watch             Watch for file changes
  -h, --help              Display help
```

### Advanced Configuration

```json
{
  "mcpServers": {
    "doc-bot": {
      "command": "npx",
      "args": [
        "@afterxleep/doc-bot@latest",
        "--docs", "./documentation",
        "--docsets", "/Library/Application Support/Dash/DocSets",
        "--verbose",
        "--watch"
      ]
    }
  }
}
```

## Documentation

- **[API Reference](doc-bot/api-reference.md)** - Complete reference for all MCP tools
- **[Architecture Guide](doc-bot/architecture.md)** - Technical architecture and components
- **[Configuration Guide](doc-bot/configuration-guide.md)** - All configuration options
- **[Troubleshooting Guide](doc-bot/troubleshooting.md)** - Common issues and solutions
- **[Examples & Best Practices](doc-bot/examples-and-best-practices.md)** - Real-world usage examples
- **[Contributing Guide](doc-bot/contributing.md)** - How to contribute to doc-bot

## Best Practices

### Writing Effective Documentation

1. **Use descriptive titles and keywords**
   ```markdown
   ---
   title: "Authentication Flow"
   keywords: ["auth", "login", "jwt", "security", "authentication"]
   ---
   ```

2. **Use file patterns for contextual docs**
   ```markdown
   ---
   filePatterns: ["**/auth/**", "*.auth.js"]
   ---
   ```

3. **Keep docs focused** - One topic per file

4. **Include examples** - Show, don't just tell

### Optimizing Search

- Include synonyms in keywords: `["test", "testing", "spec", "jest"]`
- Use clear section headers for better snippet extraction
- Add descriptions to improve search relevance

## Why MCP over Static Instruction Files?

Unlike static `.cursorrules` or `.github/copilot-instructions.md` files:

- **Dynamic**: AI searches for what it needs instead of reading everything
- **Scalable**: Unlimited docs without token limits
- **Intelligent**: Context-aware documentation based on current file
- **Unified**: Works with any MCP-compatible AI tool
- **Live**: Hot reload on documentation changes

## Contributing

See our [Contributing Guide](doc-bot/contributing.md) for development setup and guidelines.

## License

MIT - See [LICENSE](LICENSE) for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/afterxleep/doc-bot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/afterxleep/doc-bot/discussions)

---

Built with ❤️ in Spain
