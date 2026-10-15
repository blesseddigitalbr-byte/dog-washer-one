// Two independent PostgreSQL connections. Only disposable QA fixtures are committed.
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { parse } from 'dotenv';
import pg from 'pg';
import { assertQaDestination } from './recovery-guards.mjs';
const root = path.join(process.env.LOCALAPPDATA, 'DWO-Recovery');
const connections = [];
const fixtures = [];
let admin;
let testsPassed = false;
try {
  const env = parse(await fs.readFile('.env.recovery.local'));
  const u = new URL(env.DWO_RESTORE_DATABASE_URL); assertQaDestination(u, new URL(env.DWO_SOURCE_DATABASE_URL));
  const ca = await fs.readFile(path.join(root, 'supabase-root.crt'), 'utf8');
  const connect = async () => { const c = new pg.Client({ host: u.hostname, port: 5432, user: decodeURIComponent(u.username), password: decodeURIComponent(u.password), database: 'postgres', ssl: { ca, rejectUnauthorized: true }, connectionTimeoutMillis: 15000, query_timeout: 15000 }); connections.push(c); await c.connect(); return c; };
  admin = await connect(); const a = await connect(); const b = await connect();
  const org = 'd0000000-0000-4000-8000-000000000001'; const unit = 'd0000000-0000-4000-8000-000000000003';
  async function setup(balance) {
    const id = randomUUID(), user = randomUUID(), second = randomUUID();
    const f = { id, user, appointments: [id, second] }; fixtures.push(f);
    await admin.query('BEGIN');
    await admin.query("INSERT INTO auth.users(id,aud,role,email,banned_until) VALUES($1,'authenticated','authenticated',$2,'infinity')", [user, `qa-concurrency-${user}@example.invalid`]);
    await admin.query("INSERT INTO public.profiles(id,role,organization_id,unit_id,active) VALUES($1,'owner',$2,$3,true) ON CONFLICT(id) DO UPDATE SET role='owner',organization_id=$2,unit_id=$3,active=true", [user, org, unit]);
    await admin.query("INSERT INTO public.user_unit_access(user_id,organization_id,unit_id,access_role,active) VALUES($1,$2,$3,'owner',true) ON CONFLICT(user_id,unit_id) DO UPDATE SET active=true", [user, org, unit]);
    await admin.query('SET LOCAL ROLE authenticated'); await admin.query("SELECT set_config('request.jwt.claims',$1,true)", [JSON.stringify({ sub: user, role: 'authenticated' })]);
    await admin.query("INSERT INTO public.clientes(id,id_cliente,nome) VALUES($1,$2,'QA disposable concurrency')", [id, `QA-${id}`]);
    await admin.query("INSERT INTO public.pets(id,id_pet,client_id,name) VALUES($1,$2,$1,'QA disposable pet')", [id, `QA-${id}`]);
    await admin.query("INSERT INTO public.services(id,name) VALUES($1,'QA disposable bath')", [id]);
    await admin.query("INSERT INTO public.professionals(id,name) VALUES($1,'QA disposable professional')", [id]);
    await admin.query("INSERT INTO public.packages(id,name,code,audience_code,duration_months) VALUES($1,'QA disposable plan',$2,'TEST',1)", [id, `QA-${id}`]);
    await admin.query("INSERT INTO public.client_packages(id,organization_id,unit_id,client_id,pet_id,package_id,code,contracted_baths,contracted_groomings,balance_baths,balance_groomings,price,contract_date,status) VALUES($1,$2,$3,$1,$1,$1,$4,$5,0,$5,0,0,current_date,'active')", [id, org, unit, `QA-${id}`, balance]);
    for (const [index, aid] of f.appointments.entries()) await admin.query("INSERT INTO public.appointments(id,client_id,pet_id,service_id,professional_id,client_package_id,appointment_date,duration_minutes,status) VALUES($1,$2,$2,$2,$2,$2,$3,60,'in_progress')", [aid, id, index ? '2026-12-01T14:00:00Z' : '2026-12-01T12:00:00Z']);
    await admin.query('COMMIT'); return f;
  }
  async function begin(c, user) { await c.query('BEGIN'); await c.query('SET LOCAL ROLE authenticated'); await c.query("SELECT set_config('request.jwt.claims',$1,true)", [JSON.stringify({ sub: user, role: 'authenticated' })]); }
  async function overlap(f, first, second, reverse = false) {
    const query = reverse ? "SELECT public.reverse_appointment_execution($1,'QA concurrency test')" : 'SELECT public.complete_appointment($1)';
    await begin(a, f.user); await begin(b, f.user);
    await a.query(query, [first]);
    const waiting = b.query(query, [second]).then(() => true, () => false);
    await a.query('SELECT pg_sleep(0.25)'); await a.query('COMMIT');
    const success = await waiting; await b.query(success ? 'COMMIT' : 'ROLLBACK'); return success;
  }
  const duplicate = await setup(4);
  if (!await overlap(duplicate, duplicate.id, duplicate.id)) throw new Error('Duplicate completion did not remain idempotent');
  let state = (await admin.query('SELECT balance_baths,(SELECT count(*)::int FROM public.package_sessions WHERE appointment_id=$1) AS sessions FROM public.client_packages WHERE id=$1', [duplicate.id])).rows[0];
  if (state.balance_baths !== 3 || state.sessions !== 1) throw new Error('Duplicate consumption');
  if (!await overlap(duplicate, duplicate.id, duplicate.id, true)) throw new Error('Duplicate reversal not idempotent');
  state = (await admin.query('SELECT balance_baths FROM public.client_packages WHERE id=$1', [duplicate.id])).rows[0];
  if (state.balance_baths !== 4) throw new Error('Double credit refund');
  console.log('PASS: overlapping duplicate completion uses one credit; overlapping reversal returns one credit.');
  const last = await setup(1);
  if (await overlap(last, last.id, last.appointments[1])) throw new Error('Last credit consumed twice');
  state = (await admin.query('SELECT balance_baths,(SELECT count(*)::int FROM public.package_sessions WHERE client_package_id=$1) AS sessions FROM public.client_packages WHERE id=$1', [last.id])).rows[0];
  if (state.balance_baths !== 0 || state.sessions !== 1) throw new Error('Invalid last-credit race outcome');
  console.log('PASS: two appointments racing for one remaining credit yield one success, one rejection and no negative balance.');
  const booking = await setup(4);
  const createIds = [randomUUID(), randomUUID()]; booking.appointments.push(...createIds);
  const insert = "INSERT INTO public.appointments(id,client_id,pet_id,service_id,professional_id,appointment_date,duration_minutes,status) VALUES($1,$2,$2,$2,$2,'2026-12-02T12:00:00Z',60,'confirmed')";
  await begin(a, booking.user); await begin(b, booking.user);
  await a.query(insert, [createIds[0], booking.id]);
  let waiting = b.query(insert, [createIds[1], booking.id]).then(() => true, () => false);
  await a.query('SELECT pg_sleep(0.25)'); await a.query('COMMIT');
  let secondSucceeded = await waiting; await b.query(secondSucceeded ? 'COMMIT' : 'ROLLBACK');
  if (secondSucceeded) throw new Error('Concurrent overlapping booking accepted');
  const created = (await admin.query('SELECT count(*)::int AS n FROM public.appointments WHERE id=ANY($1::uuid[])', [createIds])).rows[0].n;
  if (created !== 1) throw new Error('Incorrect booking race count');
  const reschedule = "UPDATE public.appointments SET appointment_date='2026-12-03T12:00:00Z' WHERE id=$1";
  await begin(a, booking.user); await begin(b, booking.user);
  await a.query(reschedule, [booking.id]);
  waiting = b.query(reschedule, [booking.appointments[1]]).then(() => true, () => false);
  await a.query('SELECT pg_sleep(0.25)'); await a.query('COMMIT');
  secondSucceeded = await waiting; await b.query(secondSucceeded ? 'COMMIT' : 'ROLLBACK');
  if (secondSucceeded) throw new Error('Concurrent overlapping reschedule accepted');
  console.log('PASS: overlapping booking creation and rescheduling races reject the second conflicting write.');
  testsPassed = true;
} catch (error) {
  await fs.writeFile(path.join(root, 'qa-concurrency-private-error.json'), JSON.stringify({ code: error?.code, message: error?.message }, null, 2)).catch(() => {});
  console.error('QA_CONCURRENCY_NOT_CONFIRMED; only disposable QA fixture IDs were used.'); process.exitCode = 1;
} finally {
  for (const c of connections) await c.query('ROLLBACK').catch(() => {});
  if (admin) {
    for (const f of fixtures) {
      try {
        await admin.query('BEGIN');
        for (const t of ['appointment_reversals', 'appointment_package_allocations', 'visit_history', 'package_sessions']) await admin.query(`DELETE FROM public.${t} WHERE appointment_id=ANY($1::uuid[])`, [f.appointments]);
        await admin.query('DELETE FROM public.appointments WHERE id=ANY($1::uuid[])', [f.appointments]);
        for (const t of ['client_packages', 'packages', 'pets', 'clientes', 'professionals', 'services']) await admin.query(`DELETE FROM public.${t} WHERE id=$1`, [f.id]);
        await admin.query('DELETE FROM public.user_unit_access WHERE user_id=$1', [f.user]);
        await admin.query('DELETE FROM public.profiles WHERE id=$1', [f.user]);
        await admin.query('DELETE FROM auth.users WHERE id=$1', [f.user]);
        await admin.query('COMMIT');
      } catch { await admin.query('ROLLBACK').catch(() => {}); console.error('QA fixture cleanup needs review; no production records were used.'); process.exitCode = 1; }
    }
  }
  if (admin && testsPassed && !process.exitCode) {
    const users = fixtures.map(f => f.user); const ids = fixtures.flatMap(f => f.appointments);
    const left = (await admin.query('SELECT (SELECT count(*)::int FROM auth.users WHERE id=ANY($1::uuid[])) AS users,(SELECT count(*)::int FROM public.appointments WHERE id=ANY($2::uuid[])) AS appointments', [users, ids])).rows[0];
    if (left.users || left.appointments) { console.error('QA fixture cleanup verification failed'); process.exitCode = 1; }
    else {
      await fs.writeFile(path.join(root, 'qa-credit-concurrency.json'), JSON.stringify({ target: 'bvmyovgourushalerpza', checkedAt: new Date().toISOString(), independentConnections: 2, duplicateCompletion: true, duplicateReversal: true, lastCreditRace: true, fixtureCleanupVerified: true, schedulingCollisionRaceTested: true, bookingCreateRace: true, bookingRescheduleRace: true }, null, 2));
      console.log('PASS: disposable QA users and appointments removed.');
    }
  }
  for (const c of connections) await c.end().catch(() => {});
}
