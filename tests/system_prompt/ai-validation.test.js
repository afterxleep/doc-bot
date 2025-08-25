/**
 * AI-Powered System Prompt Validation Tests
 * 
 * Uses Claude Sonnet to simulate real user queries and validate
 * that the system responds appropriately according to doc-bot's
 * value proposition: speed, efficiency, and smart tool usage.
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_CONFIG = {
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 500,
  temperature: 0.3, // Lower temperature for consistent test results
  apiKey: process.env.ANTHROPIC_API_KEY || ''
};

/**
 * AI-powered analyzer that simulates how the system should interpret queries
 */
class AISystemPromptAnalyzer {
  constructor(apiKey) {
    this.anthropic = new Anthropic({ apiKey });
    this.systemPrompt = this.loadSystemPrompt();
  }

  loadSystemPrompt() {
    try {
      // Load the actual system prompt (try markdown first, then txt)
      const mdPath = path.join(__dirname, '../../prompts/system-prompt.md');
      const txtPath = path.join(__dirname, '../../prompts/system-prompt.txt');
      
      try {
        return fs.readFileSync(mdPath, 'utf8');
      } catch (mdError) {
        return fs.readFileSync(txtPath, 'utf8');
      }
    } catch (error) {
      console.warn('Could not load system prompt, using default');
      return this.getDefaultPrompt();
    }
  }

  getDefaultPrompt() {
    return `
# INTENT-DRIVEN DOCUMENTATION SYSTEM

## PRIMARY DIRECTIVE
Think like a senior developer: Understand WHAT the user needs and WHY, then decide:
1. **Fast Path**: Use agent knowledge for universal programming tasks
2. **Discovery Path**: Use doc-bot tools only when project-specific knowledge adds value
3. **Hybrid Path**: Combine both for features that need project patterns

## DECISION FRAMEWORK

### FAST PATH (0 doc-bot tools, < 30 seconds)
Triggers: Typos, syntax errors, renames, comments, standard bugs, general questions
Key: If any programmer could fix it without seeing the codebase, skip doc-bot.

### DISCOVERY PATH (Use doc-bot strategically)
Triggers: "How do WE...", "In THIS project...", architecture questions
Smart Strategy: Start specific, try broader ONCE, use agent knowledge if nothing found

### HYBRID PATH (Minimal doc-bot + agent knowledge)
Triggers: "Add/Implement X", "Optimize X", "Refactor to standards"
Execution: Quick check_project_rules, follow patterns if found, else use best practices
`;
  }

  async analyzeIntent(query, context = {}) {
    const prompt = `
You are analyzing a user query to determine the appropriate response strategy.
Based on this system prompt guidance:

${this.systemPrompt}

Analyze this user query:
"${query}"

Context: ${JSON.stringify(context)}

Return a JSON object with:
{
  "intent": "QUICK_FIX" | "PROJECT_DISCOVERY" | "FEATURE_IMPLEMENTATION" | "GENERAL_QUESTION",
  "shouldUseDocBot": boolean,
  "expectedTools": [], // array of tool names, empty if no tools needed
  "expectedTimeSeconds": number, // realistic time in seconds
  "reasoning": "one sentence explanation"
}

Focus on efficiency - minimize doc-bot usage unless truly needed for project-specific knowledge.
`;

    try {
      const response = await this.anthropic.messages.create({
        model: TEST_CONFIG.model,
        max_tokens: TEST_CONFIG.maxTokens,
        temperature: TEST_CONFIG.temperature,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        // Extract JSON from the response
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      throw new Error('Could not parse AI response');
    } catch (error) {
      console.error('AI analysis failed:', error.message);
      // Return a default analysis for testing without API
      return this.getFallbackAnalysis(query, context);
    }
  }

  getFallbackAnalysis(query, context) {
    // Simple rule-based fallback for testing without API
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('typo') || queryLower.includes('syntax') || queryLower.includes('rename')) {
      return {
        intent: 'QUICK_FIX',
        shouldUseDocBot: false,
        expectedTools: [],
        expectedTimeSeconds: 10,
        reasoning: 'Simple fix that doesn\'t need documentation'
      };
    }
    
    if (queryLower.includes('how do we') || queryLower.includes('our pattern')) {
      return {
        intent: 'PROJECT_DISCOVERY',
        shouldUseDocBot: true,
        expectedTools: ['search_documentation'],
        expectedTimeSeconds: 60,
        reasoning: 'Project-specific knowledge needed'
      };
    }
    
    if (queryLower.includes('implement') || queryLower.includes('add') && queryLower.includes('service')) {
      return {
        intent: 'FEATURE_IMPLEMENTATION',
        shouldUseDocBot: true,
        expectedTools: ['check_project_rules'],
        expectedTimeSeconds: 120,
        reasoning: 'New feature needs project patterns'
      };
    }
    
    return {
      intent: 'GENERAL_QUESTION',
      shouldUseDocBot: false,
      expectedTools: [],
      expectedTimeSeconds: 15,
      reasoning: 'General programming knowledge sufficient'
    };
  }

  async validateScenario(scenario) {
    const analysis = await this.analyzeIntent(scenario.userQuery, scenario.context);
    const violations = [];

    // Validate intent matches
    if (analysis.intent !== scenario.expected.intent) {
      violations.push(`Intent mismatch: expected ${scenario.expected.intent}, got ${analysis.intent}`);
    }

    // Validate time efficiency
    if (analysis.expectedTimeSeconds > scenario.expected.maxTimeSeconds) {
      violations.push(`Too slow: ${analysis.expectedTimeSeconds}s > ${scenario.expected.maxTimeSeconds}s`);
    }

    // Validate doc-bot usage
    const docBotToolCount = analysis.expectedTools.length;
    const expectedUsage = scenario.expected.docBotUsage;
    
    if (expectedUsage === 'none' && docBotToolCount > 0) {
      violations.push(`Unnecessary doc-bot usage: ${docBotToolCount} tools when none expected`);
    } else if (expectedUsage === 'minimal' && docBotToolCount > 2) {
      violations.push(`Excessive doc-bot usage: ${docBotToolCount} tools when minimal expected`);
    } else if (expectedUsage === 'comprehensive' && docBotToolCount === 0) {
      violations.push(`Missing doc-bot usage: no tools when comprehensive search expected`);
    }

    return {
      passed: violations.length === 0,
      analysis,
      violations
    };
  }
}

/**
 * Test scenarios covering real-world usage patterns
 */
const TEST_SCENARIOS = [
  // SPEED OPTIMIZATION SCENARIOS
  {
    category: 'Speed Optimization',
    description: 'Simple typo fix',
    userQuery: 'Fix the typo in line 42 where getUserName returns getUserNmae',
    expected: {
      intent: 'QUICK_FIX',
      maxTimeSeconds: 10,
      docBotUsage: 'none',
      tokenEfficiency: 'high'
    }
  },
  {
    category: 'Speed Optimization',
    description: 'Add debug logging',
    userQuery: 'Add console.log to debug this function',
    expected: {
      intent: 'QUICK_FIX',
      maxTimeSeconds: 15,
      docBotUsage: 'none',
      tokenEfficiency: 'high'
    }
  },
  {
    category: 'Speed Optimization',
    description: 'Fix undefined error',
    userQuery: "TypeError: Cannot read property 'name' of undefined - fix this",
    context: { hasStackTrace: true },
    expected: {
      intent: 'QUICK_FIX',
      maxTimeSeconds: 30,
      docBotUsage: 'none',
      tokenEfficiency: 'high'
    }
  },

  // PROJECT DISCOVERY SCENARIOS
  {
    category: 'Project Discovery',
    description: 'Project authentication pattern',
    userQuery: 'How do we handle authentication in this project?',
    expected: {
      intent: 'PROJECT_DISCOVERY',
      maxTimeSeconds: 60,
      docBotUsage: 'minimal',
      tokenEfficiency: 'medium'
    }
  },
  {
    category: 'Project Discovery',
    description: 'Codebase architecture',
    userQuery: "What's our pattern for API error handling?",
    expected: {
      intent: 'PROJECT_DISCOVERY',
      maxTimeSeconds: 90,
      docBotUsage: 'minimal',
      tokenEfficiency: 'medium'
    }
  },

  // FEATURE IMPLEMENTATION SCENARIOS
  {
    category: 'Feature Implementation',
    description: 'Add new API endpoint',
    userQuery: 'Implement a REST endpoint for user profile updates',
    expected: {
      intent: 'FEATURE_IMPLEMENTATION',
      maxTimeSeconds: 120,
      docBotUsage: 'minimal',
      tokenEfficiency: 'medium'
    }
  },

  // GENERAL QUESTIONS
  {
    category: 'General Questions',
    description: 'JavaScript concept',
    userQuery: 'What is a JavaScript closure?',
    expected: {
      intent: 'GENERAL_QUESTION',
      maxTimeSeconds: 10,
      docBotUsage: 'none',
      tokenEfficiency: 'high'
    }
  }
];

/**
 * Run tests
 */
async function runTests() {
  console.log('='.repeat(80));
  console.log('AI-POWERED SYSTEM PROMPT VALIDATION');
  console.log('='.repeat(80));
  console.log();

  const apiKey = TEST_CONFIG.apiKey;
  if (!apiKey) {
    console.log('⚠️  No ANTHROPIC_API_KEY found - using fallback analysis');
    console.log('   Set ANTHROPIC_API_KEY environment variable for AI-powered testing\n');
  }

  const analyzer = new AISystemPromptAnalyzer(apiKey);
  const results = [];

  for (const scenario of TEST_SCENARIOS) {
    console.log(`Testing: ${scenario.description}`);
    console.log(`Query: "${scenario.userQuery}"`);
    
    const result = await analyzer.validateScenario(scenario);
    results.push(result);
    
    if (result.passed) {
      console.log('✅ PASSED');
    } else {
      console.log('❌ FAILED');
      result.violations.forEach(v => console.log(`   - ${v}`));
    }
    
    console.log(`   Intent: ${result.analysis.intent}`);
    console.log(`   Doc-bot: ${result.analysis.shouldUseDocBot ? 'Yes' : 'No'}`);
    console.log(`   Time: ${result.analysis.expectedTimeSeconds}s`);
    console.log(`   Tools: ${result.analysis.expectedTools.join(', ') || 'none'}`);
    console.log();
  }

  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} (${Math.round(passed/total*100)}%)`);
  console.log(`Failed: ${total - passed}`);
  
  // Performance metrics
  const fastPathCount = results.filter(r => r.analysis.expectedTools.length === 0).length;
  const avgTime = results.reduce((sum, r) => sum + r.analysis.expectedTimeSeconds, 0) / total;
  
  console.log('\nPERFORMANCE METRICS:');
  console.log(`- Fast path usage: ${fastPathCount}/${total} (${Math.round(fastPathCount/total*100)}%)`);
  console.log(`- Average response time: ${Math.round(avgTime)}s`);
  console.log(`- Doc-bot avoided: ${results.filter(r => !r.analysis.shouldUseDocBot).length}/${total}`);
}

// Export for use in test runners
export { AISystemPromptAnalyzer, TEST_SCENARIOS, runTests };

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runTests().catch(console.error);
}