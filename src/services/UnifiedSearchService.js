import { DocumentationService } from './DocumentationService.js';
import { MultiDocsetDatabase } from './docset/database.js';

/**
 * UnifiedSearchService provides a single search interface that searches
 * both local project documentation and official API documentation (docsets)
 * with intelligent query parsing and relevance scoring.
 */
export class UnifiedSearchService {
  constructor(documentationService, multiDocsetDatabase) {
    this.documentationService = documentationService;
    this.multiDocsetDatabase = multiDocsetDatabase;
  }

  /**
   * Parse query into individual search terms, removing stop words
   * @param {string} query - The search query
   * @returns {string[]} Array of search terms
   */
  parseQuery(query) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 
      'for', 'of', 'with', 'by', 'how', 'what', 'where', 'when', 'is', 
      'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 
      'might', 'can', 'this', 'that', 'these', 'those'
    ]);
    
    return query.toLowerCase()
      .split(/\s+/)
      .map(term => term.replace(/[^a-z0-9-_.]/g, '')) // Keep alphanumeric, dash, underscore, dot
      .filter(term => term.length > 1 && !stopWords.has(term));
  }

  /**
   * Search both local documentation and docsets with a unified query
   * @param {string} query - The search query
   * @param {Object} options - Search options
   * @param {number} options.limit - Maximum number of results (default: 20)
   * @param {string} options.docsetId - Limit to specific docset
   * @param {string} options.type - Filter docset results by type
   * @returns {Promise<Array>} Combined search results sorted by relevance
   */
  async search(query, options = {}) {
    const { limit = 20, docsetId, type } = options;
    
    if (!query || query.trim() === '') {
      return [];
    }

    // Parse query into search terms
    const searchTerms = this.parseQuery(query);
    if (searchTerms.length === 0) {
      return [];
    }

    // Perform searches in parallel
    const [localResults, docsetResults] = await Promise.all([
      // Search local documentation (unless searching specific docset)
      docsetId ? [] : this.searchLocalDocs(query, searchTerms, Math.ceil(limit / 2)),
      // Search docsets
      this.searchDocsets(searchTerms, { type, docsetId, limit: Math.ceil(limit / 2) })
    ]);

    // Combine and normalize results
    const combinedResults = [
      ...this.normalizeLocalResults(localResults),
      ...this.normalizeDocsetResults(docsetResults)
    ];

    // Apply source-based score boosting
    const boostedResults = combinedResults.map(result => {
      // Boost project documentation scores to prioritize them
      if (result.type === 'local') {
        // Multiply project doc scores by 5 to ensure they rank higher
        // This ensures even moderately relevant project docs appear before API docs
        result.relevanceScore = result.relevanceScore * 5;
      }
      return result;
    });

    // Sort by relevance score
    const sortedResults = boostedResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply quality filtering
    // If we have high-quality results (score > 50), filter out low-quality ones
    const highQualityResults = sortedResults.filter(r => r.relevanceScore >= 50);
    
    if (highQualityResults.length >= 5) {
      // We have enough high-quality results, use only those
      return highQualityResults.slice(0, limit);
    } else if (sortedResults.length > 0) {
      // Include medium quality results, but filter out very low relevance
      const minScore = Math.max(sortedResults[0].relevanceScore * 0.1, 10);
      const qualityResults = sortedResults.filter(r => r.relevanceScore >= minScore);
      return qualityResults.slice(0, limit);
    }
    
    return [];
  }

  /**
   * Search local project documentation
   */
  async searchLocalDocs(query, searchTerms, limit) {
    try {
      // Use existing DocumentationService search which already has good relevance scoring
      const results = await this.documentationService.searchDocuments(query);
      return results.slice(0, limit);
    } catch (error) {
      console.error('Error searching local docs:', error);
      return [];
    }
  }

  /**
   * Search docsets using term-based search
   */
  searchDocsets(searchTerms, options) {
    try {
      // Use the new term-based search method
      return this.multiDocsetDatabase.searchWithTerms(searchTerms, options);
    } catch (error) {
      console.error('Error searching docsets:', error);
      return [];
    }
  }

  /**
   * Normalize local documentation results to unified format
   */
  normalizeLocalResults(results) {
    return results.map(doc => ({
      id: doc.fileName,
      title: doc.metadata?.title || doc.fileName,
      description: doc.metadata?.description || doc.snippet || '',
      type: 'local',
      source: 'project',
      path: doc.fileName,
      url: doc.fileName,
      relevanceScore: doc.relevanceScore || 0,
      metadata: doc.metadata,
      content: doc.content,
      snippet: doc.snippet,
      matchedTerms: doc.matchedTerms || []
    }));
  }

  /**
   * Normalize docset results to unified format
   */
  normalizeDocsetResults(results) {
    // First normalize all results
    const normalized = results.map(doc => ({
      id: `${doc.docsetId}:${doc.name}`,
      title: doc.name,
      description: `${doc.type} in ${doc.docsetName}`,
      type: 'docset',
      source: doc.docsetName,
      path: doc.path || doc.url,
      url: doc.url,
      relevanceScore: doc.relevanceScore || 0,
      docsetId: doc.docsetId,
      docsetName: doc.docsetName,
      entryType: doc.type
    }));

    // Deduplicate by name + type, preferring Swift entries
    const dedupMap = new Map();
    
    for (const doc of normalized) {
      const key = `${doc.title}:${doc.entryType}`;
      const existing = dedupMap.get(key);
      
      if (!existing) {
        dedupMap.set(key, doc);
      } else {
        // Prefer Swift entries (they have 'language=swift' in the URL)
        const isSwift = doc.url && doc.url.includes('language=swift');
        const existingIsSwift = existing.url && existing.url.includes('language=swift');
        
        if (isSwift && !existingIsSwift) {
          dedupMap.set(key, doc);
        } else if (!isSwift && !existingIsSwift && doc.relevanceScore > existing.relevanceScore) {
          // If neither is Swift, keep the one with higher score
          dedupMap.set(key, doc);
        }
      }
    }
    
    return Array.from(dedupMap.values());
  }

  /**
   * Get a summary of available documentation sources
   */
  async getSources() {
    const localDocs = this.documentationService.documents.size;
    const docsets = this.multiDocsetDatabase.databases.size;
    const docsetStats = this.multiDocsetDatabase.getStats();
    
    return {
      local: {
        documentCount: localDocs,
        indexed: localDocs > 0
      },
      docsets: {
        count: docsets,
        details: docsetStats
      }
    };
  }
}