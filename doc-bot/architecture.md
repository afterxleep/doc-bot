---
alwaysApply: false
title: "Doc-Bot Architecture"
description: "Technical architecture and components of the doc-bot MCP server"
keywords: ["architecture", "MCP", "server", "components", "technical"]
filePatterns: ["*.js"]
---

# Architecture

## Core Components

### 1. CLI Interface (`bin/doc-bot.js`)
- NPM package with `npx` support
- Auto-detects `docs.ai/` folder
- Creates default configuration if missing

### 2. MCP Server (`src/index.js`)
- Implements MCP protocol for AI agent communication
- Provides resources and tools for documentation access
- Handles search, inference, and contextual suggestions

### 3. Documentation Service (`src/services/DocumentationService.js`)
- Loads and parses markdown files with frontmatter
- Provides search functionality with relevance scoring
- Manages global rules and contextual documentation

### 4. Inference Engine (`src/services/InferenceEngine.js`)
- Smart suggestions based on context (keywords, file paths, code patterns)
- Calculates confidence scores for recommendations
- Combines multiple signals for better accuracy

### 5. Manifest Loader (`src/services/ManifestLoader.js`)
- Manages project configuration from `manifest.json`
- Validates and provides defaults for missing config
- Supports hot reloading of configuration changes

## How Intelligence Works

### Context Analysis
1. **Query Keywords**: Extracts keywords from user queries
2. **File Path Analysis**: Analyzes current file being worked on
3. **Code Pattern Detection**: Recognizes patterns in code snippets
4. **Confidence Calculation**: Combines signals for confidence score

### Documentation Mapping
- **Global Rules**: Always applied (coding standards, security)
- **Contextual Rules**: Applied based on file patterns
- **Inference Rules**: Applied based on keywords and code patterns
- **Smart Ranking**: Results ranked by relevance and confidence

## MCP Server Features

### Tools
- `search_documentation(query)` - Full-text search
- `get_relevant_docs(context)` - Context-aware suggestions
- `get_global_rules()` - Always-apply documentation
- `get_file_docs(filepath)` - File-specific documentation

### Smart Inference Engine
- **Keyword Detection**: Matches query keywords to documentation
- **File Path Analysis**: Suggests docs based on file being worked on
- **Code Pattern Recognition**: Detects patterns in code snippets
- **Context Awareness**: Combines multiple signals for better suggestions