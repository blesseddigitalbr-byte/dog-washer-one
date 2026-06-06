/**
 * tRPC Router para Units com isolamento Multi-Tenant
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  listUnits,
  getUnitById,
  getUnitByCode,
  createUnit,
  updateUnit,
  deactivateUnit,
} from "../db/units";
import { resolveContextSync } from "../utils/contextResolver";

// Schemas de validação
const UnitCreateSchema = z.object({
  organizationId: z.string().uuid("ID de organização inválido"),
  legalEntityId: z.string().uuid("ID de pessoa jurídica inválido"),
  name: z.string().min(1, "Nome é obrigatório").max(255),
  code: z.string().min(1, "Código é obrigatório").max(50),
  address: z.string().min(1, "Endereço é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório").max(50),
  email: z.string().email("E-mail inválido"),
  managerName: z.string().min(1, "Nome do gerente é obrigatório").max(255),
  managerEmail: z.string().email("E-mail do gerente inválido"),
  unitType: z.string().max(50).optional().default("salon"),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  cnpj: z.string().max(20).optional(),
  razaoSocial: z.string().max(255).optional(),
  inscricaoMunicipal: z.string().max(50).optional(),
  inscricaoEstadual: z.string().max(50).optional(),
  cnae: z.string().max(20).optional(),
  serviceCode: z.string().max(50).optional(),
  nfseDescriptionTemplate: z.string().optional(),
  nfseDefaultValue: z.string().optional(),
  codigoTributacaoNacional: z.string().max(50).optional(),
  codigoNbs: z.string().max(50).optional(),
  asaasApiKey: z.string().optional(),
  asaasAccountId: z.string().max(255).optional(),
  asaasWalletId: z.string().max(255).optional(),
});

const UnitUpdateSchema = UnitCreateSchema.partial();

/**
 * Procedure protegida que valida contexto Multi-Tenant
 * Nota: Para produção, você implementaria validação real de ownership
 * verificando se o usuário tem permissão para acessar a organização
 */
const protectedUnitProcedure = publicProcedure.use(async ({ ctx, next }) => {
  // Em produção, validar se usuário está autenticado e tem acesso à organização
  // Por enquanto, permitimos acesso para testes
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Autenticação necessária",
    });
  }
  return next({ ctx });
});

export const unitsRouter = router({
  /**
   * Listar todas as unidades (com filtro opcional por organização)
   */
  list: publicProcedure
    .input(
      z.object({
        organizationId: z.string().uuid().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        // TODO: Em produção, validar que o usuário tem acesso a esta organização
        const units = await listUnits(input.organizationId);
        return {
          success: true,
          data: units,
          total: units.length,
        };
      } catch (error) {
        console.error("[Units Router] Erro ao listar unidades:", error);
        throw error;
      }
    }),

  /**
   * Buscar unidade por ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid("ID inválido") }))
    .query(async ({ input }) => {
      try {
        const unit = await getUnitById(input.id);
        if (!unit) {
          return {
            success: false,
            error: "Unidade não encontrada",
          };
        }
        // TODO: Validar que o usuário tem acesso a esta unidade
        return {
          success: true,
          data: unit,
        };
      } catch (error) {
        console.error("[Units Router] Erro ao buscar unidade:", error);
        throw error;
      }
    }),

  /**
   * Buscar unidade por código
   */
  getByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      try {
        const unit = await getUnitByCode(input.code);
        if (!unit) {
          return {
            success: false,
            error: "Unidade não encontrada",
          };
        }
        // TODO: Validar que o usuário tem acesso a esta unidade
        return {
          success: true,
          data: unit,
        };
      } catch (error) {
        console.error("[Units Router] Erro ao buscar unidade por código:", error);
        throw error;
      }
    }),

  /**
   * Criar nova unidade
   */
  create: protectedUnitProcedure
    .input(UnitCreateSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // TODO: Validar que o usuário tem permissão para criar unidades nesta organização
        
        // Validar se código é único
        const existing = await getUnitByCode(input.code);
        if (existing) {
          return {
            success: false,
            error: "Código de unidade já existe",
          };
        }

        const newUnit = await createUnit({
          ...input,
          status: "active",
          isActive: true,
          createdAt: new Date(),
        });

        return {
          success: true,
          data: newUnit,
          message: "Unidade criada com sucesso",
        };
      } catch (error) {
        console.error("[Units Router] Erro ao criar unidade:", error);
        throw error;
      }
    }),

  /**
   * Atualizar unidade
   */
  update: protectedUnitProcedure
    .input(
      z.object({
        id: z.string().uuid("ID inválido"),
        data: UnitUpdateSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verificar se unidade existe
        const existing = await getUnitById(input.id);
        if (!existing) {
          return {
            success: false,
            error: "Unidade não encontrada",
          };
        }

        // TODO: Validar que o usuário tem permissão para editar esta unidade
        
        // Se código foi alterado, verificar unicidade
        if (input.data.code && input.data.code !== existing.code) {
          const codeExists = await getUnitByCode(input.data.code);
          if (codeExists) {
            return {
              success: false,
              error: "Código de unidade já existe",
            };
          }
        }

        const updated = await updateUnit(input.id, input.data);

        return {
          success: true,
          data: updated,
          message: "Unidade atualizada com sucesso",
        };
      } catch (error) {
        console.error("[Units Router] Erro ao atualizar unidade:", error);
        throw error;
      }
    }),

  /**
   * Desativar unidade (soft delete)
   */
  deactivate: protectedUnitProcedure
    .input(z.object({ id: z.string().uuid("ID inválido") }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Verificar se unidade existe
        const existing = await getUnitById(input.id);
        if (!existing) {
          return {
            success: false,
            error: "Unidade não encontrada",
          };
        }

        // TODO: Validar que o usuário tem permissão para desativar esta unidade

        const deactivated = await deactivateUnit(input.id);

        return {
          success: true,
          data: deactivated,
          message: "Unidade desativada com sucesso",
        };
      } catch (error) {
        console.error("[Units Router] Erro ao desativar unidade:", error);
        throw error;
      }
    }),
});
