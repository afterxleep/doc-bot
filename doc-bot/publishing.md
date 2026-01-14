---
title: "Publishing Guide"
description: "How to publish doc-bot to npm"
keywords: ["publishing", "npm", "release", "deployment", "versioning"]
---

# Publishing Guide

How to publish doc-bot to npm registry.

## Prerequisites

1. npm account with publish permissions for `@afterxleep/doc-bot`
2. Authenticated npm CLI: `npm login`
3. Clean git working directory
4. All tests passing
5. Documentation up to date

## Publishing Process

### 1. Pre-publish Checklist

- [ ] All tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Documentation is updated
- [ ] CHANGELOG is updated (if applicable)
- [ ] Version number is updated in `package.json`
- [ ] No uncommitted changes: `git status`

### 2. Version Update

Update the version in `package.json` following semantic versioning:

```bash
# Patch release (bug fixes)
npm version patch

# Minor release (new features, backward compatible)
npm version minor

# Major release (breaking changes)
npm version major

# Or manually edit package.json
```

Current version: `0.9.0` → Next: `0.9.1` (patch)

### 3. Final Testing

Run a final test to ensure everything works:

```bash
# Install dependencies
npm install

# Run tests
NODE_OPTIONS=--experimental-vm-modules npm test

# Run linter
npm run lint

# Test the CLI locally
node bin/doc-bot.js --help
```

### 4. Build Verification

Verify what will be published:

```bash
# Dry run to see what files will be included
npm publish --dry-run
```

Expected files to be published:
- `src/` - All source files
- `bin/` - CLI executables
- `prompts/` - Prompt templates
- `README.md` - Package documentation
- `LICENSE` - MIT license
- `package.json` - Package manifest

### 5. Publish to npm

```bash
# Publish with public access (required for scoped packages)
npm publish --access public
```

### 6. Git Tag and Push

After successful publish:

```bash
# Create git tag
git tag v0.9.1

# Push commits and tags
git push origin main --tags
```

### 7. Create GitHub Release

1. Go to https://github.com/afterxleep/doc-bot/releases
2. Click "Create a new release"
3. Select the tag (e.g., `v0.9.1`)
4. Add release notes highlighting:
   - New features
   - Bug fixes
   - Breaking changes (if any)
   - Migration guide (if needed)

### 8. Verify Publication

```bash
# Check npm registry
npm view @afterxleep/doc-bot

# Test installation
npx @afterxleep/doc-bot@latest --help

# Or install globally
npm install -g @afterxleep/doc-bot@latest
```

## Version History

- `0.1.0` - Initial release
- `0.2.0` - Added watch mode
- `0.3.0` - Improved error handling
- `0.4.0` - Enhanced inference engine
- `0.5.0` - Added tool support
- `0.6.0` - Performance improvements
- `0.7.0` - Added agent integration
- `0.8.0` - Enhanced documentation features
- `0.9.0` - ES modules migration, removed manifest support
- `0.9.1` - Documentation updates (upcoming)

## Troubleshooting

### Authentication Issues

```bash
# Check authentication
npm whoami

# Re-authenticate if needed
npm login
```

### Permission Denied

Ensure you have publish rights:
```bash
npm owner ls @afterxleep/doc-bot
```

### Version Already Exists

If version already exists:
1. Update to next version
2. Commit changes
3. Try publishing again

### Build Failures

1. Clear npm cache: `npm cache clean --force`
2. Remove node_modules: `rm -rf node_modules`
3. Reinstall: `npm install`
4. Try publishing again

## Post-Publish

After publishing:

1. **Announce the Release**
   - Update project README if needed
   - Post in relevant channels/forums
   - Update documentation site

2. **Monitor Issues**
   - Check GitHub issues for problems
   - Monitor npm download stats
   - Respond to user feedback

3. **Plan Next Version**
   - Create milestone for next release
   - Triage feature requests
   - Plan breaking changes carefully

## Emergency Procedures

### Unpublishing (within 72 hours)

```bash
# Only for serious issues (security, broken package)
npm unpublish @afterxleep/doc-bot@0.9.1
```

### Deprecating a Version

```bash
# Mark version as deprecated
npm deprecate @afterxleep/doc-bot@0.9.1 "Critical bug, please upgrade to 0.9.2"
```

## Best Practices

1. **Test in Production-like Environment**
   - Test with `npm pack` and install locally
   - Test in fresh directory/container

2. **Semantic Versioning**
   - Patch: Bug fixes only
   - Minor: New features, backward compatible
   - Major: Breaking changes

3. **Clear Communication**
   - Document breaking changes
   - Provide migration guides
   - Update examples

4. **Regular Releases**
   - Don't accumulate too many changes
   - Release early and often
   - Keep changes focused
