import { DocsetDatabase, MultiDocsetDatabase } from '../database.js';
import Database from 'better-sqlite3';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('DocsetDatabase', () => {
  let tempDir;
  let testDbPath;
  let testDb;
  let docsetInfo;

  beforeEach(async () => {
    // Create temporary directory and test database
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'doc-bot-docset-db-'));
    
    // Create docset structure
    const docsetPath = path.join(tempDir, 'Test.docset');
    const resourcesPath = path.join(docsetPath, 'Contents', 'Resources');
    await fs.ensureDir(resourcesPath);
    
    testDbPath = path.join(resourcesPath, 'docSet.dsidx');
    
    // Create test SQLite database with docset schema
    testDb = new Database(testDbPath);
    testDb.exec(`
      CREATE TABLE searchIndex(
        id INTEGER PRIMARY KEY,
        name TEXT,
        type TEXT,
        path TEXT
      );
      CREATE UNIQUE INDEX anchor ON searchIndex (name, type, path);
    `);
    
    // Insert test data
    const insertStmt = testDb.prepare('INSERT INTO searchIndex (name, type, path) VALUES (?, ?, ?)');
    insertStmt.run('UIViewController', 'Class', 'UIKit/UIViewController.html');
    insertStmt.run('viewDidLoad', 'Method', 'UIKit/UIViewController.html#viewDidLoad');
    insertStmt.run('NSString', 'Class', 'Foundation/NSString.html');
    insertStmt.run('stringWithFormat:', 'Method', 'Foundation/NSString.html#stringWithFormat');
    insertStmt.run('iOS App Lifecycle', 'Guide', 'Guides/AppLifecycle.html');
    testDb.close();
    
    // Create docset info
    docsetInfo = {
      id: 'test-docset',
      name: 'Test Docset',
      path: docsetPath
    };
  });

  afterEach(async () => {
    // Clean up
    await fs.remove(tempDir);
  });

  describe('constructor', () => {
    it('should open database in readonly mode', () => {
      const docsetDb = new DocsetDatabase(docsetInfo);
      expect(docsetDb.docsetInfo).toEqual(docsetInfo);
      expect(docsetDb.db.readonly).toBe(true);
      docsetDb.close();
    });
  });

  describe('search', () => {
    it('should search by query with case-insensitive matching', () => {
      const docsetDb = new DocsetDatabase(docsetInfo);
      
      const results = docsetDb.search('view');
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('viewDidLoad');
      expect(results[1].name).toBe('UIViewController');
      
      docsetDb.close();
    });

    it('should filter by type when provided', () => {
      const docsetDb = new DocsetDatabase(docsetInfo);
      
      const results = docsetDb.search('i', 'Class');
      expect(results).toHaveLength(2); // UIViewController and NSString
      expect(results.every(r => r.type === 'Class')).toBe(true);
      
      docsetDb.close();
    });

    it('should respect limit parameter', () => {
      const docsetDb = new DocsetDatabase(docsetInfo);
      
      const results = docsetDb.search('i', null, 2);
      expect(results).toHaveLength(2);
      
      docsetDb.close();
    });

    it('should include docset metadata in results', () => {
      const docsetDb = new DocsetDatabase(docsetInfo);
      
      const results = docsetDb.search('UIViewController');
      expect(results[0]).toMatchObject({
        name: 'UIViewController',
        type: 'Class',
        url: 'UIKit/UIViewController.html',
        docsetId: 'test-docset',
        docsetName: 'Test Docset'
      });
      
      docsetDb.close();
    });
  });

  describe('searchExact', () => {
    it('should find exact name match', () => {
      const docsetDb = new DocsetDatabase(docsetInfo);
      
      const result = docsetDb.searchExact('UIViewController');
      expect(result).toMatchObject({
        name: 'UIViewController',
        type: 'Class',
        url: 'UIKit/UIViewController.html'
      });
      
      docsetDb.close();
    });

    it('should return null when no exact match found', () => {
      const docsetDb = new DocsetDatabase(docsetInfo);
      
      const result = docsetDb.searchExact('NonExistent');
      expect(result).toBeNull();
      
      docsetDb.close();
    });

    it('should filter by type when provided', () => {
      const docsetDb = new DocsetDatabase(docsetInfo);
      
      // Should not find UIViewController when searching for Method type
      const result = docsetDb.searchExact('UIViewController', 'Method');
      expect(result).toBeNull();
      
      docsetDb.close();
    });
  });

  describe('statistics methods', () => {
    it('should get all unique types', () => {
      const docsetDb = new DocsetDatabase(docsetInfo);
      
      const types = docsetDb.getTypes();
      expect(types).toEqual(['Class', 'Guide', 'Method']);
      
      docsetDb.close();
    });

    it('should count entries by type', () => {
      const docsetDb = new DocsetDatabase(docsetInfo);
      
      expect(docsetDb.getTypeCount('Class')).toBe(2);
      expect(docsetDb.getTypeCount('Method')).toBe(2);
      expect(docsetDb.getTypeCount('Guide')).toBe(1);
      
      docsetDb.close();
    });

    it('should get total entry count', () => {
      const docsetDb = new DocsetDatabase(docsetInfo);
      
      expect(docsetDb.getEntryCount()).toBe(5);
      
      docsetDb.close();
    });
  });
});

describe('MultiDocsetDatabase', () => {
  let multiDb;
  let tempDir;
  let docset1Info;
  let docset2Info;

  beforeEach(async () => {
    multiDb = new MultiDocsetDatabase();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'doc-bot-docset-multi-'));
    
    // Create two test docsets
    const createDocset = async (name, entries) => {
      const docsetPath = path.join(tempDir, `${name}.docset`);
      const resourcesPath = path.join(docsetPath, 'Contents', 'Resources');
      await fs.ensureDir(resourcesPath);
      
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
      
      const insertStmt = db.prepare('INSERT INTO searchIndex (name, type, path) VALUES (?, ?, ?)');
      entries.forEach(entry => insertStmt.run(entry.name, entry.type, entry.path));
      db.close();
      
      return {
        id: name.toLowerCase(),
        name: name,
        path: docsetPath
      };
    };
    
    docset1Info = await createDocset('iOS', [
      { name: 'UIView', type: 'Class', path: 'UIKit/UIView.html' },
      { name: 'UIViewController', type: 'Class', path: 'UIKit/UIViewController.html' }
    ]);
    
    docset2Info = await createDocset('Swift', [
      { name: 'Array', type: 'Structure', path: 'Swift/Array.html' },
      { name: 'String', type: 'Structure', path: 'Swift/String.html' }
    ]);
  });

  afterEach(async () => {
    multiDb.closeAll();
    await fs.remove(tempDir);
  });

  describe('docset management', () => {
    it('should add and remove docsets', () => {
      multiDb.addDocset(docset1Info);
      expect(multiDb.databases.size).toBe(1);
      
      multiDb.addDocset(docset2Info);
      expect(multiDb.databases.size).toBe(2);
      
      multiDb.removeDocset('ios');
      expect(multiDb.databases.size).toBe(1);
      expect(multiDb.databases.has('swift')).toBe(true);
    });

    it('should replace existing docset when adding with same ID', () => {
      multiDb.addDocset(docset1Info);
      const firstDb = multiDb.databases.get('ios');
      
      // Add again with same ID
      multiDb.addDocset(docset1Info);
      const secondDb = multiDb.databases.get('ios');
      
      expect(firstDb).not.toBe(secondDb);
      expect(multiDb.databases.size).toBe(1);
    });
  });

  describe('search across docsets', () => {
    beforeEach(() => {
      multiDb.addDocset(docset1Info);
      multiDb.addDocset(docset2Info);
    });

    it('should search across all docsets', () => {
      const results = multiDb.search('i');
      expect(results).toHaveLength(3); // UIView, UIViewController, String contain 'i'
      
      // Check results come from both docsets
      const docsetIds = [...new Set(results.map(r => r.docsetId))];
      expect(docsetIds).toHaveLength(2);
    });

    it('should limit search to specific docset when ID provided', () => {
      const results = multiDb.search('i', { docsetId: 'ios' });
      expect(results).toHaveLength(2);
      expect(results.every(r => r.docsetId === 'ios')).toBe(true);
    });

    it('should filter by type across all docsets', () => {
      const results = multiDb.search('', { type: 'Structure' });
      expect(results).toHaveLength(2);
      expect(results.every(r => r.type === 'Structure')).toBe(true);
    });

    it('should respect global limit', () => {
      const results = multiDb.search('', { limit: 3 });
      expect(results).toHaveLength(3);
    });
  });

  describe('exact search', () => {
    beforeEach(() => {
      multiDb.addDocset(docset1Info);
      multiDb.addDocset(docset2Info);
    });

    it('should find exact match across all docsets', () => {
      const result = multiDb.searchExact('Array');
      expect(result).toMatchObject({
        name: 'Array',
        type: 'Structure',
        docsetId: 'swift'
      });
    });

    it('should limit to specific docset when ID provided', () => {
      const result = multiDb.searchExact('Array', { docsetId: 'ios' });
      expect(result).toBeNull();
    });
  });

  describe('statistics', () => {
    beforeEach(() => {
      multiDb.addDocset(docset1Info);
      multiDb.addDocset(docset2Info);
    });

    it('should get stats for all docsets', () => {
      const stats = multiDb.getStats();
      expect(stats).toHaveLength(2);
      
      const iosStats = stats.find(s => s.docsetId === 'ios');
      expect(iosStats.entryCount).toBe(2);
      expect(iosStats.types).toEqual({ Class: 2 });
      
      const swiftStats = stats.find(s => s.docsetId === 'swift');
      expect(swiftStats.entryCount).toBe(2);
      expect(swiftStats.types).toEqual({ Structure: 2 });
    });
  });
});
