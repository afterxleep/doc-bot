import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import yaml from 'yaml';

class DocumentationService {
  constructor(docsPath, manifestLoader = null) {
    this.docsPath = docsPath;
    this.manifestLoader = manifestLoader; // Keep for backward compatibility but not required
    this.documents = new Map();
    this.lastScanned = null;
  }
  
  async initialize() {
    await this.loadDocuments();
  }
  
  async reload() {
    this.documents.clear();
    this.lastScanned = null;
    await this.loadDocuments();
  }
  
  async loadDocuments() {
    try {
      if (!await fs.pathExists(this.docsPath)) {
        // Silently return if path doesn't exist - this is normal for MCP servers
        return;
      }
      
      const pattern = path.join(this.docsPath, '**/*.{md,mdx,mdc}');
      const files = glob.sync(pattern);
      
      for (const filePath of files) {
        await this.loadDocument(filePath);
      }
      
      this.lastScanned = new Date();
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  }
  
  async loadDocument(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const relativePath = path.relative(this.docsPath, filePath);
      
      // Parse frontmatter if present
      const { metadata, content: documentContent } = this.parseFrontmatter(content);
      
      const document = {
        fileName: relativePath,
        filePath: filePath,
        content: documentContent,
        metadata: metadata || {},
        lastModified: (await fs.stat(filePath)).mtime
      };
      
      this.documents.set(relativePath, document);
    } catch (error) {
      console.error(`Error loading document ${filePath}:`, error);
    }
  }
  
  parseFrontmatter(content) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (match) {
      try {
        const metadata = yaml.parse(match[1]);
        return {
          metadata,
          content: match[2]
        };
      } catch (error) {
        // Silently skip files with invalid frontmatter
      }
    }
    
    return {
      metadata: {},
      content: content
    };
  }
  
  async getAllDocuments() {
    return Array.from(this.documents.values());
  }
  
  async searchDocuments(query) {
    if (!query || query.trim() === '') {
      return [];
    }
    
    const searchTerms = this.parseQuery(query);
    const results = [];
    
    for (const doc of this.documents.values()) {
      const score = this.calculateAdvancedRelevanceScore(doc, searchTerms, query);
      // Only include documents with meaningful relevance (5% or higher)
      // This filters out documents that only have weak partial matches
      if (score >= 5.0) {
        // Extract a relevant snippet from the content
        const snippet = this.extractRelevantSnippet(doc.content, searchTerms, query);
        
        results.push({
          ...doc,
          relevanceScore: score,
          snippet: snippet,
          matchedTerms: this.getMatchedTerms(doc, searchTerms)
        });
      }
    }
    
    // Sort by relevance score
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
  
  parseQuery(query) {
    // Split by spaces and remove common stop words
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'what', 'where', 'when']);
    return query.toLowerCase()
      .split(/\s+/)
      .map(term => term.replace(/[^a-z0-9]/g, '')) // Remove punctuation
      .filter(term => term.length > 1 && !stopWords.has(term));
  }
  
  calculateAdvancedRelevanceScore(doc, searchTerms, originalQuery) {
    let totalScore = 0;
    const content = doc.content.toLowerCase();
    const title = (doc.metadata?.title || doc.fileName).toLowerCase();
    const description = (doc.metadata?.description || '').toLowerCase();
    
    // Exact phrase match bonus (highest priority)
    if (content.includes(originalQuery.toLowerCase()) || title.includes(originalQuery.toLowerCase())) {
      totalScore += 20;
    }
    
    let matchedTerms = 0;
    const termScores = [];
    
    for (const term of searchTerms) {
      let termScore = 0;
      
      // Title matches (highest weight)
      if (title.includes(term)) {
        termScore += 15;
        matchedTerms++;
      }
      
      // Description matches (high weight)
      if (description.includes(term)) {
        termScore += 10;
        matchedTerms++;
      }
      
      // Keyword exact matches (very high weight)
      if (doc.metadata?.keywords) {
        const keywords = Array.isArray(doc.metadata.keywords) 
          ? doc.metadata.keywords 
          : [doc.metadata.keywords];
        
        for (const keyword of keywords) {
          const keywordLower = keyword.toLowerCase();
          if (keywordLower === term) {
            termScore += 12; // Exact keyword match
            matchedTerms++;
          } else if (keywordLower.includes(term) || term.includes(keywordLower)) {
            termScore += 8; // Partial keyword match
            matchedTerms++;
          }
        }
      }
      
      // Content matches with frequency weighting
      const contentMatches = (content.match(new RegExp(this.escapeRegExp(term), 'g')) || []).length;
      if (contentMatches > 0) {
        termScore += Math.min(contentMatches * 2, 10); // Cap at 10 to prevent spam
        matchedTerms++;
      }
      
      // Fuzzy matching for typos (lower weight)
      if (termScore === 0) {
        const fuzzyScore = this.calculateFuzzyMatch(term, [title, description, content.substring(0, 500)].join(' '));
        termScore += fuzzyScore;
        if (fuzzyScore > 0) matchedTerms++;
      }
      
      termScores.push(termScore);
    }
    
    // Calculate final score
    totalScore += termScores.reduce((sum, score) => sum + score, 0);
    
    // Bonus for matching multiple terms
    const termCoverage = matchedTerms / searchTerms.length;
    totalScore *= (0.5 + termCoverage); // 50% base + coverage bonus
    
    // Bonus for shorter documents (more focused)
    const docLength = content.length;
    if (docLength < 2000) {
      totalScore *= 1.1;
    }
    
    // Normalize score (0-100 scale)
    return Math.min(totalScore / 10, 100);
  }
  
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  calculateFuzzyMatch(term, text) {
    // Simple fuzzy matching - check for partial matches
    const words = text.toLowerCase().split(/\s+/);
    let maxScore = 0;
    
    for (const word of words) {
      if (word.includes(term) || term.includes(word)) {
        maxScore = Math.max(maxScore, 2);
      } else if (this.levenshteinDistance(term, word) <= 2 && Math.min(term.length, word.length) > 3) {
        maxScore = Math.max(maxScore, 1);
      }
    }
    
    return maxScore;
  }
  
  levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  calculateRelevanceScore(doc, searchTerm) {
    // Legacy method - keep for backward compatibility
    return this.calculateAdvancedRelevanceScore(doc, [searchTerm], searchTerm);
  }

  /**
   * Extract a relevant snippet from content that shows context around matched terms
   * @param {string} content - The document content
   * @param {string[]} searchTerms - The search terms
   * @param {string} originalQuery - The original query
   * @returns {string} A relevant snippet
   */
  extractRelevantSnippet(content, searchTerms, originalQuery) {
    const contentLower = content.toLowerCase();
    const snippetLength = 200;
    let bestSnippet = '';
    let bestScore = 0;

    // First, try to find exact phrase match
    if (originalQuery.length > 3) {
      const phraseIndex = contentLower.indexOf(originalQuery.toLowerCase());
      if (phraseIndex !== -1) {
        const start = Math.max(0, phraseIndex - 50);
        const end = Math.min(content.length, phraseIndex + originalQuery.length + 150);
        return this.cleanSnippet(content.substring(start, end), start > 0, end < content.length);
      }
    }

    // Find the best snippet containing the most search terms
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();
      
      // Skip empty lines and frontmatter
      if (!line.trim() || line.startsWith('---')) continue;
      
      // Count matching terms in this line and surrounding context
      let score = 0;
      let matchCount = 0;
      
      for (const term of searchTerms) {
        if (lineLower.includes(term.toLowerCase())) {
          matchCount++;
          // Higher score for terms in headers
          if (line.startsWith('#')) {
            score += 10;
          } else {
            score += 5;
          }
        }
      }
      
      if (matchCount > 0) {
        // Get context around this line
        const contextStart = Math.max(0, i - 1);
        const contextEnd = Math.min(lines.length, i + 3);
        const contextLines = lines.slice(contextStart, contextEnd);
        const snippet = contextLines.join(' ').trim();
        
        if (score > bestScore && snippet.length > 20) {
          bestScore = score;
          bestSnippet = snippet;
        }
      }
    }

    // If no good snippet found, return the description or first meaningful paragraph
    if (!bestSnippet) {
      const metadata = this.extractMetadata(content);
      if (metadata.description) {
        return metadata.description;
      }
      
      // Find first non-empty paragraph after frontmatter
      const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\n*/m, '');
      const paragraphs = contentWithoutFrontmatter.split(/\n\n+/);
      for (const para of paragraphs) {
        const cleaned = para.trim();
        if (cleaned && !cleaned.startsWith('#') && cleaned.length > 30) {
          return this.cleanSnippet(cleaned.substring(0, snippetLength), false, cleaned.length > snippetLength);
        }
      }
    }

    return this.cleanSnippet(bestSnippet.substring(0, snippetLength), false, bestSnippet.length > snippetLength);
  }

  /**
   * Clean and format a snippet for display
   */
  cleanSnippet(snippet, hasStart, hasEnd) {
    // Remove multiple spaces and clean up
    let cleaned = snippet.replace(/\s+/g, ' ').trim();
    
    // Remove markdown formatting for readability
    cleaned = cleaned.replace(/\*\*/g, '');
    cleaned = cleaned.replace(/`/g, '');
    
    // Add ellipsis if truncated
    if (hasStart) cleaned = '...' + cleaned;
    if (hasEnd) cleaned = cleaned + '...';
    
    return cleaned;
  }

  /**
   * Get the terms that matched in this document
   */
  getMatchedTerms(doc, searchTerms) {
    const matched = [];
    const contentLower = doc.content.toLowerCase();
    const titleLower = (doc.metadata?.title || doc.fileName).toLowerCase();
    const descriptionLower = (doc.metadata?.description || '').toLowerCase();
    
    for (const term of searchTerms) {
      const termLower = term.toLowerCase();
      if (titleLower.includes(termLower) || 
          descriptionLower.includes(termLower) || 
          contentLower.includes(termLower)) {
        matched.push(term);
      }
    }
    
    return matched;
  }
  
  async getGlobalRules() {
    const globalRules = [];
    
    // Find all documents with alwaysApply: true in frontmatter
    for (const doc of this.documents.values()) {
      if (doc.metadata?.alwaysApply === true) {
        globalRules.push(doc);
      }
    }
    
    return globalRules;
  }
  
  async getContextualDocs(filePath) {
    const matchingDocs = [];
    
    // Find documents with alwaysApply: false and matching patterns
    for (const doc of this.documents.values()) {
      if (doc.metadata?.alwaysApply === false || doc.metadata?.alwaysApply === undefined) {
        // Check if document has file patterns in frontmatter
        const patterns = doc.metadata?.filePatterns || doc.metadata?.applies || [];
        const patternArray = Array.isArray(patterns) ? patterns : [patterns];
        
        for (const pattern of patternArray) {
          if (pattern && this.matchesPattern(filePath, pattern)) {
            matchingDocs.push(doc);
            break; // Don't add the same doc multiple times
          }
        }
      }
    }
    
    return matchingDocs;
  }
  
  matchesPattern(filePath, pattern) {
    // Simple glob-like pattern matching
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\[([^\]]+)\]/g, '($1)');
    
    const regex = new RegExp(regexPattern, 'i');
    return regex.test(filePath);
  }
  
  getDocument(fileName) {
    return this.documents.get(fileName);
  }
  
  getDocumentsByCategory(category) {
    const results = [];
    
    for (const doc of this.documents.values()) {
      if (doc.metadata?.category === category) {
        results.push(doc);
      }
    }
    
    return results;
  }
  
  async getDocumentIndex() {
    const index = [];
    
    for (const doc of this.documents.values()) {
      index.push({
        title: doc.metadata?.title || doc.fileName,
        description: doc.metadata?.description || '',
        fileName: doc.fileName,
        lastUpdated: doc.lastModified.toISOString()
      });
    }
    
    // Sort by title for consistent ordering
    return index.sort((a, b) => a.title.localeCompare(b.title));
  }
  
}

export { DocumentationService };