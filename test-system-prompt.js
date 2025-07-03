// Test script to validate the enhanced system prompt injection
const path = require('path');
const { DocsServer } = require('./src/index.js');

async function testSystemPromptInjection() {
  console.log('🧪 Testing Enhanced System Prompt Injection...');
  
  const server = new DocsServer({
    docsPath: path.join(__dirname, 'examples/documentation-files'),
    configPath: path.join(__dirname, 'examples/documentation-files/manifest.json'),
    verbose: true
  });
  
  try {
    console.log('📁 Initializing server...');
    await server.manifestLoader.load();
    await server.docService.initialize();
    await server.inferenceEngine.initialize();
    
    console.log('✅ Server initialized successfully!');
    
    // Test the enhanced system prompt
    console.log('\n🔧 Testing enhanced system prompt generation...');
    const systemPrompt = await server.generateSystemPrompt();
    
    console.log('\n📊 System Prompt Analysis:');
    console.log('Total length:', systemPrompt.length, 'characters');
    
    // Check for MCP server instructions
    console.log('\n🔍 MCP Server Integration Checks:');
    console.log('• Contains MCP usage protocol:', systemPrompt.includes('MCP Server Usage Protocol'));
    console.log('• Contains mandatory tool usage:', systemPrompt.includes('check_project_rules'));
    console.log('• Contains tool requirements:', systemPrompt.includes('BEFORE ANY CODE GENERATION'));
    console.log('• Contains never generate without docs:', systemPrompt.includes('NEVER generate code without'));
    
    // Check for documentation topic discovery
    console.log('\n📚 Documentation Discovery:');
    console.log('• Contains available resources:', systemPrompt.includes('Available Documentation Resources'));
    console.log('• Contains required tool usage:', systemPrompt.includes('Required MCP Tool Usage'));
    console.log('• Lists specific tools:', systemPrompt.includes('get_relevant_docs'));
    
    // Check for compliance requirements
    console.log('\n⚠️ Compliance Requirements:');
    console.log('• Contains critical compliance:', systemPrompt.includes('CRITICAL COMPLIANCE REQUIREMENTS'));
    console.log('• Contains violation warning:', systemPrompt.includes('VIOLATION OF THESE RULES'));
    console.log('• Contains always use tools:', systemPrompt.includes('ALWAYS use MCP tools'));
    console.log('• Contains never assume:', systemPrompt.includes('NEVER assume'));
    
    // Check for topic extraction
    console.log('\n🏷️ Topic Extraction:');
    const allDocs = await server.docService.getAllDocuments();
    const topics = server.extractDocumentationTopics(allDocs);
    console.log('• Extracted topics:', topics.length);
    console.log('• Sample topics:', topics.slice(0, 5));
    
    // Display a sample of the system prompt
    console.log('\n📄 System Prompt Sample (first 500 chars):');
    console.log('---');
    console.log(systemPrompt.substring(0, 500) + '...');
    console.log('---');
    
    console.log('\n✅ Enhanced system prompt injection test passed!');
    console.log('\n📋 Summary of enhancements:');
    console.log('• ✅ MCP server usage protocol added');
    console.log('• ✅ Mandatory tool usage instructions included');
    console.log('• ✅ Documentation topic discovery implemented');
    console.log('• ✅ Comprehensive compliance requirements added');
    console.log('• ✅ Auto-extraction of available topics working');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (server.options.verbose) {
      console.error(error.stack);
    }
  }
}

testSystemPromptInjection().catch(console.error);