import { describe, it, expect } from 'vitest';
// Pure helpers only: no file/credential reads, database clients or restore process.
import { assertQaDestination, selectQaRestoreEntries } from '../scripts/recovery-guards.mjs';
const source = new URL('postgresql://postgres.cvnshgqqqwwkcjeunecj:test@aws-1-sa-east-1.pooler.supabase.com:5432/postgres');
const qa = 'postgresql://postgres.bvmyovgourushalerpza:test@aws-1-ca-central-1.pooler.supabase.com:5432/postgres';
describe('isolated recovery guards', () => {
  it('accepts only the explicitly approved QA destination', () => expect(() => assertQaDestination(new URL(qa), source)).not.toThrow());
  it.each([source.toString(), qa.replace('bvmyovgourushalerpza', 'crimbrccbtgfshdkiktj'), qa.replace(':5432', ':6543'), qa.replace('/postgres', '/other'), qa + '?sslmode=disable', qa.replace('aws-1-ca-central-1.pooler.supabase.com', 'example.com')])('rejects production or a changed destination: %s', uri => expect(() => assertQaDestination(new URL(uri), source)).toThrow());
  it('restores data and RLS but not sessions, jobs, outbound queues or managed schema definitions', () => {
    const bodies = ['TABLE DATA public clientes postgres', 'ROW SECURITY public clientes postgres', 'POLICY public clientes unit_boundary_guard postgres', 'TABLE DATA auth users supabase_auth_admin', 'TABLE DATA auth identities supabase_auth_admin', 'TABLE DATA auth sessions supabase_auth_admin', 'TABLE DATA auth refresh_tokens supabase_auth_admin', 'TABLE DATA cron job postgres', 'TABLE DATA net http_request_queue postgres', 'TABLE DATA vault secrets supabase_admin', 'TABLE auth users supabase_auth_admin', 'TABLE DATA storage objects supabase_storage_admin'];
    const entries = bodies.map((s, i) => `${i + 1}; 0 0 ${s}`);
    expect(selectQaRestoreEntries(entries)).toEqual([entries[0], entries[1], entries[2], entries[3], entries[4], entries[11]]);
  });
  it('preserves managed default privileges while selecting application-owned privileges', () => {
    const entries = ['1; 0 0 DEFAULT ACL public DEFAULT PRIVILEGES FOR FUNCTIONS supabase_admin', '2; 0 0 DEFAULT ACL public DEFAULT PRIVILEGES FOR FUNCTIONS postgres', '3; 0 0 ACL public TABLE client_packages postgres'];
    expect(selectQaRestoreEntries(entries)).toEqual([entries[1], entries[2]]);
  });
});
