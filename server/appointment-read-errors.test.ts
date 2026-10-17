// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrpcContext } from './_core/context';
const mock = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('./_core/supabase.js', () => ({ withTenantSupabase: (_: string, action: () => unknown) => action(), supabase: mock, supabaseAdmin: mock }));
import { appRouter } from './routers';
const ctx: TrpcContext = { user: { id: 'actor', email: 'test@example.invalid', name: null, displayName: null, phone: null, role: 'staff', organizationId: 'org', unitId: 'unit' }, accessToken: 'test', req: {} as any, res: {} as any };
function query(data: unknown, error: unknown) {
  const q: any = {}; for (const method of ['select', 'eq', 'order']) q[method] = vi.fn(() => q);
  q.maybeSingle = vi.fn(async () => ({ data, error }));
  q.then = (resolve: any, reject: any) => Promise.resolve({ data, error }).then(resolve, reject);
  mock.from.mockReturnValue(q); return q;
}
beforeEach(() => vi.clearAllMocks());
describe('agenda read failures are not availability evidence', () => {
  it('reports database failure without leaking its payload', async () => {
    query(null, { message: 'private database detail' });
    await expect(appRouter.createCaller(ctx).appointments.list()).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR', message: 'Não foi possível carregar a agenda. Tente novamente.' });
  });
  it('distinguishes a genuinely empty agenda and repeats unit scope', async () => {
    const q = query([], null); expect(await appRouter.createCaller(ctx).appointments.list()).toEqual([]);
    expect(q.eq).toHaveBeenCalledWith('organization_id', 'org'); expect(q.eq).toHaveBeenCalledWith('unit_id', 'unit');
  });
  it('does not report a database failure as a missing appointment', async () => {
    query(null, { message: 'private detail' });
    await expect(appRouter.createCaller(ctx).appointments.getById({ id: 'd0000000-0000-4000-8000-000000000003' })).rejects.toThrow('Não foi possível carregar o atendimento');
  });
  it('returns null only for a successful missing-record query', async () => {
    const q = query(null, null); expect(await appRouter.createCaller(ctx).appointments.getById({ id: 'd0000000-0000-4000-8000-000000000003' })).toBeNull(); expect(q.eq).toHaveBeenCalledWith('unit_id', 'unit');
  });
  it('rejects anonymous detail reads before querying', async () => {
    await expect(appRouter.createCaller({ ...ctx, user: null, accessToken: null }).appointments.getById({ id: 'd0000000-0000-4000-8000-000000000003' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' }); expect(mock.from).not.toHaveBeenCalled();
  });
  it('rejects a missing active unit before listing', async () => {
    await expect(appRouter.createCaller({ ...ctx, user: { ...ctx.user!, unitId: null } }).appointments.list()).rejects.toMatchObject({ code: 'FORBIDDEN' }); expect(mock.from).not.toHaveBeenCalled();
  });
  it('rejects a missing active unit before a direct-ID read', async () => {
    await expect(appRouter.createCaller({ ...ctx, user: { ...ctx.user!, unitId: null } }).appointments.getById({ id: 'd0000000-0000-4000-8000-000000000003' })).rejects.toMatchObject({ code: 'FORBIDDEN' }); expect(mock.from).not.toHaveBeenCalled();
  });
});
