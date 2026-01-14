#!/usr/bin/env node

import { program } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { DocsServer } from '../src/index.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

program
  .name('doc-bot')
  .description('Generic MCP server for intelligent documentation access')
  .version(packageJson.version)
  .option('-d, --docs <path>', 'Path to docs folder', 'doc-bot')
  .option('-s, --docsets <path>', 'Path to docsets folder')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-w, --watch', 'Watch for file changes')
  .parse();

const options = program.opts();

async function main() {
  const docsPath = path.resolve(options.docs);
  
  // Check if documentation folder exists
  if (!await fs.pathExists(docsPath)) {
    console.error(`❌ Documentation folder not found: ${docsPath}`);
    console.log('');
    console.log('📖 To get started, create your documentation folder:');
    console.log('');
    console.log(`  mkdir ${path.basename(docsPath)}`);
    console.log(`  echo "---\ntitle: Getting Started\n---\n# Getting Started\nThis is your project documentation." > ${path.basename(docsPath)}/getting-started.md`);
    console.log('');
    console.log('📋 Use frontmatter in your markdown files:');
    console.log('   title: "Doc Title"  (required)');
    console.log('   keywords: ["term"]  (optional)');
    console.log('   filePatterns: ["**/*.test.js"]  (optional)');
    console.log('');
    console.log('💡 Tip: By default, doc-bot looks for a doc-bot folder.');
    console.log('   Use --docs to specify a different folder.');
    process.exit(1);
  }
  
  const server = new DocsServer({
    docsPath,
    docsetsPath: options.docsets ? path.resolve(options.docsets) : undefined,
    verbose: options.verbose,
    watch: options.watch
  });
  
  if (options.verbose) {
    console.error('🚀 Starting doc-bot...');
    console.error(`📁 Documentation: ${docsPath}`);
    if (options.docsets) {
      console.error(`📚 Docsets: ${path.resolve(options.docsets)}`);
    }
    console.error(`⚙️  Configuration: Frontmatter-based`);
    
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
