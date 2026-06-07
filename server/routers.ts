import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import * as db from "./db";
import { supabase } from "./_core/supabase";

const COOKIE_NAME = "manus_session";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    register: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if user already exists
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new Error("Email já cadastrado");
        }

        // Create user with email as openId
        const openId = `email_${input.email}`;
        await db.upsertUser({
          openId,
          name: input.name,
          email: input.email,
          loginMethod: "email",
          role: "user",
        });

        // Create session token
        const sessionToken = await sdk.createSessionToken(openId, { name: input.name });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

        return { success: true };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
      }))
      .mutation(async ({ input, ctx }) => {
        // Find user by email
        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new Error("Email ou senha inválidos");
        }

        // Create session token
        const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || "" });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, cookieOptions);

        return { success: true };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Clients & Pets routers
  clients: router({
    // List all clients with their associated pets
    list: publicProcedure.query(async () => {
      try {
        const { data: clientes, error } = await supabase
          .from("clientes")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Fetch pets for each client
        const clientesComPets = await Promise.all(
          (clientes || []).map(async (cliente) => {
            const { data: pets, error: petsError } = await supabase
              .from("pets")
              .select("*")
              .eq("client_id", cliente.id);

            if (petsError) console.error("Error fetching pets:", petsError);

            return {
              ...cliente,
              pets: pets || [],
            };
          })
        );

        return clientesComPets;
      } catch (error) {
        console.error("Error fetching clients:", error);
        return [];
      }
    }),

    // Get a single client by ID with their pets
    getById: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input }) => {
        try {
          const { data: cliente, error } = await supabase
            .from("clientes")
            .select("*")
            .eq("id", input.id)
            .single();

          if (error) throw error;
          if (!cliente) return null;

          const { data: pets, error: petsError } = await supabase
            .from("pets")
            .select("*")
            .eq("client_id", cliente.id);

          if (petsError) console.error("Error fetching pets:", petsError);

          return {
            ...cliente,
            pets: pets || [],
          };
        } catch (error) {
          console.error("Error fetching client:", error);
          return null;
        }
      }),

    // Create a new client with all fields
    create: publicProcedure
      .input(z.object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        phone: z.string().min(1, "Telefone é obrigatório"),
        cpf: z.string().optional(),
        cep: z.string().optional(),
        logradouro: z.string().optional(),
        numero: z.string().optional(),
        complemento: z.string().optional(),
        cidade: z.string().optional(),
        uf: z.string().optional(),
        isVip: z.boolean().default(false),
        isModelDog: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        try {
          const { data, error } = await supabase
            .from("clientes")
            .insert([{
              nome: input.name,
              email: input.email,
              phone: input.phone,
              cpf: input.cpf || null,
              cep: input.cep || null,
              logradouro: input.logradouro || null,
              numero: input.numero || null,
              complemento: input.complemento || null,
              cidade: input.cidade || null,
              uf: input.uf || null,
              is_vip: input.isVip,
              is_model_dog: input.isModelDog,
            }])
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error creating client:", error);
          throw new Error("Erro ao criar cliente");
        }
      }),

    // Update a client with all fields
    update: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        phone: z.string().min(1, "Telefone é obrigatório"),
        cpf: z.string().optional(),
        logradouro: z.string().optional(),
        numero: z.string().optional(),
        complemento: z.string().optional(),
        cidade: z.string().optional(),
        uf: z.string().optional(),
        cep: z.string().optional(),
        isVip: z.boolean().default(false),
        isModelDog: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        try {
          const { id, ...updateData } = input;
          const { data, error } = await supabase
            .from("clientes")
            .update({
              nome: updateData.name,
              email: updateData.email,
              phone: updateData.phone,
              cpf: updateData.cpf || null,
              logradouro: updateData.logradouro || null,
              numero: updateData.numero || null,
              complemento: updateData.complemento || null,
              cidade: updateData.cidade || null,
              uf: updateData.uf || null,
              cep: updateData.cep || null,
              is_vip: updateData.isVip,
              is_model_dog: updateData.isModelDog,
            })
            .eq("id", id)
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error updating client:", error);
          throw new Error("Erro ao atualizar cliente");
        }
      }),

    // Delete a client
    delete: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        try {
          // Delete all pets first
          await supabase.from("pets").delete().eq("client_id", input.id);

          // Then delete the client
          const { error } = await supabase
            .from("clientes")
            .delete()
            .eq("id", input.id);

          if (error) throw error;
          return { success: true };
        } catch (error) {
          console.error("Error deleting client:", error);
          throw new Error("Erro ao deletar cliente");
        }
      }),
  }),

  // Pets router
  pets: router({
    // Create a new pet with all fields
    create: publicProcedure
      .input(z.object({
        clientId: z.string().uuid(),
        name: z.string().min(1, "Nome do pet é obrigatório"),
        breed: z.string().min(1, "Raça é obrigatória"),
        species: z.string().optional(),
        color: z.string().optional(),
        birthDate: z.string().optional(),
        weight: z.string().min(1, "Peso é obrigatório"),
        microchip: z.string().optional(),
        notes: z.string().optional(),
        photo: z.string().optional(),
        status: z.string().default("active"),
      }))
      .mutation(async ({ input }) => {
        try {
          const { data, error } = await supabase
            .from("pets")
            .insert([{
              client_id: input.clientId,
              name: input.name,
              breed: input.breed,
              species: input.species || null,
              color: input.color || null,
              birth_date: input.birthDate || null,
              weight: input.weight,
              microchip: input.microchip || null,
              notes: input.notes || null,
              photo: input.photo || null,
              status: input.status,
            }])
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error creating pet:", error);
          throw new Error("Erro ao criar pet");
        }
      }),

    // Update a pet with all fields
    update: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
        name: z.string().min(1, "Nome do pet é obrigatório"),
        breed: z.string().min(1, "Raça é obrigatória"),
        species: z.string().optional(),
        color: z.string().optional(),
        birthDate: z.string().optional(),
        weight: z.string().min(1, "Peso é obrigatório"),
        microchip: z.string().optional(),
        notes: z.string().optional(),
        photo: z.string().optional(),
        status: z.string().default("active"),
        vaccines: z.string().optional(),
        dewormed: z.boolean().optional(),
        hasDiseasesOrAllergies: z.boolean().optional(),
        diseasesOrAllergiesDescription: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { id, ...updateData } = input;
          const { data, error } = await supabase
            .from("pets")
            .update({
              name: updateData.name,
              breed: updateData.breed,
              species: updateData.species || null,
              color: updateData.color || null,
              birth_date: updateData.birthDate || null,
              weight: updateData.weight,
              microchip: updateData.microchip || null,
              notes: updateData.notes || null,
              photo: updateData.photo || null,
              status: updateData.status,
              vaccines: updateData.vaccines || null,
              dewormed: updateData.dewormed || false,
              has_diseases_or_allergies: updateData.hasDiseasesOrAllergies || false,
              diseases_or_allergies_description: updateData.diseasesOrAllergiesDescription || null,
            })
            .eq("id", id)
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          console.error("Error updating pet:", error);
          throw new Error("Erro ao atualizar pet");
        }
      }),

    // Delete a pet
    delete: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        try {
          const { error } = await supabase
            .from("pets")
            .delete()
            .eq("id", input.id);

          if (error) throw error;
          return { success: true };
        } catch (error) {
          console.error("Error deleting pet:", error);
          throw new Error("Erro ao deletar pet");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
