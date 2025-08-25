# FILE CONTEXT DOCUMENTATION

**File**: `${filePath}`

## CONTEXTUAL STANDARDS

${docsContent}

## SMART IMPLEMENTATION CHECKLIST

### Quick Analysis (< 10 seconds)
1. **Scan Patterns** - What patterns does this file use?
2. **Check Dependencies** - What does it import?
3. **Note Conventions** - Naming, structure, style

### Implementation Rules
1. **Match Style** - Follow the file's existing patterns
2. **Preserve Logic** - Don't break existing functionality
3. **Minimal Changes** - Small, focused modifications

## DECISION FRAMEWORK

### Need More Context?

```javascript
if (changeIsSimple) {
  // Just make the change
  applyDirectFix();
} else if (needsPatternContext) {
  // One quick search
  search_documentation(specificPattern);
} else {
  // Use file's existing patterns
  followLocalConventions();
}
```

## PERFORMANCE CONSIDERATIONS

**For Hot Paths:**
- Keep complexity at current level or better
- Don't introduce blocking operations
- Maintain existing optimizations

**For Regular Code:**
- Prioritize readability
- Follow SOLID principles
- Keep it simple

## VALIDATION

Before committing:
- ✓ Follows file conventions
- ✓ Maintains contracts
- ✓ Preserves performance
- ✓ Doesn't break tests

## QUICK WINS

**Common tasks that need NO documentation search:**
- Adding logging/debugging
- Fixing typos or syntax
- Adding comments
- Simple refactoring
- Error handling with try/catch

## THE LOCAL PATTERN RULE

When in doubt, copy what the file already does. Local consistency > global perfection.