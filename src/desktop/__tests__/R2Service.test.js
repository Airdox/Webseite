import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const awsSpies = vi.hoisted(() => ({
  s3Constructor: vi.fn(),
  uploadConstructor: vi.fn(),
  uploadDone: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class S3Client {
    constructor(options) {
      awsSpies.s3Constructor(options);
      this.options = options;
    }
  },
}));

vi.mock('@aws-sdk/lib-storage', () => ({
  Upload: class Upload {
    constructor(options) {
      awsSpies.uploadConstructor(options);
      options.params.Body.destroy();
    }

    done() {
      return awsSpies.uploadDone();
    }
  },
}));

import { uploadAudioFile } from '../../../desktop/main/services/r2.mjs';

describe('Cloudflare R2 upload service', () => {
  let workspaceRoot;

  beforeEach(async () => {
    vi.clearAllMocks();
    awsSpies.uploadDone.mockResolvedValue(undefined);
    workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'airdox-r2-test-'));
  });

  afterEach(async () => {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
  });

  it('rejects a workspace that has no complete R2 credentials', async () => {
    await fs.writeFile(path.join(workspaceRoot, '.env'), 'R2_ACCOUNT_ID=account-only\n', 'utf8');

    await expect(uploadAudioFile(workspaceRoot, path.join(workspaceRoot, 'set.mp3'), 'sets/set.mp3'))
      .rejects.toThrow('Missing R2_BUCKET_NAME');
    expect(awsSpies.s3Constructor).not.toHaveBeenCalled();
  });

  it('uploads an MP3 with normalized object key, real stream and configured endpoint', async () => {
    await fs.writeFile(path.join(workspaceRoot, '.env'), [
      `R2_ACCOUNT_ID=account-${path.basename(workspaceRoot)}`,
      'R2_BUCKET_NAME=live-sets',
      'R2_ACCESS_KEY_ID=test-key',
      'R2_SECRET_ACCESS_KEY=test-secret',
    ].join('\n'), 'utf8');
    const audioPath = path.join(workspaceRoot, 'gig.mp3');
    await fs.writeFile(audioPath, 'audio-bytes', 'utf8');

    await expect(uploadAudioFile(workspaceRoot, audioPath, '///sets/gig.mp3')).resolves.toEqual({
      bucketName: 'live-sets',
      objectKey: 'sets/gig.mp3',
    });

    expect(awsSpies.s3Constructor).toHaveBeenCalledWith(expect.objectContaining({
      region: 'auto',
      endpoint: expect.stringMatching(/^https:\/\/account-.*\.r2\.cloudflarestorage\.com$/),
      credentials: { accessKeyId: 'test-key', secretAccessKey: 'test-secret' },
    }));
    expect(awsSpies.uploadConstructor).toHaveBeenCalledWith(expect.objectContaining({
      params: expect.objectContaining({
        Bucket: 'live-sets',
        Key: 'sets/gig.mp3',
        ContentType: 'audio/mpeg',
      }),
    }));
    expect(awsSpies.uploadDone).toHaveBeenCalledOnce();
  });

  it('reuses an R2 client and uses a safe binary type for unknown extensions', async () => {
    await fs.writeFile(path.join(workspaceRoot, '.env'), [
      `R2_ACCOUNT_ID=cache-${path.basename(workspaceRoot)}`,
      'R2_BUCKET_NAME=live-sets',
      'R2_ACCESS_KEY_ID=cache-key',
      'R2_SECRET_ACCESS_KEY=cache-secret',
    ].join('\n'), 'utf8');
    const sourcePath = path.join(workspaceRoot, 'source.bin');
    await fs.writeFile(sourcePath, 'binary', 'utf8');

    await uploadAudioFile(workspaceRoot, sourcePath, 'one/source.bin');
    await uploadAudioFile(workspaceRoot, sourcePath, 'two/source.bin');

    expect(awsSpies.s3Constructor).toHaveBeenCalledOnce();
    expect(awsSpies.uploadConstructor).toHaveBeenCalledTimes(2);
    expect(awsSpies.uploadConstructor.mock.calls[1][0].params).toMatchObject({
      Key: 'two/source.bin',
      ContentType: 'application/octet-stream',
    });
  });
});
