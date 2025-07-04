---
alwaysApply: false
title: "Testing Guide"
description: "How to write and run tests"
keywords: ["testing", "jest", "tdd", "unit-tests"]
filePatterns: ["*.js"]
---

# Testing Guide

## Test File Guidelines

All test files should:
- Use describe/it blocks for organization
- Include both positive and negative test cases
- Mock external dependencies
- Aim for 80%+ code coverage

## Running Tests

```bash
npm test
npm run test:watch
npm run test:coverage
```

## Preferred Testing Patterns

- Use Jest for unit tests
- Use React Testing Library for component tests
- Mock API calls with MSW