---
title: "Troubleshooting Guide"
description: "Common issues and their solutions"
keywords: ["troubleshooting", "debugging", "errors", "problems", "solutions"]
category: "reference"
---

# Troubleshooting Guide

## Common Issues

### Build Errors

#### "Module not found" Error
```bash
Error: Cannot resolve module 'some-package'
```

**Solutions:**
1. Check if the package is installed: `npm list some-package`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check for typos in import statements
4. Verify the package exists in package.json

#### TypeScript Compilation Errors
```bash
error TS2339: Property 'x' does not exist on type 'Y'
```

**Solutions:**
1. Check type definitions are installed: `npm install @types/package-name`
2. Update TypeScript version: `npm update typescript`
3. Check tsconfig.json configuration
4. Add type assertions if necessary: `(obj as any).property`

### Runtime Errors

#### "Cannot read property of undefined"
```javascript
TypeError: Cannot read property 'name' of undefined
```

**Solutions:**
1. Add null checks:
   ```javascript
   const name = user?.name || 'Unknown';
   ```
2. Use default values:
   ```javascript
   const { name = 'Unknown' } = user || {};
   ```
3. Add proper error handling

#### API Request Failures
```javascript
fetch('/api/users').then(response => {
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}).catch(error => {
  console.error('API request failed:', error);
});
```

### Development Environment

#### Port Already in Use
```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**
1. Kill the process using the port:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```
2. Use a different port:
   ```bash
   PORT=3001 npm start
   ```

#### Hot Reload Not Working
**Solutions:**
1. Check if you're editing the right files
2. Restart the development server
3. Clear browser cache
4. Check for syntax errors in code

## Debugging Tips

### Console Debugging
```javascript
// Log with context
console.log('User data:', { user, timestamp: new Date() });

// Use console.table for arrays/objects
console.table(users);

// Use console.time for performance
console.time('api-call');
await fetchData();
console.timeEnd('api-call');
```

### Browser DevTools
- Use breakpoints in Sources tab
- Check Network tab for failed requests
- Monitor Console for errors and warnings
- Use React DevTools for component debugging

### Server Debugging
```javascript
// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Log database queries
mongoose.set('debug', true);
```

## Getting Help

1. Check error messages carefully
2. Search error messages online
3. Check project documentation
4. Ask team members
5. Create minimal reproduction case
6. Include error logs when asking for help