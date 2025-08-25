/**
 * Expected behaviors for different query types
 * Used to validate that the system responds appropriately
 */

export const EXPECTED_BEHAVIORS = {
  quickFix: {
    maxTimeSeconds: 30,
    useDocBot: true,  // Changed: Must check rules for code changes
    maxTools: 1,      // Changed: check_project_rules for non-trivial fixes
    strategy: 'FAST_PATH',
    description: 'Simple fixes that still need rule compliance for code changes'
  },
  
  trivialFix: {
    maxTimeSeconds: 10,
    useDocBot: false,
    maxTools: 0,
    strategy: 'FAST_PATH',
    description: 'Truly trivial fixes like typos in comments that need no rules'
  },
  
  projectDiscovery: {
    maxTimeSeconds: 90,
    useDocBot: true,
    maxTools: 2,
    strategy: 'DISCOVERY_PATH',
    description: 'Learning about project-specific patterns and conventions'
  },
  
  featureImplementation: {
    maxTimeSeconds: 180,
    useDocBot: true,
    maxTools: 3,
    strategy: 'HYBRID_PATH',
    description: 'Building new features that should follow project patterns'
  },
  
  generalQuestion: {
    maxTimeSeconds: 20,
    useDocBot: false,
    maxTools: 0,
    strategy: 'FAST_PATH',
    description: 'General programming knowledge questions'
  },
  
  edgeCase: {
    maxTimeSeconds: 45,
    useDocBot: false,
    maxTools: 1,
    strategy: 'PROGRESSIVE',
    description: 'Vague requests that need clarification or quick action'
  }
};

/**
 * Performance benchmarks for the system
 */
export const PERFORMANCE_TARGETS = {
  fastPathUsage: 0.6,        // 60% of queries should use fast path
  docBotAvoidance: 0.5,       // 50% of queries should avoid doc-bot
  averageResponseTime: 45,    // Average response time in seconds
  searchEfficiency: 0.8,      // 80% of searches should succeed on first try
  tokenEfficiency: {
    simple: 100,              // Max tokens for simple queries
    medium: 500,              // Max tokens for medium complexity
    complex: 1500             // Max tokens for complex queries
  }
};

/**
 * Tool usage patterns
 */
export const TOOL_PATTERNS = {
  neverUseFor: [
    'typos',
    'syntax errors',
    'variable renames',
    'adding comments',
    'console.log',
    'general questions'
  ],
  
  alwaysUseFor: [
    'project patterns',
    'architecture decisions',
    'coding standards',
    'team conventions'
  ],
  
  considerFor: [
    'new features',
    'optimizations',
    'refactoring',
    'debugging complex issues'
  ]
};

/**
 * Decision rules for the analyzer
 */
export const DECISION_RULES = {
  // Only skip ALL doc-bot tools for these truly trivial tasks
  skipAllDocBotTriggers: [
    'typo in comment', 'typo in string', 
    'rename variable', 'rename function',
    'remove comment', 'remove dead code'
  ],
  
  // These still need check_project_rules but no other doc-bot tools
  needsRulesOnly: [
    'add null check', 'add error handling', 'add validation',
    'fix undefined', 'fix syntax error', 'add logging'
  ],
  
  // If query contains these, use doc-bot
  useDocBotTriggers: [
    'how do we', 'our pattern', 'this project', 'this codebase',
    'our standard', 'team convention', 'architecture'
  ],
  
  // Feature implementation keywords
  featureTriggers: [
    'implement', 'create', 'build', 'add', 'integrate'
  ],
  
  // Feature nouns that indicate complexity
  featureNouns: [
    'service', 'endpoint', 'api', 'module', 'authentication',
    'payment', 'notification', 'websocket'
  ]
};