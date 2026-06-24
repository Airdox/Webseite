#!/usr/bin/env node
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
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
  const opts = { prefix: 'public/', days: undefined, since: undefined, json: false };
  for (const a of args) {
    if (a.startsWith('--prefix=')) opts.prefix = a.slice('--prefix='.length);
    else if (a.startsWith('--days=')) opts.days = Number(a.slice('--days='.length));
    else if (a.startsWith('--since=')) opts.since = new Date(a.slice('--since='.length));
    else if (a === '--json') opts.json = true;
    else if (a === '--help' || a === '-h') { console.log(usage()); process.exit(0); }
  }
  return opts;
};

const usage = () => `Usage: node scripts/r2-list.mjs [--prefix=public/] [--days=1] [--since=YYYY-MM-DD] [--json]

Lists objects in the configured R2 bucket. Default prefix: public/`;

const listAll = async (client, bucket, prefix) => {
  const results = [];
  let continuationToken = undefined;
  do {
    const params = { Bucket: bucket, ContinuationToken: continuationToken };
    if (prefix && prefix.length) params.Prefix = prefix;
    const cmd = new ListObjectsV2Command(params);
    const res = await client.send(cmd);
    if (res.Contents) results.push(...res.Contents);
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);
  return results;
};

const run = async () => {
  const { prefix, days, since, json } = parseArgs();
  const { client, bucket } = await getClient();
  const objs = await listAll(client, bucket, prefix);
  let cutoff = null;
  if (typeof days === 'number' && !Number.isNaN(days)) {
    cutoff = new Date(Date.now() - Math.max(0, days) * 24 * 3600 * 1000);
  } else if (since instanceof Date && !isNaN(since)) {
    cutoff = since;
  }

  const mapped = objs.map(o => ({ Key: o.Key, Size: o.Size, LastModified: o.LastModified }));
  const filtered = cutoff ? mapped.filter(m => m.LastModified && new Date(m.LastModified) >= cutoff) : mapped;

  if (json) {
    console.log(JSON.stringify(filtered, null, 2));
    return;
  }

  if (!filtered.length) {
    console.log('No objects found for the given filters.');
    return;
  }

  console.log(`Found ${filtered.length} object(s):`);
  for (const f of filtered) {
    console.log(`${f.Key}  ${f.Size} bytes  ${f.LastModified ? new Date(f.LastModified).toISOString() : 'unknown'}`);
  }
};

run().catch(err => { console.error('Error:', err && err.message ? err.message : err); process.exit(1); });
