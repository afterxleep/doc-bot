---
title: "Coding Standards"
description: "Core coding standards that apply to all code in the project"
keywords: ["code-quality", "standards", "best-practices", "javascript", "typescript"]
category: "core"
---

# Coding Standards

These standards apply to all code written in this project.

## General Principles

- **Consistency**: Follow established patterns in the codebase
- **Readability**: Code should be self-documenting
- **Maintainability**: Write code that's easy to modify and extend
- **Performance**: Consider performance implications of code choices

## JavaScript/TypeScript

### Variables and Functions
- Use `const` for values that don't change
- Use `let` for variables that will be reassigned
- Never use `var`
- Use descriptive variable names

```javascript
// Good
const userAge = 25;
const isLoggedIn = true;

// Bad
var a = 25;
let x = true;
```

### Functions
- Prefer arrow functions for short operations
- Use async/await instead of promise chains
- Keep functions small (max 20-30 lines)

```javascript
// Good
const fetchUser = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

// Bad
function fetchUser(id) {
  return api.get('/users/' + id).then(function(response) {
    return response.data;
  });
}
```

## Code Formatting

- Use 2 spaces for indentation
- Maximum line length: 100 characters
- Always use semicolons
- Use single quotes for strings
- Trailing commas in multiline objects/arrays