import { jest } from '@jest/globals';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

const watcher = {
  on: jest.fn(function () { return this; }),
  close: jest.fn(async () => {}),
};
const watch = jest.fn(() => watcher);

jest.unstable_mockModule('chokidar', () => ({
  default: { watch },
}));

const { DocsServer } = await import('../../index.js');

describe('DocsServer documentation watcher', () => {
  let tempRoot;
  let docsPath;

  beforeEach(async () => {
    jest.useFakeTimers();
    watch.mockClear();
    watcher.on.mockClear();
    watcher.close.mockClear();
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'doc-bot-watcher-'));
    docsPath = path.join(tempRoot, 'docs');
  });

  afterEach(async () => {
    jest.useRealTimers();
    await fs.remove(tempRoot);
  });

  it('defers Chokidar until a missing documentation directory appears', async () => {
    const server = new DocsServer({
      docsPath,
      watch: true,
      watcherRetryDelay: 100,
    });

    await server.watcherSetupPromise;

    expect(watch).not.toHaveBeenCalled();

    await fs.ensureDir(docsPath);
    await jest.advanceTimersByTimeAsync(100);
    await server.watcherSetupPromise;

    expect(watch).toHaveBeenCalledTimes(1);
    expect(watch).toHaveBeenCalledWith(docsPath, expect.any(Object));
  });
});
