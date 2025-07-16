import Database from 'better-sqlite3';
import path from 'path';
import { ParallelSearchManager } from './ParallelSearchManager.js';

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

  searchWithTerms(searchTerms, type, limit = 50) {
    // First try to find exact phrase match
    const fullQuery = searchTerms.join(' ');
    let sql = 'SELECT name, type, path FROM searchIndex WHERE name LIKE ?';
    const exactParams = [`%${fullQuery}%`];
    
    if (type) {
      sql += ' AND type = ?';
      exactParams.push(type);
    }
    
    sql += ' LIMIT ?';
    exactParams.push(limit);
    
    const stmt = this.db.prepare(sql);
    const exactResults = stmt.all(...exactParams);
    
    // If we found exact phrase matches, score them highly
    const exactScored = exactResults.map(entry => ({
      ...entry,
      url: entry.path,
      docsetId: this.docsetInfo.id,
      docsetName: this.docsetInfo.name,
      relevanceScore: 100 - (entry.name.length * 0.1), // Prefer shorter names
      matchedTerms: searchTerms.length,
      isExactPhrase: true
    }));
    
    // Also search for individual terms
    const termConditions = searchTerms.map(() => 'name LIKE ?').join(' OR ');
    let termSql = `SELECT name, type, path FROM searchIndex WHERE (${termConditions})`;
    const termParams = searchTerms.map(term => `%${term}%`);
    
    if (type) {
      termSql += ' AND type = ?';
      termParams.push(type);
    }
    
    termSql += ' ORDER BY LENGTH(name), name LIMIT ?';
    termParams.push(limit * 3); // Get more results for scoring
    
    const termStmt = this.db.prepare(termSql);
    const termResults = termStmt.all(...termParams);
    
    // Score results based on how many terms match
    const termScored = termResults.map(entry => {
      const nameLower = entry.name.toLowerCase();
      let score = 0;
      let matchedTerms = 0;
      
      // Check if all terms appear in the name
      let hasAllTerms = true;
      for (const term of searchTerms) {
        if (nameLower.includes(term.toLowerCase())) {
          matchedTerms++;
        } else {
          hasAllTerms = false;
        }
      }
      
      // High bonus for having all terms
      if (hasAllTerms) {
        score += 50;
      }
      
      // Score individual term matches
      for (const term of searchTerms) {
        if (nameLower.includes(term.toLowerCase())) {
          // Exact match gets higher score
          if (nameLower === term.toLowerCase()) {
            score += 10;
          } else if (nameLower.startsWith(term.toLowerCase())) {
            score += 7;
          } else {
            score += 5;
          }
        }
      }
      
      // Bonus for matching multiple terms
      score += matchedTerms * 3;
      
      // Shorter names are generally more relevant
      score -= entry.name.length * 0.1;
      
      return {
        ...entry,
        url: entry.path,
        docsetId: this.docsetInfo.id,
        docsetName: this.docsetInfo.name,
        relevanceScore: score,
        matchedTerms,
        isExactPhrase: false
      };
    });
    
    // Combine and deduplicate results
    const allResults = [...exactScored];
    const seen = new Set(exactScored.map(r => r.name + r.type));
    
    for (const result of termScored) {
      const key = result.name + result.type;
      if (!seen.has(key)) {
        seen.add(key);
        allResults.push(result);
      }
    }
    
    // Sort by score and return top results
    return allResults
      .filter(r => r.matchedTerms > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
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
    this.parallelSearchManager = new ParallelSearchManager();
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

  searchWithTerms(searchTerms, options = {}) {
    const { type, docsetId, limit = 50 } = options;

    // If specific docset is requested
    if (docsetId) {
      const db = this.databases.get(docsetId);
      if (db) {
        return db.searchWithTerms(searchTerms, type, limit);
      }
      return [];
    }

    // Use parallel search for multiple docsets when there are many
    if (this.databases.size > 3) {
      return this.parallelSearchManager.searchDocsetsParallel(
        this.databases,
        searchTerms,
        { type, limit }
      );
    }

    // For small number of docsets, use sequential search
    const results = [];
    const limitPerDocset = Math.ceil(limit / Math.max(1, this.databases.size));
    
    for (const db of this.databases.values()) {
      const docsetResults = db.searchWithTerms(searchTerms, type, limitPerDocset);
      results.push(...docsetResults);
    }

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

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

  /**
   * Explore related API documentation for a given entry
   * @param {string} entryName - The name of the API entry to explore (e.g., "AlarmKit", "URLSession")
   * @param {Object} options - Options for exploration
   * @returns {Object} Related documentation organized by type
   */
  exploreAPI(entryName, options = {}) {
    const { docsetId, includeTypes = ['Class', 'Struct', 'Method', 'Property', 'Function', 'Protocol', 'Enum', 'Constant'] } = options;
    const results = {
      framework: null,
      classes: [],
      structs: [],
      methods: [],
      properties: [],
      functions: [],
      protocols: [],
      enums: [],
      constants: [],
      samples: [],
      guides: [],
      other: []
    };

    // Helper to categorize results
    const categorizeResult = (entry) => {
      switch (entry.type) {
        case 'Framework':
          results.framework = entry;
          break;
        case 'Class':
          results.classes.push(entry);
          break;
        case 'Struct':
          results.structs.push(entry);
          break;
        case 'Method':
          results.methods.push(entry);
          break;
        case 'Property':
          results.properties.push(entry);
          break;
        case 'Function':
          results.functions.push(entry);
          break;
        case 'Protocol':
          results.protocols.push(entry);
          break;
        case 'Enum':
          results.enums.push(entry);
          break;
        case 'Constant':
          results.constants.push(entry);
          break;
        case 'Sample':
          results.samples.push(entry);
          break;
        case 'Guide':
          results.guides.push(entry);
          break;
        default:
          results.other.push(entry);
      }
    };

    // Search across databases
    const databases = docsetId ? [this.databases.get(docsetId)].filter(Boolean) : Array.from(this.databases.values());
    
    for (const db of databases) {
      // First, try exact match to see if it's a framework
      const exactMatch = db.searchExact(entryName, null);
      if (exactMatch && exactMatch.type === 'Framework') {
        categorizeResult(exactMatch);
      }

      // Search for related entries
      // For frameworks like "AlarmKit", search for entries that start with it
      const searchPattern = entryName.endsWith('Kit') || entryName.endsWith('Core') ? entryName : `${entryName}.`;
      
      const stmt = db.db.prepare(`
        SELECT name, type, path 
        FROM searchIndex 
        WHERE (name LIKE ? OR name LIKE ?) 
        AND type IN (${includeTypes.map(() => '?').join(',')})
        ORDER BY 
          CASE 
            WHEN name = ? THEN 0
            WHEN name LIKE ? THEN 1
            ELSE 2
          END,
          LENGTH(name),
          name
        LIMIT 100
      `);
      
      const relatedEntries = stmt.all(
        `${searchPattern}%`,
        `${entryName}%`,
        ...includeTypes,
        entryName,
        `${entryName}.%`
      );

      // Process results
      for (const entry of relatedEntries) {
        const result = {
          name: entry.name,
          type: entry.type,
          url: entry.path,
          docsetId: db.docsetInfo.id,
          docsetName: db.docsetInfo.name
        };
        categorizeResult(result);
      }
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