#!/usr/bin/env node
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parse as parseDotenv } from 'dotenv';

const readEnv = async () => {
  const merged = {};
  for (const candidate of [path.join(process.cwd(), '.env.example'), path.join(process.cwd(), '.env')]) {
    try {
      const raw = await fs.readFile(candidate, 'utf8');
      Object.assign(merged, parseDotenv(raw));
    } catch {}
  }
  return merged;
};

const getClient = async () => {
  const env = await readEnv();
  const required = ['R2_ACCOUNT_ID', 'R2_BUCKET_NAME', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'];
  for (const k of required) {
    if (!env[k]) throw new Error(`Missing ${k} in .env`);
  }
  return {
    client: new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
    }),
    bucket: env.R2_BUCKET_NAME,
  };
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  let prefix = 'public/';
  let yes = false;
  const keys = [];
  for (const a of args) {
    if (a === '--yes' || a === '-y') { yes = true; continue; }
    if (a.startsWith('--prefix=')) { prefix = a.slice('--prefix='.length); continue; }
    keys.push(a);
  }
  return { prefix, keys, yes };
};

const run = async () => {
  const { prefix, keys, yes } = parseArgs();
  if (!keys.length) {
    console.error('Usage: node scripts/r2-delete.mjs [--prefix=public/] <key1> <key2> ... [--yes]');
    process.exit(2);
  }
  const { client, bucket } = await getClient();

  console.log(`# Deleting ${keys.length} object(s) from ${bucket} (prefix=${prefix})`);
  if (!yes) {
    console.log('Add --yes to confirm');
    process.exit(3);
  }

  for (const k of keys) {
    const key = k.startsWith(prefix) ? k : `${prefix.replace(/\/+$/g, '')}/${k}`;
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      console.log(`deleted: ${key}`);
    } catch (err) {
      console.error(`failed: ${key} -> ${err && err.message ? err.message : err}`);
    }
  }
};

run().catch((err) => { console.error(err && err.message ? err.message : err); process.exit(1); });
