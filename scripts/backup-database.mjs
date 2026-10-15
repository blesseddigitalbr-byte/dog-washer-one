// Read-only source export. This is not a restoration test or a Storage-object backup.
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createHash, X509Certificate } from 'node:crypto';
import { parse } from 'dotenv';
import pg from 'pg';

const root = process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'DWO-Recovery');
if (!root || process.platform !== 'win32') throw new Error('Windows private recovery directory required');
const bin = path.join(root, 'pgsql', 'bin');

async function run(executable, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const out = []; const err = [];
    child.stdout.on('data', chunk => out.push(chunk));
    child.stderr.on('data', chunk => err.push(chunk));
    child.on('error', () => reject(new Error('Recovery tool could not start')));
    child.on('close', code => resolve({ code, stdout: Buffer.concat(out), stderr: Buffer.concat(err) }));
  });
}

let client;
let destination;
try {
  const source = new URL(parse(await fs.readFile('.env.recovery.local')).DWO_SOURCE_DATABASE_URL.trim());
  if (source.hostname !== 'aws-1-sa-east-1.pooler.supabase.com' || source.port !== '5432' || decodeURIComponent(source.username) !== 'postgres.cvnshgqqqwwkcjeunecj' || source.pathname !== '/postgres') throw new Error('Unapproved source');
  const who = await run('whoami.exe', ['/user', '/fo', 'csv', '/nh']);
  const sid = who.stdout.toString().match(/S-1-5-[\d-]+/)?.[0];
  if (!sid) throw new Error('Cannot identify private directory owner');
  const acl = await run('icacls.exe', [root, '/inheritance:r', '/grant:r', `*${sid}:(OI)(CI)F`, '*S-1-5-18:(OI)(CI)F']);
  if (acl.code !== 0) throw new Error('Private directory ACL failed');
  const caResponse = await fetch('https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt', { signal: AbortSignal.timeout(15000) });
  if (!caResponse.ok) throw new Error('Certificate download failed');
  const ca = await caResponse.text();
  if (new X509Certificate(ca).fingerprint256 !== '80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA') throw new Error('Certificate fingerprint mismatch');
  const caPath = path.join(root, 'supabase-root.crt');
  await fs.writeFile(caPath, ca);
  const environment = { ...process.env, PGHOST: source.hostname, PGPORT: '5432', PGUSER: decodeURIComponent(source.username), PGPASSWORD: decodeURIComponent(source.password), PGDATABASE: 'postgres', PGSSLMODE: 'verify-full', PGSSLROOTCERT: caPath, PGCONNECT_TIMEOUT: '15' };
  const version = await run(path.join(bin, 'pg_dump.exe'), ['--version']);
  if (version.code !== 0 || !/PostgreSQL\) 17\./.test(version.stdout.toString())) throw new Error('PostgreSQL 17 tools required');
  destination = path.join(root, new Date().toISOString().replace(/[:.]/g, '-'));
  await fs.mkdir(destination);
  client = new pg.Client({ host: source.hostname, port: 5432, user: environment.PGUSER, password: environment.PGPASSWORD, database: 'postgres', ssl: { ca, rejectUnauthorized: true }, connectionTimeoutMillis: 15000, query_timeout: 20000 });
  await client.connect();
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const snapshot = (await client.query('SELECT pg_export_snapshot() AS snapshot')).rows[0].snapshot;
  const archive = path.join(destination, 'database.dump');
  console.log('Exporting consistent read-only snapshot; no source writes.');
  const dumped = await run(path.join(bin, 'pg_dump.exe'), ['--format=custom', '--lock-wait-timeout=10000', `--snapshot=${snapshot}`, `--file=${archive}`], environment);
  await fs.writeFile(path.join(destination, 'dump-private.log'), dumped.stderr);
  if (dumped.code !== 0) throw new Error('Export failed; private log retained; incomplete archive is not a backup');
  const listed = await run(path.join(bin, 'pg_restore.exe'), ['--list', archive], environment);
  if (listed.code !== 0) throw new Error('Archive catalogue verification failed');
  await fs.writeFile(path.join(destination, 'archive-catalogue.txt'), listed.stdout);
  const counts = {};
  for (const table of ['clientes', 'pets', 'appointments', 'packages', 'client_packages']) {
    counts[table] = (await client.query(`SELECT count(*)::text AS n FROM public.${table}`)).rows[0].n;
  }
  await client.query('ROLLBACK');
  const bytes = await fs.readFile(archive);
  await fs.writeFile(path.join(destination, 'manifest.json'), JSON.stringify({ project: 'cvnshgqqqwwkcjeunecj', createdAt: new Date().toISOString(), toolVersion: version.stdout.toString().trim(), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), sourceReadOnly: true, counts, archiveCatalogueVerified: true, restorationVerified: false, storageObjectsIncluded: false, rolePasswordsIncluded: false, originalOwnershipAndGrantsIncluded: true }, null, 2));
  console.log('BACKUP_ARCHIVE_OK: catalogue and SHA-256 verified. Restoration and Storage files remain pending.');
  console.log(`Private destination: ${destination}`);
} catch {
  console.error('BACKUP_NOT_CONFIRMED: inspect private recovery files; credentials and provider errors are not printed.');
  process.exitCode = 1;
} finally {
  if (client) { await client.query('ROLLBACK').catch(() => {}); await client.end().catch(() => {}); }
}
