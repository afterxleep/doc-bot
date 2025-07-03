---
title: Coding Standards
description: Core coding standards and conventions for the project
category: core
alwaysApply: true
---

# Coding Standards

These standards should be applied to all code in the project.

## General Principles

- **Consistency**: Follow established patterns in the codebase
- **Readability**: Code should be self-documenting
- **Maintainability**: Write code that's easy to modify and extend
- **Performance**: Consider performance implications of code choices

## JavaScript/TypeScript Standards

### Naming Conventions
- Use camelCase for variables and functions
- Use PascalCase for classes and components
- Use UPPER_SNAKE_CASE for constants
- Use descriptive names that explain intent

### Code Structure
- Keep functions small and focused (max 20-30 lines)
- Use early returns to reduce nesting
- Group related functionality together
- Separate concerns appropriately

### Comments
- Write comments for complex business logic
- Avoid obvious comments
- Use JSDoc for function documentation
- Keep comments up-to-date with code changes

## React Standards

### Component Structure
- Use functional components with hooks
- Keep components small and focused
- Use TypeScript for props and state
- Follow the single responsibility principle

### Props and State
- Use TypeScript interfaces for props
- Avoid prop drilling - use context for deep data
- Keep state as close to usage as possible
- Use proper key props for lists

## File Organization

### Directory Structure
```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom hooks
├── utils/         # Utility functions
├── services/      # API and external services
├── types/         # TypeScript type definitions
└── __tests__/     # Test files
```

### File Naming
- Use kebab-case for file names
- Use descriptive names
- Include component type in name (e.g., `user-profile.component.tsx`)

## Error Handling

- Always handle errors appropriately
- Use try-catch blocks for async operations
- Provide meaningful error messages
- Log errors for debugging

## Testing

- Write tests for all new features
- Aim for high test coverage
- Use descriptive test names
- Test both happy path and edge cases