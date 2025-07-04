# Documentation Examples

This folder contains example documentation files that demonstrate how to structure and write documentation for use with doc-bot.

## Structure

```
examples/documentation-files/
├── manifest.json              # Configuration file
├── core/                      # Global rules (always apply)
│   ├── coding-standards.md
│   └── security-guidelines.md
├── guides/                    # Step-by-step guides
│   ├── testing.md
│   ├── react-components.md
│   └── api-development.md
└── reference/                 # Quick reference materials
    └── troubleshooting.md
```

## Key Features Demonstrated

### Frontmatter Usage
Each example file shows how to use frontmatter for automatic indexing:

```markdown
---
title: "Clear, descriptive title"
description: "Brief description of the content"
keywords: ["relevant", "searchable", "terms"]
category: "core|guides|reference"
---
```

### Documentation Types

- **Core (`core/`)**: Critical standards that apply to all work
- **Guides (`guides/`)**: Detailed how-to instructions
- **Reference (`reference/`)**: Quick lookups and troubleshooting

### Contextual Rules
The manifest.json shows how to trigger specific documentation based on file patterns:

- `*.test.js` files → testing guide
- `src/components/*` files → React component guide  
- `src/api/*` files → API development guide

## Using These Examples

1. Copy the structure to your project
2. Customize the content for your needs
3. Update the manifest.json file paths
4. Add more documentation files as needed

The automatic indexing will handle keyword extraction and pattern matching based on the content and frontmatter you provide.