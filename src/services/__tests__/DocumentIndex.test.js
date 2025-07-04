const { DocumentIndex } = require('../DocumentIndex');

describe('DocumentIndex', () => {
  let documentIndex;
  let mockDocuments;

  beforeEach(() => {
    documentIndex = new DocumentIndex();
    mockDocuments = [
      {
        fileName: 'react-guide.md',
        content: 'React components are the building blocks of React applications.',
        metadata: {
          title: 'React Component Guide',
          keywords: ['react', 'components', 'jsx'],
          category: 'development'
        }
      },
      {
        fileName: 'testing.md',
        content: 'Testing is crucial for reliable software. Use Jest for unit tests.',
        metadata: {
          title: 'Testing Guide',
          keywords: ['testing', 'jest', 'unit-tests'],
          category: 'development'
        }
      }
    ];
  });

  describe('constructor', () => {
    it('should initialize with empty indexes', () => {
      expect(documentIndex.keywordIndex).toBeInstanceOf(Map);
      expect(documentIndex.topicIndex).toBeInstanceOf(Map);
      expect(documentIndex.patternIndex).toBeInstanceOf(Map);
      expect(documentIndex.extensionIndex).toBeInstanceOf(Map);
      expect(documentIndex.keywordIndex.size).toBe(0);
      expect(documentIndex.topicIndex.size).toBe(0);
      expect(documentIndex.patternIndex.size).toBe(0);
      expect(documentIndex.extensionIndex.size).toBe(0);
    });
  });

  describe('buildIndexes', () => {
    it('should build indexes from provided documents', async () => {
      await documentIndex.buildIndexes(mockDocuments);
      
      expect(documentIndex.keywordIndex.size).toBeGreaterThan(0);
      expect(documentIndex.topicIndex.size).toBeGreaterThan(0);
    });

    it('should handle empty document array', async () => {
      await documentIndex.buildIndexes([]);
      
      expect(documentIndex.keywordIndex.size).toBe(0);
      expect(documentIndex.topicIndex.size).toBe(0);
      expect(documentIndex.patternIndex.size).toBe(0);
      expect(documentIndex.extensionIndex.size).toBe(0);
    });
  });

  describe('indexDocument', () => {
    it('should index keywords from metadata', async () => {
      const document = {
        fileName: 'test.md',
        metadata: {
          keywords: ['javascript', 'node', 'backend']
        }
      };

      await documentIndex.indexDocument(document);

      expect(documentIndex.keywordIndex.has('javascript')).toBe(true);
      expect(documentIndex.keywordIndex.has('node')).toBe(true);
      expect(documentIndex.keywordIndex.has('backend')).toBe(true);
      const javascriptEntries = documentIndex.keywordIndex.get('javascript');
      expect(javascriptEntries.some(entry => entry.document === document)).toBe(true);
    });

    it('should handle single keyword as string', async () => {
      const document = {
        fileName: 'test.md',
        metadata: {
          keywords: 'python'
        }
      };

      await documentIndex.indexDocument(document);

      expect(documentIndex.keywordIndex.has('python')).toBe(true);
      const pythonEntries = documentIndex.keywordIndex.get('python');
      expect(pythonEntries.some(entry => entry.document === document)).toBe(true);
    });



    it('should index category in topic index', async () => {
      const document = {
        fileName: 'test.md',
        metadata: {
          category: 'Architecture'
        }
      };

      await documentIndex.indexDocument(document);

      expect(documentIndex.topicIndex.has('architecture')).toBe(true);
      const architectureEntries = documentIndex.topicIndex.get('architecture');
      expect(architectureEntries.some(entry => entry.document === document)).toBe(true);
    });

    it('should handle documents without metadata', async () => {
      const document = {
        fileName: 'test.md'
      };

      await documentIndex.indexDocument(document);

      expect(documentIndex.keywordIndex.size).toBe(0);
      expect(documentIndex.topicIndex.size).toBe(0);
    });

    it('should handle empty metadata', async () => {
      const document = {
        fileName: 'test.md',
        metadata: {}
      };

      await documentIndex.indexDocument(document);

      expect(documentIndex.keywordIndex.size).toBe(0);
      expect(documentIndex.topicIndex.size).toBe(0);
    });

    it('should index keywords case-insensitively', async () => {
      const document = {
        fileName: 'test.md',
        metadata: {
          keywords: ['JavaScript', 'REACT', 'Node.js']
        }
      };

      await documentIndex.indexDocument(document);

      expect(documentIndex.keywordIndex.has('javascript')).toBe(true);
      expect(documentIndex.keywordIndex.has('react')).toBe(true);
      expect(documentIndex.keywordIndex.has('node.js')).toBe(true);
    });

    it('should allow multiple documents for same keyword', async () => {
      const doc1 = {
        fileName: 'react-basics.md',
        metadata: { keywords: ['react'] }
      };
      const doc2 = {
        fileName: 'react-advanced.md',
        metadata: { keywords: ['react'] }
      };

      await documentIndex.indexDocument(doc1);
      await documentIndex.indexDocument(doc2);

      const reactEntries = documentIndex.keywordIndex.get('react');
      expect(reactEntries).toHaveLength(2);
      expect(reactEntries.some(entry => entry.document === doc1)).toBe(true);
      expect(reactEntries.some(entry => entry.document === doc2)).toBe(true);
    });
  });

  describe('findRelevantDocs', () => {
    beforeEach(async () => {
      await documentIndex.buildIndexes(mockDocuments);
    });

    it('should return empty array when no context provided', () => {
      const result = documentIndex.findRelevantDocs({});
      expect(result).toEqual([]);
    });

    it('should return documents based on query keywords', () => {
      const context = { query: 'react components' };
      const result = documentIndex.findRelevantDocs(context);
      
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('document');
      expect(result[0]).toHaveProperty('score');
    });

    it('should return scored and ranked results', () => {
      const context = { query: 'testing' };
      const result = documentIndex.findRelevantDocs(context);
      
      // Results should be sorted by score (descending)
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].score).toBeGreaterThanOrEqual(result[i + 1].score);
      }
    });

    it('should find documents by exact keyword match', async () => {
      // Create a fresh index with no content to test exact scoring
      const testIndex = new DocumentIndex();
      const testDoc = {
        fileName: 'clean-test.md',
        metadata: { keywords: ['react'] }
      };
      await testIndex.indexDocument(testDoc);
      
      const context = { query: 'react' };
      const result = testIndex.findRelevantDocs(context);
      
      expect(result.length).toBe(1);
      expect(result[0].document.fileName).toBe('clean-test.md');
      expect(result[0].score).toBe(10); // High score for exact keyword match
    });



    it('should handle case-insensitive queries', () => {
      const context = { query: 'REACT Components' };
      const result = documentIndex.findRelevantDocs(context);
      
      expect(result.length).toBe(1);
      expect(result[0].document.fileName).toBe('react-guide.md');
    });
  });

  describe('content keyword extraction', () => {
    it('should extract keywords from code blocks', async () => {
      const document = {
        fileName: 'api-guide.md',
        content: `
# API Guide

\`\`\`javascript
const express = require('express');
const mongoose = require('mongoose');
app.use(bodyParser.json());
\`\`\`

\`\`\`python
import flask
from sqlalchemy import create_engine
\`\`\`
        `,
        metadata: {}
      };

      await documentIndex.indexDocument(document);

      // Should extract technical terms from code blocks
      expect(documentIndex.keywordIndex.has('express')).toBe(true);
      expect(documentIndex.keywordIndex.has('mongoose')).toBe(true);
      expect(documentIndex.keywordIndex.has('bodyparser')).toBe(true);
      expect(documentIndex.keywordIndex.has('flask')).toBe(true);
      expect(documentIndex.keywordIndex.has('sqlalchemy')).toBe(true);
    });

    it('should extract keywords from headings', async () => {
      const document = {
        fileName: 'deployment-guide.md',
        content: `
# Docker Deployment Guide

## Setting up Kubernetes

### Using Terraform for Infrastructure

#### CI/CD Pipeline Configuration
        `,
        metadata: {}
      };

      await documentIndex.indexDocument(document);

      expect(documentIndex.keywordIndex.has('docker')).toBe(true);
      expect(documentIndex.keywordIndex.has('kubernetes')).toBe(true);
      expect(documentIndex.keywordIndex.has('terraform')).toBe(true);
      expect(documentIndex.keywordIndex.has('ci/cd')).toBe(true);
      expect(documentIndex.keywordIndex.has('pipeline')).toBe(true);
    });

    it('should extract file extensions mentioned in content', async () => {
      const document = {
        fileName: 'project-structure.md',
        content: `
Files in this project:
- *.js files for JavaScript
- *.py files for Python
- *.md files for documentation
- *.json files for configuration
        `,
        metadata: {}
      };

      await documentIndex.indexDocument(document);

      expect(documentIndex.extensionIndex.has('js')).toBe(true);
      expect(documentIndex.extensionIndex.has('py')).toBe(true);
      expect(documentIndex.extensionIndex.has('md')).toBe(true);
      expect(documentIndex.extensionIndex.has('json')).toBe(true);
    });

    it('should extract framework and library names', async () => {
      const document = {
        fileName: 'tech-stack.md',
        content: `
Our tech stack includes:
- React for frontend
- Node.js for backend
- PostgreSQL for database
- Redis for caching
- AWS for cloud infrastructure
        `,
        metadata: {}
      };

      await documentIndex.indexDocument(document);

      expect(documentIndex.keywordIndex.has('react')).toBe(true);
      expect(documentIndex.keywordIndex.has('node.js')).toBe(true);
      expect(documentIndex.keywordIndex.has('postgresql')).toBe(true);
      expect(documentIndex.keywordIndex.has('redis')).toBe(true);
      expect(documentIndex.keywordIndex.has('aws')).toBe(true);
    });

    it('should not extract common words', async () => {
      const document = {
        fileName: 'guide.md',
        content: `
This is a guide that explains how to use the system.
The system is very useful and helps developers.
        `,
        metadata: {}
      };

      await documentIndex.indexDocument(document);

      // Should not extract common words
      expect(documentIndex.keywordIndex.has('this')).toBe(false);
      expect(documentIndex.keywordIndex.has('is')).toBe(false);
      expect(documentIndex.keywordIndex.has('a')).toBe(false);
      expect(documentIndex.keywordIndex.has('the')).toBe(false);
      expect(documentIndex.keywordIndex.has('and')).toBe(false);
      expect(documentIndex.keywordIndex.has('to')).toBe(false);
      expect(documentIndex.keywordIndex.has('how')).toBe(false);
    });

    it('should score content keywords lower than metadata keywords', async () => {
      const docWithMetadata = {
        fileName: 'meta-doc.md',
        content: 'Some content about React',
        metadata: {
          keywords: ['react']
        }
      };

      const docWithContentOnly = {
        fileName: 'content-doc.md',
        content: 'This document talks about React development',
        metadata: {}
      };

      await documentIndex.indexDocument(docWithMetadata);
      await documentIndex.indexDocument(docWithContentOnly);

      const context = { query: 'react' };
      const result = documentIndex.findRelevantDocs(context);

      // Document with metadata keywords should score higher
      expect(result[0].document.fileName).toBe('meta-doc.md');
      expect(result[0].score).toBeGreaterThan(result[1].score);
    });
  });

  describe('code pattern indexing', () => {
    it('should index common code patterns', async () => {
      const document = {
        fileName: 'patterns-guide.md',
        content: `
# Common Patterns

## React Hooks
\`\`\`javascript
const [state, setState] = useState();
useEffect(() => {});
\`\`\`

## Express Routes
\`\`\`javascript
app.get('/api/users', (req, res) => {});
app.post('/api/data', handler);
\`\`\`

## Testing
\`\`\`javascript
describe('Component', () => {
  it('should render', () => {});
});
\`\`\`
        `,
        metadata: {}
      };

      await documentIndex.indexDocument(document);

      expect(documentIndex.patternIndex.has('useState')).toBe(true);
      expect(documentIndex.patternIndex.has('useEffect')).toBe(true);
      expect(documentIndex.patternIndex.has('app.get')).toBe(true);
      expect(documentIndex.patternIndex.has('app.post')).toBe(true);
      expect(documentIndex.patternIndex.has('describe(')).toBe(true);
      expect(documentIndex.patternIndex.has('it(')).toBe(true);
    });

    it('should find documents by code patterns in codeSnippet context', async () => {
      const testIndex = new DocumentIndex();
      const document = {
        fileName: 'react-hooks.md',
        content: `
# React Hooks Guide
\`\`\`javascript
const [count, setCount] = useState(0);
\`\`\`
        `,
        metadata: {}
      };

      await testIndex.indexDocument(document);

      const context = { codeSnippet: 'const [value, setValue] = useState(10);' };
      const result = testIndex.findRelevantDocs(context);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].document.fileName).toBe('react-hooks.md');
      expect(result[0].score).toBe(8); // Pattern match score
    });

    it('should index Python patterns', async () => {
      const document = {
        fileName: 'python-patterns.md',
        content: `
# Python Patterns

\`\`\`python
def my_function():
    pass

class MyClass:
    def __init__(self):
        pass

if __name__ == '__main__':
    pass
\`\`\`
        `,
        metadata: {}
      };

      await documentIndex.indexDocument(document);

      expect(documentIndex.patternIndex.has('def ')).toBe(true);
      expect(documentIndex.patternIndex.has('class ')).toBe(true);
      expect(documentIndex.patternIndex.has('__init__')).toBe(true);
      expect(documentIndex.patternIndex.has('if __name__')).toBe(true);
    });

    it('should index SQL patterns', async () => {
      const document = {
        fileName: 'sql-guide.md',
        content: `
# SQL Guide

\`\`\`sql
SELECT * FROM users WHERE id = 1;
INSERT INTO products (name, price) VALUES ('item', 10.99);
UPDATE users SET name = 'new' WHERE id = 1;
DELETE FROM logs WHERE date < '2023-01-01';
\`\`\`
        `,
        metadata: {}
      };

      await documentIndex.indexDocument(document);

      expect(documentIndex.patternIndex.has('SELECT')).toBe(true);
      expect(documentIndex.patternIndex.has('INSERT INTO')).toBe(true);
      expect(documentIndex.patternIndex.has('UPDATE')).toBe(true);
      expect(documentIndex.patternIndex.has('DELETE FROM')).toBe(true);
    });

    it('should handle multiple patterns in same document', async () => {
      const document = {
        fileName: 'multi-patterns.md',
        content: `
\`\`\`javascript
useState();
useEffect();
\`\`\`

\`\`\`python
def func():
    pass
\`\`\`
        `,
        metadata: {}
      };

      await documentIndex.indexDocument(document);

      const useStateEntries = documentIndex.patternIndex.get('useState');
      const defEntries = documentIndex.patternIndex.get('def ');
      
      expect(useStateEntries.some(entry => entry.document === document)).toBe(true);
      expect(defEntries.some(entry => entry.document === document)).toBe(true);
    });

    it('should match patterns case-insensitively for SQL', async () => {
      const testIndex = new DocumentIndex();
      const document = {
        fileName: 'sql-doc.md',
        content: '```sql\nselect * from users;\n```',
        metadata: {}
      };

      await testIndex.indexDocument(document);

      const context = { codeSnippet: 'SELECT name FROM products;' };
      const result = testIndex.findRelevantDocs(context);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].document.fileName).toBe('sql-doc.md');
    });
  });

  describe('smart inference and relevance scoring', () => {
    it('should provide higher relevance for comprehensive context', async () => {
      const testIndex = new DocumentIndex();
      
      // Document with multiple matching signals
      const comprehensiveDoc = {
        fileName: 'comprehensive-react.md',
        content: `
# React Component Testing

\`\`\`javascript
import { render } from '@testing-library/react';
const [state, setState] = useState();
\`\`\`
        `,
        metadata: {
          keywords: ['react', 'testing'],
          category: 'development'
        }
      };

      // Document with fewer matching signals
      const basicDoc = {
        fileName: 'basic-react.md',
        content: 'Basic React information',
        metadata: {
          keywords: ['react']
        }
      };

      await testIndex.indexDocument(comprehensiveDoc);
      await testIndex.indexDocument(basicDoc);

      const context = { 
        query: 'react testing',
        codeSnippet: 'useState()',
        filePath: 'src/components/Button.jsx'
      };
      const result = testIndex.findRelevantDocs(context);

      expect(result.length).toBe(2);
      expect(result[0].document.fileName).toBe('comprehensive-react.md');
      expect(result[0].score).toBeGreaterThan(result[1].score);
    });

    it('should handle file extension inference', async () => {
      const testIndex = new DocumentIndex();
      
      const jsDoc = {
        fileName: 'js-guide.md',
        content: '*.js files contain JavaScript code',
        metadata: {}
      };

      await testIndex.indexDocument(jsDoc);

      const context = { filePath: 'src/utils/helper.js' };
      const result = testIndex.findRelevantDocs(context);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].document.fileName).toBe('js-guide.md');
    });

    it('should combine multiple scoring factors appropriately', async () => {
      const testIndex = new DocumentIndex();
      
      const multiFactorDoc = {
        fileName: 'multi-factor.md',
        content: `
# React Testing Guide

\`\`\`javascript
describe('Component', () => {
  const [state] = useState();
});
\`\`\`

Files: *.test.js
        `,
        metadata: {
          keywords: ['react', 'testing'],
          category: 'testing'
        }
      };

      await testIndex.indexDocument(multiFactorDoc);

      const context = { 
        query: 'react testing frontend',
        codeSnippet: 'useState() describe(',
        filePath: 'tests/Button.test.js'
      };
      const result = testIndex.findRelevantDocs(context);

      expect(result.length).toBe(1);
      // Should have high score from multiple factors:
      // - Keywords: react (10) + testing (10)
      // - Topics: frontend (5)
      // - Patterns: useState (6) + describe( (6) 
      // - Extension: test.js (3)
      expect(result[0].score).toBeGreaterThan(35);
    });

    it('should rank documents by relevance score', async () => {
      const testIndex = new DocumentIndex();
      
      const docs = [
        {
          fileName: 'high-relevance.md',
          metadata: { keywords: ['javascript', 'react'] },
          content: '```javascript\nconst [state] = useState();\n```'
        },
        {
          fileName: 'medium-relevance.md',
          metadata: { keywords: ['javascript'] },
          content: 'Basic JavaScript information'
        },
        {
          fileName: 'low-relevance.md',
          metadata: { category: 'backend' },
          content: 'Server-side development'
        }
      ];

      for (const doc of docs) {
        await testIndex.indexDocument(doc);
      }

      const context = { query: 'javascript react', codeSnippet: 'useState()' };
      const result = testIndex.findRelevantDocs(context);

      expect(result.length).toBe(2); // Only docs matching query should be returned
      expect(result[0].document.fileName).toBe('high-relevance.md');
      expect(result[1].document.fileName).toBe('medium-relevance.md');
      expect(result[0].score).toBeGreaterThan(result[1].score);
    });

    it('should handle edge cases gracefully', async () => {
      const testIndex = new DocumentIndex();
      
      // Empty context
      expect(testIndex.findRelevantDocs({})).toEqual([]);
      
      // Context with undefined values
      const result1 = testIndex.findRelevantDocs({ 
        query: undefined, 
        codeSnippet: null, 
        filePath: '' 
      });
      expect(result1).toEqual([]);
      
      // Very long query
      const longQuery = 'word '.repeat(1000);
      const result2 = testIndex.findRelevantDocs({ query: longQuery });
      expect(result2).toEqual([]);
    });

    it('should provide confidence scoring', async () => {
      const testIndex = new DocumentIndex();
      
      const doc = {
        fileName: 'test-doc.md',
        metadata: { keywords: ['testing'] },
        content: 'Testing information'
      };

      await testIndex.indexDocument(doc);

      // High confidence context (exact keyword match)
      const highConfidenceContext = { query: 'testing' };
      const highResult = testIndex.findRelevantDocs(highConfidenceContext);
      
      // Lower confidence context (partial match)
      const lowConfidenceContext = { query: 'software development' };
      const lowResult = testIndex.findRelevantDocs(lowConfidenceContext);

      expect(highResult.length).toBeGreaterThan(0);
      expect(lowResult.length).toBe(0);
    });

    it('should handle duplicate documents correctly', async () => {
      const testIndex = new DocumentIndex();
      
      const doc = {
        fileName: 'duplicate-test.md',
        metadata: { 
          keywords: ['react', 'react'], // Duplicate keywords
          category: 'frontend' // Category
        },
        content: 'React React React' // Repeated content
      };

      await testIndex.indexDocument(doc);

      const context = { query: 'react' };
      const result = testIndex.findRelevantDocs(context);

      expect(result.length).toBe(1);
      expect(result[0].document.fileName).toBe('duplicate-test.md');
      // Score should still be reasonable despite duplicates
      expect(result[0].score).toBeLessThan(100);
    });
  });
});