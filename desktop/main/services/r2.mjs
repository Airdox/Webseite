import path from 'node:path';
import { createReadStream } from 'node:fs';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { readWorkspaceEnv } from './workspace.mjs';

const clientCache = new Map();

const AUDIO_CONTENT_TYPES = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
};

const getClientKey = (env) => [
  env.R2_ACCOUNT_ID,
  env.R2_BUCKET_NAME,
  env.R2_ACCESS_KEY_ID,
].join(':');

const getR2Client = async (workspaceRoot) => {
  const env = await readWorkspaceEnv(workspaceRoot);
  const required = ['R2_ACCOUNT_ID', 'R2_BUCKET_NAME', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'];
  for (const key of required) {
    if (!env[key]) {
      throw new Error(`Missing ${key} in workspace .env`);
    }
  }

  const clientKey = getClientKey(env);
  if (!clientCache.has(clientKey)) {
    clientCache.set(clientKey, {
      bucketName: env.R2_BUCKET_NAME,
      client: new S3Client({
        region: 'auto',
        endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
      }),
    });
  }

  return clientCache.get(clientKey);
};

const guessContentType = (filePath) => AUDIO_CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';

export const uploadAudioFile = async (workspaceRoot, filePath, objectKey) => {
  const { client, bucketName } = await getR2Client(workspaceRoot);
  const normalizedKey = objectKey.replace(/^\/+/, '');

  const upload = new Upload({
    client,
    params: {
      Bucket: bucketName,
      Key: normalizedKey,
      Body: createReadStream(filePath),
      ContentType: guessContentType(filePath),
    },
  });

  await upload.done();
  return {
    bucketName,
    objectKey: normalizedKey,
  };
};
