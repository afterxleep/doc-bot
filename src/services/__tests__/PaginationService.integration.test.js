import { PaginationService } from '../PaginationService.js';
import { DocumentationService } from '../DocumentationService.js';
import os from 'os';
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
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'doc-bot-pagination-'));
    
    // Create the large test document
    // Need 80K+ characters to exceed 20K token limit (80K/4 = 20K tokens)
    const largeContent = 'a'.repeat(85000); // 85K characters = ~21K tokens
    const largeDoc = `---
title: Large Test Document
---

${largeContent}`;
    
    await fs.writeFile(path.join(tempDir, 'large-doc.md'), largeDoc);
    
    // Create a small test document
    const smallDoc = `---
title: Small Test Document
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

  describe('Documentation Pagination', () => {
    it('should paginate large documents that exceed token limits', async () => {
      const documents = await docService.getAllDocuments();
      
      expect(documents).toHaveLength(2);
      
      const formatter = (docs) => {
        let output = '# Documentation\n\n';
        
        docs.forEach((doc, index) => {
          output += `## ${index + 1}. ${doc.metadata?.title || doc.fileName}\n`;
          output += `${doc.content}\n\n`;
        });
        
        return output;
      };
      
      const page1Result = paginationService.smartPaginate(documents, formatter, 1);
      
      expect(page1Result.pagination.hasMore).toBe(true);
      expect(page1Result.pagination.totalItems).toBe(2);
      
      const estimatedTokens = paginationService.estimateTokens(page1Result.content);
      expect(estimatedTokens).toBeLessThanOrEqual(20000);
      
      expect(page1Result.content).toContain('Documentation');
      expect(page1Result.pagination.itemsInPage).toBeGreaterThanOrEqual(1);
      
      if (page1Result.pagination.hasMore) {
        const page2Result = paginationService.smartPaginate(documents, formatter, 2);
        expect(page2Result.pagination.page).toBe(2);
        expect(page2Result.pagination.prevPage).toBe(1);
        
        const page2Tokens = paginationService.estimateTokens(page2Result.content);
        if (page2Result.pagination.itemsInPage === 1) {
          expect(page2Tokens).toBeGreaterThan(0);
        } else {
          expect(page2Tokens).toBeLessThanOrEqual(20000);
        }
      }
    });
    
    it('should properly indicate pagination in the response', () => {
      const documents = [
        { 
          metadata: { title: 'Large Rule' }, 
          content: 'x'.repeat(100000), // 25000 tokens - exceeds single page
          fileName: 'large.md'
        }
      ];
      
      const formatter = (rules) => {
        return rules.map(r => r.content).join('\n');
      };
      
      const result = paginationService.smartPaginate(documents, formatter, 1);
      
      // Should include the large item even though it exceeds limit
      expect(result.pagination.itemsInPage).toBe(1);
      expect(result.pagination.totalItems).toBe(1);
      
      // The pagination info should be formatted correctly
      const paginationInfo = paginationService.formatPaginationInfo(result.pagination);
      expect(paginationInfo).toContain('Page 1');
      expect(paginationInfo).toContain('Showing 1 of 1');
    });
    
    it('should handle mixed content sizes correctly', () => {
      const mixedDocs = [
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
      const page1 = paginationService.smartPaginate(mixedDocs, formatter, 1);
      expect(page1.pagination.hasMore).toBe(true);
      expect(page1.pagination.itemsInPage).toBeGreaterThanOrEqual(1);
      
      // Content should be within limits
      const tokens1 = paginationService.estimateTokens(page1.content);
      expect(tokens1).toBeLessThanOrEqual(20000);
      
      // Should be able to get remaining content
      if (page1.pagination.hasMore) {
        const page2 = paginationService.smartPaginate(mixedDocs, formatter, 2);
        const tokens2 = paginationService.estimateTokens(page2.content);
        expect(tokens2).toBeLessThanOrEqual(22000); // Allow buffer for realistic tokenization
      }
    });
  });
});
