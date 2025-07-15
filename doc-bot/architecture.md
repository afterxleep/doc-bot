---
alwaysApply: false
title: "Doc-Bot Architecture"
description: "Technical architecture and components of the doc-bot MCP server"
keywords: ["architecture", "mcp", "server", "components", "design"]
---

# Doc-Bot Architecture

Doc-bot is an MCP (Model Context Protocol) server that provides intelligent documentation access for AI coding assistants. This document describes the technical architecture and components of the system.

## Overview

Doc-bot implements the MCP server specification to provide a standardized interface for AI tools to access project documentation. The architecture is designed to be:

- **Platform agnostic**: Works with any MCP-compatible AI tool
- **Scalable**: Documentation lives outside AI context windows
- **Dynamic**: Supports hot reloading and live updates
- **Intelligent**: Provides smart search and contextual retrieval

## Core Components

### 1. MCP Server (index.js)

The main server class that implements the MCP protocol:

- **DocsServer**: Main class extending `Server` from `@modelcontextprotocol/sdk`
- Handles resource listing and reading
- Implements tool operations
- Supports file watching for hot reloading
- Loads prompt templates for agent optimization

### 2. Documentation Service

Manages document loading and parsing:

- Loads markdown files (`.md`, `.mdx`, `.mdc`) from specified directory
- Parses frontmatter metadata using YAML
- Caches documents in memory
- Supports hot reloading via file watching
- Provides document retrieval by filename

### 3. Inference Engine

Provides intelligent documentation retrieval:

- Builds and maintains document indexes
- Calculates confidence scores for relevance
- Supports contextual search based on:
  - Keywords and synonyms
  - File patterns and extensions
  - Topics and concepts
  - Framework/library patterns
- Returns ranked documentation results

### 4. Document Index

Creates sophisticated indexing for fast retrieval:

- **Keyword Index**: Maps keywords to documents
- **Topic Index**: Groups documents by topics
- **Pattern Index**: Matches file patterns to documentation
- **Extension Index**: Maps file extensions to relevant docs
- Extracts keywords from:
  - Code blocks and their languages
  - Headings and content
  - Frontmatter metadata

## Data Flow

```
1. AI Tool Request → MCP Server
2. MCP Server → Tool Handler
3. Tool Handler → InferenceEngine/DocumentationService
4. Service → Document Index (for search)
5. Service → Document Cache (for retrieval)
6. Response → AI Tool
```

## Available Tools

The server exposes the following MCP tools:

### 1. `check_project_rules(task)`
Returns project-specific rules and forbidden patterns for a coding task.

### 2. `search_documentation(query)`
Searches across all documentation using intelligent matching.

### 3. `get_global_rules()`
Returns all rules that should always apply to the project.

### 4. `get_file_docs(filePath)`
Gets targeted documentation for specific file paths.

### 5. `read_specific_document(fileName)`
Reads the full content of a specific documentation file.

### 6. `create_or_update_rule(fileName, title, content, ...)`
Creates or updates documentation rules dynamically.

### 7. `refresh_documentation()`
Manually refreshes the documentation index.

### 8. `get_document_index()`
Lists all available documents with metadata.

## File Structure

```
doc-bot/
├── src/
│   ├── index.js                 # MCP server implementation
│   └── services/
│       ├── DocumentationService.js
│       ├── InferenceEngine.js
│       └── DocumentIndex.js
├── bin/
│   └── doc-bot.js              # CLI executable
├── prompts/                     # Agent optimization templates
│   ├── agent_integration.md
│   ├── alwaysApply.md
│   ├── checkProjectRules.md
│   └── ...
└── AGENT_INTEGRATION_RULE.txt  # Agent enforcement protocol
```

## Document Format

Documents use frontmatter for metadata:

```markdown
---
title: Document Title
keywords: [keyword1, keyword2]
topics: [topic1, topic2]
filePatterns: ["*.js", "src/**/*.ts"]
alwaysApply: false
confidence: 0.9
---

# Document Content
...
```

## Agent Optimization

Doc-bot includes sophisticated prompt templates to ensure AI agents:
- Always check project rules before generating code
- Use documentation as the source of truth
- Follow project-specific patterns and conventions

The `AGENT_INTEGRATION_RULE.txt` file provides enforcement rules that AI platforms can use to ensure consistent behavior.

## Hot Reloading

When running with `--watch` flag:
1. Monitors documentation directory for changes
2. Automatically reloads modified documents
3. Updates indexes in real-time
4. No server restart required

## Error Handling

- Graceful handling of missing documentation directories
- Clear error messages for file access issues
- Validation of frontmatter format
- Fallback behavior for missing metadata