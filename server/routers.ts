import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { unitsRouter } from "./routers/units";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { sdk } from "./_core/sdk";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    register: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          console.log("[Auth] Registrando novo usuário:", { email: input.email, name: input.name });
          
          // Verificar se usuário já existe
          const existingUser = await db.getUserByEmail(input.email);
          if (existingUser) {
            console.log("[Auth] Email já cadastrado:", input.email);
            throw new TRPCError({
              code: "CONFLICT",
              message: "Este email já está cadastrado",
            });
          }

          // Criar novo usuário com openId baseado no email
          const openId = `local_${input.email}_${Date.now()}`;
          console.log("[Auth] Salvando usuário no Supabase com openId:", openId);
          
          await db.upsertUser({
            openId,
            name: input.name,
            email: input.email,
            loginMethod: "local",
          });

          // Criar session token e setar cookie
          const sessionToken = await sdk.createSessionToken(openId, {
            name: input.name,
            expiresInMs: ONE_YEAR_MS,
          });

          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

          console.log("[Auth] Usuário registrado com sucesso e cookie setado");

          return {
            success: true,
            user: {
              id: openId,
              openId,
              email: input.email,
              name: input.name,
            },
          };
        } catch (error) {
          console.error("[Auth] Erro ao registrar:", error);
          throw error;
        }
      }),
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          console.log("[Auth] Login com email:", input.email);
          
          // Buscar usuário por email
          const user = await db.getUserByEmail(input.email);
          if (!user) {
            console.log("[Auth] Usuário não encontrado:", input.email);
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Email ou senha inválidos",
            });
          }

          // Criar session token e setar cookie
          const sessionToken = await sdk.createSessionToken(user.openId, {
            name: user.name || "",
            expiresInMs: ONE_YEAR_MS,
          });

          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

          console.log("[Auth] Login bem-sucedido e cookie setado:", input.email);

          return {
            success: true,
            user: {
              id: user.id,
              openId: user.openId,
              email: user.email,
              name: user.name,
              role: user.role,
            },
          };
        } catch (error) {
          console.error("[Auth] Erro ao fazer login:", error);
          throw error;
        }
      }),
  }),
  units: unitsRouter,
});

export type AppRouter = typeof appRouter;
