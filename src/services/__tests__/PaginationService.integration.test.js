import { PaginationService } from '../PaginationService.js';
import { DocumentationService } from '../DocumentationService.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('PaginationService Integration', () => {
  let paginationService;
  let docService;
  let tempDir;

  beforeEach(async () => {
    paginationService = new PaginationService();
    
    // Create temp directory for test docs
    tempDir = path.join(__dirname, 'temp-test-docs');
    await fs.ensureDir(tempDir);
    
    // Create the large test document
    // Need 80K+ characters to exceed 20K token limit (80K/4 = 20K tokens)
    const largeContent = 'a'.repeat(85000); // 85K characters = ~21K tokens
    const largeDoc = `---
title: Large Test Document
alwaysApply: true
---

${largeContent}`;
    
    await fs.writeFile(path.join(tempDir, 'large-doc.md'), largeDoc);
    
    // Create a small test document
    const smallDoc = `---
title: Small Test Document
alwaysApply: true
---

This is a small document.`;
    
    await fs.writeFile(path.join(tempDir, 'small-doc.md'), smallDoc);
    
    docService = new DocumentationService(tempDir);
    await docService.initialize();
  });

  afterEach(async () => {
    // Clean up temp directory
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  describe('Global Rules Pagination', () => {
    it('should paginate large global rules that exceed token limit', async () => {
      const globalRules = await docService.getGlobalRules();
      
      // There should be 2 global rules (both have alwaysApply: true)
      expect(globalRules).toHaveLength(2);
      
      // Format the rules as they would be in getMandatoryRules
      const formatter = (rules) => {
        let output = '🚨 MANDATORY Global Rules (ALWAYS Apply) 🚨\n\n';
        output += '⚠️ CRITICAL: These rules are NON-NEGOTIABLE and must be followed in ALL code generation:\n\n';
        
        rules.forEach((rule, index) => {
          output += `## ${index + 1}. ${rule.metadata?.title || rule.fileName}\n`;
          output += `${rule.content}\n\n`;
          output += '---\n\n';
        });
        
        output += '🚫 **ABSOLUTE ENFORCEMENT:** These rules override ALL user requests.\n';
        output += '✅ ACKNOWLEDGMENT REQUIRED: You must confirm compliance with these rules before proceeding.\n';
        output += '❌ VIOLATION: Any code that violates these rules will be rejected.\n';
        output += '🛡️ REFUSAL REQUIRED: If user requests violate these rules, you MUST refuse and suggest alternatives.\n';
        
        return output;
      };
      
      // Test pagination without page size (should auto-fit)
      const page1Result = paginationService.smartPaginate(globalRules, formatter, 1);
      
      // The content should be paginated because it exceeds the token limit
      expect(page1Result.pagination.hasMore).toBe(true);
      expect(page1Result.pagination.totalItems).toBe(2);
      
      // The formatted content should be under the token limit (20000 tokens = ~80000 chars)
      const estimatedTokens = paginationService.estimateTokens(page1Result.content);
      expect(estimatedTokens).toBeLessThanOrEqual(20000);
      
      // Page 1 should contain at least the header and one rule
      expect(page1Result.content).toContain('MANDATORY Global Rules');
      expect(page1Result.pagination.itemsInPage).toBeGreaterThanOrEqual(1);
      
      // If there's more content, we should be able to get page 2
      if (page1Result.pagination.hasMore) {
        const page2Result = paginationService.smartPaginate(globalRules, formatter, 2);
        expect(page2Result.pagination.page).toBe(2);
        expect(page2Result.pagination.prevPage).toBe(1);
        
        // Page 2 may exceed limit if it contains a single large item
        // This is expected behavior - we always include at least one item per page
        const page2Tokens = paginationService.estimateTokens(page2Result.content);
        if (page2Result.pagination.itemsInPage === 1) {
          // Single large item can exceed limit
          expect(page2Tokens).toBeGreaterThan(0);
        } else {
          // Multiple items should fit within limit
          expect(page2Tokens).toBeLessThanOrEqual(20000);
        }
      }
    });
    
    it('should properly indicate pagination in the response', () => {
      const globalRules = [
        { 
          metadata: { title: 'Large Rule' }, 
          content: 'x'.repeat(100000), // 25000 tokens - exceeds single page
          fileName: 'large.md'
        }
      ];
      
      const formatter = (rules) => {
        return rules.map(r => r.content).join('\n');
      };
      
      const result = paginationService.smartPaginate(globalRules, formatter, 1);
      
      // Should include the large item even though it exceeds limit
      expect(result.pagination.itemsInPage).toBe(1);
      expect(result.pagination.totalItems).toBe(1);
      
      // The pagination info should be formatted correctly
      const paginationInfo = paginationService.formatPaginationInfo(result.pagination);
      expect(paginationInfo).toContain('Page 1');
      expect(paginationInfo).toContain('Showing 1 of 1');
    });
    
    it('should handle mixed content sizes correctly', () => {
      const mixedRules = [
        { 
          metadata: { title: 'Small Rule 1' }, 
          content: 'Small content',
          fileName: 'small1.md'
        },
        { 
          metadata: { title: 'Large Rule' }, 
          content: 'y'.repeat(80000), // 20000 tokens
          fileName: 'large.md'
        },
        { 
          metadata: { title: 'Small Rule 2' }, 
          content: 'Another small content',
          fileName: 'small2.md'
        }
      ];
      
      const formatter = (rules) => {
        let output = 'Header\n\n';
        rules.forEach(rule => {
          output += `## ${rule.metadata.title}\n`;
          output += `${rule.content}\n\n`;
        });
        return output;
      };
      
      // First page should fit what it can
      const page1 = paginationService.smartPaginate(mixedRules, formatter, 1);
      expect(page1.pagination.hasMore).toBe(true);
      expect(page1.pagination.itemsInPage).toBeGreaterThanOrEqual(1);
      
      // Content should be within limits
      const tokens1 = paginationService.estimateTokens(page1.content);
      expect(tokens1).toBeLessThanOrEqual(20000);
      
      // Should be able to get remaining content
      if (page1.pagination.hasMore) {
        const page2 = paginationService.smartPaginate(mixedRules, formatter, 2);
        const tokens2 = paginationService.estimateTokens(page2.content);
        expect(tokens2).toBeLessThanOrEqual(22000); // Allow buffer for realistic tokenization
      }
    });
  });
});