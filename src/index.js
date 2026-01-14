import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { DocumentationService } from './services/DocumentationService.js';
import { InferenceEngine } from './services/InferenceEngine.js';
import { MultiDocsetDatabase } from './services/docset/database.js';
import { DocsetService } from './services/docset/index.js';
import { UnifiedSearchService } from './services/UnifiedSearchService.js';
import { PaginationService } from './services/PaginationService.js';
import { TokenEstimator } from './utils/TokenEstimator.js';
import chokidar from 'chokidar';
import path from 'path';
import { promises as fs } from 'fs';
import fsExtra from 'fs-extra';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DocsServer {
  constructor(options = {}) {
    this.options = {
      docsPath: options.docsPath || './doc-bot',
      verbose: options.verbose || false,
      watch: options.watch || false,
      ...options
    };
    
    // Cache for prompt templates
    this.promptTemplates = {};
    
    // Track search attempts per session/query pattern
    this.searchAttempts = new Map();
    
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
    
    this.docService = new DocumentationService(this.options.docsPath);
    this.inferenceEngine = new InferenceEngine(this.docService);
    
    // Initialize docset services
    const docsetsPath = this.options.docsetsPath || path.join(os.homedir(), 'Developer', 'DocSets');
    this.docsetService = new DocsetService(docsetsPath);
    this.multiDocsetDb = new MultiDocsetDatabase();
    
    // Initialize unified search
    this.unifiedSearch = new UnifiedSearchService(this.docService, this.multiDocsetDb);
    
    // Initialize pagination service
    this.paginationService = new PaginationService();
    
    this.setupHandlers();
    
    if (this.options.watch) {
      this.setupWatcher();
    }
  }

  async loadPromptTemplate(templateName) {
    if (!this.promptTemplates[templateName]) {
      // Try markdown first, fall back to txt for backward compatibility
      const mdPath = path.join(__dirname, '../prompts', `${templateName}.md`);
      const txtPath = path.join(__dirname, '../prompts', `${templateName}.txt`);
      
      try {
        // Try loading markdown version first
        this.promptTemplates[templateName] = await fs.readFile(mdPath, 'utf8');
      } catch (mdError) {
        try {
          // Fall back to txt version
          this.promptTemplates[templateName] = await fs.readFile(txtPath, 'utf8');
        } catch (txtError) {
          console.error(`Failed to load prompt template ${templateName}:`, mdError.message);
          return null;
        }
      }
    }
    return this.promptTemplates[templateName];
  }
  
  setupHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'docs://search',
            name: 'Documentation Store',
            description: 'All project documentation entries with metadata and content',
            mimeType: 'application/json'
          },
          {
            uri: 'docs://index',
            name: 'Document Index',
            description: 'Titles and metadata for all documentation entries',
            mimeType: 'application/json'
          },
          {
            uri: 'docs://system-prompt',
            name: 'Agent Guidance',
            description: 'Suggested guidance for using doc-bot documentation tools',
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
          
        case 'docs://index':
          const documentIndex = await this.docService.getDocumentIndex();
          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(documentIndex, null, 2)
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
            description: 'Search project documentation and installed API references for patterns, examples, and usage details. Use early and often to stay aligned with current docs.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Technical search terms. Examples: "URLSession", "WidgetKit", "CoreData"'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum results per page. Default: 20'
                },
                page: {
                  type: 'number',
                  description: 'Page number for paginated results. Default: 1'
                },
                docsetId: {
                  type: 'string',
                  description: 'Filter results to specific documentation set'
                },
                type: {
                  type: 'string',
                  description: 'Filter API results by type: "Class", "Method", "Function", "Property", "Framework", "Protocol", "Enum"'
                }
              },
              required: ['query']
            }
          },
          {
            name: 'get_file_docs',
            description: 'Get documentation that matches a file path or pattern using frontmatter filePatterns. Use when editing a specific file or directory.',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'File path or pattern. Examples: "src/components/Button.tsx", "**/*.test.js", "services/auth/*"'
                }
              },
              required: ['filePath']
            }
          },
          {
            name: 'read_specific_document',
            description: 'Read full documentation file content when you need complete context.',
            inputSchema: {
              type: 'object',
              properties: {
                fileName: {
                  type: 'string',
                  description: 'Name of the documentation file to read. Must match exactly. Example: "coding-standards.md"'
                },
                page: {
                  type: 'number',
                  description: 'Page number for paginated content. Default: 1'
                }
              },
              required: ['fileName']
            }
          },
          {
            name: 'explore_api',
            description: 'Deep dive into any API, framework, or class from installed docsets.',
            inputSchema: {
              type: 'object',
              properties: {
                apiName: {
                  type: 'string',
                  description: 'API, framework, or class name. Examples: "URLSession", "WidgetKit", "SwiftUI.View", "React.Component"'
                },
                docsetId: {
                  type: 'string',
                  description: 'Limit exploration to specific documentation set'
                }
              },
              required: ['apiName']
            }
          },
          {
            name: 'create_or_update_rule',
            description: 'Create or update documentation as you discover new patterns, decisions, or changes. Use this to keep docs current for future agents.',
            inputSchema: {
              type: 'object',
              properties: {
                fileName: {
                  type: 'string',
                  description: 'Documentation file name. Must end with .md. Example: "api-patterns.md"'
                },
                title: {
                  type: 'string',
                  description: 'Document title for display and search'
                },
                description: {
                  type: 'string',
                  description: 'Brief summary of the document\'s purpose'
                },
                keywords: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Search keywords. Include technologies, patterns, and concepts covered'
                },
                filePatterns: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Optional file globs for contextual docs. Examples: ["**/*.test.js"]'
                },
                topics: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Optional topical tags to group related documents'
                },
                category: {
                  type: 'string',
                  description: 'Optional category label for this document'
                },
                content: {
                  type: 'string',
                  description: 'Full markdown content of the documentation'
                }
              },
              required: ['fileName', 'title', 'content']
            }
          },
          {
            name: 'refresh_documentation',
            description: 'Reload all project documentation from disk when docs are updated externally.',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false
            }
          },
          {
            name: 'get_document_index',
            description: 'List all available project documentation files with titles and metadata.',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false
            }
          },
          {
            name: 'add_docset',
            description: 'Install a new documentation set (docset) for API reference. Supports both local .docset files and direct URLs.',
            inputSchema: {
              type: 'object',
              properties: {
                source: {
                  type: 'string',
                  description: 'Path to local .docset file/directory or URL to download. Examples: "/Downloads/Swift.docset", "https://example.com/React.docset.tgz"'
                }
              },
              required: ['source']
            }
          },
          {
            name: 'remove_docset',
            description: 'Remove an installed documentation set. Use list_docsets first to see available docsets and their IDs.',
            inputSchema: {
              type: 'object',
              properties: {
                docsetId: {
                  type: 'string',
                  description: 'ID of the docset to remove. Get this from list_docsets command.'
                }
              },
              required: ['docsetId']
            }
          },
          {
            name: 'list_docsets',
            description: 'List all installed documentation sets (docsets). Shows docset IDs, names, and installation details.',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false
            }
          },
          {
            name: 'doc_bot',
            description: 'Documentation MCP guidance: suggests docs, search hints, and doc upkeep steps. Use frequently to stay aligned and capture new knowledge.',
            inputSchema: {
              type: 'object',
              properties: {
                task: {
                  type: 'string',
                  description: 'What do you need help with? Examples: "create REST API", "modify auth.js", "debug auth error", "review completion", "understand auth flow"'
                },
                page: {
                  type: 'number',
                  description: 'Page number for paginated results (default: 1). Use this when the response indicates more pages are available.'
                }
              },
              required: ['task']
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
            const unifiedQuery = args?.query;
            if (!unifiedQuery) {
              throw new Error('Query parameter is required');
            }
            const searchPage = args?.page || 1;
            const searchLimit = args?.limit || 20;

            const unifiedOptions = {
              limit: searchLimit * 3, // Get more results for pagination
              docsetId: args?.docsetId,
              type: args?.type
            };
            const allResults = await this.unifiedSearch.search(unifiedQuery, unifiedOptions);
            
            // Paginate results
            const paginatedSearchResults = this.paginationService.paginateArray(
              allResults,
              searchPage,
              searchLimit
            );
            
            // Format the current page of results
            let searchResponse = await this.formatUnifiedSearchResults(paginatedSearchResults.items, unifiedQuery);
            
            // Add pagination info if there are results
            if (paginatedSearchResults.totalItems > 0) {
              searchResponse += this.paginationService.formatPaginationInfo(paginatedSearchResults);
            }
            
            return {
              content: [{
                type: 'text',
                text: searchResponse
              }]
            };
            
          case 'get_file_docs':
            const filePath = args?.filePath;
            if (!filePath) {
              throw new Error('FilePath parameter is required');
            }
            const fileDocs = await this.docService.getContextualDocs(filePath);
            const fileDocsPage = args?.page || 1;
            const fileDocsPageSize = args?.pageSize;
            
            // Use smart pagination
            const paginatedFileDocs = this.paginationService.smartPaginate(
              fileDocs,
              (docs) => this.formatFileDocsArray(docs, filePath),
              fileDocsPage,
              fileDocsPageSize
            );
            
            // Add pagination info to response
            let fileDocsResponse = paginatedFileDocs.content;
            if (paginatedFileDocs.pagination.totalItems > 0) {
              fileDocsResponse += this.paginationService.formatPaginationInfo(paginatedFileDocs.pagination);
            }
            
            return {
              content: [{
                type: 'text',
                text: fileDocsResponse
              }]
            };
            
          case 'read_specific_document':
            const fileName = args?.fileName;
            const page = args?.page || 1;
            if (!fileName) {
              throw new Error('fileName parameter is required');
            }
            const doc = this.docService.getDocument(fileName);
            if (!doc) {
              throw new Error(`Document not found: ${fileName}`);
            }
            
            const fullContent = await this.formatSingleDocument(doc);
            const fullContentTokens = TokenEstimator.estimateTokens(fullContent);
            
            // Check if pagination is needed
            if (fullContentTokens <= 20000) {
              return {
                content: [{
                  type: 'text',
                  text: fullContent
                }]
              };
            }
            
            // Use pagination for large documents
            const contentChunks = this.paginationService.chunkText(fullContent, 20000);
            const docTotalPages = contentChunks.length;
            
            if (page < 1 || page > docTotalPages) {
              throw new Error(`Invalid page number. Must be between 1 and ${docTotalPages}`);
            }
            
            const paginationHeader = this.paginationService.formatPaginationHeader(page, docTotalPages, 1, `${fileName} content`);
            const docPageContent = contentChunks[page - 1];
            
            return {
              content: [{
                type: 'text',
                text: `${paginationHeader}\n\n${docPageContent}`
              }]
            };

          case 'explore_api':
            const apiName = args?.apiName;
            if (!apiName) {
              throw new Error('apiName parameter is required');
            }
            const exploreOptions = {
              docsetId: args?.docsetId
            };
            const apiExploration = this.multiDocsetDb.exploreAPI(apiName, exploreOptions);
            return {
              content: [{
                type: 'text',
                text: await this.formatAPIExploration(apiExploration, apiName)
              }]
            };

          case 'add_docset':
            const source = args?.source;
            if (!source) {
              throw new Error('source parameter is required');
            }
            
            try {
              const docsetInfo = await this.docsetService.addDocset(source);
              // Add to the database for searching
              this.multiDocsetDb.addDocset(docsetInfo);
              
              return {
                content: [{
                  type: 'text',
                  text: `✅ Successfully installed docset!\n\n**Name:** ${docsetInfo.name}\n**ID:** ${docsetInfo.id}\n**Path:** ${docsetInfo.path}\n\nThe docset is now available for searching with \`search_documentation\` and exploring with \`explore_api\`.`
                }]
              };
            } catch (error) {
              throw new Error(`Failed to add docset: ${error.message}`);
            }

          case 'remove_docset':
            const docsetId = args?.docsetId;
            if (!docsetId) {
              throw new Error('docsetId parameter is required');
            }
            
            try {
              await this.docsetService.removeDocset(docsetId);
              // Remove from the database
              this.multiDocsetDb.removeDocset(docsetId);
              
              return {
                content: [{
                  type: 'text',
                  text: `✅ Successfully removed docset with ID: ${docsetId}`
                }]
              };
            } catch (error) {
              throw new Error(`Failed to remove docset: ${error.message}`);
            }

          case 'list_docsets':
            const docsets = await this.docsetService.listDocsets();
            
            if (docsets.length === 0) {
              return {
                content: [{
                  type: 'text',
                  text: 'No docsets installed yet.\n\nUse `add_docset` to install documentation sets for your frameworks and libraries.'
                }]
              };
            }
            
            let output = `# Installed Documentation Sets\n\nFound ${docsets.length} docset(s):\n\n`;
            docsets.forEach((docset, index) => {
              output += `## ${index + 1}. ${docset.name}\n`;
              output += `**ID:** ${docset.id}\n`;
              output += `**Path:** ${docset.path}\n`;
              output += `**Installed:** ${new Date(docset.downloadedAt).toLocaleString()}\n\n`;
            });
            
            return {
              content: [{
                type: 'text',
                text: output
              }]
            };

          case 'create_or_update_rule':
            const {
              fileName: ruleFileName,
              title,
              description,
              keywords,
              filePatterns,
              topics,
              category,
              content
            } = args || {};
            
            if (!ruleFileName || !title || !content) {
              throw new Error('fileName, title, and content parameters are required');
            }
            
            const result = await this.createOrUpdateRule({
              fileName: ruleFileName,
              title,
              description,
              keywords,
              filePatterns,
              topics,
              category,
              content
            });
            
            return {
              content: [{
                type: 'text',
                text: result
              }]
            };

          case 'refresh_documentation':
            await this.docService.reload();
            const docCount = this.docService.documents.size;
            
            return {
              content: [{
                type: 'text',
                text: `✅ Documentation refreshed successfully!\n\n**Files indexed:** ${docCount}\n**Last updated:** ${new Date().toLocaleString()}\n\n💡 All manually added files should now be available for search and reading.`
              }]
            };

          case 'get_document_index':
            const documentIndex = await this.docService.getDocumentIndex();
            
            return {
              content: [{
                type: 'text',
                text: await this.formatDocumentIndex(documentIndex)
              }]
            };
            
          case 'doc_bot': {
            const assistantTask = args?.task || '';
            const docBotPage = args?.page || 1;
            return {
              content: [{
                type: 'text',
                text: await this.getDocumentationGuidance(assistantTask, docBotPage)
              }]
            };
          }
            
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
    const watcher = chokidar.watch(this.options.docsPath, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true
    });
    
    watcher.on('change', async (filePath) => {
      if (this.options.verbose) {
        console.error(`📄 Documentation updated: ${path.relative(process.cwd(), filePath)}`);
      }
      
      // Reload docs if documentation changed
      await this.docService.reload();
    });
  }
  
  async formatSearchResults(results, query) {
    if (!results || results.length === 0) {
      return `No documentation found for query: "${query}"`;
    }
    
    // Limit to top 10 results for context efficiency
    const topResults = results.slice(0, 10);
    
    const template = await this.loadPromptTemplate('search-results');
    if (!template) {
      // Fallback to concise format if template fails to load
      let output = `# Search Results for "${query}"\n\n`;
      output += `Found ${results.length} relevant document(s) (showing top ${topResults.length}):\n\n`;
      
      topResults.forEach((doc, index) => {
        output += `## ${index + 1}. ${doc.metadata?.title || doc.fileName}\n`;
        output += `**File:** ${doc.fileName}\n`;
        if (doc.metadata?.description) {
          output += `**Description:** ${doc.metadata.description}\n`;
        }
        if (doc.metadata?.keywords) {
          output += `**Keywords:** ${Array.isArray(doc.metadata.keywords) ? doc.metadata.keywords.join(', ') : doc.metadata.keywords}\n`;
        }
        output += `**Relevance:** ${doc.relevanceScore?.toFixed(2) || 'N/A'}\n\n`;
      });
      
      output += '\n💡 **Next Steps:** Use the `read_specific_document` tool with the file name to get the full content of any document above.\n';
      output += '💡 **Tip:** If something is missing or outdated, capture updates with `create_or_update_rule`.\n';
      return output;
    }
    
    // Format results for template - concise format
    let formattedResults = '';
    topResults.forEach((doc, index) => {
      formattedResults += `## ${index + 1}. ${doc.metadata?.title || doc.fileName}\n`;
      formattedResults += `**File:** ${doc.fileName}\n`;
      if (doc.metadata?.description) {
        formattedResults += `**Description:** ${doc.metadata.description}\n`;
      }
      if (doc.metadata?.keywords) {
        formattedResults += `**Keywords:** ${Array.isArray(doc.metadata.keywords) ? doc.metadata.keywords.join(', ') : doc.metadata.keywords}\n`;
      }
      formattedResults += `**Relevance:** ${doc.relevanceScore?.toFixed(2) || 'N/A'}\n\n`;
    });
    
    return template
      .replace('${query}', query)
      .replace('${resultCount}', results.length.toString())
      .replace('${results}', formattedResults);
  }
  
  async formatUnifiedSearchResults(results, query) {
    // Track search attempts for this query pattern
    const queryKey = query.toLowerCase().trim();
    const attemptData = this.searchAttempts.get(queryKey) || { count: 0, timestamp: Date.now() };
    attemptData.count += 1;
    attemptData.timestamp = Date.now();
    this.searchAttempts.set(queryKey, attemptData);
    
    if (!results || results.length === 0) {
      // Check if we've tried multiple times
      if (attemptData.count >= 3) {
        // Clear the counter after suggesting fallback
        this.searchAttempts.delete(queryKey);
        
        return `No documentation found for query: "${query}" in any source after ${attemptData.count} attempts.

## 🌐 Fallback Recommendation:
Since the documentation search hasn't yielded results after multiple attempts, **consider using web search** to find information about "${query}". Web searches can provide:

- Latest API documentation from official sources
- Community tutorials and examples
- Stack Overflow solutions
- Blog posts and articles

**Suggested action:** Use web search with queries like:
- "${query} documentation"
- "${query} API reference"
- "${query} example code"
- "${query} tutorial"

This will help you find the most current information beyond the local documentation.`;
      }
      
      return `No documentation found for query: "${query}" in any source.

Try:
- Using different search terms or keywords
- Searching for related concepts
- Checking if the correct docset is installed with \`list_docsets\``;
    }
    
    let output = `# Search Results for "${query}"\n\n`;
    output += `Found ${results.length} relevant result(s):\n\n`;
    
    // Group results by source
    const localResults = results.filter(r => r.type === 'local');
    const docsetResults = results.filter(r => r.type === 'docset');
    
    // Highlight the most relevant results
    if (results.length > 0 && results[0].relevanceScore > 90) {
      output += `## 🎯 Highly Relevant:\n\n`;
      const topResults = results.filter(r => r.relevanceScore > 90).slice(0, 3);
      topResults.forEach(doc => {
        if (doc.type === 'local') {
          output += `- **${doc.title}** (Project Doc)\n`;
          if (doc.description) {
            output += `  ${doc.description}\n`;
          }
        } else {
          output += `- **${doc.title}** (${doc.entryType})\n`;
          // Provide context hints based on entry type
          if (doc.entryType === 'Framework') {
            output += `  📦 Import this framework to access its APIs\n`;
          } else if (doc.entryType === 'Sample') {
            output += `  📝 Example code demonstrating usage\n`;
          } else if (doc.entryType === 'Class' || doc.entryType === 'Struct') {
            output += `  🔧 Core type for ${doc.title.replace(/Kit$/, '')} functionality\n`;
          } else if (doc.entryType === 'Type' && doc.title.includes('Usage')) {
            output += `  ⚠️ Required for Info.plist permissions\n`;
          }
        }
      });
      output += '\n';
    }
    
    // Show remaining results grouped by type
    if (localResults.length > 0) {
      output += `## 📁 Project Documentation (${localResults.length})\n`;
      localResults.forEach(doc => {
        output += `- **${doc.title}**`;
        if (doc.matchedTerms && doc.matchedTerms.length > 0) {
          output += ` [matches: ${doc.matchedTerms.join(', ')}]`;
        }
        output += '\n';
        
        // Show snippet or description
        if (doc.snippet) {
          output += `  > ${doc.snippet}\n`;
        } else if (doc.description && doc.description !== doc.snippet) {
          output += `  > ${doc.description}\n`;
        }
      });
      output += '\n';
    }
    
    if (docsetResults.length > 0) {
      // Group API results by type for better organization
      const apiByType = {};
      docsetResults.forEach(doc => {
        if (!apiByType[doc.entryType]) {
          apiByType[doc.entryType] = [];
        }
        apiByType[doc.entryType].push(doc);
      });
      
      output += `## 📚 API Documentation (${docsetResults.length})\n`;
      
      // Show frameworks first
      if (apiByType['Framework']) {
        output += `### Frameworks:\n`;
        apiByType['Framework'].forEach(doc => {
          output += `- **${doc.title}** - Import to use this API\n`;
        });
        delete apiByType['Framework'];
      }
      
      // Show samples next
      if (apiByType['Sample']) {
        output += `### Code Samples:\n`;
        apiByType['Sample'].forEach(doc => {
          output += `- ${doc.title}\n`;
        });
        delete apiByType['Sample'];
      }
      
      // Show other types
      Object.entries(apiByType).forEach(([type, docs]) => {
        if (docs.length > 0) {
          output += `### ${type}s:\n`;
          docs.forEach(doc => {
            output += `- ${doc.title}\n`;
          });
        }
      });
    }
    
    // Smarter next steps based on results
    output += '\n## 💡 Next Steps:\n';
    
    // Check if we found frameworks
    const frameworks = results.filter(r => r.entryType === 'Framework');
    if (frameworks.length > 0) {
      output += `- Import framework: \`import ${frameworks[0].title}\`\n`;
    }
    
    // Check if we found samples
    const samples = results.filter(r => r.entryType === 'Sample');
    if (samples.length > 0) {
      output += `- Review code sample: "${samples[0].title}"\n`;
    }
    
    // Check if we found usage/permission entries
    const usageEntries = results.filter(r => r.title.includes('Usage'));
    if (usageEntries.length > 0) {
      output += `- Add to Info.plist: ${usageEntries[0].title}\n`;
    }
    
    if (localResults.length > 0) {
      output += `- Read project docs with \`read_specific_document\`\n`;
    }

    output += `- Use \`explore_api\` to see all methods/properties for a class\n`;

    // Add engagement hooks for continuous investigation
    output += '\n## 🔍 Keep Exploring:\n';
    output += `- Check file-specific docs with \`get_file_docs\` when you know the file path\n`;
    output += `- Explore the full API surface with \`explore_api\` if needed\n`;
    output += `- If you discover new patterns or changes, capture them with \`create_or_update_rule\`\n`;

    return output;
  }
  
  async formatAPIExploration(exploration, apiName) {
    let output = `# API Exploration: ${apiName}\n\n`;
    
    // Check if we found anything
    const hasContent = exploration.framework || 
                      exploration.classes.length > 0 || 
                      exploration.structs.length > 0 ||
                      exploration.methods.length > 0 ||
                      exploration.properties.length > 0 ||
                      exploration.samples.length > 0;
    
    if (!hasContent) {
      return `No API documentation found for "${apiName}". Try searching for a different name or check if the framework is imported.`;
    }
    
    // Framework info
    if (exploration.framework) {
      output += `## 📦 Framework\n`;
      output += `Import this framework to use its APIs:\n`;
      output += `\`\`\`swift\nimport ${exploration.framework.name}\n\`\`\`\n\n`;
    }
    
    // Code samples
    if (exploration.samples.length > 0) {
      output += `## 📝 Code Samples\n`;
      exploration.samples.forEach(sample => {
        output += `- ${sample.name}\n`;
      });
      output += '\n';
    }
    
    // Main types
    if (exploration.classes.length > 0) {
      output += `## 🔧 Classes (${exploration.classes.length})\n`;
      const topClasses = exploration.classes.slice(0, 10);
      topClasses.forEach(cls => {
        output += `- **${cls.name}**\n`;
      });
      if (exploration.classes.length > 10) {
        output += `- ... and ${exploration.classes.length - 10} more\n`;
      }
      output += '\n';
    }
    
    if (exploration.structs.length > 0) {
      output += `## 📐 Structs (${exploration.structs.length})\n`;
      const topStructs = exploration.structs.slice(0, 5);
      topStructs.forEach(struct => {
        output += `- **${struct.name}**\n`;
      });
      if (exploration.structs.length > 5) {
        output += `- ... and ${exploration.structs.length - 5} more\n`;
      }
      output += '\n';
    }
    
    if (exploration.protocols.length > 0) {
      output += `## 🔌 Protocols (${exploration.protocols.length})\n`;
      exploration.protocols.slice(0, 5).forEach(proto => {
        output += `- ${proto.name}\n`;
      });
      output += '\n';
    }
    
    // Methods and Properties
    if (exploration.methods.length > 0) {
      output += `## 🔨 Methods (${exploration.methods.length})\n`;
      const methodsByPrefix = {};
      
      // Group methods by their prefix
      exploration.methods.forEach(method => {
        const prefix = method.name.split('(')[0].split(':')[0];
        if (!methodsByPrefix[prefix]) {
          methodsByPrefix[prefix] = [];
        }
        methodsByPrefix[prefix].push(method);
      });
      
      // Show top method groups
      const prefixes = Object.keys(methodsByPrefix).slice(0, 5);
      prefixes.forEach(prefix => {
        const methods = methodsByPrefix[prefix];
        output += `- **${prefix}** (${methods.length} variant${methods.length > 1 ? 's' : ''})\n`;
      });
      if (Object.keys(methodsByPrefix).length > 5) {
        output += `- ... and more method groups\n`;
      }
      output += '\n';
    }
    
    if (exploration.properties.length > 0) {
      output += `## 📊 Properties (${exploration.properties.length})\n`;
      exploration.properties.slice(0, 10).forEach(prop => {
        output += `- ${prop.name}\n`;
      });
      if (exploration.properties.length > 10) {
        output += `- ... and ${exploration.properties.length - 10} more\n`;
      }
      output += '\n';
    }
    
    // Constants and Enums
    if (exploration.enums.length > 0) {
      output += `## 📋 Enums (${exploration.enums.length})\n`;
      exploration.enums.slice(0, 5).forEach(e => {
        output += `- ${e.name}\n`;
      });
      output += '\n';
    }
    
    if (exploration.constants.length > 0) {
      output += `## 🔢 Constants (${exploration.constants.length})\n`;
      exploration.constants.slice(0, 5).forEach(c => {
        output += `- ${c.name}\n`;
      });
      output += '\n';
    }
    
    // Next steps
    output += `## 💡 Next Steps:\n`;
    output += `- Use \`search_documentation\` with specific class/method names for details\n`;
    if (exploration.samples.length > 0) {
      output += `- Review the code samples for implementation examples\n`;
    }
    output += `- Import the framework and start using these APIs\n`;

    // Add project-specific context suggestions
    output += `\n## 🔍 Project-Specific Context:\n`;
    output += `- Your project may use ${apiName} differently than the generic reference\n`;
    output += `- Use \`search_documentation("${apiName}")\` to find local usage patterns\n`;
    output += `- Use \`get_file_docs(filePath)\` when you know the file you will modify\n`;
    output += `- Capture newly discovered patterns with \`create_or_update_rule\`\n`;

    return output;
  }
  
  async formatFileDocs(fileDocs, filePath) {
    if (!fileDocs || fileDocs.length === 0) {
      return `No specific documentation found for file: ${filePath}`;
    }
    
    const template = await this.loadPromptTemplate('file-docs');
    if (!template) {
      // Fallback to original format
      let output = `# Documentation for ${filePath}\n\n`;
      
      fileDocs.forEach(doc => {
        output += `## ${doc.metadata?.title || doc.fileName}\n`;
        output += `${doc.content}\n\n`;
      });
      
      return output;
    }
    
    // Build docs content for template
    let docsContent = '';
    fileDocs.forEach(doc => {
      docsContent += `## ${doc.metadata?.title || doc.fileName}\n`;
      docsContent += `${doc.content}\n\n`;
    });
    
    return template
      .replace('${filePath}', filePath)
      .replace('${docsContent}', docsContent);
  }
  
  // Array formatting method for pagination
  formatFileDocsArray(fileDocs, filePath) {
    if (!fileDocs || fileDocs.length === 0) {
      return `No specific documentation found for file: ${filePath}`;
    }

    let output = `# Documentation for ${filePath}\n\n`;

    fileDocs.forEach(doc => {
      output += `## ${doc.metadata?.title || doc.fileName}\n`;
      if (doc.metadata?.description) {
        output += `**Description:** ${doc.metadata.description}\n\n`;
      }
      output += `${doc.content}\n\n`;
      output += '---\n\n';
    });

    // Add helpful reminder
    output += `## 💡 Helpful Context:\n`;
    output += `These docs are matched to **${filePath}** by file patterns.\n\n`;
    output += `**Notes**:\n`;
    output += `- Other directories may have different guidance\n`;
    output += `- If you discover missing or outdated details, update docs with \`create_or_update_rule\`\n`;

    return output;
  }
  
  async formatSingleDocument(doc) {
    if (!doc) {
      return 'Document not found';
    }

    let output = `# ${doc.metadata?.title || doc.fileName}\n\n`;

    if (doc.metadata?.description) {
      output += `**Description:** ${doc.metadata.description}\n\n`;
    }

    if (doc.metadata?.keywords) {
      output += `**Keywords:** ${Array.isArray(doc.metadata.keywords) ? doc.metadata.keywords.join(', ') : doc.metadata.keywords}\n\n`;
    }

    output += `**File:** ${doc.fileName}\n\n`;
    output += '---\n\n';
    output += doc.content;

    // Add cross-reference suggestions
    output += `\n\n---\n\n`;
    output += `## 🔍 Related Documentation:\n`;
    if (doc.metadata?.keywords && doc.metadata.keywords.length > 0) {
      output += `Consider searching for related topics:\n`;
      const keywords = Array.isArray(doc.metadata.keywords) ? doc.metadata.keywords : [doc.metadata.keywords];
      keywords.slice(0, 3).forEach(keyword => {
        output += `- \`search_documentation("${keyword}")\`\n`;
      });
    }
    output += `\n💡 **Tip:** If this document is missing information, capture updates with \`create_or_update_rule\`.\n`;

    return output;
  }

  async formatDocumentIndex(documentIndex) {
    if (!documentIndex || documentIndex.length === 0) {
      return 'No documents found in the store.';
    }
    
    let output = '# Document Index\n\n';
    output += `Found ${documentIndex.length} document(s) in the store:\n\n`;
    
    documentIndex.forEach((doc, index) => {
      output += `## ${index + 1}. ${doc.title}\n\n`;
      output += `**File:** ${doc.fileName}\n`;
      
      if (doc.description) {
        output += `**Description:** ${doc.description}\n`;
      }
      
      output += `**Last Updated:** ${new Date(doc.lastUpdated).toLocaleString()}\n\n`;
      output += '---\n\n';
    });
  
    output += '💡 **Next Steps:** Use the `read_specific_document` tool with the file name to get the full content of any document above.\n';
    output += '✍️ **Keep docs current:** Use `create_or_update_rule` when you learn something new.\n';
    
    return output;
  }

  async getDocumentationGuidance(task, page = 1) {
    const normalizedTask = (task || '').trim();
    const isDocsetManagement = /add.*docset|remove.*docset|list.*docset|install.*docset/i.test(normalizedTask);
    const isDocUpdate = /add.*doc|create.*doc|update.*doc|document.*pattern|capture.*pattern|add.*rule|update.*rule/i.test(normalizedTask);
    const isDocumentManagement = /refresh.*doc|reload.*doc|index.*doc|get.*index/i.test(normalizedTask);

    if (isDocsetManagement) {
      let guidance = `# 📦 Docset Management\n\n`;

      if (/list/i.test(normalizedTask)) {
        guidance += `**Action**: \`list_docsets()\`\n\n`;
        guidance += `Shows all installed documentation sets with their IDs and metadata.\n`;
      } else if (/add|install/i.test(normalizedTask)) {
        guidance += `**Action**: \`add_docset(source: "path or URL")\`\n\n`;
        guidance += `**Examples**:\n`;
        guidance += `- Local: \`add_docset(source: "/Downloads/Swift.docset")\`\n`;
        guidance += `- URL: \`add_docset(source: "https://example.com/React.docset.tgz")\`\n`;
      } else if (/remove/i.test(normalizedTask)) {
        guidance += `**Steps**:\n`;
        guidance += `1. \`list_docsets()\` - Get the docset ID\n`;
        guidance += `2. \`remove_docset(docsetId: "id-from-step-1")\`\n`;
      }

      return guidance;
    }

    if (isDocUpdate) {
      let guidance = `# 📝 Documentation Update\n\n`;
      guidance += `**Action**: \`create_or_update_rule(...)\`\n\n`;
      guidance += `**Parameters**:\n`;
      guidance += `\`\`\`javascript\n`;
      guidance += `{\n`;
      guidance += `  fileName: "descriptive-name.md",\n`;
      guidance += `  title: "Clear documentation title",\n`;
      guidance += `  content: "Full markdown documentation",\n`;
      guidance += `  keywords: ["search", "terms"],\n`;
      guidance += `  description: "Brief summary",\n`;
      guidance += `  filePatterns: ["**/*.test.js"], // optional\n`;
      guidance += `  topics: ["testing"], // optional\n`;
      guidance += `  category: "qa" // optional\n`;
      guidance += `}\n`;
      guidance += `\`\`\`\n`;
      return guidance;
    }

    if (isDocumentManagement) {
      let guidance = `# 🔄 Documentation Management\n\n`;

      if (/refresh|reload/i.test(normalizedTask)) {
        guidance += `**Action**: \`refresh_documentation()\`\n\n`;
        guidance += `Reloads all documentation from disk and rebuilds search indexes.\n`;
      } else {
        guidance += `**Action**: \`get_document_index()\`\n\n`;
        guidance += `Lists all available documentation files with metadata.\n`;
      }

      return guidance;
    }

    const context = normalizedTask ? { query: normalizedTask } : {};
    const relevantDocs = normalizedTask
      ? await this.inferenceEngine.getRelevantDocumentation(context)
      : { contextualDocs: [], inferredDocs: [], confidence: 0 };
    const combinedDocs = this.mergeRelevantDocs(relevantDocs.contextualDocs, relevantDocs.inferredDocs);
    const paginatedDocs = this.paginationService.paginateArray(combinedDocs, page, 5);
    const searchHints = this.extractSearchHints(normalizedTask);

    let response = `# Documentation Guidance\n\n`;
    response += `doc-bot is a documentation MCP server. Reference it frequently to stay aligned and keep docs current.\n\n`;
    response += `Task: ${normalizedTask || 'General inquiry'}\n\n`;
    response += this.getAgentLoopGuidance();

    if (combinedDocs.length === 0) {
      response += `No directly matched docs yet.\n\n`;
    } else {
      response += `## Suggested Docs (${combinedDocs.length})\n\n`;
      paginatedDocs.items.forEach((doc, index) => {
        response += `### ${index + 1}. ${doc.metadata?.title || doc.fileName}\n`;
        response += `**File:** ${doc.fileName}\n`;
        if (doc.metadata?.description) {
          response += `**Description:** ${doc.metadata.description}\n`;
        }
        if (doc.inferenceScore) {
          response += `**Relevance:** ${doc.inferenceScore.toFixed(1)}\n`;
        }
        response += '\n';
      });

      response += this.paginationService.formatPaginationInfo(paginatedDocs);
    }

    if (searchHints.length > 0) {
      response += `\n## Suggested Searches\n`;
      searchHints.forEach(term => {
        response += `- \`search_documentation("${term}")\`\n`;
      });
      response += '\n';
    }

    response += `## Recommended Actions\n`;
    response += `- Use \`search_documentation\` to dig deeper into patterns and examples\n`;
    response += `- Use \`read_specific_document\` for full context\n`;
    response += `- Use \`get_file_docs\` when you know the file being edited\n`;
    response += `- Capture new knowledge with \`create_or_update_rule\`\n`;

    response += this.getToolCatalog();

    return response;
  }

  getToolCatalog() {
    let catalog = `\n---\n\n`;
    catalog += `## Documentation Tools\n\n`;
    catalog += `Use these often to stay aligned and keep docs current.\n\n`;
    catalog += `**\`doc_bot(task)\`** - Guidance on docs, searches, and upkeep\n`;
    catalog += `**\`search_documentation(query)\`** - Search project docs and docsets\n`;
    catalog += `**\`read_specific_document(fileName)\`** - Read full documentation files\n`;
    catalog += `**\`get_file_docs(filePath)\`** - Get docs matched by file patterns\n`;
    catalog += `**\`get_document_index()\`** - List all docs with metadata\n`;
    catalog += `**\`explore_api(apiName)\`** - Inspect API references in docsets\n`;
    catalog += `**\`create_or_update_rule(...)\`** - Add or update documentation\n`;
    catalog += `**\`refresh_documentation()\`** - Reload docs after changes\n`;

    return catalog;
  }

  getAgentLoopGuidance() {
    let guidance = `## Fast Documentation Loop\n\n`;
    guidance += `1. Start with \`doc_bot(task)\` or \`get_document_index()\` when the project is unfamiliar.\n`;
    guidance += `2. Use \`search_documentation\` with concrete terms (APIs, class names, errors).\n`;
    guidance += `3. Open details with \`read_specific_document\` or \`get_file_docs\` for the file path.\n`;
    guidance += `4. Capture new or corrected knowledge with \`create_or_update_rule\`.\n`;
    guidance += `5. If docs were edited manually, run \`refresh_documentation\`.\n\n`;
    guidance += `Keep docs short, scoped, and searchable (clear titles, keywords, filePatterns).\n\n`;
    return guidance;
  }

  extractSearchHints(task) {
    if (!task) {
      return [];
    }

    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'how', 'what', 'where', 'when', 'why', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'create', 'build', 'add', 'update', 'modify', 'implement', 'fix', 'debug'
    ]);

    const terms = task
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(term => term.length > 2 && !stopWords.has(term));

    return Array.from(new Set(terms)).slice(0, 3);
  }

  mergeRelevantDocs(contextualDocs, inferredDocs) {
    const combined = new Map();

    (contextualDocs || []).forEach(doc => {
      combined.set(doc.fileName, { doc, source: 'contextual' });
    });

    (inferredDocs || []).forEach(doc => {
      if (combined.has(doc.fileName)) {
        const existing = combined.get(doc.fileName);
        const score = Math.max(existing.doc.inferenceScore || 0, doc.inferenceScore || 0);
        combined.set(doc.fileName, { doc: { ...existing.doc, inferenceScore: score }, source: existing.source });
      } else {
        combined.set(doc.fileName, { doc, source: 'inferred' });
      }
    });

    return Array.from(combined.values())
      .map(entry => ({ ...entry.doc, docSource: entry.source }))
      .sort((a, b) => (b.inferenceScore || 0) - (a.inferenceScore || 0));
  }

  async createOrUpdateRule({ fileName, title, description, keywords, filePatterns, topics, category, content }) {
    try {
      // Ensure the docs directory exists
      await fsExtra.ensureDir(this.options.docsPath);
      
      // Create the full file path
      const filePath = path.join(this.options.docsPath, fileName);
      
      // Build frontmatter
      let frontmatter = '---\n';
      frontmatter += `title: "${title}"\n`;
      if (description) {
        frontmatter += `description: "${description}"\n`;
      }
      if (keywords && keywords.length > 0) {
        frontmatter += `keywords: [${keywords.map(k => `"${k}"`).join(', ')}]\n`;
      }
      if (topics && topics.length > 0) {
        frontmatter += `topics: [${topics.map(t => `"${t}"`).join(', ')}]\n`;
      }
      if (category) {
        frontmatter += `category: "${category}"\n`;
      }
      if (filePatterns && filePatterns.length > 0) {
        frontmatter += `filePatterns: [${filePatterns.map(p => `"${p}"`).join(', ')}]\n`;
      }
      frontmatter += '---\n\n';
      
      // Combine frontmatter and content
      const fullContent = frontmatter + content;
      
      // Check if file exists to determine if this is create or update
      const fileExists = await fsExtra.pathExists(filePath);
      const action = fileExists ? 'updated' : 'created';
      
      // Write the file
      await fsExtra.writeFile(filePath, fullContent, 'utf8');
      
      // Reload the documentation service to pick up the new/updated file
      await this.docService.reload();
      
      return `✅ Documentation ${action} successfully: ${fileName}\n\n` +
             `**Title**: ${title}\n` +
             `**File**: ${fileName}\n` +
             (description ? `**Description**: ${description}\n` : '') +
             (keywords && keywords.length > 0 ? `**Keywords**: ${keywords.join(', ')}\n` : '') +
             (topics && topics.length > 0 ? `**Topics**: ${topics.join(', ')}\n` : '') +
             (category ? `**Category**: ${category}\n` : '') +
             (filePatterns && filePatterns.length > 0 ? `**File Patterns**: ${filePatterns.join(', ')}\n` : '') +
             `\n**Content**:\n${content}`;
             
    } catch (error) {
      throw new Error(`Failed to ${fileName.includes('/') ? 'create' : 'update'} documentation: ${error.message}`);
    }
  }

  async generateSystemPrompt() {
    const allDocs = await this.docService.getAllDocuments();
    
    const template = await this.loadPromptTemplate('system-prompt');
    if (!template) {
      // Fallback to original format
      let prompt = '# Project Documentation Guidance\n\n';
      
      prompt += 'doc-bot is a documentation MCP server for project context and API references.\n\n';
      prompt += '## ✅ Recommended Usage\n';
      prompt += '- Reference doc-bot frequently to stay aligned with current docs\n';
      prompt += '- Search docs for patterns and examples\n';
      prompt += '- Read full documents for deeper context\n';
      prompt += '- Update documentation when you discover new patterns or changes\n';
      prompt += '- Refresh documentation after manual edits\n\n';
      
      prompt += '### 📚 Available Documentation Resources:\n';
      if (allDocs && allDocs.length > 0) {
        const docTopics = this.extractDocumentationTopics(allDocs);
        prompt += 'This project has documentation covering:\n';
        docTopics.forEach(topic => {
          prompt += `- ${topic}\n`;
        });
        prompt += '\n';
      }
      
      prompt += '### 🛠️ Helpful MCP Tools\n';
      prompt += '- `search_documentation` for patterns and examples\n';
      prompt += '- `read_specific_document` for full context\n';
      prompt += '- `get_file_docs` for file-specific guidance\n';
      prompt += '- `create_or_update_rule` to keep documentation current\n';
      prompt += '- `refresh_documentation` after manual edits\n';
      
      return prompt;
    }
    
    // Build documentation topics for template
    let documentationTopics = '';
    if (allDocs && allDocs.length > 0) {
      const docTopics = this.extractDocumentationTopics(allDocs);
      documentationTopics = 'This project has documentation covering:\n';
      docTopics.forEach(topic => {
        documentationTopics += `- ${topic}\n`;
      });
      documentationTopics += '\n';
    }
    
    return template
      .replace('${documentationTopics}', documentationTopics)
      .replace('${projectRulesSection}', '');
  }

  extractDocumentationTopics(docs) {
    const topics = new Set();
    
    docs.forEach(doc => {
      // Add topics from metadata
      if (doc.metadata?.topics) {
        doc.metadata.topics.forEach(topic => topics.add(topic));
      }
      
      // Add topics from keywords
      if (doc.metadata?.keywords) {
        doc.metadata.keywords.forEach(keyword => topics.add(keyword));
      }
      
      // Add filename-based topics
      const fileName = doc.fileName.replace(/\.(md|txt)$/, '');
      const fileTopics = fileName.split(/[-_]/).map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      );
      fileTopics.forEach(topic => topics.add(topic));
      
      // Add content-based topics (simple heuristic)
      if (doc.content) {
        const contentTopics = this.extractContentTopics(doc.content);
        contentTopics.forEach(topic => topics.add(topic));
      }
    });
    
    return Array.from(topics).slice(0, 10); // Limit to top 10 topics
  }

  extractContentTopics(content) {
    const topics = new Set();
    
    // Extract from headers
    const headers = content.match(/^#+\s+(.+)$/gm);
    if (headers) {
      headers.forEach(header => {
        const topic = header.replace(/^#+\s+/, '').trim();
        if (topic.length > 3 && topic.length < 50) {
          topics.add(topic);
        }
      });
    }
    
    // Extract common programming topics
    const programmingPatterns = [
      'Swift', 'SwiftUI', 'iOS', 'macOS', 'Architecture', 'Testing',
      'Performance', 'Security', 'Privacy', 'Patterns', 'Components',
      'API', 'Database', 'UI', 'UX', 'Analytics', 'Configuration'
    ];
    
    programmingPatterns.forEach(pattern => {
      if (content.toLowerCase().includes(pattern.toLowerCase())) {
        topics.add(pattern);
      }
    });
    
    return Array.from(topics);
  }

  extractContextualRules(allDocs) {
    const contextualRules = {};
    
    for (const doc of allDocs) {
      const patterns = doc.metadata?.filePatterns || doc.metadata?.applies || [];
      const patternArray = Array.isArray(patterns) ? patterns : (patterns ? [patterns] : []);
      
      for (const pattern of patternArray) {
        if (pattern) {
          if (!contextualRules[pattern]) {
            contextualRules[pattern] = [];
          }
          contextualRules[pattern].push(doc.fileName);
        }
      }
    }
    
    return contextualRules;
  }
  
  async start() {
    // Initialize services
    await this.docService.initialize();
    await this.inferenceEngine.initialize();
    
    // Set up periodic cleanup of search attempts (every 5 minutes)
    this.searchCleanupInterval = setInterval(() => {
      // Clear search attempts older than 10 minutes
      const now = Date.now();
      for (const [key, value] of this.searchAttempts.entries()) {
        if (typeof value === 'object' && value.timestamp && (now - value.timestamp) > 600000) {
          this.searchAttempts.delete(key);
        }
      }
    }, 300000);
    
    // Initialize docset services
    try {
      await this.docsetService.initialize();
      const docsets = await this.docsetService.listDocsets();
      
      // Load existing docsets into the database
      for (const docset of docsets) {
        this.multiDocsetDb.addDocset(docset);
      }
      
      if (this.options.verbose && docsets.length > 0) {
        console.error(`📚 Loaded ${docsets.length} docset(s)`);
      }
    } catch (error) {
      if (this.options.verbose) {
        console.error('⚠️  Warning: Failed to initialize docsets:', error.message);
      }
    }
    
    // Start server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    if (this.options.verbose) {
      console.error('🔧 Server initialized with MCP transport');
      console.error('🚀 Using frontmatter-based configuration');
    }
  }
}

export { DocsServer };
