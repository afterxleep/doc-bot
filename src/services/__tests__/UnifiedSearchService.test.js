import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { UnifiedSearchService } from '../UnifiedSearchService.js';

describe('UnifiedSearchService', () => {
  let documentationService;
  let multiDocsetDatabase;
  let searchService;

  beforeEach(() => {
    documentationService = {
      searchDocuments: jest.fn()
    };
    multiDocsetDatabase = {
      searchWithTerms: jest.fn()
    };
    searchService = new UnifiedSearchService(documentationService, multiDocsetDatabase);
  });

  it('returns strong local documentation without searching docsets', async () => {
    documentationService.searchDocuments.mockResolvedValue([
      {
        fileName: 'macos/agent-pi-backend.md',
        content: 'Pi handoff context',
        metadata: { title: 'Pi Agent Backend' },
        relevanceScore: 20
      }
    ]);

    const results = await searchService.search('Pi Codex context handoff', { limit: 20 });

    expect(multiDocsetDatabase.searchWithTerms).not.toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      type: 'local',
      title: 'Pi Agent Backend'
    });
  });

  it('returns compact local search results without document content or snippets', async () => {
    documentationService.searchDocuments.mockResolvedValue([
      {
        fileName: 'large-doc.md',
        content: 'Very large document body that should stay behind read_specific_document.',
        metadata: {
          title: 'Large Doc',
          description: 'Compact summary for search results'
        },
        relevanceScore: 20,
        snippet: 'Body excerpt that should not be returned by search'
      }
    ]);

    const results = await searchService.search('large doc', { limit: 20 });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      title: 'Large Doc',
      description: 'Compact summary for search results',
      path: 'large-doc.md'
    });
    expect(results[0]).not.toHaveProperty('content');
    expect(results[0]).not.toHaveProperty('snippet');
    expect(results[0]).not.toHaveProperty('metadata');
  });

  it('searches docsets when local documentation is weak', async () => {
    documentationService.searchDocuments.mockResolvedValue([
      {
        fileName: 'general.md',
        content: 'A weak mention',
        metadata: { title: 'General' },
        relevanceScore: 1
      }
    ]);
    multiDocsetDatabase.searchWithTerms.mockReturnValue([
      {
        name: 'URLSession',
        type: 'Class',
        path: 'Foundation/URLSession.html',
        url: 'Foundation/URLSession.html',
        docsetId: 'apple',
        docsetName: 'Apple',
        relevanceScore: 80
      }
    ]);

    const results = await searchService.search('URLSession', { limit: 20 });

    expect(multiDocsetDatabase.searchWithTerms).toHaveBeenCalled();
    expect(results.some((result) => result.type === 'docset')).toBe(true);
  });

  it('searches docsets when explicitly filtered to a docset', async () => {
    documentationService.searchDocuments.mockResolvedValue([
      {
        fileName: 'macos/agent-pi-backend.md',
        content: 'Pi handoff context',
        metadata: { title: 'Pi Agent Backend' },
        relevanceScore: 20
      }
    ]);
    multiDocsetDatabase.searchWithTerms.mockReturnValue([
      {
        name: 'URLSession',
        type: 'Class',
        path: 'Foundation/URLSession.html',
        url: 'Foundation/URLSession.html',
        docsetId: 'apple',
        docsetName: 'Apple',
        relevanceScore: 80
      }
    ]);

    await searchService.search('Pi Codex context handoff', { docsetId: 'apple', limit: 20 });

    expect(documentationService.searchDocuments).not.toHaveBeenCalled();
    expect(multiDocsetDatabase.searchWithTerms).toHaveBeenCalledWith(
      ['pi', 'codex', 'context', 'handoff'],
      { docsetId: 'apple', limit: 10, type: undefined }
    );
  });

  it('searches docsets when explicitly filtered by API type', async () => {
    documentationService.searchDocuments.mockResolvedValue([
      {
        fileName: 'macos/agent-pi-backend.md',
        content: 'Pi handoff context',
        metadata: { title: 'Pi Agent Backend' },
        relevanceScore: 20
      }
    ]);
    multiDocsetDatabase.searchWithTerms.mockReturnValue([]);

    await searchService.search('Pi Codex context handoff', { type: 'Class', limit: 20 });

    expect(documentationService.searchDocuments).not.toHaveBeenCalled();
    expect(multiDocsetDatabase.searchWithTerms).toHaveBeenCalledWith(
      ['pi', 'codex', 'context', 'handoff'],
      { docsetId: undefined, limit: 10, type: 'Class' }
    );
  });
});
