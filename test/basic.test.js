import { DocsServer } from '../src/index.js';
import { DocumentationService } from '../src/services/DocumentationService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Doc-Bot Basic Tests', () => {
  const docsPath = path.join(__dirname, '../doc-bot');

  describe('DocumentationService', () => {
    let docService;

    beforeEach(async () => {
      docService = new DocumentationService(docsPath);
      await docService.initialize();
    });

    it('should load documentation files', async () => {
      const docs = await docService.getAllDocuments();
      expect(docs.length).toBeGreaterThan(0);
    });

    it('should search documents', async () => {
      const results = await docService.searchDocuments('testing');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should get document by name', () => {
      const doc = docService.getDocument('testing-guide.md');
      if (doc) {
        expect(doc.content).toBeDefined();
      }
    });

    it('should get document index', async () => {
      const index = await docService.getDocumentIndex();
      expect(Array.isArray(index)).toBe(true);
      expect(index.length).toBeGreaterThan(0);
    });

    it('should get global rules', async () => {
      const rules = await docService.getGlobalRules();
      expect(Array.isArray(rules)).toBe(true);
    });
  });

  describe('DocsServer', () => {
    it('should create server instance', () => {
      const server = new DocsServer({
        docsPath: docsPath,
        verbose: false,
        watch: false
      });
      
      expect(server.docService).toBeDefined();
      expect(server.inferenceEngine).toBeDefined();
      expect(server.unifiedSearch).toBeDefined();
    });

    it('should extract search terms', () => {
      const server = new DocsServer({
        docsPath: docsPath,
        verbose: false,
        watch: false
      });
      
      const terms = server.extractSearchTerms('How to test React components?');
      expect(Array.isArray(terms)).toBe(true);
      expect(terms.length).toBeGreaterThan(0);
      // Check that we got meaningful terms (may be capitalized)
      const lowerTerms = terms.map(t => t.toLowerCase());
      expect(lowerTerms.some(t => t.includes('test'))).toBe(true);
      expect(lowerTerms.some(t => t.includes('react'))).toBe(true);
      expect(lowerTerms.some(t => t.includes('component'))).toBe(true);
    });
  });
});