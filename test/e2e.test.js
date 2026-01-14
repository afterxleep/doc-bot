import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import Database from 'better-sqlite3';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

const REQUIRED_TOOLS = [
  'search_documentation',
  'get_file_docs',
  'read_specific_document',
  'explore_api',
  'create_or_update_rule',
  'refresh_documentation',
  'get_document_index',
  'add_docset',
  'remove_docset',
  'list_docsets',
  'doc_bot'
];

const getText = (result) => result?.content?.[0]?.text || '';

describe('MCP server e2e', () => {
  let client;
  let tempRoot;
  let docsPath;
  let docsetsPath;
  let mockDocsetPath;

  beforeAll(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'doc-bot-e2e-'));
    docsPath = path.join(tempRoot, 'docs');
    docsetsPath = path.join(tempRoot, 'docsets');
    await fs.ensureDir(docsPath);
    await fs.ensureDir(docsetsPath);

    await fs.writeFile(
      path.join(docsPath, 'auth-flow.md'),
      `---\n` +
        `title: \"Auth Flow\"\n` +
        `description: \"Token issuing and refresh\"\n` +
        `keywords: [\"auth\", \"token\", \"refresh\"]\n` +
        `filePatterns: [\"src/auth/**\"]\n` +
        `---\n\n` +
        `# Auth Flow\n\n` +
        `- Issue access tokens on login.\n` +
        `- Rotate refresh tokens on each use.\n`,
      'utf8'
    );

    await fs.writeFile(
      path.join(docsPath, 'architecture.md'),
      `---\n` +
        `title: \"Service Architecture\"\n` +
        `description: \"Service boundaries and shared utilities\"\n` +
        `keywords: [\"architecture\", \"services\"]\n` +
        `filePatterns: [\"src/services/**\"]\n` +
        `---\n\n` +
        `# Service Architecture\n\n` +
        `- Keep services stateless where possible.\n`,
      'utf8'
    );

    mockDocsetPath = await createMockDocset(tempRoot);

    const serverPath = path.resolve(process.cwd(), 'bin', 'doc-bot.js');
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [serverPath, '--docs', docsPath, '--docsets', docsetsPath]
    });

    client = new Client(
      { name: 'doc-bot-e2e', version: '1.0.0' },
      { capabilities: {} }
    );

    await client.connect(transport);
  });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
    if (tempRoot) {
      await fs.remove(tempRoot);
    }
  });

  it('should list tools and return search results', async () => {
    const toolsResult = await client.listTools();
    const toolNames = toolsResult.tools.map((tool) => tool.name);
    expect(toolNames).toEqual(expect.arrayContaining(REQUIRED_TOOLS));

    const guidanceResult = await client.callTool({
      name: 'doc_bot',
      arguments: { task: 'update auth flow' }
    });
    expect(getText(guidanceResult)).toContain('Documentation Guidance');
    expect(getText(guidanceResult)).toContain('Fast Documentation Loop');

    const indexResult = await client.callTool({
      name: 'get_document_index',
      arguments: {}
    });
    expect(getText(indexResult)).toContain('Auth Flow');

    const readResult = await client.callTool({
      name: 'read_specific_document',
      arguments: { fileName: 'auth-flow.md' }
    });
    expect(getText(readResult)).toContain('Auth Flow');

    const searchResult = await client.callTool({
      name: 'search_documentation',
      arguments: { query: 'auth' }
    });
    expect(getText(searchResult)).toContain('Auth Flow');
  });

  it('should return contextual docs, update documentation, and refresh', async () => {
    const fileDocs = await client.callTool({
      name: 'get_file_docs',
      arguments: { filePath: 'src/auth/login.js' }
    });
    expect(getText(fileDocs)).toContain('Auth Flow');

    const updateResult = await client.callTool({
      name: 'create_or_update_rule',
      arguments: {
        fileName: 'e2e-updated.md',
        title: 'E2E Update Doc',
        description: 'Created during e2e test',
        keywords: ['e2e', 'doc-update'],
        filePatterns: ['src/e2e/**'],
        content: '# E2E Update Doc\n\nAdded by the MCP e2e test.'
      }
    });
    expect(getText(updateResult)).toContain('Documentation created successfully');

    const refreshResult = await client.callTool({
      name: 'refresh_documentation',
      arguments: {}
    });
    expect(getText(refreshResult)).toContain('Documentation refreshed successfully');

    const searchResult = await client.callTool({
      name: 'search_documentation',
      arguments: { query: 'e2e' }
    });
    expect(getText(searchResult)).toContain('E2E Update Doc');
  });

  it('should manage docsets and explore APIs', async () => {
    const emptyDocsets = await client.callTool({
      name: 'list_docsets',
      arguments: {}
    });
    expect(getText(emptyDocsets)).toContain('No docsets installed yet');

    const addResult = await client.callTool({
      name: 'add_docset',
      arguments: { source: mockDocsetPath }
    });
    const addText = getText(addResult);
    expect(addText).toContain('Successfully installed docset');

    const idMatch = addText.match(/\*\*ID:\*\*\s+([a-f0-9]+)/i);
    expect(idMatch).not.toBeNull();
    const docsetId = idMatch[1];

    const docsetsResult = await client.callTool({
      name: 'list_docsets',
      arguments: {}
    });
    expect(getText(docsetsResult)).toContain('Mock Docset');

    const apiSearch = await client.callTool({
      name: 'search_documentation',
      arguments: { query: 'MockKit' }
    });
    expect(getText(apiSearch)).toContain('API Documentation');
    expect(getText(apiSearch)).toContain('MockKit');

    const exploreResult = await client.callTool({
      name: 'explore_api',
      arguments: { apiName: 'MockKit' }
    });
    expect(getText(exploreResult)).toContain('API Exploration: MockKit');
    expect(getText(exploreResult)).toContain('MockKitClass');

    const removeResult = await client.callTool({
      name: 'remove_docset',
      arguments: { docsetId }
    });
    expect(getText(removeResult)).toContain('Successfully removed docset');
  });
});

async function createMockDocset(rootPath) {
  const docsetPath = path.join(rootPath, 'Mock.docset');
  const resourcesPath = path.join(docsetPath, 'Contents', 'Resources');
  const plistPath = path.join(docsetPath, 'Contents', 'Info.plist');
  await fs.ensureDir(resourcesPath);

  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" ` +
    `"http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n` +
    `<plist version="1.0">\n` +
    `<dict>\n` +
    `  <key>CFBundleName</key>\n` +
    `  <string>Mock Docset</string>\n` +
    `  <key>CFBundleIdentifier</key>\n` +
    `  <string>mock.docset</string>\n` +
    `  <key>CFBundleVersion</key>\n` +
    `  <string>1.0</string>\n` +
    `  <key>DocSetPlatformFamily</key>\n` +
    `  <string>mock</string>\n` +
    `</dict>\n` +
    `</plist>\n`;
  await fs.writeFile(plistPath, plistContent, 'utf8');

  const dbPath = path.join(resourcesPath, 'docSet.dsidx');
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE searchIndex(
      id INTEGER PRIMARY KEY,
      name TEXT,
      type TEXT,
      path TEXT
    );
    CREATE UNIQUE INDEX anchor ON searchIndex (name, type, path);
  `);
  const insert = db.prepare('INSERT INTO searchIndex (name, type, path) VALUES (?, ?, ?)');
  insert.run('MockKit', 'Framework', 'MockKit/index.html');
  insert.run('MockKitClass', 'Class', 'MockKit/MockKitClass.html');
  insert.run('MockKit.doThing', 'Method', 'MockKit/MockKitClass.html#doThing');
  insert.run('MockKitValue', 'Constant', 'MockKit/Constants.html#MockKitValue');
  db.close();

  return docsetPath;
}
