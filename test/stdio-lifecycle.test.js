import { spawn } from 'node:child_process';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';

const serverPath = path.resolve(process.cwd(), 'bin', 'doc-bot.js');

function waitForOutput(stream, expected, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    let output = '';
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${JSON.stringify(expected)}. Output: ${output}`));
    }, timeoutMs);

    const onData = (chunk) => {
      output += chunk;
      if (output.includes(expected)) {
        cleanup();
        resolve();
      }
    };

    const cleanup = () => {
      clearTimeout(timeout);
      stream.off('data', onData);
    };

    stream.setEncoding('utf8');
    stream.on('data', onData);
  });
}

function waitForExit(child, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`doc-bot did not exit after stdin closed (pid ${child.pid})`));
    }, timeoutMs);

    const onExit = (code, signal) => {
      cleanup();
      resolve({ code, signal });
    };

    const cleanup = () => {
      clearTimeout(timeout);
      child.off('exit', onExit);
    };

    child.once('exit', onExit);
  });
}

describe('stdio lifecycle', () => {
  let tempRoot;
  let child;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'doc-bot-stdio-'));
  });

  afterEach(async () => {
    if (child && child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL');
    }
    await fs.remove(tempRoot);
  });

  it.each([
    ['an existing documentation directory', true],
    ['a missing documentation directory', false],
  ])('exits after stdin closes with %s', async (_description, createDocs) => {
    const docsPath = path.join(tempRoot, 'docs');
    if (createDocs) {
      await fs.ensureDir(docsPath);
    }

    child = spawn(process.execPath, [serverPath, '--docs', docsPath, '--verbose'], {
      cwd: tempRoot,
      stdio: ['pipe', 'ignore', 'pipe'],
    });

    await waitForOutput(child.stderr, 'Server initialized with MCP transport');
    const exitPromise = waitForExit(child);

    child.stdin.end();

    await expect(exitPromise).resolves.toEqual({ code: 0, signal: null });
  });
});
