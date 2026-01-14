---
title: "File Patterns Guide"
description: "Comprehensive guide for using file patterns in doc-bot"
keywords: ["filePatterns", "patterns", "glob", "contextual", "documentation", "matching"]
---

# File Patterns Guide

This guide explains how to use file patterns in doc-bot to create contextual documentation that appears only for specific files.

## Overview

The `filePatterns` feature allows you to specify which files your documentation applies to. When AI assistants request documentation for a specific file using the `get_file_docs` tool, only documents with matching patterns are returned.

## Basic Usage

Add the `filePatterns` field to your documentation's frontmatter:

```markdown
---
title: React Hooks Guide
keywords: [react, hooks, useState, useEffect]
filePatterns: ["*.jsx", "*.tsx", "src/hooks/**/*.js"]
---

# React Hooks Best Practices
...
```

## Pattern Syntax

Doc-bot supports glob-like patterns with the following syntax:

### Wildcards

- `*` - Matches any characters (except path separators)
- `**` - Matches any characters including path separators
- `?` - Matches exactly one character

### Examples

| Pattern | Matches | Doesn't Match |
|---------|---------|---------------|
| `*.js` | `app.js`, `utils.js` | `app.ts`, `src/app.js` |
| `**/*.js` | `app.js`, `src/app.js`, `src/utils/helper.js` | `app.ts` |
| `src/*.js` | `src/app.js`, `src/utils.js` | `app.js`, `src/utils/helper.js` |
| `src/**/*.js` | `src/app.js`, `src/utils/helper.js` | `app.js`, `test/app.js` |
| `?.js` | `a.js`, `b.js` | `app.js`, `ab.js` |
| `test?.js` | `test1.js`, `testA.js` | `test.js`, `test10.js` |

### Character Sets

Use brackets to match specific characters:

- `[abc]` - Matches 'a', 'b', or 'c'
- `[a-z]` - Matches any lowercase letter
- `[0-9]` - Matches any digit

Examples:
- `test[0-9].js` matches `test0.js`, `test5.js`
- `[Tt]est.js` matches `Test.js` or `test.js`

## Common Use Cases

### 1. React/JSX Files

```yaml
filePatterns: ["*.jsx", "*.tsx", "src/components/**/*.js"]
```

Use for:
- Component guidelines
- React hooks documentation
- JSX best practices

### 2. Test Files

```yaml
filePatterns: ["*.test.js", "*.spec.js", "__tests__/**/*", "**/*.test.ts"]
```

Use for:
- Testing standards
- Jest configuration
- Test utilities documentation

### 3. Configuration Files

```yaml
filePatterns: ["*.config.js", "webpack.*.js", ".*rc", ".env*"]
```

Use for:
- Configuration guidelines
- Environment variable documentation
- Build setup instructions

### 4. API Routes

```yaml
filePatterns: ["api/**/*.js", "routes/**/*.js", "src/controllers/**/*.js"]
```

Use for:
- API design patterns
- Authentication middleware docs
- Request/response standards

### 5. Database Models

```yaml
filePatterns: ["models/**/*.js", "src/db/**/*.js", "**/*Schema.js"]
```

Use for:
- Database schema guidelines
- Model relationships
- Query optimization tips

### 6. Style Files

```yaml
filePatterns: ["*.css", "*.scss", "*.less", "styles/**/*"]
```

Use for:
- CSS conventions
- Styling guidelines
- Component styling patterns

## Advanced Patterns

### Multiple Extensions

Match multiple file types:
```yaml
filePatterns: ["*.{js,ts}", "*.{jsx,tsx}", "*.{json,yaml,yml}"]
```

### Exclude Patterns

While doc-bot doesn't support negative patterns directly, you can be specific:
```yaml
# Instead of excluding test files, be specific about source files
filePatterns: ["src/**/*.js", "lib/**/*.js", "!**/*.test.js"]
```

### Complex Patterns

Combine multiple pattern types:
```yaml
filePatterns: [
  "src/**/[A-Z]*.jsx",     # React components (PascalCase)
  "src/hooks/use*.js",     # Custom hooks
  "src/utils/*.helper.js", # Utility helpers
  "**/*.config.{js,json}" # Configuration files
]
```

## Best Practices

### 1. Be Specific

```yaml
# ✅ Good - Specific to component files
filePatterns: ["src/components/**/*.jsx", "src/components/**/*.tsx"]

# ❌ Too broad - Matches all JS files
filePatterns: ["**/*.js"]
```

### 2. Order Matters

List patterns from most to least specific:
```yaml
filePatterns: [
  "src/components/Button.jsx",  # Specific file first
  "src/components/*.jsx",       # Component directory
  "**/*.jsx"                    # All JSX files
]
```

### 3. Test Your Patterns

Before deploying, test patterns with various file paths:
- `src/App.js`
- `src/components/Button.jsx`
- `tests/unit/Button.test.js`
- `config/webpack.config.js`

### 4. Document Pattern Intent

Add comments in your documentation explaining what the patterns target:

```markdown
---
title: API Route Guidelines
# Patterns target Express route handlers and controllers
filePatterns: ["routes/**/*.js", "controllers/**/*.js", "api/**/*.js"]
---
```

### 5. Keep Non-Pattern Docs General

Docs without `filePatterns` are treated as general documentation and show up in search results instead of file-specific lookups.

## Pattern Matching Behavior

1. **Case Insensitive**: Patterns match regardless of case
2. **Full Path Matching**: Patterns match against the full file path
3. **OR Logic**: Multiple patterns are combined with OR (any match includes the doc)
4. **No Negative Patterns**: Use specific positive patterns instead

## Debugging Pattern Issues

If your patterns aren't matching:

1. **Check Pattern Syntax**
   - Ensure wildcards are correct (`*` vs `**`)
   - Verify character sets are properly closed

2. **Test with Simple Patterns**
   - Start with `*.js` and gradually add complexity
   - Use the `get_file_docs` tool to test

3. **Verify File Paths**
   - Patterns match against full paths
   - Include directory separators as needed

4. **Check filePatterns**
   - Ensure `filePatterns` are present and correctly formatted

## Examples by Framework

### React Project

```yaml
# Component documentation
filePatterns: ["src/components/**/*.{jsx,tsx}"]

# Hook documentation  
filePatterns: ["src/hooks/**/*.{js,ts}", "**/use*.{js,ts}"]

# Context documentation
filePatterns: ["src/context/**/*.{jsx,tsx}", "**/*Context.{js,ts}"]
```

### Node.js API

```yaml
# Route handlers
filePatterns: ["routes/**/*.js", "api/**/*.js"]

# Middleware
filePatterns: ["middleware/**/*.js", "src/middleware/**/*.js"]

# Database models
filePatterns: ["models/**/*.js", "**/*Model.js"]
```

### Full-Stack Application

```yaml
# Frontend files
filePatterns: ["client/**/*.{js,jsx,ts,tsx}", "frontend/**/*.{js,jsx,ts,tsx}"]

# Backend files
filePatterns: ["server/**/*.js", "backend/**/*.js", "api/**/*.js"]

# Shared utilities
filePatterns: ["shared/**/*.js", "common/**/*.js", "utils/**/*.js"]
```

## Integration with Other Features

File patterns work seamlessly with other doc-bot features:

1. **Keyword Search**: Documents are still searchable by keywords
2. **Inference Engine**: AI can still infer relevant docs beyond patterns
3. **General Docs**: Documents without `filePatterns` are treated as general guidance
4. **Confidence Scores**: Combine with confidence for prioritization

Remember: File patterns provide deterministic, author-controlled matching for contextual documentation, ensuring the right documentation appears at the right time.
