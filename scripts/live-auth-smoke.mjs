// Read-only business checks. Creates only Auth sessions; never payments, messages or users.
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local", quiet: true });
config({ path: ".env.test.local", quiet: true });
const base = "https://olivedrab-emu-744435.hostingersite.com";
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const identities = [
  { label: "Lux operation", prefix: "LUX", org: "d0000000-0000-4000-8000-000000000001" },
  { label: "QA operation", prefix: "QA", org: "2c20b78f-f4c6-4581-b23a-310738d3f968" },
];
if (url !== "https://cvnshgqqqwwkcjeunecj.supabase.co" || !key || identities.some(identity => !process.env[`DWO_TEST_${identity.prefix}_EMAIL`] || !process.env[`DWO_TEST_${identity.prefix}_PASSWORD`])) {
  console.error("BLOCKED: configure only test-account credentials in ignored .env.test.local and the approved public Supabase settings in .env.local. Do not send credentials to chat or GitHub.");
  process.exit(2);
}
async function query(path, token, input) {
  const params = input === undefined ? "" : `?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
  const response = await fetch(`${base}/api/trpc/${path}${params}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) return { status: response.status };
  const body = await response.json();
  return { status: response.status, data: body.result?.data?.json };
}
const sessions = [];
try {
  for (const identity of identities) {
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const signed = await client.auth.signInWithPassword({ email: process.env[`DWO_TEST_${identity.prefix}_EMAIL`], password: process.env[`DWO_TEST_${identity.prefix}_PASSWORD`] });
    if (signed.error || !signed.data.session) throw new Error("Test login failed");
    sessions.push({ client, token: signed.data.session.access_token, ...identity });
  }
  const results = [];
  for (const session of sessions) {
    const me = await query("auth.me", session.token);
    if (me.status !== 200 || me.data?.role !== "staff" || me.data?.organizationId !== session.org) throw new Error("Unexpected test identity or role");
    const workspace = await query("workspace.context", session.token);
    if (workspace.status !== 200 || workspace.data?.organization?.id !== session.org) throw new Error("Wrong workspace");
    const clients = await query("clients.list", session.token);
    if (clients.status !== 200 || !Array.isArray(clients.data) || !clients.data.length) throw new Error("Missing positive client control");
    for (const procedure of ["userAccess.list", "asaas.externalInvoices"]) {
      if ((await query(procedure, session.token)).status !== 403) throw new Error("Staff privileged endpoint accessible");
    }
    results.push({ session, clients: clients.data });
  }
  for (let index = 0; index < results.length; index++) {
    const own = results[index], foreign = results[1 - index];
    if (own.clients.some(client => foreign.clients.some(other => other.id === client.id))) throw new Error("Client IDs shared between tenants");
    const read = await query("clients.getById", own.session.token, { id: foreign.clients[0].id });
    if (read.status !== 200 || read.data !== null) throw new Error("Cross-tenant direct ID read exposed or unexpectedly failed");
  }
  console.log("PASS: two test logins, expected roles/workspaces, positive client controls, staff restrictions and bidirectional direct-ID read denial. No financial operations executed.");
} catch {
  // Do not print responses, account emails, tokens, passwords or provider errors.
  console.error("FAIL: authenticated smoke check did not pass. Review test configuration and application logs securely.");
  process.exitCode = 1;
} finally {
  for (const session of sessions) await session.client.auth.signOut({ scope: "local" }).catch(() => undefined);
}
