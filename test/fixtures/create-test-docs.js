#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const docsPath = path.join(__dirname, 'docs');
const promptsPath = path.join(__dirname, 'prompts');

// Ensure directories exist
await fs.ensureDir(docsPath);
await fs.ensureDir(promptsPath);
await fs.ensureDir(path.join(docsPath, 'guides'));
await fs.ensureDir(path.join(docsPath, 'api'));
await fs.ensureDir(path.join(docsPath, 'standards'));
await fs.ensureDir(path.join(docsPath, 'tutorials'));
await fs.ensureDir(path.join(docsPath, 'reference'));

// Create various test documents with different configurations

// General standards docs
const globalDocs = [
  {
    name: 'coding-standards.md',
    folder: 'standards',
    content: `---
title: Coding Standards
description: Global coding standards for all project files
keywords: ["standards", "code-quality", "best-practices"]
category: standards
---

# Coding Standards

All code in this project must follow these standards:

## General Rules
- Use consistent indentation (2 spaces)
- Write comprehensive tests for all features
- Document all public APIs
- Follow language-specific conventions

## JavaScript/TypeScript
- Use ES6+ features
- Prefer const over let
- Use async/await over callbacks
- Write pure functions when possible

## Testing Requirements
- Minimum 80% code coverage
- Unit tests for all utilities
- Integration tests for services
- E2E tests for user flows`
  },
  {
    name: 'security-guidelines.md',
    folder: 'standards',
    content: `---
title: Security Guidelines
description: Security best practices for all development
keywords: ["security", "authentication", "encryption"]
category: security
---

# Security Guidelines

## Required Security Practices
- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all user input
- Implement proper authentication
- Use HTTPS for all communications
- Regular dependency updates`
  }
];

// Contextual docs (with file patterns)
const contextualDocs = [
  {
    name: 'react-components.md',
    folder: 'guides',
    content: `---
title: React Component Guidelines
description: Best practices for React components
keywords: ["react", "components", "jsx", "hooks"]
filePatterns: ["*.jsx", "*.tsx", "**/components/**"]
category: frontend
---

# React Component Guidelines

## Component Structure
- Use functional components with hooks
- One component per file
- Props validation with TypeScript/PropTypes
- Separate business logic from presentation

## Hooks Best Practices
- Custom hooks for reusable logic
- useEffect cleanup
- Proper dependency arrays
- Avoid excessive re-renders`
  },
  {
    name: 'api-development.md',
    folder: 'api',
    content: `---
title: API Development Guide
description: RESTful API design and implementation
keywords: ["api", "rest", "http", "endpoints"]
filePatterns: ["**/api/**", "*.controller.js", "*.route.js"]
category: backend
---

# API Development Guide

## REST Principles
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Meaningful resource naming
- Consistent error responses
- API versioning strategy

## Response Format
\`\`\`json
{
  "success": true,
  "data": {},
  "error": null,
  "timestamp": "2024-01-01T00:00:00Z"
}
\`\`\`

## Authentication
- JWT tokens for stateless auth
- API key for service-to-service
- Rate limiting per client`
  },
  {
    name: 'database-patterns.md',
    folder: 'guides',
    content: `---
title: Database Patterns
description: Database design and query patterns
keywords: ["database", "sql", "orm", "migrations"]
filePatterns: ["**/models/**", "**/migrations/**", "*.model.js"]
category: backend
---

# Database Patterns

## Schema Design
- Normalized tables
- Proper indexing strategy
- Foreign key constraints
- Audit columns (created_at, updated_at)

## Query Optimization
- Use indexes effectively
- Avoid N+1 queries
- Batch operations when possible
- Connection pooling`
  }
];

// Tutorial documents
const tutorials = [
  {
    name: 'getting-started.md',
    folder: 'tutorials',
    content: `---
title: Getting Started
description: Quick start guide for new developers
keywords: ["setup", "installation", "quickstart"]
category: tutorial
---

# Getting Started

## Prerequisites
- Node.js 18+
- Git
- VS Code (recommended)

## Installation Steps
1. Clone the repository
2. Install dependencies: npm install
3. Set up environment variables
4. Run development server: npm run dev

## Project Structure
- /src - Source code
- /tests - Test files
- /docs - Documentation
- /config - Configuration files`
  },
  {
    name: 'testing-tutorial.md',
    folder: 'tutorials',
    content: `---
title: Testing Tutorial
description: How to write and run tests
keywords: ["testing", "jest", "unit-tests", "integration-tests"]
category: tutorial
---

# Testing Tutorial

## Writing Unit Tests
\`\`\`javascript
describe('MyComponent', () => {
  it('should render correctly', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
\`\`\`

## Running Tests
- npm test - Run all tests
- npm run test:watch - Watch mode
- npm run test:coverage - Coverage report`
  }
];

// Reference documentation
const referenceDocs = [
  {
    name: 'api-reference.md',
    folder: 'reference',
    content: `---
title: API Reference
description: Complete API documentation
keywords: ["api", "reference", "endpoints", "methods"]
category: reference
---

# API Reference

## Authentication Endpoints

### POST /api/auth/login
Authenticate user and receive JWT token

### POST /api/auth/refresh
Refresh expired JWT token

## User Endpoints

### GET /api/users
List all users (admin only)

### GET /api/users/:id
Get user by ID

### PUT /api/users/:id
Update user profile`
  },
  {
    name: 'configuration.md',
    folder: 'reference',
    content: `---
title: Configuration Reference
description: All configuration options explained
keywords: ["config", "environment", "settings"]
category: reference
---

# Configuration Reference

## Environment Variables
- NODE_ENV - Environment (development/production)
- PORT - Server port
- DATABASE_URL - Database connection string
- JWT_SECRET - Secret for JWT signing
- LOG_LEVEL - Logging verbosity`
  }
];

// Architecture and design documents
const architectureDocs = [
  {
    name: 'system-architecture.md',
    folder: '',
    content: `---
title: System Architecture
description: High-level system design and architecture
keywords: ["architecture", "design", "system", "components"]
category: architecture
---

# System Architecture

## Overview
This system follows a microservices architecture with the following components:

## Core Services
1. **API Gateway** - Routes requests to appropriate services
2. **Auth Service** - Handles authentication and authorization
3. **User Service** - Manages user data and profiles
4. **Notification Service** - Sends emails and push notifications

## Data Flow
\`\`\`
Client -> API Gateway -> Service -> Database
                      -> Cache
                      -> Message Queue
\`\`\`

## Technology Stack
- Node.js/TypeScript - Backend services
- PostgreSQL - Primary database
- Redis - Caching and sessions
- RabbitMQ - Message queue`
  },
  {
    name: 'design-patterns.md',
    folder: '',
    content: `---
title: Design Patterns
description: Common design patterns used in the project
keywords: ["patterns", "design", "architecture", "best-practices"]
category: architecture
---

# Design Patterns

## Repository Pattern
Abstraction layer between data access and business logic

## Factory Pattern
Creating objects without specifying exact classes

## Observer Pattern
Event-driven communication between components

## Singleton Pattern
Ensuring single instance of critical services`
  }
];

// Language-specific guides
const languageDocs = [
  {
    name: 'typescript-guide.md',
    folder: 'guides',
    content: `---
title: TypeScript Guide
description: TypeScript best practices and patterns
keywords: ["typescript", "types", "interfaces", "generics"]
filePatterns: ["*.ts", "*.tsx"]
category: language
---

# TypeScript Guide

## Type Safety
- Strict mode enabled
- No implicit any
- Proper null checking
- Exhaustive switch cases

## Interfaces vs Types
- Use interfaces for objects
- Use types for unions/intersections
- Extend interfaces when possible`
  },
  {
    name: 'python-guide.md',
    folder: 'guides',
    content: `---
title: Python Guide
description: Python coding standards and practices
keywords: ["python", "pip", "virtualenv", "pytest"]
filePatterns: ["*.py"]
category: language
---

# Python Guide

## Code Style
- Follow PEP 8
- Use type hints
- Docstrings for all functions
- Virtual environments for dependencies`
  }
];

// Create specialized documents
const specializedDocs = [];

// Generate 50+ additional varied documents for comprehensive testing
for (let i = 1; i <= 50; i++) {
  specializedDocs.push({
    name: `feature-${i}.md`,
    folder: 'reference',
    content: `---
title: Feature ${i} Documentation
description: Detailed documentation for feature ${i}
keywords: ["feature${i}", "module${i}", "component${i}"]
category: feature
---

# Feature ${i}

## Overview
This feature provides functionality for ${['user management', 'data processing', 'file handling', 'network communication', 'authentication', 'caching', 'logging', 'monitoring'][i % 8]}.

## Usage Example
\`\`\`javascript
import { Feature${i} } from './features';

const feature = new Feature${i}({
  option1: 'value1',
  option2: 'value2'
});

feature.execute();
\`\`\`

## Configuration
- Setting A: ${['enabled', 'disabled'][i % 2]}
- Setting B: ${i * 100}
- Setting C: feature_${i}_config

## Performance Considerations
This feature has ${['high', 'medium', 'low'][i % 3]} performance impact.
Memory usage: ${['minimal', 'moderate', 'significant'][i % 3]}.`
  });
}

// Write all documents
async function writeDocuments() {
  const allDocs = [
    ...globalDocs,
    ...contextualDocs,
    ...tutorials,
    ...referenceDocs,
    ...architectureDocs,
    ...languageDocs,
    ...specializedDocs
  ];

  for (const doc of allDocs) {
    const filePath = path.join(docsPath, doc.folder || '', doc.name);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, doc.content);
  }

  console.log(`✅ Created ${allDocs.length} test documents`);
}

// Create prompt templates
async function createPrompts() {
  const prompts = {
    'system.md': `# System Prompt Template

You are analyzing the file: {file_path}

## Relevant Documentation:
{mandatory_rules}

Please use the guidance above when working with this file.`,

    'search.md': `# Search Results

Query: {query}
Found {count} results:

{results}`,

    'api_exploration.md': `# API Exploration

Namespace: {namespace}
Type: {type}

## Results:
{results}`,

    'check_rules.md': `# Project Documentation Check

File: {file_path}

## Applicable Docs:
{rules}`,

    'doc_bot_guidance.md': `# Intelligent Guidance

Task: {task}
Context: {context}

## Analysis:
Based on the documentation, here's the guidance:
{guidance}`,

    'search-results.md': `# Documentation Search Results

{results}

---
Total: {count} documents found`,

    'system-prompt.md': `# System Context

Working with: {file_path}
Docs to review: {mandatory_rules}`,

    'global-rules.md': `# Project Documentation Notes

{rules}`,

    'document-index.md': `# Document Index

Total documents: {count}

{index}`
  };

  for (const [name, content] of Object.entries(prompts)) {
    await fs.writeFile(path.join(promptsPath, name), content);
  }

  console.log(`✅ Created ${Object.keys(prompts).length} prompt templates`);
}

// Run the setup
async function main() {
  await writeDocuments();
  await createPrompts();
  console.log('\n📚 Test fixtures created successfully!');
  console.log(`   Documents: ${docsPath}`);
  console.log(`   Prompts: ${promptsPath}`);
}

main().catch(console.error);
