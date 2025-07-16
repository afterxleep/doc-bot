---
alwaysApply: false
title: "Doc-Bot Examples and Best Practices"
description: "Real-world examples and best practices for using doc-bot effectively"
keywords: ["examples", "best practices", "patterns", "usage", "tips", "optimization"]
---

# Doc-Bot Examples and Best Practices

This guide provides real-world examples and best practices for getting the most out of doc-bot.

## Documentation Examples

### Global Rules Documentation

**File**: `doc-bot/coding-standards.md`

```markdown
---
alwaysApply: true
title: "Project Coding Standards"
description: "Mandatory coding standards for all project code"
keywords: ["standards", "conventions", "style", "formatting"]
---

# Project Coding Standards

## Code Style
- Use 2 spaces for indentation (no tabs)
- Maximum line length: 100 characters
- Use semicolons in JavaScript
- Prefer const over let

## Naming Conventions
- Components: PascalCase (e.g., UserProfile)
- Functions: camelCase (e.g., getUserData)
- Constants: UPPER_SNAKE_CASE (e.g., MAX_RETRIES)
- Files: kebab-case (e.g., user-profile.js)

## Forbidden Patterns
- No use of eval() or Function constructor
- No synchronous file operations in production code
- No console.log() in committed code
```

### Context-Specific Documentation

**File**: `doc-bot/testing-guide.md`

```markdown
---
alwaysApply: false
title: "Testing Guidelines"
description: "How to write and organize tests"
keywords: ["testing", "jest", "unit-tests", "integration-tests", "tdd"]
filePatterns: ["*.test.js", "*.spec.js", "__tests__/**/*", "*.test.tsx"]
---

# Testing Guidelines

## Test Structure
- Use describe blocks for component/function grouping
- Use it blocks for individual test cases
- Follow AAA pattern: Arrange, Act, Assert

## Example Test
\```javascript
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when ID exists', async () => {
      // Arrange
      const userId = '123';
      const mockUser = { id: userId, name: 'John' };
      
      // Act
      const result = await userService.getUserById(userId);
      
      // Assert
      expect(result).toEqual(mockUser);
    });
  });
});
\```
```

### API Documentation

**File**: `doc-bot/api-patterns.md`

```markdown
---
alwaysApply: false
title: "REST API Patterns"
description: "Standard patterns for REST API endpoints"
keywords: ["api", "rest", "endpoints", "http", "express", "controllers"]
filePatterns: ["**/controllers/**/*.js", "**/routes/**/*.js", "*.controller.js"]
---

# REST API Patterns

## Endpoint Structure
- GET /api/v1/resources - List all resources
- GET /api/v1/resources/:id - Get single resource
- POST /api/v1/resources - Create resource
- PUT /api/v1/resources/:id - Update resource
- DELETE /api/v1/resources/:id - Delete resource

## Response Format
\```javascript
// Success response
{
  "success": true,
  "data": { /* resource data */ },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0"
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User not found",
    "details": { "userId": "123" }
  }
}
\```

## Status Codes
- 200: Success (GET, PUT)
- 201: Created (POST)
- 204: No Content (DELETE)
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error
```

### Framework-Specific Documentation

**File**: `doc-bot/react-patterns.md`

```markdown
---
alwaysApply: false
title: "React Component Patterns"
description: "Best practices for React components"
keywords: ["react", "components", "hooks", "jsx", "functional-components"]
filePatterns: ["*.jsx", "*.tsx", "components/**/*", "src/components/**/*"]
topics: ["frontend", "ui", "components"]
---

# React Component Patterns

## Component Structure
\```jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './Component.module.css';

export function MyComponent({ title, onAction }) {
  const [state, setState] = useState(null);
  
  useEffect(() => {
    // Side effects here
  }, []);
  
  const handleClick = () => {
    onAction(state);
  };
  
  return (
    <div className={styles.container}>
      <h2>{title}</h2>
      <button onClick={handleClick}>Action</button>
    </div>
  );
}

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  onAction: PropTypes.func.isRequired
};
\```

## Hooks Rules
- Only call hooks at the top level
- Only call hooks from React functions
- Use custom hooks for shared logic
- Prefix custom hooks with "use"
```

## Search Query Examples

### Effective Searches

```javascript
// Good: Specific and clear
"How to implement user authentication"
"URLSession configuration options"
"React hooks best practices"
"Testing async functions with Jest"

// Less effective: Too vague
"authentication"
"config"
"hooks"
"testing"
```

### Using Multiple Tools

```javascript
// 1. First check project rules
await mcp.call('check_project_rules', {
  task: 'implement user login endpoint'
});

// 2. Then search for specific patterns
await mcp.call('search_documentation', {
  query: 'authentication middleware Express'
});

// 3. Get file-specific docs
await mcp.call('get_file_docs', {
  filePath: 'src/controllers/auth.controller.js'
});

// 4. Explore related APIs
await mcp.call('explore_api', {
  entryName: 'passport',
  includeTypes: ['Function', 'Method']
});
```

## Best Practices

### 1. Documentation Organization

**DO:**
- Group related documentation by feature or component
- Use clear, descriptive filenames
- Keep documentation focused and concise
- Update docs when code changes

**DON'T:**
- Create one massive documentation file
- Use generic names like "guide.md" or "docs.md"
- Include outdated or deprecated information
- Mix unrelated topics in one document

### 2. Frontmatter Best Practices

**Effective Frontmatter:**
```yaml
---
title: "Database Migration Guide"
description: "How to create and run database migrations"
keywords: ["database", "migration", "sequelize", "sql", "schema"]
filePatterns: ["**/migrations/**/*.js", "*.migration.js"]
topics: ["backend", "database", "orm"]
alwaysApply: false
confidence: 0.9
---
```

**Why it's good:**
- Clear, specific title
- Descriptive keywords covering variations
- Specific file patterns
- Appropriate confidence level

### 3. Keyword Selection

**Good Keywords:**
- Include variations: ["auth", "authentication", "authorize"]
- Add common abbreviations: ["api", "application-programming-interface"]
- Include framework names: ["express", "expressjs", "express.js"]
- Add related concepts: ["jwt", "token", "session"]

**Avoid:**
- Single-letter keywords (except valid ones like "c", "r")
- Too generic terms alone: ["code", "function", "variable"]
- Internal jargon without context

### 4. File Pattern Strategies

```yaml
# Specific patterns for different file types
filePatterns:
  # Test files
  - "*.test.{js,jsx,ts,tsx}"
  - "*.spec.{js,jsx,ts,tsx}"
  - "**/__tests__/**/*"
  
  # React components
  - "components/**/*.{jsx,tsx}"
  - "src/components/**/*.{jsx,tsx}"
  - "*.component.{jsx,tsx}"
  
  # API routes
  - "routes/**/*.js"
  - "api/**/*.js"
  - "*.route.js"
  
  # Ignore patterns
  - "!node_modules/**"
  - "!build/**"
  - "!dist/**"
```

### 5. Writing for AI Agents

**Effective Documentation:**
```markdown
# Form Validation

## When to Apply
Apply these patterns when implementing form validation in React components.

## Required Libraries
- react-hook-form (v7+)
- yup or zod for schema validation

## Implementation Pattern
\```jsx
const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(8).required()
});

const { register, handleSubmit, errors } = useForm({
  resolver: yupResolver(schema)
});
\```

## Common Pitfalls
- Don't validate on every keystroke
- Show errors only after blur or submit
- Provide clear, actionable error messages
```

**Why it works:**
- Clear structure with sections
- Specific implementation details
- Code examples
- Common pitfalls to avoid

### 6. Search Optimization

**Optimize for Discovery:**

1. **Use synonyms in keywords:**
   ```yaml
   keywords: ["test", "testing", "unit-test", "spec", "jest", "mocha"]
   ```

2. **Include common misspellings:**
   ```yaml
   keywords: ["authentication", "authentification", "auth"]
   ```

3. **Add framework variations:**
   ```yaml
   keywords: ["react", "reactjs", "react.js", "react-hooks"]
   ```

### 7. Performance Tips

**For Large Documentation Sets:**

1. **Split large files:**
   ```
   Instead of: api-documentation.md (5000 lines)
   Better: 
   - api-authentication.md
   - api-users.md
   - api-products.md
   ```

2. **Use specific file patterns:**
   ```yaml
   # Too broad
   filePatterns: ["**/*.js"]
   
   # More specific
   filePatterns: ["src/api/**/*.js", "!**/*.test.js"]
   ```

3. **Prioritize with confidence scores:**
   ```yaml
   # Critical documentation
   confidence: 1.0
   
   # Important but not critical
   confidence: 0.8
   
   # Supplementary
   confidence: 0.5
   ```

### 8. Docset Management

**Optimize Docset Usage:**

1. **Only install needed docsets:**
   - Remove unused language docsets
   - Keep only current version docs
   - Archive old framework versions

2. **Organize by project type:**
   ```
   ~/Developer/DocSets/
   ├── Web/
   │   ├── React.docset
   │   ├── Vue.docset
   │   └── Node.js.docset
   ├── Mobile/
   │   ├── Swift.docset
   │   └── Kotlin.docset
   └── Backend/
       ├── PostgreSQL.docset
       └── Redis.docset
   ```

## Common Patterns

### Pattern: Multi-Environment Configuration

```markdown
---
title: "Environment Configuration"
keywords: ["env", "environment", "config", "dotenv", "variables"]
filePatterns: [".env*", "config/**/*.js", "*.config.js"]
---

# Environment Configuration

## File Structure
\```
.env.development    # Development settings
.env.test          # Test environment
.env.production    # Production settings
.env.example       # Template for developers
\```

## Usage Pattern
\```javascript
// config/index.js
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});

module.exports = {
  port: process.env.PORT || 3000,
  database: {
    url: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    }
  }
};
\```
```

### Pattern: Error Handling

```markdown
---
title: "Error Handling Patterns"
keywords: ["error", "exception", "try-catch", "error-handling", "throw"]
filePatterns: ["**/*.js", "!node_modules/**"]
alwaysApply: true
---

# Error Handling Patterns

## Global Error Handler
\```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

// Usage
throw new AppError('Resource not found', 404);
\```

## Async Error Wrapper
\```javascript
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Usage
router.get('/users', catchAsync(async (req, res) => {
  const users = await User.findAll();
  res.json(users);
}));
\```
```

## Monitoring and Maintenance

### Regular Reviews

1. **Monthly:** Review search patterns and add missing keywords
2. **Quarterly:** Archive outdated documentation
3. **On Updates:** Update docs when dependencies change
4. **On Feedback:** Add documentation based on team questions

### Usage Metrics to Track

- Most searched terms with no results
- Most accessed documentation
- File patterns with no matches
- Documentation with low relevance scores

## Summary

Effective doc-bot usage requires:
1. Well-organized, focused documentation
2. Thoughtful frontmatter with good keywords
3. Specific file patterns
4. Regular maintenance and updates
5. Understanding of search behavior
6. Optimization for AI agent consumption

Remember: Documentation is only valuable if it can be found and understood by the AI agents using it.