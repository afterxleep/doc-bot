import { DocsetDatabase, MultiDocsetDatabase } from '../database.js';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Enhanced DocsetDatabase', () => {
  let tempDir;
  let docsetInfo;
  let docsetDb;
  let sqliteDb;

  beforeEach(async () => {
    // Create temporary docset structure
    tempDir = path.join(__dirname, 'temp-docset-' + Date.now());
    const resourcesPath = path.join(tempDir, 'Contents', 'Resources');
    await fs.ensureDir(resourcesPath);
    
    // Create SQLite database
    const dbPath = path.join(resourcesPath, 'docSet.dsidx');
    sqliteDb = new Database(dbPath);
    sqliteDb.exec(`
      CREATE TABLE searchIndex(
        id INTEGER PRIMARY KEY,
        name TEXT,
        type TEXT,
        path TEXT
      );
    `);

    // Insert test data
    const stmt = sqliteDb.prepare('INSERT INTO searchIndex (name, type, path) VALUES (?, ?, ?)');
    stmt.run('AlarmKit', 'Framework', 'alarmkit.html');
    stmt.run('AlarmKit.Alarm', 'Class', 'alarmkit/alarm.html');
    stmt.run('AlarmKit.AlarmManager', 'Class', 'alarmkit/manager.html');
    stmt.run('URLSession', 'Class', 'urlsession.html');
    stmt.run('URLSession.shared', 'Property', 'urlsession/shared.html');
    stmt.run('URLSessionConfiguration', 'Class', 'urlsessionconfig.html');
    stmt.run('TestFramework', 'Framework', 'test.html');
    sqliteDb.close();

    docsetInfo = {
      id: 'test-docset',
      name: 'Test Docset',
      path: tempDir
    };

    docsetDb = new DocsetDatabase(docsetInfo);
  });

  afterEach(async () => {
    docsetDb.close();
    await fs.remove(tempDir);
  });

  describe('searchWithTerms', () => {
    it('should find exact phrase matches with high score', () => {
      const results = docsetDb.searchWithTerms(['alarmkit', 'alarm'], null, 10);
      
      const exactMatch = results.find(r => r.name === 'AlarmKit.Alarm');
      expect(exactMatch).toBeDefined();
      expect(exactMatch.isExactPhrase).toBe(true);
      expect(exactMatch.relevanceScore).toBeGreaterThan(90);
    });

    it('should find entries containing all search terms', () => {
      const results = docsetDb.searchWithTerms(['urlsession', 'configuration'], null, 10);
      
      // Should find URLSessionConfiguration since it contains both terms
      const configResult = results.find(r => r.name === 'URLSessionConfiguration');
      expect(configResult).toBeDefined();
      expect(configResult.matchedTerms).toBe(2);
    });

    it('should prioritize entries with all terms over partial matches', () => {
      const results = docsetDb.searchWithTerms(['urlsession', 'shared'], null, 10);
      
      // URLSession.shared should rank first as it contains both terms
      expect(results[0].name).toBe('URLSession.shared');
      expect(results[0].matchedTerms).toBe(2);
    });

    it('should handle single term searches', () => {
      const results = docsetDb.searchWithTerms(['alarmkit'], null, 10);
      
      expect(results.length).toBeGreaterThan(0);
      const frameworkResult = results.find(r => r.name === 'AlarmKit' && r.type === 'Framework');
      expect(frameworkResult).toBeDefined();
    });

    it('should respect type filter', () => {
      const results = docsetDb.searchWithTerms(['alarmkit'], 'Class', 10);
      
      expect(results.every(r => r.type === 'Class')).toBe(true);
      expect(results.some(r => r.name.includes('AlarmKit'))).toBe(true);
    });

    it('should prefer shorter names for equal relevance', () => {
      const results = docsetDb.searchWithTerms(['test'], null, 10);
      
      if (results.length > 1 && results[0].relevanceScore === results[1].relevanceScore) {
        expect(results[0].name.length).toBeLessThanOrEqual(results[1].name.length);
      }
    });

    it('should score exact name matches highest', () => {
      const results = docsetDb.searchWithTerms(['urlsession'], null, 10);
      
      const exactMatch = results.find(r => r.name.toLowerCase() === 'urlsession');
      if (exactMatch) {
        expect(results.indexOf(exactMatch)).toBeLessThan(3); // Should be in top 3
      }
    });

    it('should handle no matches gracefully', () => {
      const results = docsetDb.searchWithTerms(['nonexistent', 'terms'], null, 10);
      
      expect(results).toEqual([]);
    });
  });
});

describe('MultiDocsetDatabase enhanced features', () => {
  let multiDb;
  let tempDirs;

  beforeEach(async () => {
    multiDb = new MultiDocsetDatabase();
    tempDirs = [];

    // Create multiple mock docsets
    for (let i = 0; i < 2; i++) {
      const tempDir = path.join(__dirname, `temp-docset-${i}-${Date.now()}`);
      tempDirs.push(tempDir);
      
      const resourcesPath = path.join(tempDir, 'Contents', 'Resources');
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

      // Insert different data in each docset
      const stmt = db.prepare('INSERT INTO searchIndex (name, type, path) VALUES (?, ?, ?)');
      if (i === 0) {
        stmt.run('AlarmKit', 'Framework', 'alarmkit.html?language=swift');
        stmt.run('AlarmKit', 'Framework', 'alarmkit.html'); // Duplicate without Swift
        stmt.run('AlarmKit.Alarm', 'Class', 'alarm.html');
      } else {
        stmt.run('NotificationKit', 'Framework', 'notifkit.html');
        stmt.run('AlarmKit.Schedule', 'Class', 'schedule.html');
      }
      db.close();

      multiDb.addDocset({
        id: `docset-${i}`,
        name: `Docset ${i}`,
        path: tempDir
      });
    }
  });

  afterEach(async () => {
    multiDb.closeAll();
    for (const dir of tempDirs) {
      await fs.remove(dir);
    }
  });

  describe('searchWithTerms across multiple docsets', () => {
    it('should search all docsets and combine results', () => {
      const results = multiDb.searchWithTerms(['alarmkit'], { limit: 10 });
      
      expect(results.length).toBeGreaterThan(0);
      // Should find entries from both docsets
      const docsetIds = new Set(results.map(r => r.docsetId));
      expect(docsetIds.size).toBe(2);
    });

    it('should deduplicate results preferring Swift entries', () => {
      const results = multiDb.searchWithTerms(['alarmkit'], { limit: 10 });
      
      // Count AlarmKit Framework entries
      const alarmKitFrameworks = results.filter(r => 
        r.name === 'AlarmKit' && r.type === 'Framework'
      );
      
      // Should only have one after deduplication
      expect(alarmKitFrameworks.length).toBe(1);
      // And it should be the Swift version
      expect(alarmKitFrameworks[0].url).toContain('language=swift');
    });

    it('should respect docsetId filter', () => {
      const results = multiDb.searchWithTerms(['alarmkit'], { 
        docsetId: 'docset-0',
        limit: 10 
      });
      
      expect(results.every(r => r.docsetId === 'docset-0')).toBe(true);
    });

    it('should sort by relevance score', () => {
      const results = multiDb.searchWithTerms(['alarmkit'], { limit: 10 });
      
      for (let i = 1; i < results.length; i++) {
        expect(results[i].relevanceScore).toBeLessThanOrEqual(results[i-1].relevanceScore);
      }
    });
  });

  describe('exploreAPI', () => {
    it('should find framework and related entries', () => {
      const exploration = multiDb.exploreAPI('AlarmKit');
      
      expect(exploration.framework).toBeDefined();
      expect(exploration.framework.name).toBe('AlarmKit');
      expect(exploration.classes.length).toBeGreaterThan(0);
      expect(exploration.classes.some(c => c.name === 'AlarmKit.Alarm')).toBe(true);
    });

    it('should categorize entries by type', () => {
      const exploration = multiDb.exploreAPI('AlarmKit');
      
      // Check that entries are properly categorized
      expect(exploration.classes.every(e => e.type === 'Class')).toBe(true);
      expect(exploration.framework?.type).toBe('Framework');
    });

    it('should search across all docsets', () => {
      const exploration = multiDb.exploreAPI('AlarmKit');
      
      // Should find AlarmKit.Schedule from second docset
      expect(exploration.classes.some(c => c.name === 'AlarmKit.Schedule')).toBe(true);
    });

    it('should respect docsetId option', () => {
      const exploration = multiDb.exploreAPI('AlarmKit', { docsetId: 'docset-0' });
      
      // Should not find AlarmKit.Schedule which is only in docset-1
      expect(exploration.classes.some(c => c.name === 'AlarmKit.Schedule')).toBe(false);
    });

    it('should handle entries without exact framework match', () => {
      const exploration = multiDb.exploreAPI('URLSession');
      
      // Even without a Framework entry, should find related classes
      expect(exploration.framework).toBeNull();
      expect(exploration.classes.length).toBe(0); // No URLSession in our test data
    });

    it('should include only specified types', () => {
      const exploration = multiDb.exploreAPI('AlarmKit', {
        includeTypes: ['Framework', 'Class']
      });
      
      // Should only have frameworks and classes
      const allEntries = [
        exploration.framework,
        ...exploration.classes,
        ...exploration.methods,
        ...exploration.properties
      ].filter(Boolean);
      
      expect(allEntries.every(e => ['Framework', 'Class'].includes(e.type))).toBe(true);
    });
  });

  describe('ParallelSearchManager integration', () => {
    beforeEach(async () => {
      // Add more docsets to trigger parallel search
      for (let i = 2; i < 5; i++) {
        const tempDir = path.join(__dirname, `temp-docset-${i}-${Date.now()}`);
        tempDirs.push(tempDir);
        
        const resourcesPath = path.join(tempDir, 'Contents', 'Resources');
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
        
        db.prepare('INSERT INTO searchIndex (name, type, path) VALUES (?, ?, ?)')
          .run(`TestClass${i}`, 'Class', `test${i}.html`);
        db.close();

        multiDb.addDocset({
          id: `docset-${i}`,
          name: `Docset ${i}`,
          path: tempDir
        });
      }
    });

    it('should use parallel search for multiple docsets', async () => {
      // With 5 docsets, should trigger parallel search (threshold is >3)
      expect(multiDb.databases.size).toBe(5);
      
      const results = await multiDb.searchWithTerms(['test'], { limit: 20 });
      
      // Should find results from multiple docsets
      const docsetIds = new Set(results.map(r => r.docsetId));
      expect(docsetIds.size).toBeGreaterThanOrEqual(3);
    });
  });
});