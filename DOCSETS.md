# Docset Support in doc-bot

doc-bot now supports [Docsets](https://kapeli.com/docsets) - the documentation format used by Dash, Zeal, and Velocity. This allows you to search and access official API documentation alongside your project-specific Markdown documentation.

## Overview

Docsets are pre-indexed documentation sets containing HTML documentation with a SQLite search index. doc-bot can:
- Install docsets from URLs or local files
- Search across multiple docsets simultaneously
- Combine docset results with your Markdown documentation
- Access official documentation for iOS, macOS, Swift, and many other platforms

## Configuration

By default, docsets are stored in `~/Developer/DocSets`. You can customize this location:

```bash
# Custom docset storage location
doc-bot --docs ./docs --docsets ~/MyDocSets

# MCP configuration
{
  "command": "doc-bot",
  "args": ["--docs", "./docs", "--docsets", "/custom/path/to/docsets"]
}
```

## Available Tools

### Managing Docsets

#### `add_docset`
Install a new docset from a URL or local file:

```json
{
  "source": "https://example.com/iOS.tgz"
}
```

Supported formats:
- `.docset` directories
- `.tgz` / `.tar.gz` archives
- `.zip` archives

#### `remove_docset`
Remove an installed docset:

```json
{
  "docsetId": "c8d713b0"
}
```

#### `list_docsets`
List all installed docsets with their metadata.

### Searching Documentation

#### `search_docsets`
Search only within installed docsets:

```json
{
  "query": "UIViewController",
  "type": "Class",        // Optional: filter by type
  "docsetId": "ios",      // Optional: search specific docset
  "limit": 50             // Optional: max results (default: 50)
}
```

Supported types:
- `Class`, `Method`, `Function`, `Property`
- `Protocol`, `Enum`, `Structure`
- `Guide`, `Sample`, `Category`
- `Constant`, `Variable`, `Typedef`, `Macro`

#### `search_all`
Search both Markdown documentation and docsets:

```json
{
  "query": "authentication"
}
```

Returns results from both sources, clearly labeled.

#### `docset_stats`
Get statistics about installed docsets:
- Entry counts by type
- Total documentation entries
- Storage information

## Example Workflow

1. **Install iOS Documentation**
   ```
   add_docset: { "source": "https://dash-docsets.com/iOS.tgz" }
   ```

2. **Search for UIViewController**
   ```
   search_docsets: { "query": "UIViewController", "type": "Class" }
   ```

3. **Get Combined Results**
   ```
   search_all: { "query": "view lifecycle" }
   ```
   Returns both your custom docs about view lifecycle AND official Apple documentation.

## Where to Find Docsets

### Official Sources
- [Dash User Contributed Docsets](https://github.com/Kapeli/Dash-User-Contributions)
- [Zeal Feed](https://zealusercontributions.herokuapp.com/)

### Popular Docsets
- iOS: `https://dash-docsets.com/iOS.tgz`
- macOS: `https://dash-docsets.com/macOS.tgz`
- Swift: `https://dash-docsets.com/Swift.tgz`
- JavaScript: `https://dash-docsets.com/JavaScript.tgz`
- React: `https://dash-docsets.com/React.tgz`

## Storage Structure

Docsets are stored in a structured format:

```
~/Developer/DocSets/
├── docsets.json              # Metadata for all docsets
├── c8d713b0/                 # Unique ID directory
│   └── iOS.docset/           # Actual docset
│       ├── Contents/
│       │   ├── Info.plist    # Docset metadata
│       │   └── Resources/
│       │       ├── docSet.dsidx     # SQLite index
│       │       └── Documents/       # HTML documentation
└── a5f2c891/
    └── Swift.docset/
```

## Integration with AI Agents

When using doc-bot with AI agents (like Claude), the docset tools provide:
- Access to official API documentation
- Accurate class/method signatures
- Framework-specific guidance
- Code examples from official sources

This complements your project-specific documentation, giving AI agents both:
- Your custom implementation patterns (Markdown docs)
- Official API references (Docsets)

## Performance Considerations

- Docsets can be large (100MB-1GB+)
- Initial download may take time depending on connection
- Searches are fast due to SQLite indexing
- Multiple docsets can be searched simultaneously

## Troubleshooting

### Docset Won't Install
- Check the source URL is accessible
- Ensure sufficient disk space
- Verify the file is a valid docset format

### Search Returns No Results
- Verify docsets are installed with `list_docsets`
- Check the search query syntax
- Try searching without filters first

### Storage Issues
- Default location requires `~/Developer/DocSets` to be writable
- Use `--docsets` flag to specify alternate location
- Each docset is stored in a unique subdirectory