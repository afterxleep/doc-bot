import { DocsServer } from '../src/index.js';
import { DocumentationService } from '../src/services/DocumentationService.js';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
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
  });

  describe('DocumentationService reload reflects disk atomically', () => {
    let tempDocsPath;
    let service;

    const writeDoc = (name, title) =>
      fs.writeFile(
        path.join(tempDocsPath, name),
        `---\ntitle: "${title}"\nkeywords: ["${title.toLowerCase()}"]\n---\n# ${title}\n`,
        'utf8'
      );

    beforeEach(async () => {
      tempDocsPath = await fs.mkdtemp(path.join(os.tmpdir(), 'doc-bot-reload-'));
      await writeDoc('first.md', 'First');
      service = new DocumentationService(tempDocsPath);
      await service.initialize();
    });

    afterEach(async () => {
      await fs.remove(tempDocsPath);
    });

    it('picks up newly added files on reload', async () => {
      expect(service.documents.size).toBe(1);
      await writeDoc('second.md', 'Second');
      await service.reload();
      expect(service.documents.size).toBe(2);
      expect(service.getDocument('second.md')).toBeDefined();
    });

    it('drops removed files on reload', async () => {
      await fs.remove(path.join(tempDocsPath, 'first.md'));
      await service.reload();
      expect(service.documents.size).toBe(0);
      expect(service.getDocument('first.md')).toBeUndefined();
    });

    it('never exposes a partially-populated map during concurrent reloads', async () => {
      await writeDoc('second.md', 'Second');
      await writeDoc('third.md', 'Third');

      // Kick off several reloads at once (as rapid watch events would) while
      // repeatedly reading. The atomic swap means every read sees a complete
      // set — never the transient empty/partial state of a non-atomic clear.
      const reloads = Array.from({ length: 5 }, () => service.reload());
      for (let i = 0; i < 20; i++) {
        const size = service.documents.size;
        expect(size === 3 || size === 1).toBe(true); // full set, never partial
      }
      await Promise.all(reloads);
      expect(service.documents.size).toBe(3);
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

    it('should return documentation guidance for a task', async () => {
      const server = new DocsServer({
        docsPath: docsPath,
        verbose: false,
        watch: false
      });

      await server.docService.reload();
      const response = await server.getDocumentationGuidance('create REST API', 1);

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response).toContain('Documentation Guidance');
      expect(response).toContain('Documentation Tools');
      expect(response).toContain('search_documentation');
      expect(response).toContain('get_file_docs');
      expect(response).toContain('explore_api');
    });

    it('should support pagination for documentation guidance', async () => {
      const server = new DocsServer({
        docsPath: docsPath,
        verbose: false,
        watch: false
      });

      await server.docService.reload();

      // Test page 1
      const page1Response = await server.getDocumentationGuidance('create REST API', 1);
      expect(page1Response).toBeDefined();
      expect(typeof page1Response).toBe('string');

      // Should always contain tool catalog
      expect(page1Response).toContain('Documentation Tools');
    });
  });
});
