// Quick test script to verify server functionality
const path = require('path');
const { DocsServer } = require('./src/index.js');

async function test() {
  console.log('🧪 Testing doc-bot...');
  
  const server = new DocsServer({
    docsPath: path.join(__dirname, 'examples/sample-project/docs.ai'),
    configPath: path.join(__dirname, 'examples/sample-project/docs.ai/manifest.json'),
    verbose: true
  });
  
  try {
    console.log('📁 Initializing server...');
    await server.manifestLoader.load();
    await server.docService.initialize();
    await server.inferenceEngine.initialize();
    
    console.log('✅ Server initialized successfully!');
    
    // Test search functionality
    console.log('\n🔍 Testing search functionality...');
    const searchResults = await server.docService.searchDocuments('testing');
    console.log(`Found ${searchResults.length} documents for "testing"`);
    
    // Test global rules
    console.log('\n🌟 Testing global rules...');
    const globalRules = await server.docService.getGlobalRules();
    console.log(`Found ${globalRules.length} global rules`);
    
    // Test inference
    console.log('\n🧠 Testing inference engine...');
    const relevant = await server.inferenceEngine.getRelevantDocumentation({
      query: 'how to write unit tests',
      filePath: 'src/components/UserProfile.test.tsx',
      codeSnippet: 'describe("UserProfile", () => {'
    });
    console.log(`Inference confidence: ${relevant.confidence.toFixed(2)}`);
    console.log(`Global rules: ${relevant.globalRules.length}`);
    console.log(`Contextual docs: ${relevant.contextualDocs.length}`);
    console.log(`Inferred docs: ${relevant.inferredDocs.length}`);
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (server.options.verbose) {
      console.error(error.stack);
    }
  }
}

test().catch(console.error);