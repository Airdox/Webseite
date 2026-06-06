import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const tempRoots = [];

const createWorkspace = async (manifestSource) => {
  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'airdox-manifest-service-'));
  tempRoots.push(workspaceRoot);
  await fs.mkdir(path.join(workspaceRoot, 'src', 'data'), { recursive: true });
  await fs.writeFile(path.join(workspaceRoot, 'package.json'), '{"name":"test-workspace"}', 'utf8');
  await fs.writeFile(path.join(workspaceRoot, 'wrangler.jsonc'), '{}', 'utf8');
  await fs.writeFile(path.join(workspaceRoot, 'src', 'data', 'musicSets.js'), manifestSource, 'utf8');
  return workspaceRoot;
};

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe('manifest service', () => {
  it('reads exported sets without executing manifest code', async () => {
    const workspaceRoot = await createWorkspace(`
      export const sets = [
        {
          id: 'recording_test',
          title: 'Sandbox Safe',
          date: 'JUN 2026',
          file: 'safe.mp3',
          tracks: [
            { time: '00:00', artist: 'AIRDOX', title: 'Opening' },
          ],
        },
      ];

      throw new Error('manifest code should not execute');
    `);

    const { readSets } = await import('../../../desktop/main/services/manifest.mjs');
    await expect(readSets(workspaceRoot)).resolves.toEqual([
      {
        id: 'recording_test',
        title: 'Sandbox Safe',
        date: 'JUN 2026',
        file: 'safe.mp3',
        tracks: [
          { time: '00:00', artist: 'AIRDOX', title: 'Opening' },
        ],
      },
    ]);
  });
});
