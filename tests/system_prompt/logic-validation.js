/**
 * Logic-based System Prompt Validation
 * 
 * Tests the decision logic without requiring AI API calls.
 * Validates that the system makes appropriate decisions based on
 * the optimized prompt rules.
 */

import { DECISION_RULES } from '../fixtures/expected-behaviors.js';

/**
 * Rule-based analyzer that follows the optimized system prompt logic
 */
export class SystemPromptAnalyzer {
  constructor() {
    this.decisionRules = DECISION_RULES;
  }

  analyzeQuery(query, context = {}) {
    const queryLower = query.toLowerCase();

    // Rule 1: Previous searches failed - use agent knowledge
    if (context.previousSearchesFailed) {
      return this.createDecision({
        intent: 'QUICK_FIX',
        strategy: 'FAST_PATH',
        useDocBot: false,
        expectedTools: [],
        maxSearchAttempts: 0,
        expectedTime: 15,
        reasoning: 'Previous searches failed, using general knowledge'
      });
    }

    // Rule 2: Ultra-fast triggers - no doc-bot needed
    if (this.hasAnyTrigger(queryLower, this.decisionRules.skipDocBotTriggers)) {
      return this.createDecision({
        intent: 'QUICK_FIX',
        strategy: 'FAST_PATH',
        useDocBot: false,
        expectedTools: [],
        maxSearchAttempts: 0,
        expectedTime: 10,
        reasoning: 'Universal programming task - no project context needed'
      });
    }

    // Rule 3: Error with stack trace - fast fix
    if (context.hasStackTrace || this.isErrorQuery(queryLower)) {
      return this.createDecision({
        intent: 'QUICK_FIX',
        strategy: 'FAST_PATH',
        useDocBot: false,
        expectedTools: [],
        maxSearchAttempts: 0,
        expectedTime: 30,
        reasoning: 'Error fix - prioritizing speed'
      });
    }

    // Rule 4: Project-specific discovery
    if (this.hasAnyTrigger(queryLower, this.decisionRules.useDocBotTriggers)) {
      if (this.isFeatureImplementation(queryLower)) {
        return this.createDecision({
          intent: 'FEATURE_IMPLEMENTATION',
          strategy: 'HYBRID_PATH',
          useDocBot: true,
          expectedTools: ['check_project_rules'],
          maxSearchAttempts: 1,
          expectedTime: 120,
          reasoning: 'New feature needs project patterns'
        });
      }
      return this.createDecision({
        intent: 'PROJECT_DISCOVERY',
        strategy: 'DISCOVERY_PATH',
        useDocBot: true,
        expectedTools: ['search_documentation'],
        maxSearchAttempts: 2,
        expectedTime: 60,
        reasoning: 'Project-specific knowledge needed'
      });
    }

    // Rule 5: Feature implementation without project context
    if (this.isFeatureImplementation(queryLower)) {
      return this.createDecision({
        intent: 'FEATURE_IMPLEMENTATION',
        strategy: 'HYBRID_PATH',
        useDocBot: true,
        expectedTools: ['check_project_rules'],
        maxSearchAttempts: 1,
        expectedTime: 90,
        reasoning: 'Feature implementation - checking patterns'
      });
    }

    // Rule 6: General programming question
    if (this.isGeneralQuestion(queryLower)) {
      return this.createDecision({
        intent: 'GENERAL_QUESTION',
        strategy: 'FAST_PATH',
        useDocBot: false,
        expectedTools: [],
        maxSearchAttempts: 0,
        expectedTime: 15,
        reasoning: 'General programming knowledge sufficient'
      });
    }

    // Default: Start fast, enhance if needed
    return this.createDecision({
      intent: 'GENERAL_QUESTION',
      strategy: 'FAST_PATH',
      useDocBot: false,
      expectedTools: [],
      maxSearchAttempts: 0,
      expectedTime: 30,
      reasoning: 'Default to speed, enhance if user needs more'
    });
  }

  createDecision(options) {
    return {
      intent: options.intent,
      strategy: options.strategy,
      useDocBot: options.useDocBot,
      shouldUseDocBot: options.useDocBot, // For compatibility
      expectedTools: options.expectedTools,
      maxSearchAttempts: options.maxSearchAttempts,
      expectedTimeSeconds: options.expectedTime,
      expectedTime: options.expectedTime, // For compatibility
      reasoning: options.reasoning
    };
  }

  hasAnyTrigger(query, triggers) {
    return triggers.some(trigger => query.includes(trigger));
  }

  isFeatureImplementation(query) {
    const hasFeatureVerb = this.hasAnyTrigger(query, this.decisionRules.featureTriggers);
    const hasFeatureNoun = this.hasAnyTrigger(query, this.decisionRules.featureNouns);
    return hasFeatureVerb && hasFeatureNoun;
  }

  isErrorQuery(query) {
    return query.includes('error') || 
           query.includes('exception') || 
           query.includes('crash') ||
           query.includes('failing') ||
           query.includes('broken');
  }

  isGeneralQuestion(query) {
    const questionWords = ['what is', 'how does', 'why', 'explain', 'what are', "what's the"];
    const hasQuestionWord = questionWords.some(word => query.includes(word));
    const notProjectSpecific = !this.hasAnyTrigger(query, this.decisionRules.useDocBotTriggers);
    return hasQuestionWord && notProjectSpecific;
  }

  /**
   * Batch analyze multiple queries for performance testing
   */
  analyzeQueries(queries) {
    return queries.map(query => {
      if (typeof query === 'string') {
        return this.analyzeQuery(query);
      } else {
        return this.analyzeQuery(query.text, query.context);
      }
    });
  }

  /**
   * Calculate performance metrics for a set of queries
   */
  calculateMetrics(queries) {
    const analyses = this.analyzeQueries(queries);
    
    const metrics = {
      fastPathUsage: 0,
      docBotAvoidance: 0,
      averageTime: 0,
      toolUsage: {
        none: 0,
        minimal: 0,
        comprehensive: 0
      }
    };

    analyses.forEach(analysis => {
      if (analysis.strategy === 'FAST_PATH') {
        metrics.fastPathUsage++;
      }
      
      if (!analysis.useDocBot) {
        metrics.docBotAvoidance++;
      }
      
      metrics.averageTime += analysis.expectedTimeSeconds;
      
      const toolCount = analysis.expectedTools.length;
      if (toolCount === 0) {
        metrics.toolUsage.none++;
      } else if (toolCount <= 2) {
        metrics.toolUsage.minimal++;
      } else {
        metrics.toolUsage.comprehensive++;
      }
    });

    // Convert to percentages
    const total = analyses.length;
    metrics.fastPathUsage = metrics.fastPathUsage / total;
    metrics.docBotAvoidance = metrics.docBotAvoidance / total;
    metrics.averageTime = metrics.averageTime / total;
    metrics.toolUsage.none = metrics.toolUsage.none / total;
    metrics.toolUsage.minimal = metrics.toolUsage.minimal / total;
    metrics.toolUsage.comprehensive = metrics.toolUsage.comprehensive / total;

    return metrics;
  }
}

// Export for testing
export default SystemPromptAnalyzer;