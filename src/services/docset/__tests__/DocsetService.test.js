import { DocsetService } from '../index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('DocsetService', () => {
  let docsetService;
  let tempStoragePath;

  beforeEach(async () => {
    // Create a temporary directory for test docsets
    tempStoragePath = path.join(__dirname, 'temp-docsets-' + Date.now());
    await fs.ensureDir(tempStoragePath);
    
    docsetService = new DocsetService(tempStoragePath);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.remove(tempStoragePath);
  });

  describe('constructor', () => {
    it('should create instance with custom storage path', () => {
      expect(docsetService.storagePath).toBe(tempStoragePath);
      expect(docsetService.metadataPath).toBe(path.join(tempStoragePath, 'docsets.json'));
    });

    it('should create instance with default storage path when none provided', () => {
      const defaultService = new DocsetService();
      const expectedPath = path.join(os.homedir(), 'Developer', 'DocSets');
      expect(defaultService.storagePath).toBe(expectedPath);
    });
  });

  describe('initialize', () => {
    it('should create storage directory if it does not exist', async () => {
      // Remove the directory first
      await fs.remove(tempStoragePath);
      expect(await fs.pathExists(tempStoragePath)).toBe(false);
      
      // Initialize should create it
      await docsetService.initialize();
      expect(await fs.pathExists(tempStoragePath)).toBe(true);
    });

    it('should load existing metadata on initialization', async () => {
      // Create test metadata
      const testMetadata = [
        {
          id: 'test-docset-1',
          name: 'Test Docset',
          downloadedAt: new Date().toISOString()
        }
      ];
      await fs.writeJson(docsetService.metadataPath, testMetadata);
      
      // Create the docset directory
      await fs.ensureDir(path.join(tempStoragePath, 'test-docset-1'));
      
      // Initialize and check if metadata is loaded
      await docsetService.initialize();
      expect(docsetService.docsets.size).toBe(1);
      expect(docsetService.docsets.has('test-docset-1')).toBe(true);
    });

    it('should skip docsets that no longer exist on disk', async () => {
      // Create metadata for non-existent docset
      const testMetadata = [
        {
          id: 'missing-docset',
          name: 'Missing Docset',
          downloadedAt: new Date().toISOString()
        }
      ];
      await fs.writeJson(docsetService.metadataPath, testMetadata);
      
      // Initialize and check that missing docset is not loaded
      await docsetService.initialize();
      expect(docsetService.docsets.size).toBe(0);
    });
  });

  describe('listDocsets', () => {
    it('should return empty array when no docsets are installed', async () => {
      await docsetService.initialize();
      const docsets = await docsetService.listDocsets();
      expect(docsets).toEqual([]);
    });

    it('should return list of installed docsets', async () => {
      // Add test docsets to internal map
      docsetService.docsets.set('test-1', { 
        id: 'test-1', 
        name: 'Test Docset 1',
        downloadedAt: new Date()
      });
      docsetService.docsets.set('test-2', { 
        id: 'test-2', 
        name: 'Test Docset 2',
        downloadedAt: new Date()
      });
      
      const docsets = await docsetService.listDocsets();
      expect(docsets).toHaveLength(2);
      expect(docsets[0].name).toBe('Test Docset 1');
      expect(docsets[1].name).toBe('Test Docset 2');
    });
  });

  describe('getDocset', () => {
    it('should return docset by ID', () => {
      const testDocset = { 
        id: 'test-docset', 
        name: 'Test Docset',
        downloadedAt: new Date()
      };
      docsetService.docsets.set('test-docset', testDocset);
      
      const result = docsetService.getDocset('test-docset');
      expect(result).toEqual(testDocset);
    });

    it('should return undefined for non-existent docset', () => {
      const result = docsetService.getDocset('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('removeDocset', () => {
    it('should throw error when docset does not exist', async () => {
      await expect(docsetService.removeDocset('non-existent'))
        .rejects.toThrow('Docset non-existent not found');
    });

    it('should remove docset directory and metadata', async () => {
      // Create a test docset
      const docsetId = 'test-remove';
      const docsetPath = path.join(tempStoragePath, docsetId, 'Test.docset');
      await fs.ensureDir(docsetPath);
      
      docsetService.docsets.set(docsetId, {
        id: docsetId,
        name: 'Test Docset',
        path: docsetPath,
        downloadedAt: new Date()
      });
      await docsetService.saveMetadata();
      
      // Remove the docset
      await docsetService.removeDocset(docsetId);
      
      // Check that directory is removed
      expect(await fs.pathExists(path.join(tempStoragePath, docsetId))).toBe(false);
      
      // Check that metadata is updated
      expect(docsetService.docsets.has(docsetId)).toBe(false);
      
      // Check that metadata file is updated
      const metadata = await fs.readJson(docsetService.metadataPath);
      expect(metadata).toHaveLength(0);
    });
  });

  describe('download progress tracking', () => {
    it('should track download progress for a docset', () => {
      const docsetId = 'test-download';
      const progress = {
        docsetId,
        url: 'https://example.com/test.docset',
        percentage: 50
      };
      
      docsetService.downloadProgress.set(docsetId, progress);
      
      const result = docsetService.getDownloadProgress(docsetId);
      expect(result).toEqual(progress);
    });

    it('should return all download progress', () => {
      docsetService.downloadProgress.set('download-1', { percentage: 25 });
      docsetService.downloadProgress.set('download-2', { percentage: 75 });
      
      const allProgress = docsetService.getAllDownloadProgress();
      expect(allProgress).toHaveLength(2);
      expect(allProgress[0].percentage).toBe(25);
      expect(allProgress[1].percentage).toBe(75);
    });
  });
});