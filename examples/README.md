# Documentation Examples

This folder contains example documentation files that demonstrate how to structure and write documentation for use with doc-bot.

## Structure

```
examples/documentation-files/
├── core/                      # Global rules (alwaysApply: true)
│   ├── coding-standards.md
│   └── security-guidelines.md
├── guides/                    # Contextual rules (alwaysApply: false)
│   ├── testing.md             # Applied to *.test.js files
│   ├── react-components.md    # Applied to *.jsx, *.tsx files
│   └── api-development.md     # Applied to **/routes/**, **/api/** files
└── reference/                 # Contextual rules (alwaysApply: false)
    └── troubleshooting.md     # Applied to *.js, *.ts files
```

## Key Features Demonstrated

### Frontmatter Usage
Each example file shows how to use frontmatter for automatic indexing:

```markdown
---
alwaysApply: true|false        # Global vs contextual rules
title: "Clear, descriptive title"
description: "Brief description of the content"
keywords: ["relevant", "searchable", "terms"]
filePatterns: ["*.js", "src/**/*"]  # Required for contextual rules
---
```

### Documentation Types

- **Global Rules (`alwaysApply: true`)**: Critical standards that apply to every AI interaction
- **Contextual Rules (`alwaysApply: false`)**: Rules triggered by specific file patterns

### Frontmatter-Based Rules
Rules are now automatically detected from frontmatter - no manifest.json needed:

- `filePatterns: ["*.test.js"]` → testing guide applies to test files
- `filePatterns: ["*.jsx", "*.tsx"]` → React guide applies to component files  
- `filePatterns: ["**/api/**"]` → API guide applies to API files

## Using These Examples

1. Copy the structure to your project
2. Customize the content for your needs
3. Set `alwaysApply: true` for global rules that should always be considered
4. Set `alwaysApply: false` and add `filePatterns` for contextual rules
5. Add more documentation files as needed

The automatic indexing will handle keyword extraction and pattern matching based on the content and frontmatter you provide. No manifest.json file is required!