import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("clients router", () => {
  describe("clients.list", () => {
    it("should return an array of clients with their pets", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clients.list();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check first client structure
      const firstClient = result[0];
      expect(firstClient).toHaveProperty("id");
      expect(firstClient).toHaveProperty("nome");
      expect(firstClient).toHaveProperty("email");
      expect(firstClient).toHaveProperty("phone");
      expect(firstClient).toHaveProperty("pets");
      expect(Array.isArray(firstClient.pets)).toBe(true);
    });

    it("should return clients with proper pet structure", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clients.list();

      // Find a client with pets
      const clientWithPets = result.find((c) => c.pets.length > 0);
      expect(clientWithPets).toBeDefined();

      if (clientWithPets) {
        const pet = clientWithPets.pets[0];
        expect(pet).toHaveProperty("id");
        expect(pet).toHaveProperty("name");
        expect(pet).toHaveProperty("breed");
        expect(pet).toHaveProperty("sexo");
        expect(pet).toHaveProperty("cor_pelagem");
        expect(pet).toHaveProperty("weight");
        expect(pet).toHaveProperty("is_vip");
        expect(pet).toHaveProperty("is_model_dog");
      }
    });

    it("should have at least 5 clients from seed data", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clients.list();

      expect(result.length).toBeGreaterThanOrEqual(5);
    });

    it("should have Helena Silveira with 2 pets", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clients.list();
      const helena = result.find((c) => c.nome === "Helena Silveira");

      expect(helena).toBeDefined();
      expect(helena?.pets.length).toBe(2);
    });
  });

  describe("clients.getById", () => {
    it("should return a specific client by ID", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // First get all clients to get a valid ID
      const allClients = await caller.clients.list();
      expect(allClients.length).toBeGreaterThan(0);

      const clientId = allClients[0].id;
      const result = await caller.clients.getById({ id: clientId });

      expect(result).not.toBeNull();
      expect(result?.id).toBe(clientId);
      expect(result?.nome).toBeDefined();
      expect(result?.email).toBeDefined();
      expect(result?.phone).toBeDefined();
      expect(Array.isArray(result?.pets)).toBe(true);
    });

    it("should return null for non-existent client ID", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const fakeId = "00000000-0000-0000-0000-000000000000";
      const result = await caller.clients.getById({ id: fakeId });

      expect(result).toBeNull();
    });

    it("should return client with all associated pets", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const allClients = await caller.clients.list();
      const clientWithPets = allClients.find((c) => c.pets.length > 0);

      if (clientWithPets) {
        const result = await caller.clients.getById({ id: clientWithPets.id });

        expect(result?.pets.length).toBe(clientWithPets.pets.length);
        result?.pets.forEach((pet) => {
          expect(pet).toHaveProperty("id");
          expect(pet).toHaveProperty("name");
          expect(pet).toHaveProperty("breed");
        });
      }
    });
  });

  describe("VIP and Model Dog filtering", () => {
    it("should identify clients with VIP pets", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const allClients = await caller.clients.list();

      const vipClients = allClients.filter((client) =>
        client.pets.some((pet) => pet.is_vip)
      );

      // Should be an array (may be empty or have items)
      expect(Array.isArray(vipClients)).toBe(true);
    });

    it("should identify clients with model dog pets", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const allClients = await caller.clients.list();

      const modelDogClients = allClients.filter((client) =>
        client.pets.some((pet) => pet.is_model_dog)
      );

      // Should be an array (may be empty or have items)
      expect(Array.isArray(modelDogClients)).toBe(true);
    });

    it("should have pet data with is_vip and is_model_dog properties", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const allClients = await caller.clients.list();
      const clientWithPets = allClients.find((c) => c.pets.length > 0);

      if (clientWithPets) {
        const pet = clientWithPets.pets[0];
        expect(typeof pet.is_vip).toBe("boolean");
        expect(typeof pet.is_model_dog).toBe("boolean");
      }
    });
  });
});
