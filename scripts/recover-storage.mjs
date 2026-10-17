// Source: reads only. Destination: explicitly isolated QA only. No key values or object names in console output.
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { X509Certificate } from 'node:crypto';
import { parse } from 'dotenv';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import { assertStorageRecoveryConfig, backupStorageObject, restoreStorageObject, SOURCE_STORAGE_URL, QA_STORAGE_URL, sha256 } from './storage-recovery.mjs';
const root = path.join(process.env.LOCALAPPDATA, 'DWO-Recovery');
let database;
let phase = 'configuration';
let failureStatus = null;
try {
  const env = parse(await fs.readFile('.env.recovery.local'));
  assertStorageRecoveryConfig({ sourceUrl: SOURCE_STORAGE_URL, targetUrl: QA_STORAGE_URL, sourceKey: env.DWO_SOURCE_STORAGE_SERVICE_ROLE_KEY, targetKey: env.DWO_QA_STORAGE_SERVICE_ROLE_KEY });
  if (process.argv.slice(2).some(x => x !== '--restore-qa')) throw new Error('Unsupported argument');
  const restore = process.argv.includes('--restore-qa');
  const ca = await fs.readFile(path.join(root, 'supabase-root.crt'), 'utf8');
  if (new X509Certificate(ca).fingerprint256 !== '80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA') throw new Error('CA mismatch');
  const u = new URL(env.DWO_SOURCE_DATABASE_URL);
  if (u.hostname !== 'aws-1-sa-east-1.pooler.supabase.com' || decodeURIComponent(u.username) !== 'postgres.cvnshgqqqwwkcjeunecj' || u.port !== '5432' || u.pathname !== '/postgres') throw new Error('Unapproved source');
  const who = spawnSync('whoami.exe', ['/user', '/fo', 'csv', '/nh'], { encoding: 'utf8', windowsHide: true });
  const sid = who.stdout?.match(/S-1-5-[\d-]+/)?.[0]; if (!sid) throw new Error('Private owner not verified');
  const acl = spawnSync('icacls.exe', [root, '/inheritance:r', '/grant:r', `*${sid}:(OI)(CI)F`, '*S-1-5-18:(OI)(CI)F'], { windowsHide: true });
  if (acl.status !== 0) throw new Error('Private ACL failed');
  const safeFetch = (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(30000) });
  const options = { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: safeFetch } };
  const source = createClient(SOURCE_STORAGE_URL, env.DWO_SOURCE_STORAGE_SERVICE_ROLE_KEY, options);
  const target = createClient(QA_STORAGE_URL, env.DWO_QA_STORAGE_SERVICE_ROLE_KEY, options);
  database = new pg.Client({ host: u.hostname, port: 5432, user: decodeURIComponent(u.username), password: decodeURIComponent(u.password), database: 'postgres', ssl: { ca, rejectUnauthorized: true }, connectionTimeoutMillis: 15000, query_timeout: 15000 });
  phase = 'source-inventory';
  await database.connect(); await database.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const entries = (await database.query("SELECT bucket_id AS bucket,name,(metadata->>'size')::bigint AS size,metadata->>'mimetype' AS mimetype,updated_at::text AS updated_at FROM storage.objects ORDER BY bucket_id,name")).rows.map(x => ({ ...x, size: Number(x.size) }));
  const inventoryDigest = sha256(Buffer.from(JSON.stringify(entries)));
  await database.query('ROLLBACK');
  const dir = path.join(root, 'storage-' + new Date().toISOString().replace(/[:.]/g, '-')); await fs.mkdir(dir);
  const download = async (client, entry, allowMissing = false) => {
    const { data, error } = await client.storage.from(entry.bucket).download(entry.name);
    if (error) {
      failureStatus = Number(error.statusCode ?? error.status) || null;
      if (allowMissing && Number(error.statusCode ?? error.status) === 404) return null;
      throw new Error('Storage download not verified');
    }
    if (!data) throw new Error('No object bytes'); return Buffer.from(await data.arrayBuffer());
  };
  const backed = [];
  phase = 'source-download';
  for (const entry of entries) backed.push(await backupStorageObject({ entry, downloadSource: x => download(source, x), savePrivate: (name, bytes) => fs.writeFile(path.join(dir, name), bytes, { flag: 'wx' }) }));
  // Detect changed object metadata during export; the database snapshot cannot freeze the Storage object bytes.
  const fresh = (await database.query("SELECT bucket_id AS bucket,name,(metadata->>'size')::bigint AS size,metadata->>'mimetype' AS mimetype,updated_at::text AS updated_at FROM storage.objects ORDER BY bucket_id,name")).rows.map(x => ({ ...x, size: Number(x.size) }));
  if (sha256(Buffer.from(JSON.stringify(fresh))) !== inventoryDigest) throw new Error('Storage changed during backup');
  await fs.writeFile(path.join(dir, 'manifest-private.json'), JSON.stringify({ sourceProject: 'cvnshgqqqwwkcjeunecj', createdAt: new Date().toISOString(), inventoryDigest, entries: backed }, null, 2));
  console.log(`STORAGE_BACKUP_OK: ${backed.length} files saved privately with SHA-256.`);
  let verified = 0;
  if (restore) {
    phase = 'qa-bucket-protection';
    const buckets = [...new Set(backed.map(x => x.bucket))];
    for (const bucket of buckets) {
      const { data, error } = await target.storage.getBucket(bucket); if (error || !data) throw new Error('QA bucket not available');
      if (data.public) {
        const changed = await target.storage.updateBucket(bucket, { public: false }); if (changed.error) throw new Error('Cannot protect QA bucket');
      }
    }
    phase = 'qa-upload-verification';
    for (const entry of backed) {
      await restoreStorageObject({ entry, targetUrl: QA_STORAGE_URL, readPrivate: name => fs.readFile(path.join(dir, name)), downloadTarget: x => download(target, x, true), uploadTarget: async (x, bytes) => {
        const { error } = await target.storage.from(x.bucket).upload(x.name, bytes, { upsert: true, contentType: x.mimetype || 'application/octet-stream' }); if (error) throw new Error('QA upload not confirmed');
      } }); verified++;
    }
  }
  await fs.writeFile(path.join(dir, 'verification.json'), JSON.stringify({ createdAt: new Date().toISOString(), sourceReadOnly: true, targetProject: restore ? 'bvmyovgourushalerpza' : null, backedUpFiles: backed.length, qaFilesVerified: verified, storageRestorationVerified: restore && verified === backed.length, credentialRotationVerified: false }, null, 2));
  console.log(restore ? `QA_STORAGE_VERIFIED: ${verified} files downloaded again and hashes match.` : 'Backup only; no target writes performed.');
} catch {
  console.error(`STORAGE_RECOVERY_NOT_CONFIRMED: phase=${phase}, status=${failureStatus ?? 'unavailable'}. No key, object path or provider error printed.`); process.exitCode = 1;
} finally { if (database) { await database.query('ROLLBACK').catch(() => {}); await database.end().catch(() => {}); } }
