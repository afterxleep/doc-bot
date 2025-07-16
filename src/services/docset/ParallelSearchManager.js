import { Worker } from 'worker_threads';
import os from 'os';

/**
 * ParallelSearchManager handles searching multiple docsets concurrently
 * using worker threads to improve performance with many docsets
 */
export class ParallelSearchManager {
  constructor(options = {}) {
    this.maxWorkers = options.maxWorkers || Math.min(os.cpus().length, 4);
    this.searchTimeout = options.searchTimeout || 2000; // 2 seconds per search
    this.cache = new Map();
    this.cacheMaxSize = options.cacheMaxSize || 100;
    this.cacheMaxAge = options.cacheMaxAge || 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Search multiple docsets in parallel using Promise.allSettled
   * This ensures one slow docset doesn't block all results
   */
  async searchDocsetsParallel(databases, searchTerms, options = {}) {
    const { type, limit = 50 } = options;
    
    // Check cache first
    const cacheKey = this.getCacheKey(searchTerms, type);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Prepare search promises with timeout
    const searchPromises = [];
    const limitPerDocset = Math.ceil(limit / Math.max(1, databases.size));
    
    for (const db of databases.values()) {
      const searchPromise = this.searchWithTimeout(
        db.searchWithTerms(searchTerms, type, limitPerDocset),
        this.searchTimeout,
        db.docsetInfo.name
      );
      searchPromises.push(searchPromise);
    }

    // Execute all searches in parallel
    const searchResults = await Promise.allSettled(searchPromises);
    
    // Collect successful results
    const allResults = [];
    let successCount = 0;
    let failureCount = 0;

    searchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
        successCount++;
      } else {
        failureCount++;
        console.warn(`Search failed for docset:`, result.reason);
      }
    });

    // Sort by relevance score
    const sortedResults = allResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    // Cache the results
    this.addToCache(cacheKey, sortedResults);

    // Add search metadata
    sortedResults._metadata = {
      totalDocsets: databases.size,
      successfulSearches: successCount,
      failedSearches: failureCount
    };

    return sortedResults;
  }

  /**
   * Wrap search with timeout to prevent slow docsets from blocking
   */
  async searchWithTimeout(searchPromise, timeout, docsetName) {
    return Promise.race([
      searchPromise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Search timeout for ${docsetName}`)), timeout)
      )
    ]);
  }

  /**
   * Generate cache key from search parameters
   */
  getCacheKey(searchTerms, type) {
    const termsKey = searchTerms.sort().join('|');
    return `${termsKey}:${type || 'all'}`;
  }

  /**
   * Get cached results if still valid
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.cacheMaxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.results;
  }

  /**
   * Add results to cache with LRU eviction
   */
  addToCache(key, results) {
    // Implement simple LRU by deleting oldest entries if cache is full
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      results,
      timestamp: Date.now()
    });
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    let totalAge = 0;
    let count = 0;

    for (const [key, value] of this.cache) {
      totalAge += Date.now() - value.timestamp;
      count++;
    }

    return {
      size: this.cache.size,
      maxSize: this.cacheMaxSize,
      averageAge: count > 0 ? totalAge / count : 0,
      maxAge: this.cacheMaxAge
    };
  }
}