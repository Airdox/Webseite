import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { describe, it, expect } from 'vitest';

const makeTempWorkspace = async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'flightdeck-test-'));
  // required files for isWorkspaceRoot
  await fs.mkdir(path.join(tmp, 'src', 'data'), { recursive: true });
  await fs.writeFile(path.join(tmp, 'package.json'), JSON.stringify({ name: 'flightdeck-test' }), 'utf8');
  await fs.writeFile(path.join(tmp, 'src', 'data', 'musicSets.js'), 'export const sets = [];\nexport default sets;\n', 'utf8');
  await fs.writeFile(path.join(tmp, 'wrangler.jsonc'), '{}', 'utf8');
  return tmp;
};

describe('publishSet integration', () => {
  it('writes the manifest and returns ok=true', async () => {
    const workspaceRoot = await makeTempWorkspace();
    try {
      const { publishSet } = await import('../../../../desktop/main/services/pipeline.mjs');

      const draft = {
        id: 'integration_test_set',
        title: 'Integration Test Set',
        file: 'integration_test_set.mp3',
        tracks: [],
        isNew: true,
      };

      const settings = {
        workspaceRoot,
        uploadAudioToR2: false,
        autoSeedStats: false,
        autoBuild: false,
        autoDeploy: false,
        autoCommit: false,
        autoPush: false,
        requireTracklistForLive: false,
        safeMode: false,
        extractEmbeddedCover: false,
        defaultCoverPath: '/assets/airdox-vinyl.jpg',
      };

      const result = await publishSet({ workspaceRoot, draft, settings });
      expect(result).toBeTruthy();
      expect(result.ok).toBe(true);

      const manifestSource = await fs.readFile(path.join(workspaceRoot, 'src', 'data', 'musicSets.js'), 'utf8');
      expect(manifestSource).toContain('integration_test_set');
    } finally {
      // cleanup
      await fs.rm(workspaceRoot, { recursive: true, force: true });
    }
  }, 20000);
});
