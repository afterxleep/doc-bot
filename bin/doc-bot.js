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
  .option('-d, --docs <path>', 'Path to docs folder (auto-detected from the project if omitted)')
  .option('-s, --docsets <path>', 'Path to docsets folder')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--no-watch', 'Disable watching for file changes (watching is on by default)')
  .parse();

const options = program.opts();

/**
 * Resolve which documentation folder to index.
 *
 * doc-bot is commonly installed as a single, global MCP server and launched by
 * the client (Claude Code, Codex, …) with whatever working directory it picks —
 * frequently a subdirectory of the project rather than its root. A bare
 * `./doc-bot` default therefore resolves unpredictably. When --docs is omitted
 * we walk up from the cwd looking for a `doc-bot` folder, but never escape the
 * project: we stop at the first directory that contains a `.git` entry.
 *
 * @param {string|undefined} explicitPath - value of --docs, if provided
 * @returns {Promise<{docsPath: string, source: 'flag'|'auto'|'default'}>}
 */
async function resolveDocsPath(explicitPath) {
  if (explicitPath) {
    return { docsPath: path.resolve(explicitPath), source: 'flag' };
  }

  let dir = process.cwd();
  let projectRoot = null;
  while (true) {
    const candidate = path.join(dir, 'doc-bot');
    if (await fs.pathExists(candidate)) {
      return { docsPath: candidate, source: 'auto' };
    }
    // Stop before climbing out of the project root.
    if (await fs.pathExists(path.join(dir, '.git'))) {
      projectRoot = dir;
      break;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break; // reached the filesystem root
    }
    dir = parent;
  }

  // Conventional fallback: a `doc-bot` folder at the project root if we found
  // one, otherwise relative to the cwd.
  return { docsPath: path.join(projectRoot || process.cwd(), 'doc-bot'), source: 'default' };
}

async function main() {
  const { docsPath, source } = await resolveDocsPath(options.docs);
  const docsExist = await fs.pathExists(docsPath);

  // Always report the resolved path to stderr so it shows up in the client's
  // MCP logs — this is the first thing to check when "indexing isn't picked up".
  console.error(`📁 doc-bot docs: ${docsPath} (${source}) — cwd: ${process.cwd()}`);

  if (!docsExist) {
    // Don't exit: a global MCP server that dies takes its docset/API tools down
    // with it. Start empty, say so loudly, and pick the folder up once it exists
    // (watching is on by default).
    console.error(`⚠️  No documentation folder found at ${docsPath}.`);
    console.error('   Create it, or pass --docs <path> to point at your docs.');
    console.error(`   Example: mkdir -p "${docsPath}" && printf -- '---\\ntitle: Getting Started\\n---\\n# Getting Started\\n' > "${docsPath}/getting-started.md"`);
  }

  const server = new DocsServer({
    docsPath,
    docsetsPath: options.docsets ? path.resolve(options.docsets) : undefined,
    verbose: options.verbose,
    watch: options.watch
  });

  if (options.verbose) {
    console.error('🚀 Starting doc-bot...');
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
