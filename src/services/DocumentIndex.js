class DocumentIndex {
  constructor() {
    this.keywordIndex = new Map();
    this.topicIndex = new Map();
    this.patternIndex = new Map();
    this.extensionIndex = new Map();
  }

  async buildIndexes(documents) {
    for (const document of documents) {
      await this.indexDocument(document);
    }
  }

  async indexDocument(document) {
    if (!document) {
      return;
    }

    // Index keywords from metadata (if present)
    if (document.metadata?.keywords) {
      const keywords = Array.isArray(document.metadata.keywords) 
        ? document.metadata.keywords 
        : [document.metadata.keywords];
      
      for (const keyword of keywords) {
        this.addToIndex(this.keywordIndex, keyword.toLowerCase(), document, 10);
      }
    }

    // Index topics from category (if present)

    if (document.metadata?.category) {
      this.addToIndex(this.topicIndex, document.metadata.category.toLowerCase(), document, 5);
    }

    // Index content keywords
    if (document.content) {
      await this.indexContentKeywords(document);
    }
  }

  async indexContentKeywords(document) {
    const content = document.content;

    // Extract keywords from code blocks
    this.extractCodeBlockKeywords(content, document);

    // Extract keywords from headings
    this.extractHeadingKeywords(content, document);

    // Extract file extensions
    this.extractFileExtensions(content, document);

    // Extract framework and library names
    this.extractFrameworkNames(content, document);

    // Extract code patterns
    this.extractCodePatterns(content, document);
  }

  extractCodeBlockKeywords(content, document) {
    // Match code blocks with language specifiers
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const codeContent = match[2];
      
      // Extract common library/framework names from code
      const patterns = [
        /require\(['"]([^'"]+)['"]\)/g,
        /import\s+(\w+)/g,
        /from\s+['"]([^'"]+)['"]/g,
        /\b(express|mongoose|bodyParser|flask|sqlalchemy|react|vue|angular|django|fastapi|axios|lodash|moment|uuid)\b/gi
      ];

      for (const pattern of patterns) {
        let patternMatch;
        while ((patternMatch = pattern.exec(codeContent)) !== null) {
          const keyword = patternMatch[1]?.toLowerCase() || patternMatch[0]?.toLowerCase();
          if (keyword && !this.isCommonWord(keyword)) {
            this.addToIndex(this.keywordIndex, keyword, document, 3); // Lower score for content keywords
          }
        }
      }
    }
  }

  extractHeadingKeywords(content, document) {
    // Extract from markdown headings
    const headingRegex = /^#{1,6}\s+(.+)$/gm;
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const heading = match[1];
      const words = heading.split(/\s+/);
      
      for (const word of words) {
        const cleanWord = word.toLowerCase().replace(/[^\w\-\/]/g, '');
        if (cleanWord && !this.isCommonWord(cleanWord)) {
          this.addToIndex(this.keywordIndex, cleanWord, document, 2); // Lower score for content keywords
        }
      }
    }
  }

  extractFileExtensions(content, document) {
    // Extract file extensions mentioned in content
    const extensionRegex = /\*\.(\w+)\b/g;
    let match;

    while ((match = extensionRegex.exec(content)) !== null) {
      const extension = match[1].toLowerCase();
      this.addToIndex(this.extensionIndex, extension, document);
    }
  }

  extractFrameworkNames(content, document) {
    // Common framework and technology names
    const techPatterns = [
      /\b(react|vue|angular|svelte|next\.js|nuxt\.js|gatsby)\b/gi,
      /\b(node\.js|express|fastify|koa|nest\.js)\b/gi,
      /\b(postgresql|mysql|mongodb|redis|elasticsearch)\b/gi,
      /\b(docker|kubernetes|terraform|ansible)\b/gi,
      /\b(aws|azure|gcp|heroku|vercel|netlify)\b/gi,
      /\b(typescript|javascript|python|java|golang|rust)\b/gi
    ];

    for (const pattern of techPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const keyword = match[0].toLowerCase();
        if (!this.isCommonWord(keyword)) {
          this.addToIndex(this.keywordIndex, keyword, document, 2); // Lower score for content keywords
        }
      }
    }
  }

  extractCodePatterns(content, document) {
    // Match code blocks with language specifiers
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1]?.toLowerCase();
      const codeContent = match[2];

      // Define patterns for different languages
      const patterns = this.getCodePatterns(language);

      for (const pattern of patterns) {
        let patternMatch;
        while ((patternMatch = pattern.regex.exec(codeContent)) !== null) {
          const patternKey = pattern.key || patternMatch[0];
          this.addToIndex(this.patternIndex, patternKey, document, 6); // Medium-high score for patterns
        }
      }
    }
  }

  getCodePatterns(language) {
    const patterns = [];

    // JavaScript/TypeScript patterns
    if (!language || language === 'javascript' || language === 'js' || language === 'typescript' || language === 'ts') {
      patterns.push(
        { regex: /\buseState\b/g, key: 'useState' },
        { regex: /\buseEffect\b/g, key: 'useEffect' },
        { regex: /\buseCallback\b/g, key: 'useCallback' },
        { regex: /\buseMemo\b/g, key: 'useMemo' },
        { regex: /\buseContext\b/g, key: 'useContext' },
        { regex: /\buseReducer\b/g, key: 'useReducer' },
        { regex: /app\.get\(/g, key: 'app.get' },
        { regex: /app\.post\(/g, key: 'app.post' },
        { regex: /app\.put\(/g, key: 'app.put' },
        { regex: /app\.delete\(/g, key: 'app.delete' },
        { regex: /describe\(/g, key: 'describe(' },
        { regex: /it\(/g, key: 'it(' },
        { regex: /test\(/g, key: 'test(' },
        { regex: /expect\(/g, key: 'expect(' },
        { regex: /async\s+function/g, key: 'async function' },
        { regex: /\.then\(/g, key: '.then(' },
        { regex: /\.catch\(/g, key: '.catch(' },
        { regex: /await\s+/g, key: 'await' }
      );
    }

    // Python patterns
    if (language === 'python' || language === 'py') {
      patterns.push(
        { regex: /\bdef\s+/g, key: 'def ' },
        { regex: /\bclass\s+/g, key: 'class ' },
        { regex: /\b__init__\b/g, key: '__init__' },
        { regex: /\bif\s+__name__\s*==\s*['"]__main__['"]/g, key: 'if __name__' },
        { regex: /\bimport\s+/g, key: 'import ' },
        { regex: /\bfrom\s+\w+\s+import/g, key: 'from import' },
        { regex: /\btry:/g, key: 'try:' },
        { regex: /\bexcept\s+/g, key: 'except ' },
        { regex: /\bwith\s+/g, key: 'with ' },
        { regex: /@\w+/g, key: 'decorator' }
      );
    }

    // SQL patterns
    if (language === 'sql') {
      patterns.push(
        { regex: /\bSELECT\b/gi, key: 'SELECT' },
        { regex: /\bINSERT\s+INTO\b/gi, key: 'INSERT INTO' },
        { regex: /\bUPDATE\b/gi, key: 'UPDATE' },
        { regex: /\bDELETE\s+FROM\b/gi, key: 'DELETE FROM' },
        { regex: /\bCREATE\s+TABLE\b/gi, key: 'CREATE TABLE' },
        { regex: /\bALTER\s+TABLE\b/gi, key: 'ALTER TABLE' },
        { regex: /\bDROP\s+TABLE\b/gi, key: 'DROP TABLE' },
        { regex: /\bJOIN\b/gi, key: 'JOIN' },
        { regex: /\bLEFT\s+JOIN\b/gi, key: 'LEFT JOIN' },
        { regex: /\bINNER\s+JOIN\b/gi, key: 'INNER JOIN' }
      );
    }

    // Java patterns
    if (language === 'java') {
      patterns.push(
        { regex: /\bpublic\s+class\b/g, key: 'public class' },
        { regex: /\bprivate\s+\w+/g, key: 'private' },
        { regex: /\bpublic\s+static\s+void\s+main/g, key: 'main method' },
        { regex: /@Override/g, key: '@Override' },
        { regex: /\bnew\s+\w+\(/g, key: 'new' }
      );
    }

    // Docker patterns
    if (language === 'dockerfile' || language === 'docker') {
      patterns.push(
        { regex: /\bFROM\b/gi, key: 'FROM' },
        { regex: /\bRUN\b/gi, key: 'RUN' },
        { regex: /\bCOPY\b/gi, key: 'COPY' },
        { regex: /\bADD\b/gi, key: 'ADD' },
        { regex: /\bEXPOSE\b/gi, key: 'EXPOSE' },
        { regex: /\bCMD\b/gi, key: 'CMD' },
        { regex: /\bENTRYPOINT\b/gi, key: 'ENTRYPOINT' }
      );
    }

    return patterns;
  }

  isCommonWord(word) {
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
      'about', 'above', 'across', 'after', 'against', 'along', 'among', 'around', 'before',
      'behind', 'below', 'beneath', 'beside', 'between', 'beyond', 'during', 'except',
      'from', 'inside', 'into', 'near', 'outside', 'over', 'since', 'through', 'under',
      'until', 'up', 'upon', 'within', 'without', 'how', 'what', 'when', 'where', 'why',
      'who', 'which', 'whose', 'whom', 'very', 'so', 'too', 'quite', 'rather', 'such',
      'guide', 'documentation', 'helps', 'developers', 'system', 'useful', 'explains',
      'use', 'using', 'used', 'get', 'getting', 'set', 'setting', 'make', 'making',
      'create', 'creating', 'build', 'building', 'run', 'running', 'start', 'starting'
    ]);

    return commonWords.has(word.toLowerCase()) || word.length < 2;
  }

  addToIndex(index, key, document, score = 1) {
    if (!index.has(key)) {
      index.set(key, []);
    }
    index.get(key).push({ document, score });
  }

  findRelevantDocs(context) {
    if (!context || Object.keys(context).length === 0) {
      return [];
    }

    const candidates = new Map();

    // Search by query keywords
    if (context.query) {
      this.searchKeywords(context.query, candidates);
    }

    // Search by code snippet patterns
    if (context.codeSnippet) {
      this.searchCodePatterns(context.codeSnippet, candidates);
    }

    // Search by file extension
    if (context.filePath) {
      this.searchFileExtension(context.filePath, candidates);
    }

    return this.scoreAndRank(candidates);
  }

  searchKeywords(query, candidates) {
    const queryLower = query.toLowerCase();
    const words = queryLower.split(/\s+/);

    for (const word of words) {
      // Search in keyword index
      if (this.keywordIndex.has(word)) {
        const entries = this.keywordIndex.get(word);
        for (const entry of entries) {
          this.addCandidate(candidates, entry.document, entry.score);
        }
      }

      // Search in topic index
      if (this.topicIndex.has(word)) {
        const entries = this.topicIndex.get(word);
        for (const entry of entries) {
          this.addCandidate(candidates, entry.document, entry.score);
        }
      }
    }
  }

  searchCodePatterns(codeSnippet, candidates) {
    if (this.patternIndex.size > 0) {
      // Search for patterns in the code snippet
      for (const [pattern, entries] of this.patternIndex) {
        // Check if the pattern exists in the code snippet
        let found = false;
        
        // For SQL patterns, do case-insensitive matching
        if (pattern.toUpperCase() === pattern) {
          found = codeSnippet.toUpperCase().includes(pattern);
        } else {
          found = codeSnippet.includes(pattern);
        }
        
        if (found) {
          for (const entry of entries) {
            this.addCandidate(candidates, entry.document, 8); // High score for pattern match
          }
        }
      }
    }
  }

  searchFileExtension(filePath, candidates) {
    // For now, implement basic extension matching
    // This will be enhanced in later iterations
    if (this.extensionIndex.size > 0) {
      const extension = filePath.split('.').pop()?.toLowerCase();
      if (extension && this.extensionIndex.has(extension)) {
        const entries = this.extensionIndex.get(extension);
        for (const entry of entries) {
          this.addCandidate(candidates, entry.document, 3); // Lower score for extension match
        }
      }
    }
  }

  addCandidate(candidates, document, score) {
    const key = document.fileName || document.filePath;
    if (!candidates.has(key)) {
      candidates.set(key, { document, score: 0 });
    }
    candidates.get(key).score += score;
  }

  scoreAndRank(candidates) {
    const results = Array.from(candidates.values());
    
    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);
    
    return results;
  }
}

export { DocumentIndex };