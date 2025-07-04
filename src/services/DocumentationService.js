const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const yaml = require('yaml');

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
        console.warn(`Documentation path does not exist: ${this.docsPath}`);
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
        console.warn('Failed to parse frontmatter:', error);
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
    
    const searchTerm = query.toLowerCase();
    const results = [];
    
    for (const doc of this.documents.values()) {
      const score = this.calculateRelevanceScore(doc, searchTerm);
      if (score > 0) {
        results.push({
          ...doc,
          relevanceScore: score
        });
      }
    }
    
    // Sort by relevance score
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
  
  calculateRelevanceScore(doc, searchTerm) {
    let score = 0;
    const content = doc.content.toLowerCase();
    const title = (doc.metadata?.title || doc.fileName).toLowerCase();
    
    // Title matches get highest score
    if (title.includes(searchTerm)) {
      score += 10;
    }
    
    // Content matches
    const contentMatches = (content.match(new RegExp(searchTerm, 'g')) || []).length;
    score += contentMatches * 2;
    
    // Keyword matches in metadata
    if (doc.metadata?.keywords) {
      const keywords = Array.isArray(doc.metadata.keywords) 
        ? doc.metadata.keywords 
        : [doc.metadata.keywords];
      
      for (const keyword of keywords) {
        if (keyword.toLowerCase().includes(searchTerm)) {
          score += 5;
        }
      }
    }
    
    // Category matches
    if (doc.metadata?.category?.toLowerCase().includes(searchTerm)) {
      score += 3;
    }
    
    return score;
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
  
}

module.exports = { DocumentationService };