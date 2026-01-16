---
title: "Doc-Bot API Reference"
description: "Complete API reference for all MCP tools exposed by doc-bot"
keywords: ["api", "mcp", "tools", "reference", "documentation", "search", "docsets"]
---

# Doc-Bot API Reference

This document provides a complete reference for all MCP tools exposed by the doc-bot server. These tools are available to any MCP-compatible AI assistant.

## Available Tools

### 1. `doc_bot`

**Purpose**: Lightweight documentation guidance and tool recommendations.

**Description**: Provides suggested documentation to review, search hints, and next steps. Use this frequently for quick orientation and to keep docs up to date.

**Parameters**:
- `task` (string, required): What you need help with
  - Examples: "create REST API", "understand auth flow", "document this pattern", "find database models"

**Returns**: Structured guidance containing:
- Suggested documentation to review
- Search hints and relevant keywords
- Recommended next steps
- A fast documentation loop for keeping project knowledge current
- Best practices for using doc-bot tools

**Example**:
```json
{
  "task": "create a user authentication service"
}
```

**Response Example**:
```
## Documentation Guidance

## Fast Documentation Loop
1. Start with `doc_bot(task)` or `get_document_index()`
2. Use `search_documentation` with concrete terms
3. Open details with `read_specific_document` or `get_file_docs`
4. Capture new knowledge with `create_or_update_rule`

Suggested docs:
- "Auth Flow" (auth-flow.md)
- "API Development Guide" (api-development.md)

Recommended actions:
- search_documentation("authentication")
- read_specific_document("auth-flow.md")
- create_or_update_rule(...) if you discover new patterns
```

### 2. `search_documentation`

**Purpose**: Search across all available documentation sources including project docs and API documentation.

**Description**: Performs unified search across both project-specific documentation (prioritized with 5x relevance boost) and official API documentation from docsets. Uses intelligent query parsing and term-based matching.

**Parameters**:
- `query` (string, required): The search query
  - Supports natural language queries
  - Stop words are automatically filtered
  - Special characters are handled intelligently

**Returns**: Array of search results containing:
- `title`: Document or API entry title
- `description`: Brief description or context
- `relevance`: Relevance score (0-100)
- `type`: "local" (project doc) or "docset" (API doc)
- `source`: Source name (project name or docset name)
- `snippet`: Relevant text excerpt
- `matchedTerms`: Terms from query that matched

**Example**:
```json
{
  "query": "How to use AlarmKit Framework"
}
```

### 3. `get_file_docs`

**Purpose**: Get documentation specific to a particular file or file type.

**Description**: Returns documentation that matches the given file path based on `filePatterns` in frontmatter.

**Parameters**:
- `filePath` (string, required): The file path to get documentation for
  - Can be absolute or relative path
  - File extension and path structure are used for matching

**Returns**: Formatted documentation text for matching file patterns.

**Example**:
```json
{
  "filePath": "src/components/Button.test.jsx"
}
```

### 4. `read_specific_document`

**Purpose**: Read the complete content of a specific documentation file.

**Description**: Retrieves the full content of a documentation file by its name.

**Parameters**:
- `fileName` (string, required): Name of the documentation file
  - Should match the filename in the documentation index
  - Include the .md extension

**Returns**: Object containing:
- `fileName`: The requested file name
- `content`: Complete file content
- `metadata`: Parsed frontmatter metadata

**Example**:
```json
{
  "fileName": "testing-guide.md"
}
```

### 5. `create_or_update_rule`

**Purpose**: Create or update documentation dynamically.

**Description**: Allows creating new documentation or updating existing documentation programmatically.

**Parameters**:
- `fileName` (string, required): Name for the documentation file
- `title` (string, required): Title for the document
- `content` (string, required): Markdown content for the document
- `keywords` (array, optional): Keywords for search indexing
- `filePatterns` (array, optional): File patterns this doc applies to
- `topics` (array, optional): Topical tags
- `category` (string, optional): Category label
- `alwaysApply` (boolean, optional): Mark as always-apply guidance for every task
- `description` (string, optional): Brief description of the document

**Returns**: Success confirmation with the created/updated file details

**Example**:
```json
{
  "fileName": "new-api-guide.md",
  "title": "New API Guidelines",
  "content": "# API Guidelines\n\nContent here...",
  "keywords": ["api", "rest", "guidelines"],
  "filePatterns": ["**/api/**"]
}
```

### 6. `refresh_documentation`

**Purpose**: Manually refresh the documentation index.

**Description**: Forces a reload of all documentation files and rebuilds indices. Useful when documentation has been modified outside of the watch system.

**Parameters**: None

**Returns**: Confirmation message with number of documents loaded

### 7. `get_document_index`

**Purpose**: List all available documentation with metadata.

**Description**: Returns a complete index of all available documentation files with their metadata, useful for discovering available documentation.

**Parameters**: None

**Returns**: Array of document summaries containing:
- `title`: Document title
- `description`: Document description
- `fileName`: File name
- `lastUpdated`: Last modification timestamp

### 8. `add_docset`

**Purpose**: Install a new documentation set (docset) for API reference.

**Description**: Downloads and installs a docset from a URL or copies from a local path. Supports .docset directories and compressed archives (.tgz, .tar.gz, .zip).

**Parameters**:
- `source` (string, required): URL or local file path to the docset
  - URL examples: "https://kapeli.com/feeds/Swift.tgz"
  - Local path examples: "/Downloads/React.docset", "/Users/me/iOS.docset"

**Returns**: Object containing:
- `name`: Docset name
- `id`: Unique identifier for the docset
- `path`: Installation path

**Example**:
```json
{
  "source": "https://kapeli.com/feeds/Swift.tgz"
}
```

### 9. `remove_docset`

**Purpose**: Remove an installed documentation set.

**Description**: Deletes a docset from the system and removes it from search indices.

**Parameters**:
- `docsetId` (string, required): The unique ID of the docset to remove
  - Get this from `list_docsets` command

**Returns**: Success confirmation message

**Example**:
```json
{
  "docsetId": "a1b2c3d4"
}
```

### 10. `list_docsets`

**Purpose**: List all installed documentation sets (docsets).

**Description**: Returns information about all installed docsets that can be searched.

**Parameters**: None

**Returns**: Array of docset information containing:
- `id`: Unique docset identifier
- `name`: Human-readable docset name
- `path`: File system path to docset
- `downloadedAt`: Installation timestamp

### 11. `explore_api`

**Purpose**: Explore API documentation for a specific framework or class.

**Description**: Provides comprehensive exploration of API documentation, returning related classes, methods, properties, and other elements for a given API entry.

**Parameters**:
- `entryName` (string, required): Name of the API to explore
  - Examples: "AlarmKit", "URLSession", "React"
- `docsetId` (string, optional): Limit to specific docset
- `includeTypes` (array, optional): Types to include in results
  - Default: ["Class", "Struct", "Method", "Property", "Function", "Protocol", "Enum", "Constant"]

**Returns**: Object containing categorized API elements:
- `framework`: Framework information if applicable
- `classes`: Related classes
- `methods`: Available methods
- `properties`: Properties
- `functions`: Functions
- `protocols`: Protocols
- `enums`: Enumerations
- `constants`: Constants
- `samples`: Code samples
- `guides`: Related guides

**Example**:
```json
{
  "entryName": "URLSession",
  "includeTypes": ["Class", "Method", "Property"]
}
```

## Response Format

All tools return responses in a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { /* tool-specific data */ }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Best Practices

1. **Treat doc-bot as a documentation MCP**: reference it frequently to stay aligned with current project knowledge
2. **Start with `doc_bot` or `search_documentation`** to find relevant context fast
3. **Search using API/class names** not descriptions (e.g., "Widget" not "iOS widgets")
4. **Use `explore_api` for deep dives** into frameworks and classes
5. **Read full docs** with `read_specific_document` when you need complete context
6. **Document new patterns** using `create_or_update_rule` for future reference
7. **Refresh indexes** with `refresh_documentation` after manual edits

## Rate Limiting and Performance

- Documentation is cached in memory for fast access
- Docset searches use parallel execution for performance
- File watching provides real-time updates without manual refresh
- Search results are limited to prevent overwhelming responses

## Error Handling

Common error scenarios:
- Missing documentation directory: Returns empty results gracefully
- Invalid file patterns: Logged but doesn't break execution
- Docset database errors: Isolated to specific docset, others continue working
- Search timeouts: Individual docset searches timeout after 2 seconds
