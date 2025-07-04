#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs-extra');
const { DocsServer } = require('../src/index.js');

program
  .name('doc-bot')
  .description('Generic MCP server for intelligent documentation access')
  .version('1.5.0')
  .option('-d, --docs <path>', 'Path to docs folder', 'doc-bot')
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
    console.log('');
    console.log('💡 Tip: By default, doc-bot looks for a doc-bot folder.');
    console.log('   Use --docs to specify a different folder.');
    process.exit(1);
  }
  
  // Manifest is now optional - only create if explicitly requested
  if (options.config && !await fs.pathExists(configPath)) {
    if (options.verbose) {
      console.error('📝 Creating default manifest.json...');
    }
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
  
  if (options.verbose) {
    console.error('🚀 Starting doc-bot...');
    console.error(`📁 Documentation: ${docsPath}`);
    if (await fs.pathExists(configPath)) {
      console.error(`⚙️  Configuration: ${configPath}`);
    } else {
      console.error(`⚙️  Configuration: Auto-generated from frontmatter`);
    }
    
    if (options.watch) {
      console.error('👀 Watching for file changes...');
    }
  }
  
  await server.start();
  
  if (options.verbose) {
    console.error('✅ Server started successfully!');
  }
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  if (options.verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});