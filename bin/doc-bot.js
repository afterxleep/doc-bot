#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs-extra');
const { DocsServer } = require('../src/index.js');

program
  .name('doc-bot')
  .description('Generic MCP server for intelligent documentation access')
  .version('1.5.0')
  .requiredOption('-d, --docs <path>', 'Path to docs folder')
  .option('-c, --config <path>', 'Path to manifest file')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-w, --watch', 'Watch for file changes')
  .parse();

const options = program.opts();

async function main() {
  const docsPath = path.resolve(options.docs);
  const configPath = options.config ? path.resolve(options.config) : path.resolve(options.docs, 'manifest.json');
  
  // Check if documentation folder exists
  if (!await fs.pathExists(docsPath)) {
    console.error(`❌ Documentation folder not found: ${docsPath}`);
    console.log('');
    console.log('📖 To get started, create your documentation folder:');
    console.log('');
    console.log(`  mkdir ${path.basename(docsPath)}`);
    console.log(`  echo "---\nalwaysApply: true\ntitle: Getting Started\n---\n# Getting Started\nThis is your project documentation." > ${path.basename(docsPath)}/getting-started.md`);
    console.log('');
    console.log('📋 Use frontmatter in your markdown files:');
    console.log('   alwaysApply: true   (for global rules)');
    console.log('   alwaysApply: false  (for contextual rules)');
    console.log('   filePatterns: ["*.js", "src/**/*"]  (when to apply contextual rules)');
    console.log('');
    console.log('Then configure your MCP client to use this folder.');
    process.exit(1);
  }
  
  // Manifest is now optional - only create if explicitly requested
  if (options.config && !await fs.pathExists(configPath)) {
    console.log('📝 Creating default manifest.json...');
    const defaultManifest = {
      name: 'Project Documentation',
      version: '1.0.0',
      description: 'AI-powered documentation (auto-generated from frontmatter)',
      note: 'This manifest is auto-generated. Configure rules using frontmatter in your markdown files.'
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
  if (await fs.pathExists(configPath)) {
    console.log(`⚙️  Configuration: ${configPath}`);
  } else {
    console.log(`⚙️  Configuration: Auto-generated from frontmatter`);
  }
  
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