/**
 * TokenEstimator - Realistic token counting for LLM content
 * 
 * Implements proper tokenization estimation based on modern LLM patterns.
 * Much more accurate than naive character-count approaches.
 */
export class TokenEstimator {
  
  /**
   * Estimate token count using realistic tokenization patterns
   * Based on GPT-style tokenization rules and observed patterns
   * 
   * @param {string} text - Text to analyze
   * @returns {number} Estimated token count
   */
  static estimateTokens(text) {
    if (!text) return 0;
    
    let tokens = 0;
    
    // Split by whitespace and punctuation patterns
    const words = text.split(/(\s+|[^\w\s])/);
    
    for (const word of words) {
      if (!word) continue;
      
      // Whitespace is often merged with adjacent tokens
      if (/^\s+$/.test(word)) {
        continue; // Don't count pure whitespace as tokens
      }
      
      // Single punctuation marks are usually 1 token
      if (/^[^\w\s]$/.test(word)) {
        tokens += 1;
        continue;
      }
      
      // Handle different word types
      if (/^\w+$/.test(word)) {
        // Regular words: estimate based on length and common patterns
        if (word.length <= 3) {
          tokens += 1;  // Short words: 1 token
        } else if (word.length <= 6) {
          tokens += 1;  // Medium words: usually 1 token
        } else if (word.length <= 10) {
          tokens += Math.ceil(word.length / 5); // Longer words: ~5 chars per token
        } else {
          // Very long words (often technical terms): ~4 chars per token
          tokens += Math.ceil(word.length / 4);
        }
      } else {
        // Mixed content (URLs, emails, code, etc.)
        // These are often tokenized more aggressively
        if (word.includes('://') || word.includes('@')) {
          // URLs and emails: roughly 3-4 chars per token
          tokens += Math.ceil(word.length / 3.5);
        } else if (/[A-Z]{2,}/.test(word) || /\d+/.test(word)) {
          // Acronyms and numbers: often 2-3 chars per token
          tokens += Math.ceil(word.length / 2.5);
        } else {
          // Other mixed content: 4 chars per token
          tokens += Math.ceil(word.length / 4);
        }
      }
    }
    
    // Account for special sequences that are tokenized differently
    // Code blocks, markdown, JSON, etc. tend to have more tokens
    const specialPatterns = [
      /```[\s\S]*?```/g,     // Code blocks
      /`[^`]+`/g,            // Inline code  
      /\[[^\]]*\]\([^)]*\)/g, // Markdown links
      /\*\*[^*]+\*\*/g,      // Bold text
      /\*[^*]+\*/g,          // Italic text
      /{[^}]*}/g,            // JSON-like structures
      /\([^)]*\)/g,          // Parenthetical content
    ];
    
    let specialTokens = 0;
    for (const pattern of specialPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          // Special content has higher token density
          specialTokens += Math.ceil(match.length / 3);
        }
      }
    }
    
    // Use the higher of the two estimates (word-based vs special-pattern-based)
    // This accounts for content that's heavily formatted vs plain text
    const wordBasedEstimate = tokens;
    const specialContentRatio = specialTokens / Math.max(1, text.length);
    
    if (specialContentRatio > 0.1) {
      // High special content - use pattern-based estimate with adjustment
      tokens = Math.max(wordBasedEstimate, Math.ceil(text.length / 3.2));
    } else {
      // Regular content - use word-based estimate
      tokens = wordBasedEstimate;
    }
    
    // Add buffer for control tokens, formatting, etc. (5-10% overhead)
    tokens = Math.ceil(tokens * 1.08);
    
    return tokens;
  }
  
  /**
   * Get the average characters per token for specific text
   * Useful for chunking operations
   */
  static getAvgCharsPerToken(text) {
    if (!text) return 4; // Fallback
    const tokens = this.estimateTokens(text);
    return tokens > 0 ? text.length / tokens : 4;
  }
  
  /**
   * Check if text exceeds a token limit
   */
  static exceedsLimit(text, maxTokens) {
    return this.estimateTokens(text) > maxTokens;
  }
  
  /**
   * Estimate how many characters would fit within a token budget
   * for a given text style
   */
  static estimateCharsForTokens(sampleText, targetTokens) {
    const avgCharsPerToken = this.getAvgCharsPerToken(sampleText);
    return Math.floor(targetTokens * avgCharsPerToken);
  }
}