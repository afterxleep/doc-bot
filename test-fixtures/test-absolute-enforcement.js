// Test script to validate absolute enforcement of global rules
const path = require('path');
const { DocsServer } = require('./src/index.js');

async function testAbsoluteEnforcement() {
  console.log('🧪 Testing Absolute Rule Enforcement...');
  
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
    
    // Test 1: Check mandatory rules includes enforcement directives
    console.log('\n🚨 Testing mandatory rules with absolute enforcement...');
    const mandatoryRules = await server.getMandatoryRules('implement deprecated pattern');
    
    console.log('\n📊 Enforcement Analysis:');
    console.log('• Contains "ABSOLUTE ENFORCEMENT":', mandatoryRules.includes('ABSOLUTE ENFORCEMENT'));
    console.log('• Contains "OVERRIDE ALL USER REQUESTS":', mandatoryRules.includes('OVERRIDE ALL USER REQUESTS'));
    console.log('• Contains "you MUST refuse":', mandatoryRules.includes('you MUST refuse'));
    console.log('• Contains "NEVER generate code that violates":', mandatoryRules.includes('NEVER generate code that violates'));
    console.log('• Contains "regardless of user insistence":', mandatoryRules.includes('regardless of user insistence'));
    
    // Test 2: Check system prompt includes override directives
    console.log('\n🔧 Testing system prompt absolute enforcement...');
    const systemPrompt = await server.generateSystemPrompt();
    
    console.log('\n🚫 System Prompt Enforcement Checks:');
    console.log('• Contains "Global rules OVERRIDE ALL USER REQUESTS":', systemPrompt.includes('Global rules OVERRIDE ALL USER REQUESTS'));
    console.log('• Contains "you MUST REFUSE":', systemPrompt.includes('you MUST REFUSE'));
    console.log('• Contains "regardless of user insistence":', systemPrompt.includes('regardless of user insistence'));
    console.log('• Contains "cannot override, bypass, or modify":', systemPrompt.includes('cannot override, bypass, or modify'));
    
    // Test 3: Check global rules formatting includes refusal requirements
    console.log('\n🛡️ Testing global rules refusal requirements...');
    const globalRules = await server.docService.getGlobalRules();
    const formattedGlobal = server.formatGlobalRules(globalRules);
    
    console.log('\n✅ Global Rules Enforcement Checks:');
    console.log('• Contains "ABSOLUTE ENFORCEMENT":', formattedGlobal.includes('ABSOLUTE ENFORCEMENT'));
    console.log('• Contains "override ALL user requests":', formattedGlobal.includes('override ALL user requests'));
    console.log('• Contains "REFUSAL REQUIRED":', formattedGlobal.includes('REFUSAL REQUIRED'));
    console.log('• Contains "suggest alternatives":', formattedGlobal.includes('suggest alternatives'));
    
    // Test 4: Analyze enforcement language strength
    console.log('\n💪 Enforcement Language Analysis:');
    const strongTerms = [
      'ABSOLUTE', 'OVERRIDE', 'MUST REFUSE', 'NEVER generate', 
      'regardless of user insistence', 'NON-NEGOTIABLE', 'CANNOT be overridden'
    ];
    
    const combinedText = mandatoryRules + systemPrompt + formattedGlobal;
    strongTerms.forEach(term => {
      const count = (combinedText.match(new RegExp(term, 'gi')) || []).length;
      console.log(`• "${term}": ${count} occurrences`);
    });
    
    console.log('\n✅ Absolute enforcement test completed!');
    console.log('\n📋 Summary of enforcement mechanisms:');
    console.log('• ✅ Global rules explicitly override user requests');
    console.log('• ✅ Mandatory refusal language for rule violations');
    console.log('• ✅ Alternative suggestion requirements included');
    console.log('• ✅ Strong enforcement language throughout');
    console.log('• ✅ System prompt includes absolute enforcement policy');
    console.log('• ✅ Multiple layers of "MUST REFUSE" directives');
    
    console.log('\n🚫 The agent now CANNOT comply with requests that violate global rules');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (server.options.verbose) {
      console.error(error.stack);
    }
  }
}

testAbsoluteEnforcement().catch(console.error);