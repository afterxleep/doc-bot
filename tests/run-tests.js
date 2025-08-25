#!/usr/bin/env node

/**
 * Main test runner for system prompt validation
 * Can run with or without AI API access
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AISystemPromptAnalyzer } from './system_prompt/ai-validation.test.js';
import { SystemPromptAnalyzer } from './system_prompt/logic-validation.js';
import { EXPECTED_BEHAVIORS, PERFORMANCE_TARGETS } from './fixtures/expected-behaviors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test queries
const queriesPath = path.join(__dirname, 'fixtures/sample-queries.json');
const sampleQueries = JSON.parse(fs.readFileSync(queriesPath, 'utf8'));

/**
 * Test runner class
 */
class SystemPromptTestRunner {
  constructor(options = {}) {
    this.useAI = options.useAI && process.env.ANTHROPIC_API_KEY;
    this.verbose = options.verbose || false;
    
    if (this.useAI) {
      this.analyzer = new AISystemPromptAnalyzer(process.env.ANTHROPIC_API_KEY);
      console.log('✅ Using AI-powered analysis with Claude Sonnet\n');
    } else {
      this.analyzer = new SystemPromptAnalyzer();
      console.log('ℹ️  Using logic-based analysis (set ANTHROPIC_API_KEY for AI testing)\n');
    }
  }

  async runAllTests() {
    console.log('='.repeat(80));
    console.log('SYSTEM PROMPT VALIDATION TEST SUITE');
    console.log('='.repeat(80));
    console.log();

    const results = {
      quickFixes: await this.testCategory('quickFixes', EXPECTED_BEHAVIORS.quickFix),
      projectDiscovery: await this.testCategory('projectDiscovery', EXPECTED_BEHAVIORS.projectDiscovery),
      featureImplementation: await this.testCategory('featureImplementation', EXPECTED_BEHAVIORS.featureImplementation),
      generalQuestions: await this.testCategory('generalQuestions', EXPECTED_BEHAVIORS.generalQuestion),
      edgeCases: await this.testCategory('edgeCases', EXPECTED_BEHAVIORS.edgeCase)
    };

    this.printSummary(results);
    this.checkPerformanceTargets(results);
    
    return results;
  }

  async testCategory(category, expectedBehavior) {
    const queries = sampleQueries[category];
    console.log(`\n${this.formatCategoryName(category).toUpperCase()}`);
    console.log('-'.repeat(40));
    console.log(`Expected: ${expectedBehavior.description}`);
    console.log();

    const results = [];
    
    for (const query of queries) {
      const result = await this.testQuery(query, expectedBehavior);
      results.push(result);
      
      if (this.verbose || !result.passed) {
        this.printResult(query, result);
      }
    }

    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    console.log(`\nCategory Score: ${passed}/${total} (${Math.round(passed/total*100)}%)`);
    
    return { category, results, passed, total, expectedBehavior };
  }

  async testQuery(query, expectedBehavior) {
    let analysis;
    
    if (this.useAI) {
      // AI-powered analysis
      analysis = await this.analyzer.analyzeIntent(query);
    } else {
      // Logic-based analysis
      analysis = this.analyzer.analyzeQuery(query);
    }

    const violations = this.validateAnalysis(analysis, expectedBehavior);
    
    return {
      query,
      analysis,
      expectedBehavior,
      violations,
      passed: violations.length === 0
    };
  }

  validateAnalysis(analysis, expected) {
    const violations = [];

    // Check time efficiency
    const timeSeconds = analysis.expectedTimeSeconds || analysis.expectedTime;
    if (timeSeconds > expected.maxTimeSeconds) {
      violations.push(`Too slow: ${timeSeconds}s > ${expected.maxTimeSeconds}s`);
    }

    // Check doc-bot usage
    const useDocBot = analysis.shouldUseDocBot || analysis.useDocBot;
    if (expected.useDocBot !== useDocBot) {
      violations.push(`Doc-bot mismatch: expected ${expected.useDocBot}, got ${useDocBot}`);
    }

    // Check tool count
    const toolCount = (analysis.expectedTools || []).length;
    if (toolCount > expected.maxTools) {
      violations.push(`Too many tools: ${toolCount} > ${expected.maxTools}`);
    }

    // Check strategy (if available)
    if (analysis.strategy && expected.strategy) {
      if (analysis.strategy !== expected.strategy) {
        violations.push(`Strategy mismatch: expected ${expected.strategy}, got ${analysis.strategy}`);
      }
    }

    return violations;
  }

  printResult(query, result) {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} "${query.substring(0, 50)}..."`);
    
    if (!result.passed) {
      result.violations.forEach(v => console.log(`   ⚠️  ${v}`));
    }
    
    if (this.verbose) {
      const analysis = result.analysis;
      console.log(`   Intent: ${analysis.intent || 'N/A'}`);
      console.log(`   Time: ${analysis.expectedTimeSeconds || analysis.expectedTime}s`);
      console.log(`   Tools: ${(analysis.expectedTools || []).join(', ') || 'none'}`);
    }
  }

  printSummary(results) {
    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));

    let totalPassed = 0;
    let totalTests = 0;

    Object.values(results).forEach(categoryResult => {
      totalPassed += categoryResult.passed;
      totalTests += categoryResult.total;
    });

    console.log(`\nTotal Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed} (${Math.round(totalPassed/totalTests*100)}%)`);
    console.log(`Failed: ${totalTests - totalPassed}`);

    // Category breakdown
    console.log('\nBy Category:');
    Object.entries(results).forEach(([category, result]) => {
      const percentage = Math.round(result.passed/result.total*100);
      console.log(`  ${this.formatCategoryName(category)}: ${result.passed}/${result.total} (${percentage}%)`);
    });
  }

  checkPerformanceTargets(results) {
    console.log('\n' + '='.repeat(80));
    console.log('PERFORMANCE METRICS');
    console.log('='.repeat(80));

    // Collect all analyses
    const allAnalyses = [];
    Object.values(results).forEach(categoryResult => {
      categoryResult.results.forEach(r => allAnalyses.push(r.analysis));
    });

    // Fast path usage
    const fastPathCount = allAnalyses.filter(a => 
      (a.strategy === 'FAST_PATH') || 
      (a.expectedTools && a.expectedTools.length === 0)
    ).length;
    const fastPathRatio = fastPathCount / allAnalyses.length;
    
    // Doc-bot avoidance
    const noDocBotCount = allAnalyses.filter(a => 
      !a.shouldUseDocBot && !a.useDocBot
    ).length;
    const docBotAvoidance = noDocBotCount / allAnalyses.length;
    
    // Average response time
    const totalTime = allAnalyses.reduce((sum, a) => 
      sum + (a.expectedTimeSeconds || a.expectedTime || 0), 0
    );
    const avgTime = Math.round(totalTime / allAnalyses.length);

    console.log('\nActual vs Target:');
    console.log(`  Fast Path Usage: ${Math.round(fastPathRatio*100)}% (target: ${PERFORMANCE_TARGETS.fastPathUsage*100}%)`);
    console.log(`  Doc-bot Avoidance: ${Math.round(docBotAvoidance*100)}% (target: ${PERFORMANCE_TARGETS.docBotAvoidance*100}%)`);
    console.log(`  Avg Response Time: ${avgTime}s (target: ${PERFORMANCE_TARGETS.averageResponseTime}s)`);

    // Check if targets are met
    const targetsMet = 
      fastPathRatio >= PERFORMANCE_TARGETS.fastPathUsage &&
      docBotAvoidance >= PERFORMANCE_TARGETS.docBotAvoidance &&
      avgTime <= PERFORMANCE_TARGETS.averageResponseTime;

    if (targetsMet) {
      console.log('\n✅ All performance targets met!');
    } else {
      console.log('\n⚠️  Some performance targets not met - consider optimizing the prompt');
    }
  }

  formatCategoryName(category) {
    return category.replace(/([A-Z])/g, ' $1').trim();
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const options = {
    useAI: !args.includes('--no-ai'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node run-tests.js [options]');
    console.log('\nOptions:');
    console.log('  --no-ai    Run without AI (logic-based testing only)');
    console.log('  --verbose  Show detailed output for all tests');
    console.log('  --help     Show this help message');
    process.exit(0);
  }

  const runner = new SystemPromptTestRunner(options);
  
  try {
    const results = await runner.runAllTests();
    
    // Exit with error code if tests failed
    const allPassed = Object.values(results).every(r => r.passed === r.total);
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('Test execution failed:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
export { SystemPromptTestRunner };

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}