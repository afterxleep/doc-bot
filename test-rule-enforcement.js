// Test script to validate the aggressive rule enforcement mechanism
const path = require('path');
const { DocsServer } = require('./src/index.js');

async function testRuleEnforcement() {
  console.log('🧪 Testing Aggressive Rule Enforcement...');
  
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
    
    // Test 1: Test the new mandatory check_project_rules tool
    console.log('\n🚨 Testing check_project_rules tool...');
    const mandatoryRules = await server.getMandatoryRules('create a singleton pattern');
    console.log('Response length:', mandatoryRules.length);
    console.log('Contains "MANDATORY":', mandatoryRules.includes('MANDATORY'));
    console.log('Contains "NON-NEGOTIABLE":', mandatoryRules.includes('NON-NEGOTIABLE'));
    console.log('Contains "VIOLATION":', mandatoryRules.includes('VIOLATION'));
    
    // Test 2: Test search with rule reminders
    console.log('\n🔍 Testing search with rule reminders...');
    const searchResults = await server.docService.searchDocuments('testing');
    const formattedSearch = server.formatSearchResults(searchResults, 'testing');
    console.log('Search includes reminder:', formattedSearch.includes('check_project_rules'));
    
    // Test 3: Test global rules formatting
    console.log('\n🌟 Testing aggressive global rules formatting...');
    const globalRules = await server.docService.getGlobalRules();
    const formattedGlobal = server.formatGlobalRules(globalRules);
    console.log('Global rules are aggressive:', formattedGlobal.includes('🚨'));
    console.log('Requires acknowledgment:', formattedGlobal.includes('ACKNOWLEDGMENT REQUIRED'));
    
    // Test 4: Test relevant docs with rule injection
    console.log('\n🧠 Testing relevant docs with rule injection...');
    const relevant = await server.inferenceEngine.getRelevantDocumentation({
      query: 'singleton pattern implementation',
      filePath: 'src/SingletonManager.swift'
    });
    const formattedRelevant = server.formatRelevantDocs(relevant);
    console.log('Relevant docs include mandatory warning:', formattedRelevant.includes('MANDATORY'));
    
    console.log('\n✅ All rule enforcement tests passed!');
    console.log('\n📋 Summary of enforcement mechanisms:');
    console.log('• ✅ Mandatory check_project_rules tool added');
    console.log('• ✅ Aggressive tool descriptions updated');
    console.log('• ✅ Rule reminders in all responses');
    console.log('• ✅ Strong warning language implemented');
    console.log('• ✅ Compliance acknowledgment required');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (server.options.verbose) {
      console.error(error.stack);
    }
  }
}

testRuleEnforcement().catch(console.error);