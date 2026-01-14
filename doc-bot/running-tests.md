---
title: Running Tests Guide
description: Complete guide for running the doc-bot test suite
keywords: ["testing", "jest", "coverage", "e2e", "unit-tests", "test-suite"]
category: testing
filePatterns: ["**/*.test.js", "**/__tests__/**"]
---

# Running Tests Guide

This guide explains how to run the comprehensive test suite for the doc-bot MCP server.

## Prerequisites

- Node.js 18+ installed
- Project dependencies installed (`npm install`)
- ES modules support (handled automatically by npm scripts)

## Quick Start

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

The project includes three types of tests:

1. **Unit Tests** - Test individual functions and methods
2. **Integration Tests** - Test service interactions
3. **End-to-End Tests** - Test the complete MCP server with real data

## Available Test Commands

### Run All Tests
```bash
npm test
```
This runs the complete test suite using Jest.

### Run with Coverage Report
```bash
npm run test:coverage
```
Generates a coverage report showing which lines of code are tested. The HTML report is saved in `coverage/lcov-report/index.html`.

### Run Tests in Watch Mode
```bash
npm run test:watch
```
Automatically re-runs tests when files change. Great for development.

### Run End-to-End Tests Only
```bash
npm run test:e2e
```
This command:
1. Creates sample documentation fixtures
2. Runs E2E tests against the real MCP server using a temp docs folder
3. Exercises core tools end-to-end (search, file docs, doc updates)

### Run Unit Tests Only
```bash
npm run test:unit
```
Runs only the unit tests in `src/services/__tests__/`.

### Setup Test Fixtures
```bash
npm run test:setup
```
Creates sample documentation and prompt templates for testing. This is automatically run by `test:e2e`.

## Test Fixtures

The test suite uses fixtures located in `test/fixtures/`:

- Sample documents covering various scenarios:
  - General docs (project-wide guidance)
  - Contextual docs (with file patterns)
  - Tutorials and guides
  - API references
  - Architecture documentation

- **9 prompt templates** for testing prompt loading

## Running Specific Tests

### Test a Single File
```bash
NODE_OPTIONS=--experimental-vm-modules npx jest path/to/test.js
```

### Test with Pattern Matching
```bash
NODE_OPTIONS=--experimental-vm-modules npx jest --testNamePattern="search"
```

### Test a Specific Directory
```bash
NODE_OPTIONS=--experimental-vm-modules npx jest src/services
```

## Understanding Coverage

The project aims for realistic coverage targets:
- **Statements**: 55%
- **Branches**: 45%
- **Functions**: 65%
- **Lines**: 55%

Key coverage achievements:
- **ParallelSearchManager**: 100% coverage
- **UnifiedSearchService**: 100% coverage
- **DocumentIndex**: 97% coverage
- **DocumentationService**: 84% coverage

## Why NODE_OPTIONS?

The `NODE_OPTIONS=--experimental-vm-modules` flag is required because:
1. The project uses ES modules (`"type": "module"` in package.json)
2. Jest needs this flag to handle ES module imports
3. The npm scripts handle this automatically

## Debugging Tests

### Run with Verbose Output
```bash
NODE_OPTIONS=--experimental-vm-modules npx jest --verbose
```

### Run with Debugging
```bash
NODE_OPTIONS=--experimental-vm-modules node --inspect-brk node_modules/.bin/jest --runInBand
```
Then attach your debugger to the Node process.

## Common Issues

### Test Timeout
If tests timeout, you may need to increase the timeout in `jest.config.js`:
```javascript
testTimeout: 30000 // 30 seconds
```

### Module Import Errors
Ensure you're using the npm scripts or including `NODE_OPTIONS=--experimental-vm-modules`.

### Coverage Not Meeting Threshold
The main `index.js` file has lower coverage due to MCP protocol complexity. Focus on service-level coverage.

## Best Practices

1. **Run tests before committing** - Ensure all tests pass
2. **Check coverage regularly** - Aim to maintain or improve coverage
3. **Write tests for new features** - Add tests when adding new functionality
4. **Use E2E tests for complex scenarios** - Better than mocking for MCP tools
5. **Keep test fixtures updated** - Update `test/fixtures/` when documentation structure changes

## CI/CD Integration

For continuous integration, use:
```bash
npm run test:setup && npm run test:coverage
```

This ensures fixtures are created and all tests run with coverage reporting.

## Test Philosophy

The test suite prioritizes:
- **Real-world scenarios** over artificial mocks
- **End-to-end testing** for MCP tools
- **Comprehensive fixtures** that mirror actual usage
- **Maintainable tests** that are easy to understand

## Related Documentation

- [Testing Standards](testing-guide.md) - General testing best practices
- [Development Guide](development.md) - Development workflow
- [Architecture](architecture.md) - System design and structure
