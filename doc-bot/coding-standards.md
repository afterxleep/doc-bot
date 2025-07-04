---
alwaysApply: true
title: "Coding Standards"
description: "Core coding standards that apply to all code"
keywords: ["code-quality", "standards", "best-practices"]
---

# Coding Standards

## Always Apply These Rules

- Use 2 spaces for indentation
- Maximum line length: 100 characters
- Always use const/let, never var
- Prefer async/await over promises
- Write descriptive variable names

## Anti-Patterns

**FORBIDDEN:** Singleton pattern - leads to tight coupling and testing difficulties
**FORBIDDEN:** Global variables - use dependency injection instead
**FORBIDDEN:** jQuery - this is a React/modern JS project