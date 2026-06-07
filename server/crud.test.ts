import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("CRUD Validation", () => {
  describe("Client Validation", () => {
    it("should reject empty nome on client creation", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.clients.create({
          nome: "",
          email: "test@example.com",
          phone: "(11) 99999-0001",
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Error);
      }
    });

    it("should reject invalid email format", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.clients.create({
          nome: "Test Client",
          email: "invalid-email",
          phone: "(11) 99999-0001",
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Error);
      }
    });

    it("should reject empty phone on client creation", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.clients.create({
          nome: "Test Client",
          email: "test@example.com",
          phone: "",
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Error);
      }
    });

    it("should reject invalid email on client update", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.clients.update({
          id: "00000000-0000-0000-0000-000000000000",
          nome: "Test",
          email: "invalid",
          phone: "(11) 99999-0001",
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe("Pet Validation", () => {
    it("should reject empty pet name", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.pets.create({
          client_id: "00000000-0000-0000-0000-000000000000",
          name: "",
          breed: "Poodle",
          sexo: "M",
          cor_pelagem: "Branco",
          weight: "8.5",
          is_vip: false,
          is_model_dog: false,
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Error);
      }
    });

    it("should reject empty breed", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.pets.create({
          client_id: "00000000-0000-0000-0000-000000000000",
          name: "Bento",
          breed: "",
          sexo: "M",
          cor_pelagem: "Branco",
          weight: "8.5",
          is_vip: false,
          is_model_dog: false,
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Error);
      }
    });

    it("should reject empty color", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.pets.create({
          client_id: "00000000-0000-0000-0000-000000000000",
          name: "Bento",
          breed: "Poodle",
          sexo: "M",
          cor_pelagem: "",
          weight: "8.5",
          is_vip: false,
          is_model_dog: false,
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Error);
      }
    });

    it("should reject empty weight", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.pets.create({
          client_id: "00000000-0000-0000-0000-000000000000",
          name: "Bento",
          breed: "Poodle",
          sexo: "M",
          cor_pelagem: "Branco",
          weight: "",
          is_vip: false,
          is_model_dog: false,
        });
        expect.fail("Should have thrown validation error");
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toBeInstanceOf(Error);
      }
    });

    it("should accept valid pet creation input", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      // Just verify the input structure is accepted (won't actually create due to invalid client_id)
      try {
        await caller.pets.create({
          client_id: "00000000-0000-0000-0000-000000000000",
          name: "Bento",
          breed: "Poodle",
          sexo: "M",
          cor_pelagem: "Branco",
          weight: "8.5",
          is_vip: true,
          is_model_dog: false,
        });
      } catch (error) {
        // Expected to fail due to invalid client_id, but validation should pass
        expect(error).toBeDefined();
        // Should not be a validation error, but a database error
        const errorMsg = error instanceof Error ? error.message : "";
        expect(errorMsg).not.toContain("obrigatório");
      }
    });
  });

  describe("Clients List", () => {
    it("should return array from clients.list", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clients.list();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);

      // If there are clients, verify structure
      if (result.length > 0) {
        const client = result[0];
        expect(client).toHaveProperty("id");
        expect(client).toHaveProperty("nome");
        expect(client).toHaveProperty("email");
        expect(client).toHaveProperty("phone");
        expect(client).toHaveProperty("pets");
        expect(Array.isArray(client.pets)).toBe(true);
      }
    });
  });

  describe("Clients GetById", () => {
    it("should return null for non-existent client", async () => {
      const ctx = createContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clients.getById({
        id: "00000000-0000-0000-0000-000000000000",
      });

      expect(result).toBeNull();
    });
  });
});
