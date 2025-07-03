const path = require('path');

class InferenceEngine {
  constructor(documentationService, manifestLoader = null) {
    this.docService = documentationService;
    this.manifestLoader = manifestLoader;
  }
  
  async initialize() {
    // Initialize any required data
  }
  
  async getRelevantDocumentation(context) {
    try {
      const globalRules = await this.docService.getGlobalRules();
      const contextualDocs = await this.getContextualDocs(context);
      const inferredDocs = await this.getInferredDocs(context);
      
      const confidence = this.calculateConfidence(context, contextualDocs, inferredDocs);
      
      return {
        globalRules: globalRules || [],
        contextualDocs,
        inferredDocs,
        confidence
      };
    } catch (error) {
      console.error('Error getting relevant documentation:', error);
      return {
        globalRules: [],
        contextualDocs: [],
        inferredDocs: [],
        confidence: 0
      };
    }
  }
  
  async getContextualDocs(context) {
    const docs = [];
    
    // Get docs based on file path
    if (context.filePath) {
      const pathDocs = await this.docService.getContextualDocs(context.filePath);
      docs.push(...pathDocs);
    }
    
    return this.removeDuplicates(docs);
  }
  
  async getInferredDocs(context) {
    const docs = [];
    
    // Keyword-based inference
    if (context.query) {
      const keywordDocs = await this.getDocsByKeywords(context.query);
      docs.push(...keywordDocs);
    }
    
    // Pattern-based inference
    if (context.codeSnippet) {
      const patternDocs = await this.getDocsByPatterns(context.codeSnippet);
      docs.push(...patternDocs);
    }
    
    // File extension inference
    if (context.filePath) {
      const extensionDocs = await this.getDocsByFileExtension(context.filePath);
      docs.push(...extensionDocs);
    }
    
    return this.removeDuplicates(docs);
  }
  
  async getDocsByKeywords(query) {
    if (!this.manifestLoader) {
      return [];
    }
    
    const manifest = await this.manifestLoader.load();
    const keywords = manifest.inference?.keywords || {};
    
    const docs = [];
    const queryLower = query.toLowerCase();
    
    for (const [keyword, docPaths] of Object.entries(keywords)) {
      if (queryLower.includes(keyword.toLowerCase())) {
        for (const docPath of docPaths) {
          const doc = this.docService.getDocument(docPath);
          if (doc) {
            docs.push(doc);
          }
        }
      }
    }
    
    return docs;
  }
  
  async getDocsByPatterns(codeSnippet) {
    if (!this.manifestLoader) {
      return [];
    }
    
    const manifest = await this.manifestLoader.load();
    const patterns = manifest.inference?.patterns || {};
    
    const docs = [];
    
    for (const [pattern, docPaths] of Object.entries(patterns)) {
      if (codeSnippet.includes(pattern)) {
        for (const docPath of docPaths) {
          const doc = this.docService.getDocument(docPath);
          if (doc) {
            docs.push(doc);
          }
        }
      }
    }
    
    return docs;
  }
  
  async getDocsByFileExtension(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const docs = [];
    
    // Common patterns for different file types
    const extensionMappings = {
      '.js': ['javascript', 'js', 'node'],
      '.ts': ['typescript', 'ts', 'javascript'],
      '.jsx': ['react', 'jsx', 'javascript'],
      '.tsx': ['react', 'tsx', 'typescript'],
      '.vue': ['vue', 'javascript'],
      '.py': ['python', 'py'],
      '.java': ['java'],
      '.cpp': ['cpp', 'c++'],
      '.c': ['c', 'cpp'],
      '.cs': ['csharp', 'c#'],
      '.rb': ['ruby'],
      '.go': ['golang', 'go'],
      '.rs': ['rust'],
      '.php': ['php'],
      '.swift': ['swift', 'ios', 'macos'],
      '.kt': ['kotlin'],
      '.scala': ['scala'],
      '.md': ['markdown', 'documentation'],
      '.css': ['css', 'styling'],
      '.scss': ['sass', 'scss', 'css'],
      '.html': ['html', 'web'],
      '.json': ['json', 'config'],
      '.yaml': ['yaml', 'config'],
      '.yml': ['yaml', 'config'],
      '.xml': ['xml'],
      '.sql': ['sql', 'database'],
      '.sh': ['bash', 'shell', 'script'],
      '.dockerfile': ['docker', 'container'],
      '.tf': ['terraform', 'infrastructure']
    };
    
    const keywords = extensionMappings[ext] || [];
    
    for (const keyword of keywords) {
      const keywordDocs = await this.docService.searchDocuments(keyword);
      docs.push(...keywordDocs);
    }
    
    return docs;
  }
  
  calculateConfidence(context, contextualDocs, inferredDocs) {
    let confidence = 0;
    
    // Base confidence from context richness
    if (context.query) confidence += 0.3;
    if (context.filePath) confidence += 0.3;
    if (context.codeSnippet) confidence += 0.2;
    
    // Boost confidence based on number of matches
    if (contextualDocs.length > 0) {
      confidence += Math.min(contextualDocs.length * 0.1, 0.3);
    }
    
    if (inferredDocs.length > 0) {
      confidence += Math.min(inferredDocs.length * 0.05, 0.2);
    }
    
    // Reduce confidence if no matches found
    if (contextualDocs.length === 0 && inferredDocs.length === 0) {
      confidence *= 0.5;
    }
    
    return Math.min(confidence, 1.0);
  }
  
  removeDuplicates(docs) {
    const seen = new Set();
    return docs.filter(doc => {
      if (seen.has(doc.fileName)) {
        return false;
      }
      seen.add(doc.fileName);
      return true;
    });
  }
}

module.exports = { InferenceEngine };