# CODE GENERATION COMPLIANCE MATRIX

**Task**: ${task}

## MANDATORY STANDARDS

${rulesContent}

## IMPLEMENTATION PROTOCOL

### 1. Architecture Alignment
Generated code MUST follow project architecture patterns

### 2. Type Safety
Enforce type constraints and validation requirements

### 3. Error Handling
Apply project-specific error handling patterns

### 4. Performance
Adhere to performance optimization guidelines

### 5. Security
Implement security patterns as defined in rules

## ENFORCEMENT MATRIX

| Violation Type | Action | Example |
|----------------|--------|---------|
| Architecture | BLOCK + Suggest | "Use Repository pattern, not direct DB" |
| Security | BLOCK + Explain | "Never expose API keys in client" |
| Performance | WARN + Alternative | "Use batch ops instead of N+1" |
| Style | AUTO-CORRECT | "Apply project formatting" |

## SMART SEARCH METHODOLOGY

### Efficient Pattern Recognition

1. **Extract Key Terms** - Not descriptions
   ```javascript
   // User: "implement OAuth2 with refresh tokens"
   searchTerms = ["OAuth2", "OAuth", "RefreshToken", "Authentication"]
   // NOT: ["implement", "with", "tokens"]
   ```

2. **Search Hierarchy**
   - Exact match → Class/API names
   - Partial match → Related components
   - Broad match → Framework/pattern names

3. **Early Termination**
   - Found with high confidence (>80%) → Stop
   - 2 attempts with no results → Use general knowledge
   - User provides implementation → Skip search

### Search Optimization Rules

**DO:**
- Search for technical nouns (Widget, URLSession)
- Use API/framework names (SwiftUI, WidgetKit)
- Try variations of technical terms

**DON'T:**
- Search for descriptions ("how to make widgets")
- Use generic verbs ("create", "build", "implement")
- Keep searching after 2 failed attempts

## COMPLIANCE CHECKLIST

- [ ] Code follows architectural patterns
- [ ] Security requirements implemented
- [ ] Performance guidelines respected
- [ ] Error handling matches standards
- [ ] Code style adheres to conventions

## QUICK DECISION TREE

```
Is this a project-specific pattern?
├─ NO → Use industry best practices
└─ YES → Search for pattern (max 2 attempts)
         ├─ Found → Apply pattern
         └─ Not Found → Use best practices + note
```

## EFFICIENCY REMINDER

**Time is valuable. Don't over-search.**

If you can't find project patterns in 2 tries, implement with industry standards and move on.