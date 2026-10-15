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
async function mutationStatus(path, token, input) {
  const response = await fetch(`${base}/api/trpc/${path}`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ json: input }), signal: AbortSignal.timeout(20000),
  });
  return response.status;
}
const sessions = [];
let phase = "initialization";
try {
  for (const identity of identities) {
    phase = `${identity.prefix}: login`;
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const signed = await client.auth.signInWithPassword({ email: process.env[`DWO_TEST_${identity.prefix}_EMAIL`], password: process.env[`DWO_TEST_${identity.prefix}_PASSWORD`] });
    if (signed.error || !signed.data.session) {
      const known = new Set(["invalid_credentials", "email_not_confirmed", "over_request_rate_limit", "user_banned"]);
      if (known.has(signed.error?.code)) phase += ` (${signed.error.code})`;
      throw new Error("Test login failed");
    }
    sessions.push({ client, token: signed.data.session.access_token, ...identity });
  }
  const results = [];
  for (const session of sessions) {
    phase = `${session.prefix}: profile`;
    const me = await query("auth.me", session.token);
    if (me.status !== 200 || me.data?.role !== "staff" || me.data?.organizationId !== session.org) throw new Error("Unexpected test identity or role");
    phase = `${session.prefix}: workspace`;
    const workspace = await query("workspace.context", session.token);
    if (workspace.status !== 200 || workspace.data?.organization?.id !== session.org) throw new Error("Wrong workspace");
    phase = `${session.prefix}: client control`;
    const clients = await query("clients.list", session.token);
    if (clients.status !== 200 || !Array.isArray(clients.data) || !clients.data.length) throw new Error("Missing positive client control");
    phase = `${session.prefix}: package payment redaction`;
    const packages = await query("clientPackages.list",session.token);
    if(packages.status!==200 || !Array.isArray(packages.data) || packages.data.some(row=>["payment_status","payment_date","payment_method"].some(field=>Object.hasOwn(row,field)))) throw new Error("Package payment redaction failed");
    phase = `${session.prefix}: direct Data API payment restrictions`;
    const direct=await session.client.from("client_packages").select("payment_status,payment_date,payment_method").limit(1);
    if(direct.error?.code!=="42501")throw new Error("Direct payment columns not blocked");
    const paymentRpc=await session.client.rpc("client_package_payment_details");
    if(paymentRpc.error?.code!=="42501")throw new Error("Payment RPC not blocked");
    for (const procedure of ["userAccess.list", "asaas.externalInvoices", "importReview.list", "supplies.list", "purchases.suppliers", "purchases.documents"]) {
      phase = `${session.prefix}: restriction ${procedure}`;
      if ((await query(procedure, session.token)).status !== 403) throw new Error("Staff privileged endpoint accessible");
    }
    // IDs used only by rolled-back fixtures; never target a real business record.
    for (const [procedure, input] of [
      ["packages.update", { id: "f2000000-0000-4000-8000-000000000001", totalPrice: 0 }],
      ["clientPackages.update", { id: "f2000000-0000-4000-8000-000000000001", price: 0 }],
      ["clientPackages.cancel", { id: "f2000000-0000-4000-8000-000000000001" }],
    ]) {
      phase = `${session.prefix}: management write restriction ${procedure}`;
      if (await mutationStatus(procedure, session.token, input) !== 403) throw new Error("Staff management mutation not forbidden");
    }
    results.push({ session, clients: clients.data });
  }
  for (let index = 0; index < results.length; index++) {
    phase = `tenant isolation direction ${index + 1}`;
    const own = results[index], foreign = results[1 - index];
    if (own.clients.some(client => foreign.clients.some(other => other.id === client.id))) throw new Error("Client IDs shared between tenants");
    const read = await query("clients.getById", own.session.token, { id: foreign.clients[0].id });
    if (read.status !== 200 || read.data !== null) throw new Error("Cross-tenant direct ID read exposed or unexpectedly failed");
  }
  console.log("PASS: two test logins, expected roles/workspaces, positive client controls, staff restrictions, package payment redaction, direct Data API payment denial and bidirectional direct-ID read denial. No financial operations executed.");
} catch {
  // Do not print responses, account emails, tokens, passwords or provider errors.
  console.error(`FAIL: authenticated smoke check at ${phase}. No credentials or provider responses displayed.`);
  process.exitCode = 1;
} finally {
  for (const session of sessions) await session.client.auth.signOut({ scope: "local" }).catch(() => undefined);
}
