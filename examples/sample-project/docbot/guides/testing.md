---
title: Testing Guide
description: Comprehensive testing strategies and best practices
category: guides
tags: [testing, jest, react-testing-library]
---

# Testing Guide

## Overview

Testing is crucial for maintaining code quality and preventing regressions. This guide covers our testing strategies and best practices.

## Testing Stack

- **Jest**: Test runner and assertion library
- **React Testing Library**: Testing utilities for React components
- **MSW**: Mock Service Worker for API mocking
- **Testing Library Jest-DOM**: Additional Jest matchers

## Test Types

### Unit Tests
- Test individual functions and components in isolation
- Fast execution
- Easy to debug
- High coverage

### Integration Tests
- Test how components work together
- Test API integrations
- More realistic than unit tests

### End-to-End Tests
- Test complete user workflows
- Use Cypress or Playwright
- Slower but most realistic

## Writing Good Tests

### Test Structure (AAA Pattern)
```javascript
test('should calculate total price correctly', () => {
  // Arrange
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 1 }
  ];
  
  // Act
  const total = calculateTotal(items);
  
  // Assert
  expect(total).toBe(25);
});
```

### Test Naming
- Use descriptive names that explain the scenario
- Follow the pattern: "should [expected behavior] when [condition]"
- Examples:
  - `should display error message when login fails`
  - `should disable submit button when form is invalid`

### Component Testing
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import UserProfile from './UserProfile';

test('should display user information', () => {
  const user = { name: 'John Doe', email: 'john@example.com' };
  
  render(<UserProfile user={user} />);
  
  expect(screen.getByText('John Doe')).toBeInTheDocument();
  expect(screen.getByText('john@example.com')).toBeInTheDocument();
});
```

## Mocking

### API Mocking with MSW
```javascript
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.get('/api/user', (req, res, ctx) => {
    return res(ctx.json({ name: 'John Doe' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Function Mocking
```javascript
// Mock a module
jest.mock('../services/api');

// Mock a function
const mockFetch = jest.fn();
global.fetch = mockFetch;
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the component does, not how it does it
   - Avoid testing internal state or methods

2. **Use Realistic Data**
   - Use data that resembles real-world scenarios
   - Avoid overly simplified test data

3. **Test Edge Cases**
   - Empty states
   - Error conditions
   - Boundary values

4. **Keep Tests Independent**
   - Each test should be able to run in isolation
   - Don't rely on test execution order

5. **Use Descriptive Assertions**
   ```javascript
   // Good
   expect(screen.getByRole('button')).toBeDisabled();
   
   // Better
   expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
   ```

## Test Organization

### File Structure
```
src/
├── components/
│   ├── UserProfile.tsx
│   └── __tests__/
│       └── UserProfile.test.tsx
├── utils/
│   ├── calculations.ts
│   └── __tests__/
│       └── calculations.test.ts
```

### Test Grouping
```javascript
describe('UserProfile', () => {
  describe('when user is logged in', () => {
    // tests for logged in state
  });
  
  describe('when user is not logged in', () => {
    // tests for logged out state
  });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test UserProfile.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should display"
```

## Coverage Goals

- **Statements**: 80% minimum
- **Branches**: 75% minimum
- **Functions**: 80% minimum
- **Lines**: 80% minimum

Focus on testing critical paths and business logic rather than achieving 100% coverage.