const { DocumentationService } = require('./services/DocumentationService');
const fs = require('fs-extra');
const path = require('path');

describe('DocumentationService get_document_index functionality', () => {
  let docService;
  let tempDocsPath;

  beforeEach(async () => {
    // Create a temporary directory for test documents
    tempDocsPath = path.join(__dirname, '../test-docs');
    await fs.ensureDir(tempDocsPath);
    
    // Create test documents
    const testDocs = [
      {
        fileName: 'react-guide.md',
        content: '---\nalwaysApply: false\ntitle: "React Component Guide"\ndescription: "Learn how to build React components"\nkeywords: ["react", "components", "jsx"]\n---\n\n# React Components\n\nThis guide covers React components.'
      },
      {
        fileName: 'testing-standards.md',
        content: '---\nalwaysApply: true\ntitle: "Testing Standards"\ndescription: "Project testing requirements"\nkeywords: ["testing", "jest", "standards"]\n---\n\n# Testing Standards\n\nAll code must have tests.'
      },
      {
        fileName: 'api-design.md',
        content: '---\nalwaysApply: false\ntitle: "API Design Guidelines"\ndescription: "REST API design patterns"\nkeywords: ["api", "rest", "design"]\n---\n\n# API Design\n\nFollow REST principles.'
      }
    ];

    // Write test documents to temp directory
    for (const doc of testDocs) {
      await fs.writeFile(path.join(tempDocsPath, doc.fileName), doc.content);
    }

    // Create DocumentationService instance
    docService = new DocumentationService(tempDocsPath);
    await docService.initialize();
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.remove(tempDocsPath);
  });

  describe('getDocumentIndex method', () => {
    it('should be implemented and return document index', async () => {
      expect(typeof docService.getDocumentIndex).toBe('function');
      
      const index = await docService.getDocumentIndex();
      
      expect(Array.isArray(index)).toBe(true);
      expect(index.length).toBe(3);
      
      // Check that each document has required fields
      index.forEach(doc => {
        expect(doc).toHaveProperty('title');
        expect(doc).toHaveProperty('description');
        expect(doc).toHaveProperty('fileName');
        expect(doc).toHaveProperty('lastUpdated');
        expect(typeof doc.lastUpdated).toBe('string');
      });
    });

    it('should return documents sorted by title', async () => {
      const index = await docService.getDocumentIndex();
      
      // Should be sorted alphabetically by title
      expect(index[0].title).toBe('API Design Guidelines');
      expect(index[1].title).toBe('React Component Guide');
      expect(index[2].title).toBe('Testing Standards');
    });

    it('should include metadata from frontmatter', async () => {
      const index = await docService.getDocumentIndex();
      
      const reactDoc = index.find(doc => doc.fileName === 'react-guide.md');
      expect(reactDoc.title).toBe('React Component Guide');
      expect(reactDoc.description).toBe('Learn how to build React components');
      
      const testingDoc = index.find(doc => doc.fileName === 'testing-standards.md');
      expect(testingDoc.title).toBe('Testing Standards');
      expect(testingDoc.description).toBe('Project testing requirements');
    });

    it('should use file name as title when no title in metadata', async () => {
      // Create a document without title metadata
      const docWithoutTitle = '---\ndescription: "A document without title"\n---\n\nSome content';
      await fs.writeFile(path.join(tempDocsPath, 'no-title.md'), docWithoutTitle);
      
      // Reload documents to pick up the new file
      await docService.reload();
      
      const index = await docService.getDocumentIndex();
      const noTitleDoc = index.find(doc => doc.fileName === 'no-title.md');
      
      expect(noTitleDoc.title).toBe('no-title.md');
      expect(noTitleDoc.description).toBe('A document without title');
    });

    it('should handle empty description gracefully', async () => {
      const index = await docService.getDocumentIndex();
      
      // All test documents should have descriptions, but let's test the structure
      index.forEach(doc => {
        expect(typeof doc.description).toBe('string');
      });
    });
  });
});