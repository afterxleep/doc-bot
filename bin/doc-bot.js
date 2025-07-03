#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs-extra');
const { DocsServer } = require('../src/index.js');

program
  .name('doc-bot')
  .description('Generic MCP server for intelligent documentation access')
  .version('1.0.0')
  .option('-p, --port <port>', 'Port to run server on', '3000')
  .option('-d, --docs <path>', 'Path to docs folder', './docs.ai')
  .option('-c, --config <path>', 'Path to manifest file', './docs.ai/manifest.json')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-w, --watch', 'Watch for file changes')
  .parse();

const options = program.opts();

async function main() {
  const docsPath = path.resolve(options.docs);
  const configPath = path.resolve(options.config);
  
  // Check if docs.ai folder exists
  if (!await fs.pathExists(docsPath)) {
    console.error(`❌ Documentation folder not found: ${docsPath}`);
    console.log('');
    console.log('📖 To get started, create a docs.ai folder in your project:');
    console.log('');
    console.log('  mkdir docs.ai');
    console.log('  echo \'{"name": "My Project Documentation", "globalRules": []}\' > docs.ai/manifest.json');
    console.log('  echo "# Getting Started" > docs.ai/README.md');
    console.log('');
    console.log('Then run: npx doc-bot');
    process.exit(1);
  }
  
  // Check if manifest exists, create default if not
  if (!await fs.pathExists(configPath)) {
    console.log('📝 Creating default manifest.json...');
    const defaultManifest = {
      name: 'Project Documentation',
      version: '1.0.0',
      description: 'AI-powered documentation',
      globalRules: [],
      contextualRules: {},
      inference: {
        keywords: {},
        patterns: {}
      }
    };
    await fs.writeJSON(configPath, defaultManifest, { spaces: 2 });
  }
  
  const server = new DocsServer({
    docsPath,
    configPath,
    verbose: options.verbose,
    watch: options.watch
  });
  
  console.log('🚀 Starting doc-bot...');
  console.log(`📁 Documentation: ${docsPath}`);
  console.log(`⚙️  Configuration: ${configPath}`);
  
  if (options.watch) {
    console.log('👀 Watching for file changes...');
  }
  
  await server.start();
  console.log('✅ Server started successfully!');
  console.log('');
  console.log('📋 Add this to your Claude Code configuration:');
  console.log('');
  console.log('{');
  console.log('  "mcpServers": {');
  console.log('    "docs": {');
  console.log(`      "command": "npx",`);
  console.log(`      "args": ["doc-bot", "--docs", "${docsPath}"]`);
  console.log('    }');
  console.log('  }');
  console.log('}');
  console.log('');
  console.log('🔄 Then restart Claude Code');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  if (options.verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});