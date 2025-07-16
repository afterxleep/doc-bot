---
alwaysApply: false
title: "Doc-Bot Architecture"
description: "Technical architecture and components of the doc-bot MCP server"
keywords: ["architecture", "mcp", "server", "components", "design", "docsets", "search"]
---

# Doc-Bot Architecture

Doc-bot is an MCP (Model Context Protocol) server that provides intelligent documentation access for AI coding assistants. This document describes the technical architecture and components of the system.

## Overview

Doc-bot implements the MCP server specification to provide a standardized interface for AI tools to access project documentation and official API documentation through docsets. The architecture is designed to be:

- **Platform agnostic**: Works with any MCP-compatible AI tool
- **Scalable**: Documentation lives outside AI context windows
- **Dynamic**: Supports hot reloading and live updates
- **Intelligent**: Provides smart search and contextual retrieval
- **Comprehensive**: Searches both project docs and official API documentation

## Core Components

### 1. MCP Server (`src/index.js`)

The main server class that implements the MCP protocol:

- **DocsServer**: Main class extending `Server` from `@modelcontextprotocol/sdk`
- Handles resource listing and reading
- Implements 10 different tool operations
- Supports file watching for hot reloading
- Loads prompt templates for agent optimization
- Initializes all service components

### 2. Documentation Service (`src/services/DocumentationService.js`)

Manages project documentation loading and parsing:

- Loads markdown files (`.md`, `.mdx`, `.mdc`) from specified directory
- Parses frontmatter metadata using YAML
- Caches documents in memory for fast access
- Supports hot reloading via file watching
- Provides document retrieval by filename
- Implements advanced relevance scoring algorithm
- Extracts relevant snippets with context
- Tracks matched search terms

Key methods:
- `searchDocuments()`: Advanced search with relevance scoring
- `extractRelevantSnippet()`: Context-aware snippet extraction
- `getMatchedTerms()`: Identifies which search terms matched
- `calculateAdvancedRelevanceScore()`: Sophisticated scoring algorithm

### 3. Unified Search Service (`src/services/UnifiedSearchService.js`)

Combines project documentation and docset searches:

- Parses queries into search terms with stop word removal
- Searches both local docs and docsets in parallel
- Applies 5x relevance boost to project documentation
- Normalizes results from different sources
- Implements quality filtering for relevance
- Deduplicates results intelligently

Key features:
- Term-based query parsing
- Parallel search execution
- Result normalization and deduplication
- Dynamic quality thresholding

### 4. Docset Services

#### DocsetService (`src/services/docset/index.js`)
Manages docset discovery and metadata:

- Scans for installed docsets in specified directory
- Parses docset Info.plist files
- Manages docset addition and removal
- Persists docset registry

#### MultiDocsetDatabase (`src/services/docset/database.js`)
Handles SQLite database operations for docsets:

- Manages multiple docset databases simultaneously
- Implements term-based search algorithm
- Provides exact match and fuzzy search
- Supports API exploration for comprehensive discovery
- Uses ParallelSearchManager for performance

#### ParallelSearchManager (`src/services/docset/ParallelSearchManager.js`)
Optimizes search performance:

- Executes searches in parallel across multiple docsets
- Implements timeout protection (2 seconds per docset)
- Uses LRU caching for repeated searches
- Handles errors gracefully per docset

### 5. Inference Engine (`src/services/InferenceEngine.js`)

Provides intelligent documentation retrieval:

- Builds and maintains document indexes
- Calculates confidence scores for relevance
- Supports contextual search based on:
  - Keywords and synonyms
  - File patterns and extensions
  - Topics and concepts
  - Framework/library patterns
- Returns ranked documentation results

### 6. Document Index (`src/services/DocumentIndex.js`)

Creates sophisticated indexing for fast retrieval:

- **Keyword Index**: Maps keywords to documents
- **Topic Index**: Groups documents by topics
- **Pattern Index**: Matches file patterns to documentation
- **Extension Index**: Maps file extensions to relevant docs
- **Framework Index**: Detects and indexes framework usage
- Extracts keywords from:
  - Code blocks and their languages
  - Headings and content
  - Frontmatter metadata

## Data Flow

```
1. AI Tool Request → MCP Server
2. MCP Server → Tool Handler
3. Tool Handler → Service Layer
   ├─→ UnifiedSearchService (for searches)
   ├─→ InferenceEngine (for rule checking)
   ├─→ DocumentationService (for direct access)
   └─→ DocsetService (for docset management)
4. Service → Indices/Caches/Databases
5. Response → AI Tool
```

## Search Architecture

The search system uses a multi-layered approach:

```
Query → UnifiedSearchService
         ├─→ Parse Query (remove stop words, extract terms)
         ├─→ Search Local Docs (DocumentationService)
         │    ├─→ Exact phrase matching
         │    ├─→ Term matching with scoring
         │    ├─→ Fuzzy matching
         │    └─→ Snippet extraction
         └─→ Search Docsets (MultiDocsetDatabase)
              ├─→ Parallel execution
              ├─→ Term-based SQL queries
              ├─→ Relevance scoring
              └─→ Result deduplication
```

## Available Tools

1. **`check_project_rules`**: Get project-specific coding rules
2. **`search_documentation`**: Unified search across all documentation
3. **`get_global_rules`**: Get always-apply rules
4. **`get_file_docs`**: Get file-specific documentation
5. **`read_specific_document`**: Read a specific doc file
6. **`create_or_update_rule`**: Create/update documentation
7. **`refresh_documentation`**: Refresh documentation index
8. **`get_document_index`**: List all available documents
9. **`list_docsets`**: List installed docsets
10. **`explore_api`**: Explore API documentation comprehensively

## File Structure

```
doc-bot/
├── src/
│   ├── index.js                    # MCP server implementation
│   └── services/
│       ├── DocumentationService.js # Project doc management
│       ├── UnifiedSearchService.js # Unified search logic
│       ├── InferenceEngine.js      # Intelligent retrieval
│       ├── DocumentIndex.js        # Indexing system
│       └── docset/
│           ├── index.js            # Docset service
│           ├── database.js         # SQLite operations
│           └── ParallelSearchManager.js # Parallel search
├── bin/
│   └── doc-bot.js                  # CLI executable
├── prompts/                        # Agent optimization templates
├── doc-bot/                        # Documentation
└── test-fixtures/                  # Test files
```

## Document Format

Documents use frontmatter for metadata:

```markdown
---
title: Document Title
description: Brief description
keywords: [keyword1, keyword2]
topics: [topic1, topic2]
filePatterns: ["*.js", "src/**/*.ts"]
alwaysApply: false
confidence: 0.9
---

# Document Content
...
```

## Performance Optimizations

1. **In-Memory Caching**: All project docs cached on startup
2. **Parallel Search**: Multiple docsets searched simultaneously
3. **LRU Cache**: Frequently searched queries cached
4. **Lazy Loading**: Docsets loaded on first search
5. **Relevance Filtering**: Low-quality results filtered early
6. **Deduplication**: Duplicate results removed efficiently

## Agent Optimization

Doc-bot includes sophisticated prompt templates to ensure AI agents:
- Always check project rules before generating code
- Use documentation as the source of truth
- Follow project-specific patterns and conventions
- Search efficiently using appropriate tools

## Hot Reloading

When running with `--watch` flag:
1. Monitors documentation directory for changes
2. Automatically reloads modified documents
3. Updates indexes in real-time
4. No server restart required
5. Preserves docset connections

## Error Handling

- Graceful handling of missing documentation directories
- Per-docset error isolation
- Clear error messages for file access issues
- Validation of frontmatter format
- Fallback behavior for missing metadata
- Timeout protection for slow searches

## Security Considerations

- Read-only access to documentation
- Sandboxed file system access
- No execution of arbitrary code
- Input validation for all parameters
- Safe handling of file paths