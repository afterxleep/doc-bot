/**
 * Expected behaviors for different query types
 * Used to validate that the system responds appropriately
 */

export const EXPECTED_BEHAVIORS = {
  quickFix: {
    maxTimeSeconds: 30,
    useDocBot: false,
    maxTools: 0,
    strategy: 'FAST_PATH',
    description: 'Simple fixes that any developer can handle without project context'
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
  // If query contains these, skip doc-bot
  skipDocBotTriggers: [
    'typo', 'syntax error', 'undefined', 'missing import',
    'rename', 'add comment', 'console.log', 'quick', 'just',
    'simple', 'for now'
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