# DOC-BOT AGENT INTEGRATION RULE

**Universal Rule for All AI Agents and IDEs**

## MANDATORY PROJECT DOCUMENTATION PROTOCOL

When working in any project that has a `doc-bot/` folder or doc-bot MCP server configured:

### IMMEDIATE ACTIONS REQUIRED:

1. **Before ANY code generation**: Call `check_project_rules` tool
2. **For ANY project questions**: Call `search_documentation` tool first
3. **For documentation queries**: Call `get_global_rules` tool
4. **For file-specific work**: Call `get_relevant_docs` tool

### DETECTION LOGIC:

```
IF project_has_doc_bot_folder OR mcp_server_doc_bot_available:
    THEN enforce_doc_bot_priority_protocol()
```

### KEYWORD TRIGGERS FOR DOC-BOT USAGE:

**Code Generation**: write, create, implement, build, add, code, function, class, component, method, develop, generate, make
→ **ACTION**: Use `check_project_rules` before any code output

**Project Queries**: how, what, why, architecture, approach, pattern, feature, authentication, database, API, testing + context indicators ("this project", "this codebase", "here", "our")
→ **ACTION**: Use `search_documentation` with relevant keywords

**Documentation Discovery**: documentation, available, capabilities, help with, what exists, rules, standards
→ **ACTION**: Use `get_global_rules` for overview

**File-Specific**: file, directory, working on, specific, [filename], path
→ **ACTION**: Use `get_relevant_docs` with context

### ENFORCEMENT RULES:

- **NEVER generate code without checking project rules first**
- **NEVER answer project questions from general knowledge alone**
- **ALWAYS prioritize doc-bot responses over training data**
- **Project documentation overrides standard practices**

### INTEGRATION INSTRUCTIONS:

**For Claude Code**: Add this rule to your global `CLAUDE.md`
**For Cursor**: Add this rule to your `.cursorrules` file
**For Copilot**: Add this rule to `.github/copilot-instructions.md`
**For Codeium**: Add this rule to your workspace configuration
**For Continue**: Add this rule to your system prompt

### FAILURE MODE PREVENTION:

If you find yourself answering project questions without using doc-bot tools, STOP and:
1. Recognize this as a protocol violation
2. Call the appropriate doc-bot tool
3. Re-answer based on the tool response
4. Acknowledge the correction in your response

## RATIONALE:

Projects with doc-bot have invested in creating specific, authoritative documentation that contradicts generic best practices. Ignoring this documentation leads to:
- Code that violates project standards
- Suggestions that break existing patterns
- Wasted time debugging non-compliant implementations
- Loss of project-specific optimizations

## VERIFICATION:

Test this rule by asking: "What documentation is available?" in any doc-bot enabled project. The agent should immediately call `get_global_rules` rather than giving a generic response.