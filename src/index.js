const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { DocumentationService } = require('./services/DocumentationService.js');
const { InferenceEngine } = require('./services/InferenceEngine.js');
const { ManifestLoader } = require('./services/ManifestLoader.js');
const chokidar = require('chokidar');
const path = require('path');

class DocsServer {
  constructor(options = {}) {
    this.options = {
      docsPath: options.docsPath || './docs.ai',
      configPath: options.configPath || './docs.ai/manifest.json',
      verbose: options.verbose || false,
      watch: options.watch || false,
      ...options
    };
    
    this.server = new Server({
      name: 'doc-bot',
      version: '1.0.0',
      description: 'Generic MCP server for intelligent documentation access'
    }, {
      capabilities: {
        resources: {},
        tools: {}
      }
    });
    
    this.manifestLoader = new ManifestLoader(this.options.configPath);
    this.docService = new DocumentationService(this.options.docsPath, this.manifestLoader);
    this.inferenceEngine = new InferenceEngine(this.docService, this.manifestLoader);
    
    this.setupHandlers();
    
    if (this.options.watch) {
      this.setupWatcher();
    }
  }
  
  setupHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const manifest = await this.manifestLoader.load();
      return {
        resources: [
          {
            uri: 'docs://search',
            name: 'Search Documentation',
            description: 'Search all documentation files',
            mimeType: 'application/json'
          },
          {
            uri: 'docs://global-rules',
            name: 'Global Rules',
            description: 'Get always-apply documentation rules',
            mimeType: 'application/json'
          },
          {
            uri: 'docs://contextual',
            name: 'Contextual Documentation',
            description: 'Get context-aware documentation',
            mimeType: 'application/json'
          },
          {
            uri: 'docs://manifest',
            name: 'Documentation Manifest',
            description: 'Project documentation configuration',
            mimeType: 'application/json'
          },
          {
            uri: 'docs://system-prompt',
            name: 'System Prompt Injection',
            description: 'Critical rules that must be considered before generating any code',
            mimeType: 'text/plain'
          }
        ]
      };
    });
    
    // Read resource content
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      switch (uri) {
        case 'docs://search':
          const allDocs = await this.docService.getAllDocuments();
          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(allDocs, null, 2)
            }]
          };
          
        case 'docs://global-rules':
          const globalRules = await this.docService.getGlobalRules();
          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(globalRules, null, 2)
            }]
          };
          
        case 'docs://manifest':
          const manifest = await this.manifestLoader.load();
          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(manifest, null, 2)
            }]
          };

        case 'docs://system-prompt':
          const systemPrompt = await this.generateSystemPrompt();
          return {
            contents: [{
              uri,
              mimeType: 'text/plain',
              text: systemPrompt
            }]
          };
          
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
    
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_documentation',
            description: 'Search documentation by query',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query'
                }
              },
              required: ['query']
            }
          },
          {
            name: 'get_relevant_docs',
            description: 'Get context-aware documentation suggestions',
            inputSchema: {
              type: 'object',
              properties: {
                context: {
                  type: 'object',
                  description: 'Context for inference (query, filePath, codeSnippet)',
                  properties: {
                    query: { type: 'string' },
                    filePath: { type: 'string' },
                    codeSnippet: { type: 'string' }
                  }
                }
              },
              required: ['context']
            }
          },
          {
            name: 'get_global_rules',
            description: 'Get always-apply documentation rules',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'get_file_docs',
            description: 'Get documentation specific to a file path',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'File path to get documentation for'
                }
              },
              required: ['filePath']
            }
          }
        ]
      };
    });
    
    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        switch (name) {
          case 'search_documentation':
            const query = args?.query;
            if (!query) {
              throw new Error('Query parameter is required');
            }
            const results = await this.docService.searchDocuments(query);
            return {
              content: [{
                type: 'text',
                text: this.formatSearchResults(results, query)
              }]
            };
            
          case 'get_relevant_docs':
            const context = args?.context;
            if (!context) {
              throw new Error('Context parameter is required');
            }
            const relevant = await this.inferenceEngine.getRelevantDocumentation(context);
            return {
              content: [{
                type: 'text',
                text: this.formatRelevantDocs(relevant)
              }]
            };
            
          case 'get_global_rules':
            const globalRules = await this.docService.getGlobalRules();
            return {
              content: [{
                type: 'text',
                text: this.formatGlobalRules(globalRules)
              }]
            };
            
          case 'get_file_docs':
            const filePath = args?.filePath;
            if (!filePath) {
              throw new Error('FilePath parameter is required');
            }
            const fileDocs = await this.docService.getContextualDocs(filePath);
            return {
              content: [{
                type: 'text',
                text: this.formatFileDocs(fileDocs, filePath)
              }]
            };
            
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}`
          }]
        };
      }
    });
  }
  
  setupWatcher() {
    const watcher = chokidar.watch([this.options.docsPath, this.options.configPath], {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true
    });
    
    watcher.on('change', async (filePath) => {
      if (this.options.verbose) {
        console.log(`📄 Documentation updated: ${path.relative(process.cwd(), filePath)}`);
      }
      
      // Reload manifest if config changed
      if (filePath === this.options.configPath) {
        await this.manifestLoader.reload();
      }
      
      // Reload docs if documentation changed
      if (filePath.startsWith(this.options.docsPath)) {
        await this.docService.reload();
      }
    });
  }
  
  formatSearchResults(results, query) {
    if (!results || results.length === 0) {
      return `No documentation found for query: "${query}"`;
    }
    
    let output = `# Search Results for "${query}"\n\n`;
    output += `Found ${results.length} relevant document(s):\n\n`;
    
    results.forEach((doc, index) => {
      output += `## ${index + 1}. ${doc.metadata?.title || doc.fileName}\n`;
      output += `**File:** ${doc.fileName}\n`;
      if (doc.metadata?.description) {
        output += `**Description:** ${doc.metadata.description}\n`;
      }
      output += `\n${doc.content}\n\n---\n\n`;
    });
    
    return output;
  }
  
  formatRelevantDocs(relevant) {
    let output = '# Relevant Documentation\n\n';
    
    if (relevant.globalRules?.length > 0) {
      output += '## 🌟 Global Rules (Always Apply)\n\n';
      relevant.globalRules.forEach(rule => {
        output += `### ${rule.metadata?.title || rule.fileName}\n`;
        output += `${rule.content}\n\n`;
      });
    }
    
    if (relevant.contextualDocs?.length > 0) {
      output += '## 📂 Contextual Documentation\n\n';
      relevant.contextualDocs.forEach(doc => {
        output += `### ${doc.metadata?.title || doc.fileName}\n`;
        output += `${doc.content}\n\n`;
      });
    }
    
    if (relevant.inferredDocs?.length > 0) {
      output += '## 🧠 Inferred Documentation\n\n';
      relevant.inferredDocs.forEach(doc => {
        output += `### ${doc.metadata?.title || doc.fileName}\n`;
        output += `${doc.content}\n\n`;
      });
    }
    
    if (relevant.confidence !== undefined) {
      output += `**Confidence:** ${relevant.confidence.toFixed(2)}\n\n`;
    }
    
    return output;
  }
  
  formatGlobalRules(globalRules) {
    if (!globalRules || globalRules.length === 0) {
      return 'No global rules defined.';
    }
    
    let output = '# Global Rules (Always Apply)\n\n';
    output += 'These rules should be applied to all interactions:\n\n';
    
    globalRules.forEach(rule => {
      output += `## ${rule.metadata?.title || rule.fileName}\n`;
      output += `${rule.content}\n\n`;
    });
    
    return output;
  }
  
  formatFileDocs(fileDocs, filePath) {
    if (!fileDocs || fileDocs.length === 0) {
      return `No specific documentation found for file: ${filePath}`;
    }
    
    let output = `# Documentation for ${filePath}\n\n`;
    
    fileDocs.forEach(doc => {
      output += `## ${doc.metadata?.title || doc.fileName}\n`;
      output += `${doc.content}\n\n`;
    });
    
    return output;
  }

  async generateSystemPrompt() {
    const globalRules = await this.docService.getGlobalRules();
    
    if (!globalRules || globalRules.length === 0) {
      return 'No global documentation rules defined.';
    }
    
    let prompt = '# CRITICAL: Project Documentation Rules\n\n';
    prompt += 'IMPORTANT: You MUST follow these rules before generating ANY code:\n\n';
    
    globalRules.forEach((rule, index) => {
      prompt += `## Rule ${index + 1}: ${rule.metadata?.title || rule.fileName}\n`;
      prompt += `${rule.content}\n\n`;
    });
    
    prompt += '⚠️ VIOLATION OF THESE RULES IS NOT ACCEPTABLE. Always check compliance before responding.\n';
    
    return prompt;
  }
  
  async start() {
    // Initialize services
    await this.manifestLoader.load();
    await this.docService.initialize();
    await this.inferenceEngine.initialize();
    
    // Start server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    if (this.options.verbose) {
      console.log('🔧 Server initialized with MCP transport');
    }
  }
}

module.exports = { DocsServer };