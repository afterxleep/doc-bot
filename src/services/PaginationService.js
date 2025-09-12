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

    // Smart pagination: fit as many items as possible within token limit
    let accumulatedContent = '';
    let itemsIncluded = [];
    let startIndex = 0;
    
    // Find starting index for requested page
    if (page > 1) {
      // Estimate items per page based on average size
      const sampleSize = Math.min(5, items.length);
      const sampleContent = formatter(items.slice(0, sampleSize));
      const avgTokensPerItem = this.estimateTokens(sampleContent) / sampleSize;
      const estimatedItemsPerPage = Math.floor(20000 / avgTokensPerItem); // Conservative limit
      startIndex = (page - 1) * estimatedItemsPerPage;
      
      if (startIndex >= items.length) {
        startIndex = items.length - estimatedItemsPerPage;
      }
    }

    // Add items until we approach token limit
    for (let i = startIndex; i < items.length; i++) {
      const itemContent = formatter([items[i]]);
      const newTotal = accumulatedContent + itemContent;
      
      if (this.estimateTokens(newTotal) > 20000 && itemsIncluded.length > 0) { // Leave room for pagination info
        break;
      }
      
      accumulatedContent = newTotal;
      itemsIncluded.push(items[i]);
      
      // If even a single item exceeds limit, include it anyway
      if (itemsIncluded.length === 1 && this.estimateTokens(newTotal) > 20000) {
        break;
      }
    }

    // Calculate pagination info
    const hasMore = startIndex + itemsIncluded.length < items.length;
    const estimatedTotalPages = Math.ceil(items.length / Math.max(1, itemsIncluded.length));
    
    return {
      content: accumulatedContent,
      pagination: {
        page: page,
        itemsInPage: itemsIncluded.length,
        totalItems: items.length,
        hasMore: hasMore,
        estimatedTotalPages: estimatedTotalPages,
        nextPage: hasMore ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
        startIndex: startIndex,
        endIndex: startIndex + itemsIncluded.length
      }
    };
  }

  /**
   * Format pagination info for display
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
    
    if (pagination.itemsInPage !== undefined) {
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
        info += `➡️ Next: Add \`page: ${pagination.nextPage}\` to see more items\n`;
      }
    }
    
    return info;
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