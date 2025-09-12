import { PaginationService } from '../PaginationService.js';

describe('PaginationService', () => {
  let paginationService;

  beforeEach(() => {
    paginationService = new PaginationService();
  });

  describe('estimateTokens', () => {
    it('should estimate tokens from text length', () => {
      expect(paginationService.estimateTokens('test')).toBe(1); // 4 chars = 1 token
      expect(paginationService.estimateTokens('a'.repeat(100))).toBe(25); // 100 chars = 25 tokens
      expect(paginationService.estimateTokens('a'.repeat(1000))).toBe(250); // 1000 chars = 250 tokens
    });

    it('should handle empty or null input', () => {
      expect(paginationService.estimateTokens('')).toBe(0);
      expect(paginationService.estimateTokens(null)).toBe(0);
      expect(paginationService.estimateTokens(undefined)).toBe(0);
    });
  });

  describe('needsPagination', () => {
    it('should return true for content over 24000 tokens', () => {
      const largeContent = 'a'.repeat(100000); // 25000 tokens
      expect(paginationService.needsPagination(largeContent)).toBe(true);
    });

    it('should return false for content under 24000 tokens', () => {
      const smallContent = 'a'.repeat(50000); // 12500 tokens
      expect(paginationService.needsPagination(smallContent)).toBe(false);
    });
  });

  describe('paginateArray', () => {
    const testItems = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

    it('should paginate array with default page size', () => {
      const result = paginationService.paginateArray(testItems, 1);
      
      expect(result.items).toHaveLength(10);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.totalPages).toBe(3);
      expect(result.totalItems).toBe(25);
      expect(result.hasMore).toBe(true);
      expect(result.nextPage).toBe(2);
      expect(result.prevPage).toBe(null);
    });

    it('should paginate array with custom page size', () => {
      const result = paginationService.paginateArray(testItems, 1, 5);
      
      expect(result.items).toHaveLength(5);
      expect(result.pageSize).toBe(5);
      expect(result.totalPages).toBe(5);
      expect(result.items[0].id).toBe(1);
      expect(result.items[4].id).toBe(5);
    });

    it('should handle page 2 correctly', () => {
      const result = paginationService.paginateArray(testItems, 2, 10);
      
      expect(result.items).toHaveLength(10);
      expect(result.page).toBe(2);
      expect(result.items[0].id).toBe(11);
      expect(result.items[9].id).toBe(20);
      expect(result.prevPage).toBe(1);
      expect(result.nextPage).toBe(3);
    });

    it('should handle last page correctly', () => {
      const result = paginationService.paginateArray(testItems, 3, 10);
      
      expect(result.items).toHaveLength(5);
      expect(result.page).toBe(3);
      expect(result.hasMore).toBe(false);
      expect(result.nextPage).toBe(null);
      expect(result.prevPage).toBe(2);
    });

    it('should handle empty array', () => {
      const result = paginationService.paginateArray([], 1, 10);
      
      expect(result.items).toHaveLength(0);
      expect(result.totalPages).toBe(0);
      expect(result.totalItems).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should handle out of bounds page number', () => {
      const result = paginationService.paginateArray(testItems, 10, 10);
      
      expect(result.page).toBe(3); // Should cap at max page
      expect(result.items).toHaveLength(5);
    });

    it('should handle negative page number', () => {
      const result = paginationService.paginateArray(testItems, -1, 10);
      
      expect(result.page).toBe(1); // Should default to page 1
      expect(result.items[0].id).toBe(1);
    });
  });

  describe('smartPaginate', () => {
    const createLargeItems = (count) => {
      return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100) // ~1400 chars each
      }));
    };

    const formatter = (items) => {
      return items.map(item => `Item ${item.id}: ${item.content}`).join('\n\n');
    };

    it('should auto-fit items within token limit when no page size specified', () => {
      const items = createLargeItems(50);
      const result = paginationService.smartPaginate(items, formatter, 1);
      
      expect(result.pagination.totalItems).toBe(50);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.hasMore).toBe(true);
      
      // Content should be under 20000 tokens
      const estimatedTokens = paginationService.estimateTokens(result.content);
      expect(estimatedTokens).toBeLessThanOrEqual(20000);
      expect(estimatedTokens).toBeGreaterThan(0);
    });

    it('should use specified page size when provided', () => {
      const items = createLargeItems(20);
      const result = paginationService.smartPaginate(items, formatter, 1, 5);
      
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(5);
      expect(result.pagination.totalPages).toBe(4);
      expect(result.pagination.totalItems).toBe(20);
    });

    it('should handle page navigation in smart mode', () => {
      const items = createLargeItems(100);
      const page1 = paginationService.smartPaginate(items, formatter, 1);
      const page2 = paginationService.smartPaginate(items, formatter, 2);
      
      expect(page1.pagination.page).toBe(1);
      expect(page1.pagination.nextPage).toBe(2);
      expect(page1.pagination.prevPage).toBe(null);
      
      expect(page2.pagination.page).toBe(2);
      expect(page2.pagination.prevPage).toBe(1);
    });

    it('should handle empty items array', () => {
      const result = paginationService.smartPaginate([], formatter, 1);
      
      expect(result.content).toBe('No items found.');
      expect(result.pagination.totalItems).toBe(0);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('should handle single small item', () => {
      const items = [{ id: 1, content: 'Small content' }];
      const result = paginationService.smartPaginate(items, formatter, 1);
      
      expect(result.pagination.itemsInPage).toBe(1);
      expect(result.pagination.totalItems).toBe(1);
      expect(result.pagination.hasMore).toBe(false);
    });
  });

  describe('formatPaginationInfo', () => {
    it('should format pagination info with total pages', () => {
      const pagination = {
        page: 2,
        totalPages: 5,
        itemsInPage: 10,
        totalItems: 50,
        hasMore: true,
        nextPage: 3,
        prevPage: 1
      };
      
      const formatted = paginationService.formatPaginationInfo(pagination);
      
      expect(formatted).toContain('Page 2 of 5');
      expect(formatted).toContain('Showing 10 of 50 items');
      expect(formatted).toContain('Previous: Add `page: 1`');
      expect(formatted).toContain('Next: Add `page: 3`');
    });

    it('should format pagination info with estimated pages', () => {
      const pagination = {
        page: 1,
        estimatedTotalPages: 3,
        itemsInPage: 15,
        totalItems: 45,
        hasMore: true,
        nextPage: 2,
        prevPage: null
      };
      
      const formatted = paginationService.formatPaginationInfo(pagination);
      
      expect(formatted).toContain('Page 1 of ~3');
      expect(formatted).not.toContain('Previous:');
      expect(formatted).toContain('Next: Add `page: 2`');
    });

    it('should format pagination info without navigation on last page', () => {
      const pagination = {
        page: 3,
        totalPages: 3,
        pageSize: 10,
        totalItems: 25,
        hasMore: false,
        nextPage: null,
        prevPage: 2
      };
      
      const formatted = paginationService.formatPaginationInfo(pagination);
      
      expect(formatted).toContain('Page 3 of 3');
      expect(formatted).toContain('Previous: Add `page: 2`');
      expect(formatted).not.toContain('Next:');
    });

    it('should handle pageSize display correctly', () => {
      const pagination = {
        page: 2,
        pageSize: 20,
        totalPages: 3,
        totalItems: 50,
        hasMore: true,
        nextPage: 3,
        prevPage: 1
      };
      
      const formatted = paginationService.formatPaginationInfo(pagination);
      
      expect(formatted).toContain('Showing items 21-40 of 50');
    });
  });

  describe('chunkText', () => {
    it('should not chunk text under token limit', () => {
      const text = 'a'.repeat(50000); // 12500 tokens
      const chunks = paginationService.chunkText(text);
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(text);
    });

    it('should chunk large text into multiple parts', () => {
      const text = 'a'.repeat(100000); // 25000 tokens
      const chunks = paginationService.chunkText(text);
      
      expect(chunks).toHaveLength(2);
      chunks.forEach(chunk => {
        const tokens = paginationService.estimateTokens(chunk);
        expect(tokens).toBeLessThanOrEqual(20000);
      });
    });

    it('should preserve line breaks when chunking', () => {
      const lines = Array.from({ length: 1000 }, (_, i) => 'a'.repeat(100)).join('\n');
      const chunks = paginationService.chunkText(lines);
      
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach(chunk => {
        // Each chunk should end with a newline (except possibly the last)
        if (chunk !== chunks[chunks.length - 1]) {
          expect(chunk.endsWith('\n')).toBe(true);
        }
      });
    });

    it('should handle very long single lines', () => {
      const longLine = 'word '.repeat(20000); // Single line with ~100000 chars
      const chunks = paginationService.chunkText(longLine);
      
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach(chunk => {
        const tokens = paginationService.estimateTokens(chunk);
        expect(tokens).toBeLessThanOrEqual(20000);
      });
    });

    it('should handle empty text', () => {
      const chunks = paginationService.chunkText('');
      expect(chunks).toEqual(['']);
    });

    it('should handle null text', () => {
      const chunks = paginationService.chunkText(null);
      expect(chunks).toEqual([null]);
    });

    it('should respect maxChunkSize parameter', () => {
      const text = 'a'.repeat(100000);
      const chunks = paginationService.chunkText(text, 40000); // 10000 tokens max
      
      expect(chunks.length).toBeGreaterThanOrEqual(3);
      chunks.forEach(chunk => {
        expect(chunk.length).toBeLessThanOrEqual(40000);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle mixed content sizes in smart pagination', () => {
      const items = [
        { id: 1, content: 'a'.repeat(50000) }, // Large item
        { id: 2, content: 'b'.repeat(10) },    // Small item
        { id: 3, content: 'c'.repeat(30000) }, // Medium item
      ];
      
      const formatter = (items) => items.map(i => i.content).join('');
      const result = paginationService.smartPaginate(items, formatter, 1);
      
      // Should include at least the first item, maybe more
      expect(result.pagination.itemsInPage).toBeGreaterThanOrEqual(1);
      const tokens = paginationService.estimateTokens(result.content);
      expect(tokens).toBeLessThanOrEqual(20000);
    });

    it('should handle single item exceeding token limit', () => {
      const items = [
        { id: 1, content: 'x'.repeat(100000) } // 25000 tokens - exceeds limit
      ];
      
      const formatter = (items) => items.map(i => i.content).join('');
      const result = paginationService.smartPaginate(items, formatter, 1);
      
      // Should still include the item even if it exceeds limit
      expect(result.pagination.itemsInPage).toBe(1);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('should handle unicode characters correctly', () => {
      const text = '你好世界🌍'.repeat(1000);
      const tokens = paginationService.estimateTokens(text);
      
      // Unicode chars should still be counted
      expect(tokens).toBeGreaterThan(0);
      
      const chunks = paginationService.chunkText(text.repeat(10));
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle formatter that returns empty string', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const formatter = () => '';
      
      const result = paginationService.smartPaginate(items, formatter, 1);
      expect(result.content).toBe('');
      expect(result.pagination.itemsInPage).toBe(2);
    });

    it('should handle formatter that throws error gracefully', () => {
      const items = [{ id: 1 }];
      const formatter = () => {
        throw new Error('Formatter error');
      };
      
      expect(() => {
        paginationService.smartPaginate(items, formatter, 1);
      }).toThrow('Formatter error');
    });
  });

  describe('Performance', () => {
    it('should handle very large arrays efficiently', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({ id: i }));
      
      const startTime = Date.now();
      const result = paginationService.paginateArray(largeArray, 1, 100);
      const endTime = Date.now();
      
      expect(result.items).toHaveLength(100);
      expect(result.totalItems).toBe(10000);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it('should handle very large text efficiently', () => {
      const largeText = 'a'.repeat(1000000); // 1M chars
      
      const startTime = Date.now();
      const chunks = paginationService.chunkText(largeText);
      const endTime = Date.now();
      
      expect(chunks.length).toBeGreaterThanOrEqual(12); // 1M chars / 80K = ~12.5 chunks
      expect(endTime - startTime).toBeLessThan(500); // Should complete quickly
    });
  });
});