import process from 'node:process';
import { describe, expect, it } from 'vitest';

describe('workspace service', () => {
  it('runs commands with explicit arguments without requiring a shell', async () => {
    const { runCommand } = await import('../../../desktop/main/services/workspace.mjs');
    const result = await runCommand({
      command: process.execPath,
      args: ['-e', 'process.stdout.write(process.argv[1])', 'hello flight deck'],
      cwd: process.cwd(),
    });

    expect(result).toMatchObject({
      ok: true,
      code: 0,
      stdout: 'hello flight deck',
      stderr: '',
    });
  });
});
