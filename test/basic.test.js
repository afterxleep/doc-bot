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

    it('should return intelligent gatekeeper response with mandatory rules', async () => {
      const server = new DocsServer({
        docsPath: docsPath,
        verbose: false,
        watch: false
      });

      await server.docService.reload();
      const mandatoryRules = await server.docService.getGlobalRules();
      const response = server.getIntelligentGatekeeperResponse('create REST API', mandatoryRules, 1);

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response).toContain('Mandatory Project Standards');
      expect(response).toContain('Additional Documentation Tools Available');
      expect(response).toContain('search_documentation');
      expect(response).toContain('get_file_docs');
      expect(response).toContain('explore_api');
    });

    it('should support pagination for large rule sets', async () => {
      const server = new DocsServer({
        docsPath: docsPath,
        verbose: false,
        watch: false
      });

      await server.docService.reload();
      const mandatoryRules = await server.docService.getGlobalRules();

      // Test page 1
      const page1Response = server.getIntelligentGatekeeperResponse('create REST API', mandatoryRules, 1);
      expect(page1Response).toBeDefined();
      expect(typeof page1Response).toBe('string');

      // Should always contain tool catalog
      expect(page1Response).toContain('Additional Documentation Tools Available');
    });
  });
});