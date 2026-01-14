import { jest } from '@jest/globals';
import { InferenceEngine } from '../InferenceEngine.js';
import { DocumentationService } from '../DocumentationService.js';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('InferenceEngine Integration', () => {
  let inferenceEngine;
  let mockDocService;
  let tempDir;

  beforeEach(async () => {
    // Create temporary directory for test documents
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'doc-bot-inference-'));

    // Create mock documents
    const mockDocuments = [
      {
        fileName: 'react-components.md',
        filePath: path.join(tempDir, 'react-components.md'),
        content: `
# React Component Guide

\`\`\`javascript
import React, { useState, useEffect } from 'react';

function MyComponent() {
  const [state, setState] = useState();
  
  useEffect(() => {
    // Effect logic
  }, []);
  
  return <div>Hello World</div>;
}
\`\`\`

This guide covers React components, hooks, and best practices.
        `,
        metadata: {
          title: 'React Component Guide',
          keywords: ['react', 'components', 'hooks', 'useState', 'useEffect'],
          category: 'development'
        },
        lastModified: new Date()
      },
      {
        fileName: 'testing-guide.md',
        filePath: path.join(tempDir, 'testing-guide.md'),
        content: `
# Testing Guide

\`\`\`javascript
import { render, screen } from '@testing-library/react';

describe('Component Tests', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
\`\`\`

Best practices for testing React components.
        `,
        metadata: {
          title: 'Testing Guide',
          keywords: ['testing', 'jest', 'react-testing-library'],
          category: 'development'
        },
        lastModified: new Date()
      },
      {
        fileName: 'api-development.md',
        filePath: path.join(tempDir, 'api-development.md'),
        content: `
# API Development

\`\`\`javascript
const express = require('express');
const app = express();

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.post('/api/users', (req, res) => {
  // Create user logic
});
\`\`\`

Building REST APIs with Express.js.
        `,
        metadata: {
          title: 'API Development Guide',
          keywords: ['api', 'express', 'nodejs', 'rest'],
          category: 'development'
        },
        lastModified: new Date()
      }
    ];

    // Create mock DocumentationService
    mockDocService = {
      getAllDocuments: jest.fn().mockResolvedValue(mockDocuments),
      getContextualDocs: jest.fn().mockResolvedValue([])
    };

    inferenceEngine = new InferenceEngine(mockDocService);
    await inferenceEngine.initialize();
  });

  afterEach(async () => {
    // Clean up temp directory
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  describe('getRelevantDocumentation', () => {
    it('should return relevant docs for React query', async () => {
      const context = {
        query: 'react components hooks',
        filePath: 'src/components/Button.jsx'
      };

      const result = await inferenceEngine.getRelevantDocumentation(context);

      expect(result.contextualDocs).toEqual([]);
      expect(result.inferredDocs.length).toBeGreaterThan(0);
      
      // React components guide should be the highest scored document
      const reactDoc = result.inferredDocs.find(doc => doc.fileName === 'react-components.md');
      expect(reactDoc).toBeDefined();
      expect(reactDoc.inferenceScore).toBeGreaterThan(0);
      expect(result.inferredDocs[0].fileName).toBe('react-components.md'); // Should be first (highest score)
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should return relevant docs for testing context', async () => {
      const context = {
        query: 'testing jest',
        codeSnippet: 'describe("test", () => { it("should work", () => {}); })',
        filePath: 'src/__tests__/Component.test.js'
      };

      const result = await inferenceEngine.getRelevantDocumentation(context);

      expect(result.inferredDocs.length).toBeGreaterThan(0);
      
      // Testing guide should be the highest scored document
      const testingDoc = result.inferredDocs.find(doc => doc.fileName === 'testing-guide.md');
      expect(testingDoc).toBeDefined();
      expect(testingDoc.inferenceScore).toBeGreaterThan(0);
      expect(result.inferredDocs[0].fileName).toBe('testing-guide.md'); // Should be first (highest score)
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should return relevant docs for API development', async () => {
      const context = {
        query: 'express api',
        codeSnippet: 'app.get("/api/endpoint", (req, res) => {});'
      };

      const result = await inferenceEngine.getRelevantDocumentation(context);

      expect(result.inferredDocs.length).toBeGreaterThan(0);
      
      // API development guide should be the highest scored document
      const apiDoc = result.inferredDocs.find(doc => doc.fileName === 'api-development.md');
      expect(apiDoc).toBeDefined();
      expect(apiDoc.inferenceScore).toBeGreaterThan(0);
      expect(result.inferredDocs[0].fileName).toBe('api-development.md'); // Should be first (highest score)
    });

    it('should rank multiple matching documents by relevance', async () => {
      const context = {
        query: 'javascript development',
        codeSnippet: 'const [state, setState] = useState();'
      };

      const result = await inferenceEngine.getRelevantDocumentation(context);

      expect(result.inferredDocs.length).toBeGreaterThan(1);
      
      // React guide should rank higher due to useState pattern match
      const reactDoc = result.inferredDocs.find(doc => doc.fileName === 'react-components.md');
      const apiDoc = result.inferredDocs.find(doc => doc.fileName === 'api-development.md');
      
      expect(reactDoc).toBeDefined();
      expect(apiDoc).toBeDefined();
      expect(reactDoc.inferenceScore).toBeGreaterThan(apiDoc.inferenceScore);
    });

    it('should handle empty context gracefully', async () => {
      const context = {};
      const result = await inferenceEngine.getRelevantDocumentation(context);

      expect(result.contextualDocs).toEqual([]);
      expect(result.inferredDocs).toEqual([]);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should handle context with no matches', async () => {
      const context = {
        query: 'nonexistent technology xyz',
        codeSnippet: 'some_unknown_function();'
      };

      const result = await inferenceEngine.getRelevantDocumentation(context);

      expect(result.inferredDocs).toEqual([]);
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should provide higher confidence for rich context', async () => {
      const richContext = {
        query: 'react hooks useState',
        codeSnippet: 'const [count, setCount] = useState(0);',
        filePath: 'src/components/Counter.jsx'
      };

      const poorContext = {
        query: 'development'
      };

      const richResult = await inferenceEngine.getRelevantDocumentation(richContext);
      const poorResult = await inferenceEngine.getRelevantDocumentation(poorContext);

      expect(richResult.confidence).toBeGreaterThan(poorResult.confidence);
    });
  });

  describe('fallback behavior', () => {
    it('should fallback to legacy inference when index building fails', async () => {
      // Create engine with failing doc service
      const failingDocService = {
        getAllDocuments: jest.fn().mockRejectedValue(new Error('Failed to load')),
        getContextualDocs: jest.fn().mockResolvedValue([])
      };

      const fallbackEngine = new InferenceEngine(failingDocService);
      await fallbackEngine.initialize();

      expect(fallbackEngine.isIndexBuilt).toBe(false);

      const context = { query: 'test query' };
      const result = await fallbackEngine.getRelevantDocumentation(context);

      // Should still return a valid result structure
      expect(result).toHaveProperty('contextualDocs');
      expect(result).toHaveProperty('inferredDocs');
      expect(result).toHaveProperty('confidence');
    });
  });

  describe('performance', () => {
    it('should be fast for repeated queries', async () => {
      const context = {
        query: 'react components',
        codeSnippet: 'useState()'
      };

      const startTime = Date.now();
      
      // Run multiple queries
      for (let i = 0; i < 10; i++) {
        await inferenceEngine.getRelevantDocumentation(context);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Should complete 10 queries in reasonable time (< 1000ms)
      expect(totalTime).toBeLessThan(1000);
    });
  });
});
