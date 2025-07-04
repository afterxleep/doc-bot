---
title: "Security Guidelines"
description: "Security best practices and guidelines for the project"
keywords: ["security", "authentication", "authorization", "encryption", "xss", "csrf"]
category: "core"
---

# Security Guidelines

Security is paramount. Follow these guidelines for all code.

## Authentication & Authorization

- Never store passwords in plain text
- Use bcrypt for password hashing
- Implement proper session management
- Use HTTPS in production
- Validate all user inputs

```javascript
// Good
const hashedPassword = await bcrypt.hash(password, 12);

// Bad
const password = req.body.password; // stored as-is
```

## Input Validation

- Sanitize all user inputs
- Use parameterized queries for database operations
- Validate data types and ranges
- Escape HTML content

## Environment Variables

- Never commit secrets to version control
- Use `.env` files for configuration
- Rotate API keys regularly
- Use different keys for different environments

## Common Vulnerabilities

### XSS Prevention
```javascript
// Good - escape HTML
const safeContent = escapeHtml(userInput);

// Bad - direct injection
element.innerHTML = userInput;
```

### SQL Injection Prevention
```javascript
// Good - parameterized query
const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

// Bad - string concatenation
const user = await db.query(`SELECT * FROM users WHERE id = ${userId}`);
```