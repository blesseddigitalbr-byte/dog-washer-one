/**
 * Database helpers para Units
 */

import { getDb } from "../db";
import { units, Unit, InsertUnit } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Listar todas as unidades com filtro opcional por organização
 */
export async function listUnits(organizationId?: string): Promise<Unit[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot list units: database not available");
    return [];
  }

  try {
    let query = db.select().from(units).where(eq(units.isActive, true));

    if (organizationId) {
      query = db
        .select()
        .from(units)
        .where(and(eq(units.organizationId, organizationId), eq(units.isActive, true)));
    }

    return await query;
  } catch (error) {
    console.error("[DB] Erro ao listar unidades:", error);
    throw error;
  }
}

/**
 * Buscar unidade por ID
 */
export async function getUnitById(unitId: string): Promise<Unit | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot get unit: database not available");
    return null;
  }

  try {
    const result = await db.select().from(units).where(eq(units.id, unitId)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DB] Erro ao buscar unidade:", error);
    throw error;
  }
}

/**
 * Buscar unidade por código
 */
export async function getUnitByCode(code: string): Promise<Unit | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[DB] Cannot get unit: database not available");
    return null;
  }

  try {
    const result = await db.select().from(units).where(eq(units.code, code)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[DB] Erro ao buscar unidade por código:", error);
    throw error;
  }
}

/**
 * Criar nova unidade
 */
export async function createUnit(data: InsertUnit): Promise<Unit> {
  const db = await getDb();
  if (!db) {
    throw new Error("[DB] Cannot create unit: database not available");
  }

  try {
    const result = await db.insert(units).values(data).returning();
    return result[0];
  } catch (error) {
    console.error("[DB] Erro ao criar unidade:", error);
    throw error;
  }
}

/**
 * Atualizar unidade
 */
export async function updateUnit(unitId: string, data: Partial<InsertUnit>): Promise<Unit> {
  const db = await getDb();
  if (!db) {
    throw new Error("[DB] Cannot update unit: database not available");
  }

  try {
    const result = await db
      .update(units)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(units.id, unitId))
      .returning();

    if (result.length === 0) {
      throw new Error(`Unit not found: ${unitId}`);
    }

    return result[0];
  } catch (error) {
    console.error("[DB] Erro ao atualizar unidade:", error);
    throw error;
  }
}

/**
 * Desativar unidade (soft delete)
 */
export async function deactivateUnit(unitId: string): Promise<Unit> {
  const db = await getDb();
  if (!db) {
    throw new Error("[DB] Cannot deactivate unit: database not available");
  }

  try {
    const result = await db
      .update(units)
      .set({ isActive: false, status: "inactive", updatedAt: new Date() })
      .where(eq(units.id, unitId))
      .returning();

    if (result.length === 0) {
      throw new Error(`Unit not found: ${unitId}`);
    }

    return result[0];
  } catch (error) {
    console.error("[DB] Erro ao desativar unidade:", error);
    throw error;
  }
}
