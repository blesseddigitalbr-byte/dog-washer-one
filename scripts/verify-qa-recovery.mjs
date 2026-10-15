import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { parse } from 'dotenv';
import pg from 'pg';
import { assertQaDestination } from './recovery-guards.mjs';
const root = path.join(process.env.LOCALAPPDATA, 'DWO-Recovery');
const clients = [];
function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
function fingerprint(rows) { return createHash('sha256').update(rows.map(canonical).sort().join('\n')).digest('hex'); }
const quote = x => '"' + x.replaceAll('"', '""') + '"';
try {
  const env = parse(await fs.readFile('.env.recovery.local'));
  const source = new URL(env.DWO_SOURCE_DATABASE_URL); const target = new URL(env.DWO_RESTORE_DATABASE_URL);
  assertQaDestination(target, source);
  const ca = await fs.readFile(path.join(root, 'supabase-root.crt'), 'utf8');
  for (const u of [source, target]) {
    const c = new pg.Client({ host: u.hostname, port: 5432, user: decodeURIComponent(u.username), password: decodeURIComponent(u.password), database: 'postgres', ssl: { ca, rejectUnauthorized: true }, connectionTimeoutMillis: 15000, query_timeout: 30000 });
    clients.push(c); await c.connect(); await c.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY; SET LOCAL timezone='UTC'");
  }
  const [s, q] = clients;
  const tables = (await s.query("SELECT schemaname,tablename FROM pg_tables WHERE schemaname IN ('public','private','supabase_migrations') ORDER BY 1,2")).rows;
  const checks = [];
  for (const t of tables) {
    const relation = quote(t.schemaname) + '.' + quote(t.tablename);
    const sql = `SELECT to_jsonb(t) AS row FROM ${relation} t`;
    const a = (await s.query(sql)).rows.map(x => x.row); const b = (await q.query(sql)).rows.map(x => x.row);
    checks.push({ table: t.schemaname + '.' + t.tablename, rows: a.length, qaRows: b.length, sha256Equal: fingerprint(a) === fingerprint(b) });
  }
  const schemaSql = `SELECT n.nspname AS schema,c.relname,c.relrowsecurity,c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','private') AND c.relkind='r' ORDER BY 1,2`;
  const policySql = "SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname IN ('public','private') ORDER BY 1,2,3";
  const functionSql = "SELECT n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) AS args,pg_get_functiondef(p.oid) AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','private') AND p.prokind='f' ORDER BY 1,2,3";
  const schemaChecks = {};
  for (const [name, sql] of [['rlsFlags', schemaSql], ['policies', policySql], ['functionDefinitions', functionSql]]) {
    schemaChecks[name] = fingerprint((await s.query(sql)).rows) === fingerprint((await q.query(sql)).rows);
  }
  for (const c of clients) await c.query('ROLLBACK');
  if (checks.some(x => !x.sha256Equal) || Object.values(schemaChecks).some(x => !x)) {
    await fs.writeFile(path.join(root, 'qa-recovery-comparison.json'), JSON.stringify({ checks, schemaChecks, rollbackTestsPassed: false }, null, 2));
    throw new Error('Source comparison mismatch');
  }
  console.log(`PASS: ${checks.length} application/history tables match source row-for-row by SHA-256; RLS flags, policies and function definitions match.`);
  const fixtureSql = await fs.readFile('scripts/test-unit-isolation-rollback.sql', 'utf8');
  if (!/^begin;/i.test(fixtureSql.trim()) || !/rollback;\s*$/i.test(fixtureSql.trim())) throw new Error('Fixture rollback guard failed');
  await q.query(fixtureSql);
  const leftovers = (await q.query("SELECT (SELECT count(*) FROM auth.users WHERE id::text LIKE 'f1000000-%')::int AS users, (SELECT count(*) FROM public.appointments WHERE id::text LIKE 'f2000000-%')::int AS appointments")).rows[0];
  if (leftovers.users || leftovers.appointments) throw new Error('Fixture cleanup failed');
  const auth = (await q.query("SELECT (SELECT count(*) FROM auth.sessions)::int AS sessions,(SELECT count(*) FROM auth.users WHERE banned_until IS DISTINCT FROM 'infinity'::timestamptz)::int AS unbanned")).rows[0];
  if (auth.sessions || auth.unbanned) throw new Error('Copied login safety failed');
  const concurrency = await fs.readFile(path.join(root, 'qa-credit-concurrency.json'), 'utf8').then(JSON.parse).catch(() => null);
  const parallelConcurrencyVerified = concurrency?.target === 'bvmyovgourushalerpza' && concurrency?.fixtureCleanupVerified === true && concurrency?.lastCreditRace === true;
  await fs.writeFile(path.join(root, 'qa-recovery-comparison.json'), JSON.stringify({ createdAt: new Date().toISOString(), target: 'bvmyovgourushalerpza', checks, schemaChecks, rollbackTestsPassed: true, testFixturesRemaining: leftovers, copiedLoginsBanned: true, sessionsCopied: false, storageFilesVerified: false, parallelConcurrencyVerified, schedulingCollisionRaceTested: parallelConcurrencyVerified && concurrency?.schedulingCollisionRaceTested === true }, null, 2));
  console.log('PASS: QA rollback tests verify same-organization Lux/school isolation, staff restrictions, photo ownership, completion/reversal idempotence and revoked membership. No fixtures remain.');
} catch {
  console.error('QA_RECOVERY_VERIFICATION_NOT_CONFIRMED; no provider errors or row contents printed.'); process.exitCode = 1;
} finally { for (const c of clients) { await c.query('ROLLBACK').catch(() => {}); await c.end().catch(() => {}); } }
