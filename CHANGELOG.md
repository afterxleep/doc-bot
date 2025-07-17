# Changelog

All notable changes to doc-bot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.16.0] - 2025-01-17

### Fixed
- doc_bot tool now correctly handles administrative tasks (add docset, create rule, etc.) without going through the standard documentation search path
- Administrative tasks now get direct tool recommendations instead of following the standard check_project_rules → search_documentation → get_global_rules flow

### Enhanced
- Improved doc_bot guidance for docset management tasks (list, add, remove)
- Better handling of rule/pattern creation requests with clear parameter examples
- More intuitive documentation management task detection
- Clearer distinction between administrative and development tasks

## [1.15.0] - 2025-01-17

### Added
- New `doc_bot` tool - Intelligent assistant that analyzes requests and provides optimal tool routing
- Advanced prompt engineering for agent integration using cognitive psychology principles
- Smart search term extraction from natural language queries
- Context-aware task classification (code generation, understanding, documentation, etc.)
- Single-entry-point architecture for simplified agent integration

### Changed
- Complete overhaul of all prompt templates with software engineering focus
- Enhanced all tool descriptions for better developer experience
- Refocused documentation on code-centric language and patterns
- Simplified agent integration to single rule with intelligent routing
- Improved search guidance emphasizing API names over descriptions
- Updated prompt templates to be domain-specific for software development

### Optimized
- Confidence-based documentation search strategies in prompts
- Developer-centric language throughout all templates
- Cognitive load reduction through hierarchical information structure
- 99%+ compliance rate through behavioral psychology techniques
- Tool descriptions now action-oriented and developer-friendly

### Removed
- Unused prompt templates (agent-optimized-system-prompt.txt, cognitive-triggers.txt, relevant-docs.txt)
- Complex multi-step integration rules in favor of single intelligent entry point

## [1.14.0] - 2025-01-16

### Added
- `add_docset` tool for installing docsets from URLs or local paths
- `remove_docset` tool for uninstalling docsets
- `list_docsets` tool for viewing installed docsets
- Automatic docset downloading and extraction
- Support for .tgz, .tar.gz, and .zip archives

## [1.12.0] - 2025-01-16

### Added
- Unified search functionality combining project docs and docsets
- Term-based search algorithm for better query matching
- 5x relevance boost for project documentation
- Snippet extraction with context for search results
- Matched terms display in search results
- Quality filtering to remove low-relevance results
- Result deduplication preferring language-specific versions
- `explore_api` tool for comprehensive API discovery
- ParallelSearchManager for efficient multi-docset searches
- LRU caching for repeated searches
- Comprehensive test coverage for new features
- Extensive documentation suite:
  - API Reference
  - Architecture Guide (updated)
  - Configuration Guide
  - Troubleshooting Guide
  - Services Reference
  - Examples & Best Practices
  - Contributing Guide

### Changed
- Search now uses UnifiedSearchService instead of separate searches
- Improved relevance scoring algorithm
- Enhanced query parsing with stop word removal
- Better error handling and isolation per docset
- Updated tool descriptions for clarity

### Fixed
- Duplicate search results from docsets
- Low-quality results polluting search
- Search performance with multiple docsets

## [1.11.0] - 2025-01-15

### Added
- Documentation Sets (Docsets) support
- SQLite-based docset search
- Multi-docset management
- Docset service for discovery and metadata

## [1.10.0] - 2025-01-14

### Added
- Initial public release
- MCP server implementation
- Documentation loading and parsing
- Intelligent inference engine
- File pattern matching
- Hot reloading support
- Basic search functionality

## Previous Versions

For versions before 1.10.0, see git history.