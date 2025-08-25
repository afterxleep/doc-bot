# DOCUMENTATION SEARCH RESULTS

**Query**: `${query}`  
**Results**: ${resultCount} matches

${results}

## SEARCH EFFECTIVENESS

${resultCount > 0 ? `### ✅ Results Found
**Next Steps:**
1. Read the most relevant result with \`read_specific_document\`
2. Explore APIs if needed with \`explore_api\`
3. Check compliance with \`check_project_rules\`

**Priority**: Start with exact matches, then partial matches.` : `### ⚠️ No Results Found

**Smart Fallback Strategy:**
1. **One Retry**: Try a single, more specific technical term
2. **If Still Nothing**: Use general programming knowledge
3. **Note to User**: "Implemented with industry standards"

**Search Tips:**
- Use API/class names, not descriptions
- Try parent class or framework name
- Search like reading an API index`}

## IMPLEMENTATION GUIDANCE

### With Documentation
```javascript
if (results.length > 0) {
  // Read most relevant
  await read_specific_document(results[0].fileName);
  
  // Only explore if needed
  if (needsAPIDetails) {
    await explore_api(results[0].name);
  }
}
```

### Without Documentation (After 2 Attempts)
```javascript
// Don't keep searching - use your knowledge
implementWithBestPractices();
// Be transparent
addComment("Following industry standards - verify against project patterns if needed");
```

## EFFICIENCY PRINCIPLE

**Found something useful?** → Read it and implement  
**Found nothing twice?** → Stop searching, start coding  
**User corrects you?** → Then search for their specific pattern

## THE 2-ATTEMPT RULE

Never search more than twice for the same concept. If project documentation doesn't have it, it probably follows standard patterns.