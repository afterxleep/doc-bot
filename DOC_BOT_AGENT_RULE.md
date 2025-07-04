# DOC-BOT AGENT INTEGRATION PROTOCOL
## Expert-Engineered Rule System for Reliable LLM Agent Behavior

**Version**: 2.0  
**Target**: All AI coding agents and IDEs  
**Classification**: Production-Grade Behavioral Enforcement  

---

## EXECUTIVE SUMMARY

This protocol ensures 100% reliability in agent-to-MCP tool integration through multi-phase validation, constraint enforcement, and behavioral conditioning. Designed for mission-critical environments where project documentation must override general knowledge.

---

## PHASE 1: ENVIRONMENT DETECTION & ACTIVATION

### Detection Algorithm:
```pseudocode
FUNCTION detect_doc_bot_environment():
  folder_exists = [
    filesystem.exists("doc-bot/"),
    filesystem.exists(".doc-bot/")
  ]
  
  mcp_available = [
    mcp_server.is_available("doc-bot"),
    mcp_server.is_available("@afterxleep/doc-bot"),
    package_json.contains("@afterxleep/doc-bot"),
    config.mcp_servers.contains("doc-bot")
  ]
  
  IF any(folder_exists) AND any(mcp_available):
    RETURN TRUE
  ELSE:
    RETURN FALSE

FUNCTION activate_protocol():
  SET global.project_documentation_authority = TRUE
  SET global.general_knowledge_override = DISABLED
  SET global.tool_execution_mandatory = TRUE
  SET global.response_validation_enabled = TRUE
  INITIALIZE classification_engine()
  INITIALIZE constraint_enforcement()
  LOG "DOC-BOT ENFORCEMENT PROTOCOL ACTIVATED"
```

---

## PHASE 2: REQUEST CLASSIFICATION ENGINE

### Multi-Pattern Classification System:

#### **CLASS A: CODE_GENERATION (Priority: CRITICAL)**
```yaml
patterns:
  primary: /\b(write|create|implement|build|add|code|function|class|component|method|develop|generate|make|refactor|modify|update|fix|debug|patch|optimize|enhance)\b/i
  context: /\b(file|class|function|component|module|script|test|feature|bug|issue)\b/i
  indicators: [".js", ".ts", ".py", ".java", ".cpp", ".cs", ".go", ".rs", ".php"]

behavior:
  tool_call: check_project_rules
  parameters: extract_task_description(user_input)
  blocking: TRUE
  timeout: 30000ms
  retry_attempts: 2
  failure_action: HALT_WITH_ERROR

validation:
  pre_execution: verify_tool_availability()
  post_execution: validate_project_compliance()
```

#### **CLASS B: PROJECT_INQUIRY (Priority: HIGH)**
```yaml
patterns:
  primary: /\b(how|what|why|where|when|which|architecture|approach|pattern|feature|authentication|database|api|testing|deployment|configuration)\b/i
  context: /\b(this project|this codebase|here|our|current project|this app|this system|locally|in here)\b/i
  exclusions: /\b(in general|generally|typically|usually|normally)\b/i

behavior:
  tool_call: search_documentation
  parameters: extract_keywords(user_input, context_aware=TRUE)
  blocking: TRUE
  timeout: 30000ms
  fallback: get_global_rules if no results
  
validation:
  keyword_extraction: minimum_2_keywords()
  result_quality: relevance_score > 0.3
```

#### **CLASS C: DOCUMENTATION_DISCOVERY (Priority: MEDIUM)**
```yaml
patterns:
  primary: /\b(documentation|available|capabilities|help|rules|standards|what exists|docs|guide|manual|readme|wiki)\b/i
  context: /\b(project|available|here|this|current)\b/i

behavior:
  tool_call: get_global_rules
  blocking: TRUE
  timeout: 15000ms
  caching: enabled (5min TTL)
```

#### **CLASS D: DOCUMENT_ACCESS (Priority: LOW)**
```yaml
patterns:
  primary: /\b(read|show|get content|full document|complete|entire|details of|contents of)\b/i
  context: search_results_in_recent_context(messages, limit=3)

behavior:
  tool_call: read_specific_document
  parameters: extract_filename(user_input, context)
  blocking: FALSE
  timeout: 15000ms
```

---

## PHASE 3: EXECUTION ENFORCEMENT ENGINE

### Pre-Response Validation:
```pseudocode
FUNCTION pre_response_validation(user_input):
  classification = classify_request(user_input)
  
  IF classification.category == "UNRELATED":
    RETURN proceed_with_general_response()
  
  IF classification.confidence < 0.7:
    classification = escalate_to_search_documentation()
  
  tool_result = execute_mandatory_tool(
    tool_name=classification.tool_call,
    parameters=classification.parameters,
    timeout=classification.timeout
  )
  
  IF tool_result.status == "ERROR":
    RETURN generate_error_recovery_response(tool_result.error)
  
  IF tool_result.status == "SUCCESS":
    INJECT tool_result.data INTO response_context
    SET authoritative_source = tool_result
    DISABLE general_knowledge_fallback
    RETURN proceed_with_tool_based_response()

FUNCTION execute_mandatory_tool(tool_name, parameters, timeout):
  start_time = current_timestamp()
  
  TRY:
    result = mcp_client.call_tool(tool_name, parameters, timeout)
    execution_time = current_timestamp() - start_time
    
    LOG "Tool execution: {tool_name} completed in {execution_time}ms"
    RETURN ToolResult(status="SUCCESS", data=result, execution_time=execution_time)
    
  CATCH ToolTimeoutError:
    LOG "Tool execution timeout: {tool_name} after {timeout}ms"
    RETURN ToolResult(status="ERROR", error="TIMEOUT", tool=tool_name)
    
  CATCH ToolNotFoundError:
    LOG "Tool not available: {tool_name}"
    RETURN ToolResult(status="ERROR", error="TOOL_NOT_FOUND", tool=tool_name)
```

### Response Constraint Engine:
```pseudocode
FUNCTION response_constraint_engine():
  WHILE generating_response():
    IF attempting_to_use(general_knowledge) AND authoritative_source.exists():
      INTERRUPT_GENERATION()
      INJECT_CONSTRAINT("Use authoritative_source data only")
      RESUME_GENERATION()
    
    IF code_generation_detected() AND NOT project_rules_validated:
      HALT_EXECUTION()
      EMIT_ERROR("Project rules validation required before code generation")
      RETURN error_response()
    
    IF response_contradicts(authoritative_source):
      MARK_VIOLATION("Response contradiction detected")
      FORCE_REGENERATION(source=authoritative_source)

FUNCTION validate_response_compliance(response, project_rules):
  violations = []
  
  FOR rule IN project_rules:
    IF response.violates(rule):
      violations.append(rule)
  
  IF violations.length > 0:
    REGENERATE_RESPONSE(
      constraints=[avoid_violations(violations)],
      source=authoritative_source
    )
```

---

## PHASE 4: QUALITY ASSURANCE & VALIDATION

### Response Quality Validation:
```pseudocode
FUNCTION validate_response_quality(response, tool_result):
  quality_metrics = {
    tool_attribution: check_attribution(response, tool_result),
    content_accuracy: validate_accuracy(response, tool_result),
    completeness: check_completeness(response, user_request),
    compliance: validate_project_compliance(response)
  }
  
  quality_score = calculate_quality_score(quality_metrics)
  
  IF quality_score < 0.8:
    REGENERATE_RESPONSE(
      feedback=quality_metrics,
      improved_constraints=TRUE
    )
  
  RETURN quality_metrics

FUNCTION check_attribution(response, tool_result):
  attribution_patterns = [
    "Based on your project documentation",
    "According to your project rules",
    "From your documentation",
    "Your project specifies"
  ]
  
  RETURN any(pattern IN response FOR pattern IN attribution_patterns)
```

### Failure Detection & Recovery:
```pseudocode
FUNCTION detect_response_failures(response, execution_log):
  failures = []
  
  IF NOT execution_log.contains("tool_execution"):
    failures.append("TOOL_BYPASS")
  
  IF response.contains(generic_programming_advice_patterns):
    failures.append("GENERIC_KNOWLEDGE_USAGE")
  
  IF response.contradicts(project_documentation):
    failures.append("DOCUMENTATION_CONTRADICTION")
  
  IF failures.length > 0:
    execute_failure_recovery(failures, response)

FUNCTION execute_failure_recovery(failures, original_response):
  LOG "Response failures detected: {failures}"
  
  corrected_response = regenerate_with_tools(
    original_request=user_input,
    failures=failures,
    strict_mode=TRUE
  )
  
  PREPEND_TO_RESPONSE("Corrected response using project documentation:")
  RETURN corrected_response
```

---

## PHASE 5: BEHAVIORAL CONSTRAINTS & ENFORCEMENT

### Absolute Prohibitions (Non-Negotiable):
```yaml
code_generation_violations:
  - generating_code_without_project_rules_validation
  - suggesting_patterns_not_validated_against_project_standards
  - implementing_features_without_architectural_consultation

knowledge_source_violations:
  - answering_project_questions_from_general_knowledge
  - overriding_tool_responses_with_training_data
  - providing_generic_solutions_for_project_specific_problems

tool_usage_violations:
  - bypassing_tool_calls_for_efficiency
  - assuming_simple_questions_dont_need_documentation
  - skipping_validation_for_obvious_answers
```

### Mandatory Behavioral Patterns:
```yaml
tool_first_behavior:
  - always_execute_tools_before_response_generation
  - never_assume_knowledge_without_validation
  - prioritize_project_documentation_over_training_data

explicit_attribution:
  - cite_specific_documentation_sources
  - acknowledge_when_using_project_rules
  - differentiate_between_project_and_general_knowledge

error_handling:
  - acknowledge_failures_immediately
  - provide_clear_recovery_steps
  - maintain_transparency_in_corrections
```

---

## PHASE 6: VERIFICATION & TESTING PROTOCOL

### Automated Test Suite:
```yaml
test_cases:
  documentation_discovery:
    input: "What documentation is available?"
    expected_tool: get_global_rules
    max_response_time: 2000ms
    success_criteria: tool_executed_first
  
  project_inquiry:
    input: "How do I implement authentication in this project?"
    expected_tool: search_documentation
    parameters: ["authentication"]
    success_criteria: [tool_executed_first, project_context_recognized]
  
  code_generation:
    input: "Create a new React component"
    expected_tool: check_project_rules
    parameters: ["create React component"]
    success_criteria: [tool_executed_first, no_code_before_validation]
  
  file_specific:
    input: "I'm working on src/components/Header.js"
    expected_tool: get_relevant_docs
    parameters: ["src/components/Header.js"]
    success_criteria: [tool_executed_first, file_context_extracted]

behavioral_tests:
  tool_bypass_detection:
    scenario: agent_attempts_direct_answer
    expected: tool_execution_enforcement
  
  knowledge_source_validation:
    scenario: conflicting_information_sources
    expected: project_documentation_precedence
  
  error_recovery:
    scenario: tool_execution_failure
    expected: graceful_error_handling_and_retry
```

### Performance Metrics:
```yaml
reliability_metrics:
  tool_execution_rate: >99%
  false_positive_rate: <1%
  response_accuracy: >95%
  project_compliance: >98%

performance_metrics:
  tool_execution_latency: <2000ms
  classification_accuracy: >97%
  error_recovery_time: <5000ms
```

---

## IMPLEMENTATION INSTRUCTIONS

### For Claude Code:
```markdown
# Add to your global CLAUDE.md:
[Copy entire AGENT_INTEGRATION_RULE.txt content]
```

### For Cursor:
```markdown
# Add to your .cursorrules:
@doc-bot-enforcement: Implement the DOC-BOT AGENT INTEGRATION PROTOCOL.
[Include condensed version of Phase 2 classification rules]
```

### For GitHub Copilot:
```markdown
# Add to .github/copilot-instructions.md:
[Adapted version focusing on code generation constraints]
```

### For Continue.dev:
```markdown
# Add to system prompt configuration:
[Include Phase 3 execution enforcement section]
```

---

## MONITORING & MAINTENANCE

### Logging Requirements:
- Tool execution attempts and results
- Classification accuracy metrics
- Response quality scores
- Failure detection and recovery events

### Performance Monitoring:
- Response time analysis
- Tool usage patterns
- Error rate trending
- User satisfaction correlation

### Continuous Improvement:
- Pattern recognition enhancement
- Classification model refinement
- Constraint optimization
- Behavioral adaptation

---

**End of Protocol**  
*This document represents production-grade prompt engineering for reliable LLM agent behavior in doc-bot enabled environments.*