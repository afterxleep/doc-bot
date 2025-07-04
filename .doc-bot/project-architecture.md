---
alwaysApply: false
title: "Project Architecture"
description: "Overall architecture and design patterns"
keywords: ["architecture", "design", "patterns", "structure"]
filePatterns: ["*.js"]
---

# Project Architecture

## Preferred Patterns

This project follows a **Clean Architecture** approach with:

- **Dependency Injection** instead of singletons
- **Composition over inheritance**
- **Pure functions** where possible
- **Event-driven architecture** for loose coupling

## Folder Structure

```
src/
├── components/     # React components
├── services/       # Business logic
├── utils/          # Pure utility functions
├── hooks/          # Custom React hooks
└── types/          # TypeScript definitions
```

## Design Principles

1. **Single Responsibility** - each module has one job
2. **Open/Closed** - open for extension, closed for modification
3. **Dependency Inversion** - depend on abstractions, not concretions