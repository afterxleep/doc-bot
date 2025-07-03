const fs = require('fs-extra');
const path = require('path');

class ManifestLoader {
  constructor(configPath) {
    this.configPath = configPath;
    this.manifest = null;
    this.lastModified = null;
  }
  
  async load() {
    try {
      const stats = await fs.stat(this.configPath);
      
      // Only reload if file has changed
      if (this.manifest && this.lastModified && stats.mtime <= this.lastModified) {
        return this.manifest;
      }
      
      const content = await fs.readFile(this.configPath, 'utf8');
      this.manifest = JSON.parse(content);
      this.lastModified = stats.mtime;
      
      // Validate manifest structure
      this.validateManifest();
      
      return this.manifest;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create default manifest if file doesn't exist
        this.manifest = this.createDefaultManifest();
        await this.save();
        return this.manifest;
      }
      throw new Error(`Failed to load manifest: ${error.message}`);
    }
  }
  
  async reload() {
    this.manifest = null;
    this.lastModified = null;
    return await this.load();
  }
  
  async save() {
    if (!this.manifest) {
      throw new Error('No manifest to save');
    }
    
    await fs.ensureDir(path.dirname(this.configPath));
    await fs.writeJSON(this.configPath, this.manifest, { spaces: 2 });
  }
  
  validateManifest() {
    if (!this.manifest) {
      throw new Error('Manifest is null');
    }
    
    // Required fields
    if (!this.manifest.name) {
      this.manifest.name = 'Project Documentation';
    }
    
    if (!this.manifest.version) {
      this.manifest.version = '1.0.0';
    }
    
    // Optional fields with defaults
    if (!this.manifest.globalRules) {
      this.manifest.globalRules = [];
    }
    
    if (!this.manifest.contextualRules) {
      this.manifest.contextualRules = {};
    }
    
    if (!this.manifest.inference) {
      this.manifest.inference = {
        keywords: {},
        patterns: {}
      };
    }
    
    // Validate globalRules is array
    if (!Array.isArray(this.manifest.globalRules)) {
      throw new Error('globalRules must be an array');
    }
    
    // Validate contextualRules is object
    if (typeof this.manifest.contextualRules !== 'object') {
      throw new Error('contextualRules must be an object');
    }
    
    // Validate inference structure
    if (!this.manifest.inference.keywords) {
      this.manifest.inference.keywords = {};
    }
    
    if (!this.manifest.inference.patterns) {
      this.manifest.inference.patterns = {};
    }
  }
  
  createDefaultManifest() {
    return {
      name: 'Project Documentation',
      version: '1.0.0',
      description: 'AI-powered documentation',
      globalRules: [],
      contextualRules: {},
      inference: {
        keywords: {},
        patterns: {}
      }
    };
  }
  
  getManifest() {
    return this.manifest;
  }
  
  getGlobalRules() {
    return this.manifest?.globalRules || [];
  }
  
  getContextualRules() {
    return this.manifest?.contextualRules || {};
  }
  
  getInferenceConfig() {
    return this.manifest?.inference || { keywords: {}, patterns: {} };
  }
}

module.exports = { ManifestLoader };