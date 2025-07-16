import Database from 'better-sqlite3';
import path from 'path';

/**
 * Handles SQLite database operations for a single docset
 */
export class DocsetDatabase {
  constructor(docsetInfo) {
    this.docsetInfo = docsetInfo;
    const dbPath = path.join(docsetInfo.path, 'Contents', 'Resources', 'docSet.dsidx');
    this.db = new Database(dbPath, { readonly: true });
  }

  search(query, type, limit = 50) {
    let sql = 'SELECT name, type, path FROM searchIndex WHERE name LIKE ?';
    const params = [`%${query}%`];
    
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    
    sql += ' ORDER BY LENGTH(name), name LIMIT ?';
    params.push(limit);
    
    const stmt = this.db.prepare(sql);
    const results = stmt.all(...params);
    
    return results.map(entry => ({
      ...entry,
      url: entry.path,
      docsetId: this.docsetInfo.id,
      docsetName: this.docsetInfo.name
    }));
  }

  searchExact(name, type) {
    let sql = 'SELECT name, type, path FROM searchIndex WHERE name = ?';
    const params = [name];
    
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    
    sql += ' LIMIT 1';
    
    const stmt = this.db.prepare(sql);
    const result = stmt.get(...params);
    
    if (!result) return null;
    
    return {
      ...result,
      url: result.path,
      docsetId: this.docsetInfo.id,
      docsetName: this.docsetInfo.name
    };
  }

  getTypes() {
    const stmt = this.db.prepare('SELECT DISTINCT type FROM searchIndex ORDER BY type');
    const results = stmt.all();
    return results.map(r => r.type);
  }

  getTypeCount(type) {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM searchIndex WHERE type = ?');
    const result = stmt.get(type);
    return result.count;
  }

  getEntryCount() {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM searchIndex');
    const result = stmt.get();
    return result.count;
  }

  close() {
    this.db.close();
  }
}

/**
 * Manages multiple docset databases and provides unified search
 */
export class MultiDocsetDatabase {
  constructor() {
    this.databases = new Map();
  }

  addDocset(docsetInfo) {
    if (this.databases.has(docsetInfo.id)) {
      this.databases.get(docsetInfo.id).close();
    }
    this.databases.set(docsetInfo.id, new DocsetDatabase(docsetInfo));
  }

  removeDocset(docsetId) {
    const db = this.databases.get(docsetId);
    if (db) {
      db.close();
      this.databases.delete(docsetId);
    }
  }

  search(query, options = {}) {
    const { type, docsetId, limit = 50 } = options;
    const results = [];

    // If specific docset is requested
    if (docsetId) {
      const db = this.databases.get(docsetId);
      if (db) {
        return db.search(query, type, limit);
      }
      return [];
    }

    // Search across all docsets
    const limitPerDocset = Math.ceil(limit / Math.max(1, this.databases.size));
    
    for (const db of this.databases.values()) {
      const docsetResults = db.search(query, type, limitPerDocset);
      results.push(...docsetResults);
    }

    // Sort by name length and then alphabetically
    results.sort((a, b) => {
      const lengthDiff = a.name.length - b.name.length;
      if (lengthDiff !== 0) return lengthDiff;
      return a.name.localeCompare(b.name);
    });

    return results.slice(0, limit);
  }

  searchExact(name, options = {}) {
    const { type, docsetId } = options;

    // If specific docset is requested
    if (docsetId) {
      const db = this.databases.get(docsetId);
      if (db) {
        return db.searchExact(name, type);
      }
      return null;
    }

    // Search across all docsets, return first match
    for (const db of this.databases.values()) {
      const result = db.searchExact(name, type);
      if (result) return result;
    }

    return null;
  }

  getAllTypes() {
    const results = [];
    
    for (const [docsetId, db] of this.databases) {
      const docsetInfo = db.docsetInfo;
      results.push({
        docsetId,
        docsetName: docsetInfo.name,
        types: db.getTypes()
      });
    }

    return results;
  }

  getStats() {
    const results = [];
    
    for (const [docsetId, db] of this.databases) {
      const docsetInfo = db.docsetInfo;
      const types = db.getTypes();
      const typeStats = {};
      
      for (const type of types) {
        typeStats[type] = db.getTypeCount(type);
      }

      results.push({
        docsetId,
        docsetName: docsetInfo.name,
        entryCount: db.getEntryCount(),
        types: typeStats
      });
    }

    return results;
  }

  closeAll() {
    for (const db of this.databases.values()) {
      db.close();
    }
    this.databases.clear();
  }
}