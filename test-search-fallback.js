#!/usr/bin/env node

import { DocBotServer } from './src/index.js';

// Create a test server instance
const server = new DocBotServer({
  docsPath: './doc-bot',
  verbose: true
});

// Initialize the server services
await server.docService.initialize();
await server.inferenceEngine.initialize();
await server.docsetService.initialize();
await server.unifiedSearch.setIndexReady(true);

// Test the fallback mechanism
console.log('\n🧪 Testing search fallback mechanism...\n');

// Simulate multiple failed searches for the same query
const testQuery = 'nonexistent-api-that-will-not-be-found-xyz123';

for (let i = 1; i <= 4; i++) {
  console.log(`\n--- Attempt ${i} ---`);
  
  const results = await server.unifiedSearch.search(testQuery, { limit: 20 });
  const formattedResponse = await server.formatUnifiedSearchResults(results, testQuery);
  
  console.log(formattedResponse);
  
  // Add a small delay between attempts
  await new Promise(resolve => setTimeout(resolve, 100));
}

console.log('\n✅ Test complete. The fallback should have triggered after 3 attempts.');

// Cleanup
if (server.searchCleanupInterval) {
  clearInterval(server.searchCleanupInterval);
}

process.exit(0);