import fs from 'fs-extra';
import path from 'path';
import { createWriteStream } from 'fs';
import axios from 'axios';
import tar from 'tar';
import AdmZip from 'adm-zip';
import plist from 'plist';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import os from 'os';

/**
 * Manages docset storage, downloading, and metadata for doc-bot
 * Adapted from scout server's DocsetManager
 */
export class DocsetService {
  constructor(storagePath) {
    this.storagePath = storagePath || path.join(os.homedir(), 'Developer', 'DocSets');
    this.metadataPath = path.join(this.storagePath, 'docsets.json');
    this.docsets = new Map();
    this.downloadProgress = new Map();
  }

  async initialize() {
    // Create storage directory if it doesn't exist
    await fs.ensureDir(this.storagePath);
    
    // Load existing docsets metadata
    await this.loadMetadata();
  }

  async loadMetadata() {
    try {
      if (await fs.pathExists(this.metadataPath)) {
        const data = await fs.readJson(this.metadataPath);
        
        for (const docset of data) {
          // Verify docset still exists
          const docsetPath = path.join(this.storagePath, docset.id);
          if (await fs.pathExists(docsetPath)) {
            this.docsets.set(docset.id, {
              ...docset,
              downloadedAt: new Date(docset.downloadedAt)
            });
          }
        }
      }
    } catch (error) {
      // If metadata is corrupted, start fresh
      this.docsets.clear();
    }
  }

  async saveMetadata() {
    const docsets = Array.from(this.docsets.values());
    await fs.writeJson(this.metadataPath, docsets, { spaces: 2 });
  }

  async addDocset(source) {
    // Determine if source is URL or local path
    const isUrl = source.startsWith('http://') || source.startsWith('https://');
    const isLocalPath = await this.isLocalPath(source);
    
    if (!isUrl && !isLocalPath) {
      throw new Error(`Invalid source: ${source}. Must be a valid URL or local file path.`);
    }

    // Generate unique ID for the docset
    const docsetId = crypto.createHash('md5').update(source).digest('hex').substring(0, 8);
    
    // Check if already exists
    if (this.docsets.has(docsetId)) {
      throw new Error(`Docset from ${source} is already installed`);
    }

    if (isUrl) {
      return await this.addDocsetFromUrl(source, docsetId);
    } else {
      return await this.addDocsetFromLocal(source, docsetId);
    }
  }

  async isLocalPath(source) {
    try {
      const stats = await fs.stat(source);
      return stats.isFile() || stats.isDirectory();
    } catch {
      return false;
    }
  }

  async addDocsetFromLocal(localPath, docsetId) {
    try {
      const stats = await fs.stat(localPath);
      const extractPath = path.join(this.storagePath, docsetId);
      await fs.ensureDir(extractPath);

      let docsetPath;

      if (stats.isDirectory() && localPath.endsWith('.docset')) {
        // Direct docset directory - copy it
        docsetPath = path.join(extractPath, path.basename(localPath));
        await fs.copy(localPath, docsetPath);
      } else if (stats.isFile()) {
        // Handle different archive formats
        if (localPath.endsWith('.tgz') || localPath.endsWith('.tar.gz')) {
          // Tar archive - extract it
          await tar.extract({
            file: localPath,
            cwd: extractPath,
            strip: 0
          });
        } else if (localPath.endsWith('.zip')) {
          // ZIP archive - extract it
          const zip = new AdmZip(localPath);
          zip.extractAllTo(extractPath, true);
        } else {
          throw new Error('Local file must be a .tgz, .tar.gz, or .zip archive');
        }

        // Find the .docset directory
        const files = await fs.readdir(extractPath);
        const docsetDir = files.find(f => f.endsWith('.docset'));
        
        if (!docsetDir) {
          throw new Error('No .docset directory found in the archive');
        }

        docsetPath = path.join(extractPath, docsetDir);
      } else {
        throw new Error('Local path must be a .docset directory or archive file (.tgz, .tar.gz, .zip)');
      }

      // Read docset metadata
      const metadata = await this.readDocsetMetadata(docsetPath);
      
      // Get docset size
      const size = await this.getDirectorySize(docsetPath);

      // Create docset info
      const docsetInfo = {
        id: docsetId,
        name: metadata.CFBundleName || path.basename(docsetPath).replace('.docset', ''),
        source: localPath,
        path: docsetPath,
        version: metadata.CFBundleVersion,
        platform: metadata.DocSetPlatformFamily,
        downloadedAt: new Date(),
        size
      };

      // Save to metadata
      this.docsets.set(docsetId, docsetInfo);
      await this.saveMetadata();

      return docsetInfo;
    } catch (error) {
      // Clean up on failure
      try {
        const extractPath = path.join(this.storagePath, docsetId);
        await fs.remove(extractPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      throw error;
    }
  }

  async addDocsetFromUrl(url, docsetId) {
    const progress = {
      docsetId,
      url,
      totalBytes: 0,
      downloadedBytes: 0,
      percentage: 0,
      status: 'downloading'
    };
    
    this.downloadProgress.set(docsetId, progress);

    try {
      // Determine file extension from URL
      const urlLower = url.toLowerCase();
      let fileExt = '.tgz';
      if (urlLower.endsWith('.zip')) {
        fileExt = '.zip';
      } else if (urlLower.endsWith('.tar.gz')) {
        fileExt = '.tar.gz';
      }

      // Download the docset
      const downloadPath = path.join(this.storagePath, `${docsetId}${fileExt}`);
      await this.downloadFile(url, downloadPath, docsetId);

      // Update progress
      progress.status = 'extracting';
      
      // Extract the docset
      const extractPath = path.join(this.storagePath, docsetId);
      await fs.ensureDir(extractPath);
      
      if (fileExt === '.zip') {
        // Extract ZIP file
        const zip = new AdmZip(downloadPath);
        zip.extractAllTo(extractPath, true);
      } else {
        // Extract tar archive
        await tar.extract({
          file: downloadPath,
          cwd: extractPath,
          strip: 0
        });
      }

      // Clean up downloaded file
      await fs.unlink(downloadPath);

      // Find the .docset directory
      const files = await fs.readdir(extractPath);
      const docsetDir = files.find(f => f.endsWith('.docset'));
      
      if (!docsetDir) {
        throw new Error('No .docset directory found in the downloaded archive');
      }

      const docsetPath = path.join(extractPath, docsetDir);
      
      // Read docset metadata
      const metadata = await this.readDocsetMetadata(docsetPath);
      
      // Get docset size
      const size = await this.getDirectorySize(docsetPath);

      // Create docset info
      const docsetInfo = {
        id: docsetId,
        name: metadata.CFBundleName || docsetDir.replace('.docset', ''),
        source: url,
        path: docsetPath,
        version: metadata.CFBundleVersion,
        platform: metadata.DocSetPlatformFamily,
        downloadedAt: new Date(),
        size
      };

      // Save to metadata
      this.docsets.set(docsetId, docsetInfo);
      await this.saveMetadata();

      // Update progress
      progress.status = 'completed';
      progress.percentage = 100;

      return docsetInfo;
    } catch (error) {
      progress.status = 'failed';
      progress.error = error.message;
      
      // Clean up any partial downloads
      try {
        const extractPath = path.join(this.storagePath, docsetId);
        await fs.remove(extractPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      throw error;
    } finally {
      // Clean up progress after a delay
      setTimeout(() => {
        this.downloadProgress.delete(docsetId);
      }, 5000);
    }
  }

  async downloadFile(url, destination, docsetId) {
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
      onDownloadProgress: (progressEvent) => {
        const progress = this.downloadProgress.get(docsetId);
        if (progress && progressEvent.total) {
          progress.totalBytes = progressEvent.total;
          progress.downloadedBytes = progressEvent.loaded;
          progress.percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        }
      }
    });

    const writer = createWriteStream(destination);
    await pipeline(response.data, writer);
  }

  async readDocsetMetadata(docsetPath) {
    const plistPath = path.join(docsetPath, 'Contents', 'Info.plist');
    const plistContent = await fs.readFile(plistPath, 'utf-8');
    return plist.parse(plistContent);
  }

  async getDirectorySize(dirPath) {
    let size = 0;
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        size += await this.getDirectorySize(filePath);
      } else {
        const stats = await fs.stat(filePath);
        size += stats.size;
      }
    }
    
    return size;
  }

  async removeDocset(docsetId) {
    const docset = this.docsets.get(docsetId);
    if (!docset) {
      throw new Error(`Docset ${docsetId} not found`);
    }

    // Remove the docset directory
    const docsetDir = path.dirname(docset.path);
    await fs.remove(docsetDir);

    // Update metadata
    this.docsets.delete(docsetId);
    await this.saveMetadata();
  }

  async listDocsets() {
    return Array.from(this.docsets.values());
  }

  getDocset(docsetId) {
    return this.docsets.get(docsetId);
  }

  getDownloadProgress(docsetId) {
    return this.downloadProgress.get(docsetId);
  }

  getAllDownloadProgress() {
    return Array.from(this.downloadProgress.values());
  }
}