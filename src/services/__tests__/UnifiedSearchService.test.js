import { UnifiedSearchService } from '../UnifiedSearchService.js';
import { DocumentationService } from '../DocumentationService.js';
import { MultiDocsetDatabase } from '../docset/database.js';
import { jest } from '@jest/globals';

describe('UnifiedSearchService', () => {
  let unifiedSearchService;
  let mockDocumentationService;
  let mockMultiDocsetDatabase;

  beforeEach(() => {
    // Mock DocumentationService
    mockDocumentationService = {
      searchDocuments: jest.fn().mockResolvedValue([]),
      documents: new Map()
    };

    // Mock MultiDocsetDatabase
    mockMultiDocsetDatabase = {
      searchWithTerms: jest.fn().mockReturnValue([]),
      databases: new Map(),
      getStats: jest.fn().mockReturnValue([])
    };

    unifiedSearchService = new UnifiedSearchService(
      mockDocumentationService,
      mockMultiDocsetDatabase
    );
  });

  describe('parseQuery', () => {
    it('should parse query into terms removing stop words', () => {
      const terms = unifiedSearchService.parseQuery('How to use AlarmKit Framework');
      expect(terms).toEqual(['use', 'alarmkit', 'framework']);
    });

    it('should handle queries with special characters', () => {
      const terms = unifiedSearchService.parseQuery('URLSession.shared configuration!');
      expect(terms).toEqual(['urlsessionshared', 'configuration']);
    });

    it('should filter out short terms', () => {
      const terms = unifiedSearchService.parseQuery('a I URLSession x');
      expect(terms).toEqual(['urlsession']);
    });

    it('should preserve dots, dashes and underscores', () => {
      const terms = unifiedSearchService.parseQuery('URLSession.shared my-function test_var');
      expect(terms).toEqual(['urlsession.shared', 'my-function', 'test_var']);
    });

    it('should handle empty query', () => {
      const terms = unifiedSearchService.parseQuery('');
      expect(terms).toEqual([]);
    });
  });

  describe('search', () => {
    it('should return empty array for empty query', async () => {
      const results = await unifiedSearchService.search('');
      expect(results).toEqual([]);
    });

    it('should return empty array for query with only stop words', async () => {
      const results = await unifiedSearchService.search('the is are was');
      expect(results).toEqual([]);
    });

    it('should search both local and docset documentation', async () => {
      const localResults = [
        {
          fileName: 'test.md',
          content: 'Test content',
          metadata: { title: 'Test' },
          relevanceScore: 50
        }
      ];

      const docsetResults = [
        {
          name: 'TestClass',
          type: 'Class',
          path: 'test.html',
          docsetId: 'mock',
          docsetName: 'Mock',
          relevanceScore: 40
        }
      ];

      mockDocumentationService.searchDocuments.mockResolvedValue(localResults);
      mockMultiDocsetDatabase.searchWithTerms.mockReturnValue(docsetResults);

      const results = await unifiedSearchService.search('test');
      
      expect(mockDocumentationService.searchDocuments).toHaveBeenCalledWith('test');
      expect(mockMultiDocsetDatabase.searchWithTerms).toHaveBeenCalledWith(
        ['test'],
        { type: undefined, docsetId: undefined, limit: 10 }
      );
      
      expect(results).toHaveLength(2);
      // Local result should be boosted and come first
      expect(results[0].type).toBe('local');
      expect(results[0].relevanceScore).toBe(250); // 50 * 5
      expect(results[1].type).toBe('docset');
    });

    it('should not search local docs when docsetId is specified', async () => {
      mockMultiDocsetDatabase.searchWithTerms.mockReturnValue([]);
      
      await unifiedSearchService.search('test', { docsetId: 'specific-docset' });
      
      expect(mockDocumentationService.searchDocuments).not.toHaveBeenCalled();
      expect(mockMultiDocsetDatabase.searchWithTerms).toHaveBeenCalledWith(
        ['test'],
        { type: undefined, docsetId: 'specific-docset', limit: 10 }
      );
    });

    it('should apply quality filtering when high-quality results exist', async () => {
      const mixedResults = [
        {
          fileName: 'high-quality.md',
          content: 'Highly relevant',
          metadata: { title: 'Perfect Match' },
          relevanceScore: 80
        },
        {
          fileName: 'medium.md',
          content: 'Somewhat relevant',
          metadata: { title: 'Partial Match' },
          relevanceScore: 30
        },
        {
          fileName: 'low.md',
          content: 'Barely relevant',
          metadata: { title: 'Weak Match' },
          relevanceScore: 5
        }
      ];

      mockDocumentationService.searchDocuments.mockResolvedValue(mixedResults);
      
      const results = await unifiedSearchService.search('test', { limit: 10 });
      
      // Should only include high-quality results (score >= 50 after boosting)
      expect(results.length).toBe(2);
      expect(results[0].relevanceScore).toBe(400); // 80 * 5
      expect(results[1].relevanceScore).toBe(150); // 30 * 5
    });

    it('should handle search errors gracefully', async () => {
      mockDocumentationService.searchDocuments.mockRejectedValue(new Error('Search failed'));
      mockMultiDocsetDatabase.searchWithTerms.mockImplementation(() => {
        throw new Error('Database error');
      });

      const results = await unifiedSearchService.search('test');
      expect(results).toEqual([]);
    });
  });

  describe('normalizeLocalResults', () => {
    it('should normalize local documentation results', () => {
      const localResults = [
        {
          fileName: 'guide.md',
          content: 'Full content here',
          metadata: { 
            title: 'User Guide',
            description: 'A comprehensive guide'
          },
          relevanceScore: 75,
          snippet: 'This is a snippet...',
          matchedTerms: ['guide', 'user']
        }
      ];

      const normalized = unifiedSearchService.normalizeLocalResults(localResults);
      
      expect(normalized[0]).toEqual({
        id: 'guide.md',
        title: 'User Guide',
        description: 'A comprehensive guide',
        type: 'local',
        source: 'project',
        path: 'guide.md',
        url: 'guide.md',
        relevanceScore: 75,
        metadata: localResults[0].metadata,
        content: 'Full content here',
        snippet: 'This is a snippet...',
        matchedTerms: ['guide', 'user']
      });
    });

    it('should handle missing metadata gracefully', () => {
      const localResults = [
        {
          fileName: 'readme.md',
          content: 'Content',
          relevanceScore: 50
        }
      ];

      const normalized = unifiedSearchService.normalizeLocalResults(localResults);
      
      expect(normalized[0].title).toBe('readme.md');
      expect(normalized[0].description).toBe('');
      expect(normalized[0].matchedTerms).toEqual([]);
    });
  });

  describe('normalizeDocsetResults', () => {
    it('should normalize and deduplicate docset results', () => {
      const docsetResults = [
        {
          name: 'URLSession',
          type: 'Class',
          path: 'path1.html',
          url: 'https://example.com/path1.html',
          docsetId: 'apple',
          docsetName: 'Apple',
          relevanceScore: 60
        },
        {
          name: 'URLSession',
          type: 'Class',
          path: 'path2.html?language=swift',
          url: 'https://example.com/path2.html?language=swift',
          docsetId: 'apple',
          docsetName: 'Apple',
          relevanceScore: 50
        }
      ];

      const normalized = unifiedSearchService.normalizeDocsetResults(docsetResults);
      
      // Should deduplicate and prefer Swift entry
      expect(normalized).toHaveLength(1);
      expect(normalized[0].url).toContain('language=swift');
    });

    it('should keep higher score when neither is Swift', () => {
      const docsetResults = [
        {
          name: 'TestClass',
          type: 'Class',
          path: 'path1.html',
          url: 'https://example.com/path1.html',
          docsetId: 'mock',
          docsetName: 'Mock',
          relevanceScore: 70
        },
        {
          name: 'TestClass',
          type: 'Class',
          path: 'path2.html',
          url: 'https://example.com/path2.html',
          docsetId: 'mock',
          docsetName: 'Mock',
          relevanceScore: 80
        }
      ];

      const normalized = unifiedSearchService.normalizeDocsetResults(docsetResults);
      
      expect(normalized).toHaveLength(1);
      expect(normalized[0].relevanceScore).toBe(80);
    });
  });

  describe('getSources', () => {
    it('should return summary of available documentation sources', async () => {
      mockDocumentationService.documents.set('doc1.md', {});
      mockDocumentationService.documents.set('doc2.md', {});
      
      mockMultiDocsetDatabase.databases.set('apple', {});
      mockMultiDocsetDatabase.databases.set('mock', {});
      mockMultiDocsetDatabase.getStats.mockReturnValue([
        { docsetId: 'apple', docsetName: 'Apple', entryCount: 1000 },
        { docsetId: 'mock', docsetName: 'Mock', entryCount: 50 }
      ]);

      const sources = await unifiedSearchService.getSources();
      
      expect(sources).toEqual({
        local: {
          documentCount: 2,
          indexed: true
        },
        docsets: {
          count: 2,
          details: [
            { docsetId: 'apple', docsetName: 'Apple', entryCount: 1000 },
            { docsetId: 'mock', docsetName: 'Mock', entryCount: 50 }
          ]
        }
      });
    });
  });
});