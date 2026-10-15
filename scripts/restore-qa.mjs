// Explicitly authorized isolated restoration only; never accepts a production target.
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createHash, X509Certificate } from 'node:crypto';
import { parse } from 'dotenv';
import pg from 'pg';
import { assertQaDestination, selectQaRestoreEntries } from './recovery-guards.mjs';

const root = path.join(process.env.LOCALAPPDATA, 'DWO-Recovery');
const backup = path.join(root, '2026-10-15T21-39-11-756Z');
const runDir = path.join(root, `restore-${new Date().toISOString().replace(/[:.]/g, '-')}`);
const bin = path.join(root, 'pgsql', 'bin');
const run = (exe, args, env = process.env) => new Promise((resolve, reject) => {
  const child = spawn(path.join(bin, exe), args, { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const out = []; const err = [];
  child.stdout.on('data', x => out.push(x)); child.stderr.on('data', x => err.push(x));
  child.on('error', () => reject(new Error('Private recovery tool unavailable')));
  child.on('close', code => resolve({ code, out: Buffer.concat(out), err: Buffer.concat(err) }));
});
let client;
let phase = 'preflight';
try {
  const e = parse(await fs.readFile('.env.recovery.local'));
  const target = new URL(e.DWO_RESTORE_DATABASE_URL);
  const source = new URL(e.DWO_SOURCE_DATABASE_URL);
  assertQaDestination(target, source);
  const caPath = path.join(root, 'supabase-root.crt'); const ca = await fs.readFile(caPath, 'utf8');
  if (new X509Certificate(ca).fingerprint256 !== '80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA') throw new Error('CA mismatch');
  const archive = path.join(backup, 'database.dump');
  const manifest = JSON.parse(await fs.readFile(path.join(backup, 'manifest.json'), 'utf8'));
  if (manifest.project !== 'cvnshgqqqwwkcjeunecj' || createHash('sha256').update(await fs.readFile(archive)).digest('hex') !== manifest.sha256) throw new Error('Archive integrity rejected');
  client = new pg.Client({ host: target.hostname, port: 5432, user: decodeURIComponent(target.username), password: decodeURIComponent(target.password), database: 'postgres', ssl: { ca, rejectUnauthorized: true }, connectionTimeoutMillis: 15000, query_timeout: 20000 });
  await client.connect();
  const existing = (await client.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema IN ('public','private','supabase_migrations') AND table_type='BASE TABLE'")).rows[0].n;
  const users = (await client.query('SELECT count(*)::int AS n FROM auth.users')).rows[0].n;
  const objects = (await client.query('SELECT count(*)::int AS n FROM storage.objects')).rows[0].n;
  if (existing || users || objects) throw new Error('Target is not empty; no overwrite permitted');
  // Check setting permission without leaving any change behind.
  await client.query('BEGIN'); await client.query('SET LOCAL session_replication_role = replica'); await client.query('ROLLBACK');
  const catalogue = (await fs.readFile(path.join(backup, 'archive-catalogue.txt'), 'utf8')).split(/\r?\n/);
  const selected = selectQaRestoreEntries(catalogue);
  if (!selected.some(x => x.includes('TABLE DATA public clientes ')) || !selected.some(x => x.includes('ROW SECURITY public clientes ')) || !selected.some(x => x.includes('POLICY public clientes unit_boundary_guard '))) throw new Error('Incomplete restore selection');
  await fs.mkdir(runDir);
  const listPath = path.join(runDir, 'restore-selection.txt'); await fs.writeFile(listPath, selected.join('\n'));
  const sqlPath = path.join(runDir, 'restore-private.sql');
  const extracted = await run('pg_restore.exe', ['--no-owner', `--use-list=${listPath}`, `--file=${sqlPath}`, archive]);
  await fs.writeFile(path.join(runDir, 'extract-private.log'), extracted.err);
  if (extracted.code) throw new Error('SQL extraction failed');
  const sql = await fs.readFile(sqlPath, 'utf8');
  if (/\b(?:net\.http_|http_post\s*\(|http_get\s*\(|dblink\s*\(|CREATE\s+SUBSCRIPTION|cron\.schedule\s*\()/i.test(sql)) throw new Error('Outbound-capable SQL needs separate review');
  const pre = path.join(runDir, 'before.sql'); const post = path.join(runDir, 'after.sql');
  await fs.writeFile(pre, "SET LOCAL session_replication_role = replica; SET LOCAL lock_timeout = '10s'; SET LOCAL statement_timeout = '120s';\n");
  await fs.writeFile(post, "UPDATE auth.users SET banned_until = 'infinity'::timestamptz;\nSET LOCAL session_replication_role = origin;\n");
  const env = { ...process.env, PGHOST: target.hostname, PGPORT: '5432', PGUSER: decodeURIComponent(target.username), PGPASSWORD: decodeURIComponent(target.password), PGDATABASE: 'postgres', PGSSLMODE: 'verify-full', PGSSLROOTCERT: caPath, PGCONNECT_TIMEOUT: '15' };
  phase = 'restore-transaction';
  console.log('QA restore transaction starting; production connection is never used for writes.');
  const result = await run('psql.exe', ['--no-psqlrc', '--single-transaction', '--set=ON_ERROR_STOP=1', '--file', pre, '--file', sqlPath, '--file', post], env);
  await fs.writeFile(path.join(runDir, 'restore-private.log'), Buffer.concat([result.out, result.err]));
  if (result.code) throw new Error('Restore transaction failed; rolled back');
  phase = 'verify';
  const counts = {};
  for (const [table, expected] of Object.entries(manifest.counts)) {
    if (!/^[a-z_]+$/.test(table)) throw new Error('Invalid manifest');
    counts[table] = (await client.query(`SELECT count(*)::text AS n FROM public.${table}`)).rows[0].n;
    if (counts[table] !== expected) throw new Error('Restored count mismatch');
  }
  const sessions = (await client.query('SELECT count(*)::int AS n FROM auth.sessions')).rows[0].n;
  const activeCopiedLogins = (await client.query("SELECT count(*)::int AS n FROM auth.users WHERE banned_until IS DISTINCT FROM 'infinity'::timestamptz")).rows[0].n;
  if (sessions || activeCopiedLogins) throw new Error('QA authentication safety check failed');
  await fs.writeFile(path.join(runDir, 'restore-report.json'), JSON.stringify({ targetProject: 'bvmyovgourushalerpza', sourceArchiveSha256: manifest.sha256, restoredAt: new Date().toISOString(), counts, sessionsCopied: false, copiedLoginsBanned: true, applicationAndAuthMetadataRestored: true, storageFilesRestored: false, fullRecoveryValidated: false }, null, 2));
  console.log('QA_RESTORE_OK: core table counts verified; copied logins banned; no sessions copied. Storage files and further isolation tests pending.');
  console.log(`Private report: ${runDir}`);
} catch {
  console.error(`QA_RESTORE_NOT_CONFIRMED: phase=${phase}; inspect private logs, never paste their contents into chat.`);
  process.exitCode = 1;
} finally { if (client) await client.end().catch(() => {}); }
