/**
 * Context Resolver - Resolução de IDs organizacionais para compatibilidade legado/novo.
 *
 * Implementa a lógica:
 * - unit_id = unit_id se existir, senão salon_id se existir, senão DEFAULT_UNIT
 * - organization_id = franchise_id se existir, senão DEFAULT_ORG
 * - legal_entity_id = unit.legal_entity_id se existir, senão DEFAULT_LE
 */

import { getDb } from "../db";
import { units } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Constantes de defaults para compatibilidade com dados legados
export const DEFAULT_ORGANIZATION_ID = "default_org";
export const DEFAULT_LEGAL_ENTITY_ID = "default_entity";
export const DEFAULT_UNIT_ID = "default_salon"; // Mantém compatibilidade com salon_id existente

export interface ResolvedContext {
  unitId: string;
  organizationId: string;
  legalEntityId: string;
}

/**
 * Resolve IDs organizacionais com fallbacks para legado.
 *
 * @param unitId - ID da unidade (novo modelo)
 * @param salonId - ID do salão (modelo legado)
 * @param franchiseId - ID da franquia/organização (modelo legado)
 * @param organizationId - ID da organização (novo modelo)
 * @param legalEntityId - ID da pessoa jurídica (novo modelo)
 * @returns Objeto com unit_id, organization_id, legal_entity_id resolvidos
 */
export async function resolveContext(
  unitId?: string,
  salonId?: string,
  franchiseId?: string,
  organizationId?: string,
  legalEntityId?: string
): Promise<ResolvedContext> {
  // 1. Resolver unit_id
  const resolvedUnitId = unitId || salonId || DEFAULT_UNIT_ID;

  // 2. Resolver organization_id
  const resolvedOrgId = organizationId || franchiseId || DEFAULT_ORGANIZATION_ID;

  // 3. Resolver legal_entity_id (buscar da unit se não informado)
  let resolvedLeId = legalEntityId;

  if (!resolvedLeId && resolvedUnitId !== DEFAULT_UNIT_ID) {
    try {
      const db = await getDb();
      if (db) {
        // Buscar legal_entity_id da unidade usando Drizzle ORM
        const result = await db
          .select({ legalEntityId: units.legalEntityId })
          .from(units)
          .where(eq(units.id, resolvedUnitId))
          .limit(1);

        if (result && result.length > 0 && result[0].legalEntityId) {
          resolvedLeId = result[0].legalEntityId;
        }
      }
    } catch (error) {
      console.warn("[ContextResolver] Erro ao buscar legal_entity_id da unit:", error);
    }
  }

  if (!resolvedLeId) {
    resolvedLeId = DEFAULT_LEGAL_ENTITY_ID;
  }

  return {
    unitId: resolvedUnitId,
    organizationId: resolvedOrgId,
    legalEntityId: resolvedLeId,
  };
}

/**
 * Versão síncrona simplificada (sem lookup de unit).
 * Use quando não precisar buscar legal_entity_id da unit.
 */
export function resolveContextSync(
  unitId?: string,
  salonId?: string,
  franchiseId?: string,
  organizationId?: string,
  legalEntityId?: string
): ResolvedContext {
  return {
    unitId: unitId || salonId || DEFAULT_UNIT_ID,
    organizationId: organizationId || franchiseId || DEFAULT_ORGANIZATION_ID,
    legalEntityId: legalEntityId || DEFAULT_LEGAL_ENTITY_ID,
  };
}

/**
 * Adiciona campos organizacionais a um documento.
 */
export function enrichWithOrgContext(
  doc: Record<string, any>,
  context: ResolvedContext
): Record<string, any> {
  return {
    ...doc,
    organizationId: context.organizationId,
    unitId: context.unitId,
    legalEntityId: context.legalEntityId,
  };
}

/**
 * Normaliza documento legado para leitura (adiciona defaults se ausentes).
 */
export function normalizeLegacyDoc(doc: Record<string, any>): Record<string, any> {
  const normalized = { ...doc };

  if (!normalized.organizationId) {
    normalized.organizationId = DEFAULT_ORGANIZATION_ID;
  }
  if (!normalized.unitId && normalized.salonId) {
    normalized.unitId = normalized.salonId;
  } else if (!normalized.unitId) {
    normalized.unitId = DEFAULT_UNIT_ID;
  }
  if (!normalized.legalEntityId) {
    normalized.legalEntityId = DEFAULT_LEGAL_ENTITY_ID;
  }

  return normalized;
}

// Instância global para uso nos routers
export const contextResolver = {
  resolve: resolveContext,
  resolveSync: resolveContextSync,
  enrich: enrichWithOrgContext,
  normalize: normalizeLegacyDoc,
};
