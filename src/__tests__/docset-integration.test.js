import { DocsServer } from '../index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('DocsServer Docset Integration', () => {
  let server;
  let tempDocsPath;
  let tempDocsetsPath;

  beforeEach(async () => {
    // Create temporary directories
    tempDocsPath = path.join(__dirname, 'temp-docs-' + Date.now());
    tempDocsetsPath = path.join(__dirname, 'temp-docsets-' + Date.now());
    
    await fs.ensureDir(tempDocsPath);
    await fs.ensureDir(tempDocsetsPath);
    
    // Create a simple test doc
    await fs.writeFile(
      path.join(tempDocsPath, 'test.md'),
      '---\nalwaysApply: true\ntitle: Test Doc\n---\n# Test'
    );
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
    await fs.remove(tempDocsPath);
    await fs.remove(tempDocsetsPath);
  });

  describe('Server initialization with docsets', () => {
    it('should initialize with custom docsets path', async () => {
      server = new DocsServer({
        docsPath: tempDocsPath,
        docsetsPath: tempDocsetsPath,
        verbose: false
      });

      await server.start();
      
      expect(server.docsetService).toBeDefined();
      expect(server.docsetService.storagePath).toBe(tempDocsetsPath);
    });

    it('should use default docsets path when not provided', async () => {
      server = new DocsServer({
        docsPath: tempDocsPath,
        verbose: false
      });

      await server.start();
      
      const expectedPath = path.join(os.homedir(), 'Developer', 'DocSets');
      expect(server.docsetService.storagePath).toBe(expectedPath);
    });
  });

  describe('Docset service functionality', () => {
    beforeEach(async () => {
      server = new DocsServer({
        docsPath: tempDocsPath,
        docsetsPath: tempDocsetsPath,
        verbose: false
      });
      await server.start();
    });

    it('should have docset service initialized', () => {
      expect(server.docsetService).toBeDefined();
      expect(server.multiDocsetDatabase).toBeDefined();
    });

    it('should have empty docsets initially', async () => {
      const docsets = await server.docsetService.listDocsets();
      expect(docsets).toEqual([]);
    });

    it('should handle docset operations', async () => {
      // Create a mock docset
      const mockDocsetPath = path.join(tempDocsetsPath, 'Mock.docset');
      const contentsPath = path.join(mockDocsetPath, 'Contents');
      const resourcesPath = path.join(contentsPath, 'Resources');
      
      await fs.ensureDir(resourcesPath);
      
      // Create Info.plist
      const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>Mock Documentation</string>
  <key>CFBundleIdentifier</key>
  <string>mock.documentation</string>
</dict>
</plist>`;
      await fs.writeFile(path.join(contentsPath, 'Info.plist'), infoPlist);
      
      // Create SQLite database
      const Database = (await import('better-sqlite3')).default;
      const dbPath = path.join(resourcesPath, 'docSet.dsidx');
      const db = new Database(dbPath);
      db.exec(`
        CREATE TABLE searchIndex(
          id INTEGER PRIMARY KEY,
          name TEXT,
          type TEXT,
          path TEXT
        );
      `);
      db.prepare('INSERT INTO searchIndex (name, type, path) VALUES (?, ?, ?)')
        .run('TestClass', 'Class', 'test.html');
      db.close();
      
      // Test adding docset
      const docsetInfo = await server.docsetService.addDocset(mockDocsetPath);
      expect(docsetInfo.name).toBe('Mock Documentation');
      
      // Test listing docsets
      const docsets = await server.docsetService.listDocsets();
      expect(docsets).toHaveLength(1);
      expect(docsets[0].name).toBe('Mock Documentation');
      
      // Add to database for searching
      server.multiDocsetDatabase.addDocset(docsetInfo);
      
      // Test searching
      const searchResults = server.multiDocsetDatabase.search('Test');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe('TestClass');
      
      // Test removing docset
      await server.docsetService.removeDocset(docsetInfo.id);
      const finalDocsets = await server.docsetService.listDocsets();
      expect(finalDocsets).toHaveLength(0);
    });
  });
});