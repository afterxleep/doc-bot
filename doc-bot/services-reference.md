---
title: "Doc-Bot Services Reference"
description: "Detailed documentation of all service classes and their methods"
keywords: ["services", "api", "classes", "methods", "documentation", "search", "docsets"]
---

# Doc-Bot Services Reference

This document provides detailed documentation for all service classes in the doc-bot codebase. Each service has a specific responsibility and they work together to provide the complete functionality.

## DocumentationService

**Location**: `src/services/DocumentationService.js`

**Purpose**: Manages loading, parsing, and searching of project documentation files.

### Constructor
```javascript
new DocumentationService(docsPath, manifestLoader = null)
```
- `docsPath`: Path to documentation directory
- `manifestLoader`: Optional manifest loader (legacy, not required)

### Key Properties
- `documents`: Map of loaded documents
- `lastScanned`: Timestamp of last scan

### Methods

#### `initialize()`
Loads all documentation files from the configured directory.

#### `reload()`
Clears cache and reloads all documentation.

#### `searchDocuments(query)`
Performs advanced search with relevance scoring.
- **Parameters**: `query` (string)
- **Returns**: Array of documents sorted by relevance
- **Features**:
  - Exact phrase matching (20 point bonus)
  - Title matching (15 points)
  - Description matching (10 points)
  - Keyword matching (12 points exact, 8 points partial)
  - Content frequency scoring
  - Fuzzy matching for typos
  - Minimum relevance threshold (5%)

#### `extractRelevantSnippet(content, searchTerms, originalQuery)`
Extracts context-aware snippets from content.
- **Parameters**: 
  - `content`: Document content
  - `searchTerms`: Parsed search terms
  - `originalQuery`: Original search query
- **Returns**: Relevant snippet (max 200 chars)

#### `getMatchedTerms(doc, searchTerms)`
Identifies which search terms matched in a document.
- **Returns**: Array of matched terms

#### `getAllDocuments()`
Returns all loaded documents.

#### `getDocument(fileName)`
Gets a specific document by filename.

#### `getContextualDocs(filePath)`
Returns documents matching file patterns.

## UnifiedSearchService

**Location**: `src/services/UnifiedSearchService.js`

**Purpose**: Provides unified search across project docs and docsets.

### Constructor
```javascript
new UnifiedSearchService(documentationService, multiDocsetDatabase)
```

### Methods

#### `search(query, options)`
Main search method combining all sources.
- **Parameters**:
  - `query`: Search query
  - `options`: { limit, docsetId, type }
- **Returns**: Combined, normalized results
- **Features**:
  - Query parsing with stop word removal
  - Parallel search execution
  - 5x relevance boost for project docs
  - Quality filtering
  - Result deduplication

#### `parseQuery(query)`
Parses query into search terms.
- **Removes**: Stop words, special characters
- **Preserves**: Dots, dashes, underscores
- **Filters**: Terms < 2 characters

#### `normalizeLocalResults(results)`
Normalizes project documentation results.

#### `normalizeDocsetResults(results)`
Normalizes and deduplicates docset results.
- Prefers Swift language entries
- Removes duplicates by name+type

#### `getSources()`
Returns summary of available documentation sources.

## InferenceEngine

**Location**: `src/services/InferenceEngine.js`

**Purpose**: Provides intelligent documentation inference based on context.

### Constructor
```javascript
new InferenceEngine(documentationService)
```

### Methods

#### `initialize()`
Builds document index for inference.

#### `getRelevantDocumentation(context)`
Infers relevant documentation based on context.
- **Parameters**:
  - `context`: Object with `query`, `filePath`, and/or `codeSnippet`
- **Returns**: Contextual docs, inferred docs, and confidence score

#### `extractKeywords(text)`
Extracts keywords from text.

#### `calculateConfidence(doc, keywords, fileContext)`
Calculates relevance confidence score (0-1).

## DocumentIndex

**Location**: `src/services/DocumentIndex.js`

**Purpose**: Creates and maintains search indices for fast retrieval.

### Constructor
```javascript
new DocumentIndex()
```

### Indices
- `keywordIndex`: Map<keyword, Set<documents>>
- `topicIndex`: Map<topic, Set<documents>>
- `patternIndex`: Map<pattern, Set<documents>>
- `extensionIndex`: Map<extension, Set<documents>>
- `frameworkIndex`: Map<framework, Set<documents>>

### Methods

#### `buildIndex(documents)`
Builds all indices from document collection.

#### `searchByKeywords(keywords)`
Finds documents matching keywords.

#### `searchByFilePattern(filePath)`
Finds documents matching file patterns.

#### `searchByExtension(extension)`
Finds documents for file extensions.

#### `searchByFramework(frameworkPatterns)`
Finds framework-specific documentation.

#### `detectFrameworks(content)`
Detects frameworks used in content.

## DocsetService

**Location**: `src/services/docset/index.js`

**Purpose**: Manages docset discovery and metadata.

### Constructor
```javascript
new DocsetService(storagePath)
```

### Methods

#### `initialize()`
Loads existing docsets from storage.

#### `scanForDocsets()`
Scans directory for .docset packages.

#### `addDocset(docsetPath)`
Adds a new docset to the registry.
- **Returns**: Docset info object

#### `removeDocset(docsetId)`
Removes docset from registry.

#### `listDocsets()`
Returns array of all registered docsets.

#### `parseDocsetInfo(docsetPath)`
Parses Info.plist to extract metadata.

## MultiDocsetDatabase

**Location**: `src/services/docset/database.js`

**Purpose**: Manages SQLite operations for multiple docsets.

### Constructor
```javascript
new MultiDocsetDatabase()
```

### Methods

#### `addDocset(docsetInfo)`
Adds a docset database connection.

#### `removeDocset(docsetId)`
Removes and closes docset database.

#### `search(query, options)`
Basic substring search across docsets.

#### `searchWithTerms(searchTerms, options)`
Advanced term-based search.
- **Features**:
  - Exact phrase matching
  - Individual term matching
  - Relevance scoring
  - Result deduplication

#### `searchExact(name, options)`
Finds exact matches by name.

#### `exploreAPI(entryName, options)`
Comprehensive API exploration.
- **Returns**: Categorized API elements
  - framework, classes, methods, properties
  - functions, protocols, enums, constants
  - samples, guides

#### `getAllTypes()`
Returns all available types across docsets.

#### `getStats()`
Returns statistics for all docsets.

## DocsetDatabase

**Location**: `src/services/docset/database.js`

**Purpose**: Handles SQLite operations for a single docset.

### Methods

#### `search(query, type, limit)`
Basic LIKE search in docset.

#### `searchWithTerms(searchTerms, type, limit)`
Term-based search with scoring.
- **Scoring**:
  - Exact phrase: 100 points
  - All terms present: 50 point bonus
  - Exact term match: 10 points
  - Term at start: 7 points
  - Term anywhere: 5 points

#### `searchExact(name, type)`
Exact name match search.

#### `getTypes()`
Returns all entry types in docset.

#### `getEntryCount()`
Returns total number of entries.

## ParallelSearchManager

**Location**: `src/services/docset/ParallelSearchManager.js`

**Purpose**: Optimizes search performance across multiple docsets.

### Features
- Executes searches in parallel
- 2-second timeout per docset
- LRU cache for repeated searches
- Error isolation per docset

### Methods

#### `searchDocsetsParallel(databases, searchTerms, options)`
Executes parallel search across multiple databases.
- **Returns**: Combined, sorted results
- **Cache**: 5-minute TTL

#### `getCacheKey(searchTerms, options)`
Generates cache key for search.

## Service Interactions

### Search Flow
```
User Query
    ↓
UnifiedSearchService.search()
    ├→ parseQuery()
    ├→ DocumentationService.searchDocuments()
    │   └→ calculateAdvancedRelevanceScore()
    └→ MultiDocsetDatabase.searchWithTerms()
        └→ ParallelSearchManager (if >3 docsets)
```

### Documentation Guidance Flow
```
doc_bot(task)
    ↓
InferenceEngine.getRelevantDocumentation()
    ├→ DocumentationService.getContextualDocs()
    └→ DocumentIndex.searchByKeywords()
```

### File Documentation Flow
```
get_file_docs(filePath)
    ↓
DocumentationService.getContextualDocs()
```

## Error Handling

All services implement consistent error handling:
- Graceful degradation (return empty results vs throwing)
- Logging of errors for debugging
- Isolation of failures (one docset failure doesn't affect others)
- Clear error messages in responses

## Performance Considerations

1. **DocumentationService**: In-memory caching of all documents
2. **UnifiedSearchService**: Parallel execution, quality filtering
3. **DocsetDatabase**: Indexed SQLite queries, term-based search
4. **ParallelSearchManager**: Concurrent execution, LRU caching
5. **DocumentIndex**: Pre-built indices for O(1) lookups
