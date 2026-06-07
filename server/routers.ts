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
          .select("id, nome, email, phone")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Fetch pets for each client
        const clientesComPets = await Promise.all(
          (clientes || []).map(async (cliente) => {
            const { data: pets, error: petsError } = await supabase
              .from("pets")
              .select("id, name, breed, sexo, cor_pelagem, weight, is_vip, is_model_dog")
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
            .select("id, nome, email, phone")
            .eq("id", input.id)
            .single();

          if (error) throw error;
          if (!cliente) return null;

          const { data: pets, error: petsError } = await supabase
            .from("pets")
            .select("id, name, breed, sexo, cor_pelagem, weight, is_vip, is_model_dog")
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

    // Create a new client
    create: publicProcedure
      .input(z.object({
        nome: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        phone: z.string().min(1, "Telefone é obrigatório"),
      }))
      .mutation(async ({ input }) => {
        try {
          const { data, error } = await supabase
            .from("clientes")
            .insert([{
              nome: input.nome,
              email: input.email,
              phone: input.phone,
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

    // Update a client
    update: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
        nome: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        phone: z.string().min(1, "Telefone é obrigatório"),
      }))
      .mutation(async ({ input }) => {
        try {
          const { data, error } = await supabase
            .from("clientes")
            .update({
              nome: input.nome,
              email: input.email,
              phone: input.phone,
            })
            .eq("id", input.id)
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
    // Create a new pet
    create: publicProcedure
      .input(z.object({
        client_id: z.string().uuid(),
        name: z.string().min(1, "Nome do pet é obrigatório"),
        breed: z.string().min(1, "Raça é obrigatória"),
        sexo: z.enum(["M", "F"]),
        cor_pelagem: z.string().min(1, "Cor da pelagem é obrigatória"),
        weight: z.string().min(1, "Peso é obrigatório"),
        is_vip: z.boolean().default(false),
        is_model_dog: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        try {
          const { data, error } = await supabase
            .from("pets")
            .insert([{
              client_id: input.client_id,
              name: input.name,
              breed: input.breed,
              sexo: input.sexo,
              cor_pelagem: input.cor_pelagem,
              weight: input.weight,
              is_vip: input.is_vip,
              is_model_dog: input.is_model_dog,
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

    // Update a pet
    update: publicProcedure
      .input(z.object({
        id: z.string().uuid(),
        name: z.string().min(1, "Nome do pet é obrigatório"),
        breed: z.string().min(1, "Raça é obrigatória"),
        sexo: z.enum(["M", "F"]),
        cor_pelagem: z.string().min(1, "Cor da pelagem é obrigatória"),
        weight: z.string().min(1, "Peso é obrigatório"),
        is_vip: z.boolean(),
        is_model_dog: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { id, ...updateData } = input;
          const { data, error } = await supabase
            .from("pets")
            .update(updateData)
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
