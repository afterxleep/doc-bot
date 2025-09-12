/**
 * PaginationService - Handles response pagination for MCP server
 * Ensures responses stay within token limits (25K tokens)
 */
export class PaginationService {
  constructor(options = {}) {
    // Conservative estimate: ~4 chars per token on average
    this.maxCharsPerResponse = options.maxCharsPerResponse || 100000; // ~25K tokens
    this.defaultPageSize = options.defaultPageSize || 10;
  }

  /**
   * Estimate token count from string length
   * Uses conservative 4:1 char to token ratio
   */
  estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if response needs pagination
   */
  needsPagination(content) {
    return this.estimateTokens(content) > 24000; // Leave buffer for wrapper text
  }

  /**
   * Paginate array of items (documents, rules, etc.)
   */
  paginateArray(items, page = 1, pageSize = null) {
    if (!items || items.length === 0) {
      return {
        items: [],
        page: 1,
        pageSize: pageSize || this.defaultPageSize,
        totalPages: 0,
        totalItems: 0,
        hasMore: false
      };
    }

    const actualPageSize = pageSize || this.defaultPageSize;
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / actualPageSize);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    
    const startIndex = (currentPage - 1) * actualPageSize;
    const endIndex = Math.min(startIndex + actualPageSize, totalItems);
    
    return {
      items: items.slice(startIndex, endIndex),
      page: currentPage,
      pageSize: actualPageSize,
      totalPages,
      totalItems,
      hasMore: currentPage < totalPages,
      nextPage: currentPage < totalPages ? currentPage + 1 : null,
      prevPage: currentPage > 1 ? currentPage - 1 : null
    };
  }

  /**
   * Smart pagination that adjusts page size based on content length
   */
  smartPaginate(items, formatter, page = 1, requestedPageSize = null) {
    if (!items || items.length === 0) {
      return {
        content: 'No items found.',
        pagination: {
          page: 1,
          pageSize: 0,
          totalPages: 0,
          totalItems: 0,
          hasMore: false
        }
      };
    }

    // If specific page size requested, use standard pagination
    if (requestedPageSize) {
      const result = this.paginateArray(items, page, requestedPageSize);
      const formattedContent = formatter(result.items);
      
      return {
        content: formattedContent,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
          totalItems: result.totalItems,
          hasMore: result.hasMore,
          nextPage: result.nextPage,
          prevPage: result.prevPage
        }
      };
    }

    // First, analyze all items to detect chunking needs and build a page map
    const itemAnalysis = items.map((item, index) => {
      const singleContent = formatter([item]);
      const tokens = this.estimateTokens(singleContent);
      
      let chunks = [singleContent];
      let needsChunking = false;
      
      if (tokens > 20000) {
        chunks = this.chunkText(singleContent, 80000); // ~20k tokens
        needsChunking = chunks.length > 1;
      }
      
      return {
        index,
        item,
        tokens,
        needsChunking,
        chunks,
        pagesNeeded: needsChunking ? chunks.length : 1
      };
    });
    
    // Build a logical page map that accounts for chunked items
    const pageMap = [];
    let currentPage = 1;
    
    for (const analysis of itemAnalysis) {
      if (analysis.needsChunking) {
        // Each chunk gets its own page
        for (let chunkIndex = 0; chunkIndex < analysis.chunks.length; chunkIndex++) {
          pageMap.push({
            page: currentPage++,
            itemIndex: analysis.index,
            chunkIndex: chunkIndex,
            content: analysis.chunks[chunkIndex],
            isChunked: true,
            totalChunks: analysis.chunks.length
          });
        }
      } else {
        // Regular item gets one page
        pageMap.push({
          page: currentPage++,
          itemIndex: analysis.index,
          chunkIndex: null,
          content: analysis.chunks[0],
          isChunked: false,
          totalChunks: 1
        });
      }
    }
    
    // Find the requested page
    const requestedPageData = pageMap.find(p => p.page === page);
    
    if (!requestedPageData) {
      // Page out of range
      return {
        content: 'Page not found.',
        pagination: {
          page: page,
          itemsInPage: 0,
          totalItems: items.length,
          hasMore: false,
          estimatedTotalPages: pageMap.length,
          nextPage: null,
          prevPage: page > 1 ? Math.min(page - 1, pageMap.length) : null
        }
      };
    }
    
    // Return the content for the requested page
    return {
      content: requestedPageData.content,
      pagination: {
        page: page,
        itemsInPage: 1,
        totalItems: items.length,
        hasMore: page < pageMap.length,
        estimatedTotalPages: pageMap.length,
        nextPage: page < pageMap.length ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
        isChunked: requestedPageData.isChunked,
        chunkIndex: requestedPageData.isChunked ? requestedPageData.chunkIndex + 1 : null,
        totalChunks: requestedPageData.totalChunks,
        startIndex: requestedPageData.itemIndex,
        endIndex: requestedPageData.itemIndex + 1
      }
    };
  }

  /**
   * Format pagination info for display at the bottom of responses
   */
  formatPaginationInfo(pagination) {
    let info = '\n\n---\n';
    info += `📄 **Page ${pagination.page}`;
    
    if (pagination.totalPages) {
      info += ` of ${pagination.totalPages}`;
    } else if (pagination.estimatedTotalPages) {
      info += ` of ~${pagination.estimatedTotalPages}`;
    }
    info += '**\n';
    
    // Handle chunked content
    if (pagination.isChunked) {
      info += `📄 **Content Chunk ${pagination.chunkIndex} of ${pagination.totalChunks}** (Large document split for readability)\n`;
      info += `📊 Document ${pagination.startIndex + 1} of ${pagination.totalItems} total items\n`;
    } else if (pagination.itemsInPage !== undefined) {
      info += `📊 Showing ${pagination.itemsInPage} of ${pagination.totalItems} items\n`;
    } else if (pagination.pageSize) {
      const start = (pagination.page - 1) * pagination.pageSize + 1;
      const end = Math.min(start + pagination.pageSize - 1, pagination.totalItems);
      info += `📊 Showing items ${start}-${end} of ${pagination.totalItems}\n`;
    }
    
    if (pagination.hasMore || pagination.nextPage || pagination.prevPage) {
      info += '\n**Navigation:**\n';
      if (pagination.prevPage) {
        info += `⬅️ Previous: Add \`page: ${pagination.prevPage}\` to see previous items\n`;
      }
      if (pagination.nextPage) {
        if (pagination.isChunked && pagination.chunkIndex < pagination.totalChunks) {
          info += `➡️ Next: Add \`page: ${pagination.nextPage}\` to see next chunk\n`;
        } else {
          info += `➡️ Next: Add \`page: ${pagination.nextPage}\` to see more items\n`;
        }
      }
    }
    
    return info;
  }

  /**
   * Format pagination info for display at the TOP of responses (for agent guidance)
   */
  formatPaginationHeader(pagination) {
    let header = '📖 **LARGE DOCUMENT - PAGINATION ACTIVE**\n\n';
    header += `📄 **Current Page: ${pagination.page}`;
    
    if (pagination.totalPages) {
      header += ` of ${pagination.totalPages}`;
    } else if (pagination.estimatedTotalPages) {
      header += ` of ~${pagination.estimatedTotalPages}`;
    }
    header += '**\n';
    
    // Handle chunked content
    if (pagination.isChunked) {
      header += `📄 **Content Chunk ${pagination.chunkIndex} of ${pagination.totalChunks}** (Large document automatically split)\n`;
      header += `📊 **Content**: Document ${pagination.startIndex + 1} of ${pagination.totalItems} total items\n`;
    } else if (pagination.itemsInPage !== undefined) {
      header += `📊 **Content**: Showing ${pagination.itemsInPage} of ${pagination.totalItems} items\n`;
    }
    
    if (pagination.hasMore || pagination.nextPage || pagination.prevPage) {
      header += '\n🧭 **NAVIGATION GUIDE FOR AGENTS:**\n';
      if (pagination.prevPage) {
        header += `  • **Previous page**: Add \`page: ${pagination.prevPage}\` parameter\n`;
      }
      if (pagination.nextPage) {
        if (pagination.isChunked && pagination.chunkIndex < pagination.totalChunks) {
          header += `  • **Next page**: Add \`page: ${pagination.nextPage}\` parameter (next chunk)\n`;
        } else {
          header += `  • **Next page**: Add \`page: ${pagination.nextPage}\` parameter\n`;
        }
      }
      const maxPages = pagination.isChunked ? 
        Math.max(pagination.totalChunks, pagination.estimatedTotalPages || pagination.totalPages || 1) :
        (pagination.estimatedTotalPages || pagination.totalPages);
      if (maxPages) {
        header += `  • **Jump to page**: Use \`page: N\` (where N = 1-${maxPages})\n`;
      }
      
      if (pagination.nextPage) {
        header += '\n⚠️ **IMPORTANT**: This response is truncated. Use pagination to see the complete content.\n';
      }
    }
    
    header += '\n---\n\n';
    return header;
  }

  /**
   * Chunk large text content
   */
  chunkText(text, maxChunkSize = 80000) {
    if (!text) {
      return [text];
    }
    
    const maxTokensPerChunk = Math.floor(maxChunkSize / 4); // Convert char limit to token limit
    
    // If text is under the limit for default chunk size
    if (maxChunkSize === 80000 && this.estimateTokens(text) <= 24000) {
      return [text];
    }
    
    // If text is under the specified limit
    if (text.length <= maxChunkSize) {
      return [text];
    }

    const chunks = [];
    
    // Check if text has line breaks
    if (text.includes('\n')) {
      const lines = text.split('\n');
      let currentChunk = '';

      for (const line of lines) {
        const testChunk = currentChunk + line + '\n';
        if (testChunk.length > maxChunkSize) {
          if (currentChunk) {
            chunks.push(currentChunk);
            currentChunk = line + '\n';
          } else {
            // Single line too long, split it
            const words = line.split(' ');
            let wordChunk = '';
            for (const word of words) {
              const testWordChunk = wordChunk + word + ' ';
              if (testWordChunk.length > maxChunkSize) {
                if (wordChunk) {
                  chunks.push(wordChunk);
                }
                wordChunk = word + ' ';
              } else {
                wordChunk = testWordChunk;
              }
            }
            if (wordChunk) {
              currentChunk = wordChunk + '\n';
            }
          }
        } else {
          currentChunk = testChunk;
        }
      }

      if (currentChunk) {
        chunks.push(currentChunk);
      }
    } else {
      // No line breaks, split by character count
      let i = 0;
      while (i < text.length) {
        chunks.push(text.slice(i, i + maxChunkSize));
        i += maxChunkSize;
      }
    }

    return chunks;
  }
}