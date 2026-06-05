import { describe, it, expect, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Mock das funções de database
vi.mock("../db/units", () => ({
  listUnits: vi.fn().mockResolvedValue([]),
  getUnitById: vi.fn().mockResolvedValue(null),
  getUnitByCode: vi.fn().mockResolvedValue(null),
  createUnit: vi.fn().mockResolvedValue(null),
  updateUnit: vi.fn().mockResolvedValue(null),
  deactivateUnit: vi.fn().mockResolvedValue(null),
}));

vi.mock("../utils/contextResolver", () => ({
  resolveContextSync: vi.fn().mockReturnValue({
    unitId: null,
    organizationId: null,
    legalEntityId: null,
  }),
}));

// Mock de usuário autenticado
const mockUser = {
  id: 1,
  openId: "test-user-123",
  email: "test@example.com",
  name: "Test User",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

// Mock de contexto
function createMockContext(user: typeof mockUser | null = mockUser): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Units Router", () => {
  describe("units.list", () => {
    it("deve retornar lista vazia quando nenhuma unidade existe", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const result = await caller.units.list({ organizationId: undefined });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    }, { timeout: 10000 });

    it("deve aceitar organizationId como filtro", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const testOrgId = "550e8400-e29b-41d4-a716-446655440000";
      
      const result = await caller.units.list({ organizationId: testOrgId });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    }, { timeout: 10000 });
  });

  describe("units.getById", () => {
    it("deve retornar erro quando unidade não existe", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const fakeId = "550e8400-e29b-41d4-a716-446655440001";

      const result = await caller.units.getById({ id: fakeId });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unidade não encontrada");
    }, { timeout: 10000 });

    it("deve validar UUID inválido", async () => {
      const caller = appRouter.createCaller(createMockContext());

      try {
        await caller.units.getById({ id: "invalid-uuid" });
        expect.fail("Deveria ter lançado erro");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    }, { timeout: 10000 });
  });

  describe("units.create", () => {
    it("deve rejeitar quando usuário não está autenticado", async () => {
      const caller = appRouter.createCaller(createMockContext(null));

      try {
        await caller.units.create({
          organizationId: "550e8400-e29b-41d4-a716-446655440000",
          legalEntityId: "550e8400-e29b-41d4-a716-446655440001",
          name: "Test Unit",
          code: "TEST-001",
          address: "Rua Teste, 123",
          phone: "(11) 99999-9999",
          email: "unit@test.com",
          managerName: "Manager",
          managerEmail: "manager@test.com",
        });
        expect.fail("Deveria ter lançado erro de autenticação");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    }, { timeout: 10000 });

    it("deve validar campos obrigatórios", async () => {
      const caller = appRouter.createCaller(createMockContext());

      try {
        await caller.units.create({
          organizationId: "550e8400-e29b-41d4-a716-446655440000",
          legalEntityId: "550e8400-e29b-41d4-a716-446655440001",
          name: "",
          code: "TEST-001",
          address: "Rua Teste, 123",
          phone: "(11) 99999-9999",
          email: "unit@test.com",
          managerName: "Manager",
          managerEmail: "manager@test.com",
        });
        expect.fail("Deveria ter validado campo vazio");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    }, { timeout: 10000 });

    it("deve validar formato de email", async () => {
      const caller = appRouter.createCaller(createMockContext());

      try {
        await caller.units.create({
          organizationId: "550e8400-e29b-41d4-a716-446655440000",
          legalEntityId: "550e8400-e29b-41d4-a716-446655440001",
          name: "Test Unit",
          code: "TEST-001",
          address: "Rua Teste, 123",
          phone: "(11) 99999-9999",
          email: "invalid-email",
          managerName: "Manager",
          managerEmail: "manager@test.com",
        });
        expect.fail("Deveria ter validado email inválido");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    }, { timeout: 10000 });

    it("deve validar UUID inválido para organizationId", async () => {
      const caller = appRouter.createCaller(createMockContext());

      try {
        await caller.units.create({
          organizationId: "invalid-uuid",
          legalEntityId: "550e8400-e29b-41d4-a716-446655440001",
          name: "Test Unit",
          code: "TEST-001",
          address: "Rua Teste, 123",
          phone: "(11) 99999-9999",
          email: "unit@test.com",
          managerName: "Manager",
          managerEmail: "manager@test.com",
        });
        expect.fail("Deveria ter validado UUID inválido");
      } catch (error: any) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    }, { timeout: 10000 });
  });

  describe("units.update", () => {
    it("deve rejeitar quando usuário não está autenticado", async () => {
      const caller = appRouter.createCaller(createMockContext(null));

      try {
        await caller.units.update({
          id: "550e8400-e29b-41d4-a716-446655440000",
          data: { name: "Updated Name" },
        });
        expect.fail("Deveria ter lançado erro de autenticação");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    }, { timeout: 10000 });

    it("deve retornar erro quando unidade não existe", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const fakeId = "550e8400-e29b-41d4-a716-446655440001";

      const result = await caller.units.update({
        id: fakeId,
        data: { name: "Updated Name" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unidade não encontrada");
    }, { timeout: 10000 });
  });

  describe("units.deactivate", () => {
    it("deve rejeitar quando usuário não está autenticado", async () => {
      const caller = appRouter.createCaller(createMockContext(null));

      try {
        await caller.units.deactivate({
          id: "550e8400-e29b-41d4-a716-446655440000",
        });
        expect.fail("Deveria ter lançado erro de autenticação");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    }, { timeout: 10000 });

    it("deve retornar erro quando unidade não existe", async () => {
      const caller = appRouter.createCaller(createMockContext());
      const fakeId = "550e8400-e29b-41d4-a716-446655440001";

      const result = await caller.units.deactivate({ id: fakeId });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unidade não encontrada");
    }, { timeout: 10000 });
  });
});
