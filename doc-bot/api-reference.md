---
alwaysApply: false
title: "Doc-Bot API Reference"
description: "Complete API reference for all MCP tools exposed by doc-bot"
keywords: ["api", "mcp", "tools", "reference", "documentation", "search", "docsets"]
---

# Doc-Bot API Reference

This document provides a complete reference for all MCP tools exposed by the doc-bot server. These tools are available to any MCP-compatible AI assistant.

## Available Tools

### 1. `doc_bot`

**Purpose**: Intelligent assistant that analyzes ANY request and provides optimal tool routing.

**Description**: This is the primary entry point for all interactions with doc-bot. It analyzes your request, classifies the task type, extracts relevant search terms, and provides a step-by-step execution plan using other doc-bot tools. ALWAYS call this first.

**Parameters**:
- `task` (string, required): What you need help with
  - Examples: "create REST API", "understand auth flow", "document this pattern", "find database models"

**Returns**: Structured guidance containing:
- Task classification (code generation, understanding, documentation, etc.)
- Exact tool sequence to execute
- Specific search terms to use
- Best practices and tips
- Search strategy guidance

**Example**:
```json
{
  "task": "create a user authentication service"
}
```

**Response Example**:
```
## 💻 CODE GENERATION TASK DETECTED

**MANDATORY Steps (in order)**:
1. ⚡ FIRST: `check_project_rules("authentication service")` - Get critical coding standards
2. 🔍 SEARCH for existing patterns:
   - `search_documentation("Authentication")`
   - `search_documentation("Auth")`
   - `search_documentation("Login")`
3. 📚 EXPLORE: If APIs found, use `explore_api()` for complete details
4. ✅ IMPLEMENT: Generate code following ALL discovered patterns
```

### 2. `check_project_rules`

**Purpose**: Retrieve project-specific coding rules and constraints that MUST be followed.

**Description**: This tool should be called before generating any code. It returns mandatory patterns, forbidden practices, and project conventions that override standard programming practices.

**Parameters**:
- `task` (string, required): The specific coding task to be performed
  - Examples: "create singleton class", "implement REST endpoint", "add authentication"

**Returns**: Object containing:
- `global_rules`: Array of rules that always apply
- `task_specific_rules`: Rules specific to the requested task
- `relevant_documentation`: Documentation relevant to the task
- `forbidden_patterns`: Patterns that must not be used

**Example**:
```json
{
  "task": "implement user authentication"
}
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

### 3. `get_global_rules`

**Purpose**: Retrieve all global rules that should always apply to the project.

**Description**: Returns documentation marked with `alwaysApply: true` in frontmatter. These are rules that apply universally across the entire project.

**Parameters**: None

**Returns**: Array of global rule documents containing:
- `fileName`: Name of the documentation file
- `content`: Full content of the document
- `metadata`: Frontmatter metadata

### 4. `get_file_docs`

**Purpose**: Get documentation specific to a particular file or file type.

**Description**: Returns documentation that matches the given file path based on `filePatterns` in frontmatter.

**Parameters**:
- `filePath` (string, required): The file path to get documentation for
  - Can be absolute or relative path
  - File extension and path structure are used for matching

**Returns**: Object containing:
- `global_rules`: Always-apply rules
- `contextual_docs`: Documentation matching the file pattern
- `inferred_docs`: Documentation inferred from file type and context

**Example**:
```json
{
  "filePath": "src/components/Button.test.jsx"
}
```

### 5. `read_specific_document`

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

### 6. `create_or_update_rule`

**Purpose**: Create or update a documentation rule dynamically.

**Description**: Allows creating new documentation or updating existing documentation programmatically.

**Parameters**:
- `fileName` (string, required): Name for the documentation file
- `title` (string, required): Title for the document
- `content` (string, required): Markdown content for the document
- `alwaysApply` (boolean, optional): Whether rule always applies (default: false)
- `keywords` (array, optional): Keywords for search indexing
- `filePatterns` (array, optional): File patterns this doc applies to
- `description` (string, optional): Brief description of the document

**Returns**: Success confirmation with the created/updated file details

**Example**:
```json
{
  "fileName": "new-api-guide.md",
  "title": "New API Guidelines",
  "content": "# API Guidelines\n\nContent here...",
  "keywords": ["api", "rest", "guidelines"],
  "alwaysApply": false
}
```

### 7. `refresh_documentation`

**Purpose**: Manually refresh the documentation index.

**Description**: Forces a reload of all documentation files and rebuilds indices. Useful when documentation has been modified outside of the watch system.

**Parameters**: None

**Returns**: Confirmation message with number of documents loaded

### 8. `get_document_index`

**Purpose**: List all available documentation with metadata.

**Description**: Returns a complete index of all available documentation files with their metadata, useful for discovering available documentation.

**Parameters**: None

**Returns**: Array of document summaries containing:
- `title`: Document title
- `description`: Document description
- `fileName`: File name
- `lastUpdated`: Last modification timestamp
- `keywords`: Associated keywords
- `alwaysApply`: Whether globally applied

### 9. `add_docset`

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

### 10. `remove_docset`

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

### 11. `list_docsets`

**Purpose**: List all installed documentation sets (docsets).

**Description**: Returns information about all installed docsets that can be searched.

**Parameters**: None

**Returns**: Array of docset information containing:
- `id`: Unique docset identifier
- `name`: Human-readable docset name
- `path`: File system path to docset
- `downloadedAt`: Installation timestamp

### 12. `explore_api`

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

1. **ALWAYS call `doc_bot` first** for ANY task - it provides optimal routing
2. **Follow the exact tool sequence** provided by `doc_bot` without deviation
3. **Search using API/class names** not descriptions (e.g., "Widget" not "iOS widgets")
4. **Call `check_project_rules` before generating code** as directed by `doc_bot`
5. **Use `explore_api` for deep dives** into frameworks and classes
6. **Trust project documentation** over general programming knowledge
7. **Document new patterns** using `create_or_update_rule` for future reference

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