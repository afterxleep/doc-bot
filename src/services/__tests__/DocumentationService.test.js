import { DocumentationService } from '../DocumentationService.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('DocumentationService', () => {
  let docService;
  let tempDocsPath;

  beforeEach(async () => {
    tempDocsPath = path.join(__dirname, 'temp-docs-' + Date.now());
    await fs.ensureDir(tempDocsPath);
    docService = new DocumentationService(tempDocsPath);
  });

  afterEach(async () => {
    await fs.remove(tempDocsPath);
  });

  describe('extractRelevantSnippet', () => {
    it('should extract snippet around exact phrase match', () => {
      const content = `This is some content before the match.
      Here we discuss how to use AlarmKit Framework effectively.
      And this is content after the match.`;
      
      const snippet = docService.extractRelevantSnippet(
        content,
        ['use', 'alarmkit', 'framework'],
        'use AlarmKit Framework'
      );
      
      expect(snippet).toContain('use AlarmKit Framework');
      expect(snippet.length).toBeLessThanOrEqual(250);
    });

    it('should find best snippet with most matching terms', () => {
      const content = `# Introduction
      This document covers various topics.
      
      # URLSession Configuration
      Learn how to configure URLSession properly.
      
      # Advanced Usage
      Here we discuss URLSession and configuration together.
      URLSession provides many configuration options.`;
      
      const snippet = docService.extractRelevantSnippet(
        content,
        ['urlsession', 'configuration'],
        'URLSession configuration'
      );
      
      expect(snippet).toContain('URLSession');
      expect(snippet).toContain('configuration');
    });

    it('should prioritize headers containing search terms', () => {
      const content = `# Random Header
      Some content here.
      
      # AlarmKit Integration
      This is the section about integration.
      
      Some other content mentioning AlarmKit.`;
      
      const snippet = docService.extractRelevantSnippet(
        content,
        ['alarmkit', 'integration'],
        'AlarmKit integration'
      );
      
      expect(snippet).toContain('# AlarmKit Integration');
    });

    it('should return description from metadata if no good snippet found', () => {
      const content = `---
title: Test Document
description: This is a comprehensive guide to using the API
---

Some unrelated content here.`;
      
      const snippet = docService.extractRelevantSnippet(
        content,
        ['nonexistent', 'terms'],
        'nonexistent terms'
      );
      
      expect(snippet).toBe('This is a comprehensive guide to using the API');
    });

    it('should clean and format snippets properly', () => {
      const content = `This is **bold** text with \`code\` and     multiple    spaces.`;
      
      const snippet = docService.extractRelevantSnippet(
        content,
        ['bold', 'text'],
        'bold text'
      );
      
      expect(snippet).not.toContain('**');
      expect(snippet).not.toContain('`');
      expect(snippet).not.toMatch(/\s{2,}/);
    });
  });

  describe('getMatchedTerms', () => {
    it('should return terms that match in document', () => {
      const doc = {
        content: 'Learn about URLSession and networking in Swift',
        metadata: {
          title: 'Swift Networking Guide',
          description: 'A guide to URLSession'
        },
        fileName: 'networking.md'
      };
      
      const matched = docService.getMatchedTerms(doc, ['urlsession', 'swift', 'api']);
      
      expect(matched).toContain('urlsession');
      expect(matched).toContain('swift');
      expect(matched).not.toContain('api');
    });

    it('should match terms in title and description', () => {
      const doc = {
        content: 'Some content',
        metadata: {
          title: 'AlarmKit Framework',
          description: 'Learn to use AlarmKit'
        },
        fileName: 'guide.md'
      };
      
      const matched = docService.getMatchedTerms(doc, ['alarmkit', 'framework', 'use']);
      
      expect(matched).toEqual(['alarmkit', 'framework', 'use']);
    });
  });

  describe('searchDocuments with enhanced features', () => {
    beforeEach(async () => {
      // Create test documents
      await fs.writeFile(
        path.join(tempDocsPath, 'high-relevance.md'),
        `---
title: AlarmKit Framework Guide
description: Complete guide to using AlarmKit Framework
keywords: [alarmkit, framework, ios]
---

# AlarmKit Framework

Learn how to use AlarmKit Framework effectively.
AlarmKit provides powerful alarm functionality.`
      );

      await fs.writeFile(
        path.join(tempDocsPath, 'medium-relevance.md'),
        `---
title: iOS Development
description: General iOS development guide
---

# iOS Development

This guide covers various frameworks including AlarmKit.`
      );

      await fs.writeFile(
        path.join(tempDocsPath, 'low-relevance.md'),
        `---
title: Random Document
---

# Random Content

This has nothing to do with alarms or kits.`
      );

      await docService.initialize();
    });

    it('should return results with snippets and matched terms', async () => {
      const results = await docService.searchDocuments('AlarmKit Framework');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].snippet).toBeDefined();
      expect(results[0].matchedTerms).toBeDefined();
      expect(results[0].matchedTerms).toContain('alarmkit');
      expect(results[0].matchedTerms).toContain('framework');
    });

    it('should filter out low relevance results', async () => {
      const results = await docService.searchDocuments('AlarmKit Framework');
      
      // Should not include the "Random Document" with no relevant content
      const hasLowRelevance = results.some(r => r.metadata?.title === 'Random Document');
      expect(hasLowRelevance).toBe(false);
    });

    it('should prioritize exact phrase matches', async () => {
      const results = await docService.searchDocuments('AlarmKit Framework');
      
      expect(results[0].metadata?.title).toBe('AlarmKit Framework Guide');
      expect(results[0].relevanceScore).toBeGreaterThan(50);
    });

    it('should boost keyword matches', async () => {
      const results = await docService.searchDocuments('alarmkit');
      
      // Document with alarmkit in keywords should score higher
      expect(results[0].metadata?.keywords).toContain('alarmkit');
    });
  });

  describe('calculateAdvancedRelevanceScore', () => {
    it('should give high score for exact phrase match', () => {
      const doc = {
        content: 'Learn how to use AlarmKit Framework in your iOS app',
        metadata: { title: 'iOS Guide' },
        fileName: 'guide.md'
      };
      
      const score = docService.calculateAdvancedRelevanceScore(
        doc,
        ['alarmkit', 'framework'],
        'AlarmKit Framework'
      );
      
      expect(score).toBeGreaterThan(20); // Exact phrase bonus
    });

    it('should boost matches in title', () => {
      const doc1 = {
        content: 'Some content about URLSession',
        metadata: { title: 'URLSession Guide' },
        fileName: 'guide1.md'
      };
      
      const doc2 = {
        content: 'URLSession is mentioned here',
        metadata: { title: 'Random Guide' },
        fileName: 'guide2.md'
      };
      
      const score1 = docService.calculateAdvancedRelevanceScore(
        doc1,
        ['urlsession'],
        'URLSession'
      );
      
      const score2 = docService.calculateAdvancedRelevanceScore(
        doc2,
        ['urlsession'],
        'URLSession'
      );
      
      expect(score1).toBeGreaterThan(score2);
    });

    it('should apply term coverage bonus', () => {
      const doc = {
        content: 'URLSession configuration and usage',
        metadata: { title: 'Networking' },
        fileName: 'net.md'
      };
      
      const score1 = docService.calculateAdvancedRelevanceScore(
        doc,
        ['urlsession'],
        'URLSession'
      );
      
      const score2 = docService.calculateAdvancedRelevanceScore(
        doc,
        ['urlsession', 'configuration'],
        'URLSession configuration'
      );
      
      // Matching both terms should score higher
      expect(score2).toBeGreaterThan(score1);
    });

    it('should cap content match frequency to prevent spam', () => {
      const spamDoc = {
        content: 'test '.repeat(100),
        metadata: { title: 'Spam' },
        fileName: 'spam.md'
      };
      
      const normalDoc = {
        content: 'This is a test document with normal content',
        metadata: { title: 'Normal' },
        fileName: 'normal.md'
      };
      
      const spamScore = docService.calculateAdvancedRelevanceScore(
        spamDoc,
        ['test'],
        'test'
      );
      
      const normalScore = docService.calculateAdvancedRelevanceScore(
        normalDoc,
        ['test'],
        'test'
      );
      
      // Spam score should be capped, not drastically higher
      expect(spamScore / normalScore).toBeLessThan(5);
    });
  });
});