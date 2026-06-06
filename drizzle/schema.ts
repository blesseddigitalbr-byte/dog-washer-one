import { pgTable, varchar, text, timestamp, boolean, json, decimal, uuid, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. UUID managed by the database.
   * Use this for relations between tables.
   */
  id: uuid("id").primaryKey().defaultRandom(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 50 }).default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ========== MULTI-TENANT INFRASTRUCTURE ==========

/**
 * Organizations - Nível mais alto da hierarquia Multi-Tenant
 * Representa um grupo empresarial ou holding que pode ter múltiplas pessoas jurídicas e unidades.
 */
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  tradingName: varchar("trading_name", { length: 255 }),
  description: text("description"),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 255 }),
  settings: json("settings").default({}),
  status: varchar("status", { length: 50 }).default("active"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

/**
 * Legal Entities - Pessoa Jurídica (CNPJ)
 * Representa uma empresa com CNPJ próprio dentro de uma organização.
 */
export const legalEntities = pgTable(
  "legal_entities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  tradingName: varchar("trading_name", { length: 255 }),
  taxId: varchar("tax_id", { length: 20 }).unique(),
  stateRegistration: varchar("state_registration", { length: 50 }),
  municipalRegistration: varchar("municipal_registration", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  zipCode: varchar("zip_code", { length: 20 }),
  country: varchar("country", { length: 50 }).default("BR"),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  legalRepresentativeName: varchar("legal_representative_name", { length: 255 }),
  legalRepresentativeCpf: varchar("legal_representative_cpf", { length: 20 }),
  taxRegime: varchar("tax_regime", { length: 50 }),
  status: varchar("status", { length: 50 }).default("active"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export type LegalEntity = typeof legalEntities.$inferSelect;
export type InsertLegalEntity = typeof legalEntities.$inferInsert;

/**
 * Units - Unidade Operacional (Loja/Filial)
 * Representa uma unidade operacional dentro da hierarquia: Organization → LegalEntity → Unit
 * Suporta Multi-Tenant fiscal: cada unidade pode ter CNPJ e conta Asaas próprios.
 */
export const units = pgTable("units", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  legalEntityId: uuid("legal_entity_id").notNull().references(() => legalEntities.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  unitType: varchar("unit_type", { length: 50 }).default("salon"),
  
  // Dados Fiscais (Multi-Tenant)
  cnpj: varchar("cnpj", { length: 20 }).unique(),
  razaoSocial: varchar("razao_social", { length: 255 }),
  inscricaoMunicipal: varchar("inscricao_municipal", { length: 50 }),
  inscricaoEstadual: varchar("inscricao_estadual", { length: 50 }),
  
  // NFS-e Configuration
  cnae: varchar("cnae", { length: 20 }),
  serviceCode: varchar("service_code", { length: 50 }),
  nfseDescriptionTemplate: text("nfse_description_template"),
  nfseDefaultValue: decimal("nfse_default_value", { precision: 10, scale: 2 }),
  
  // Reforma Tributária
  codigoTributacaoNacional: varchar("codigo_tributacao_nacional", { length: 50 }),
  codigoNbs: varchar("codigo_nbs", { length: 50 }),
  
  // Integração Asaas
  asaasApiKey: text("asaas_api_key"),
  asaasAccountId: varchar("asaas_account_id", { length: 255 }),
  asaasWalletId: varchar("asaas_wallet_id", { length: 255 }),
  
  // Localização
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  zipCode: varchar("zip_code", { length: 20 }),
  
  // Contato
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  
  // Responsável
  managerName: varchar("manager_name", { length: 255 }).notNull(),
  managerEmail: varchar("manager_email", { length: 255 }).notNull(),
  
  // Controle
  status: varchar("status", { length: 50 }).default("active"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export type Unit = typeof units.$inferSelect;
export type InsertUnit = typeof units.$inferInsert;

// ========== RELATIONS ==========

export const organizationsRelations = relations(organizations, ({ many }) => ({
  legalEntities: many(legalEntities),
  units: many(units),
}));

export const legalEntitiesRelations = relations(legalEntities, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [legalEntities.organizationId],
    references: [organizations.id],
  }),
  units: many(units),
}));

export const unitsRelations = relations(units, ({ one }) => ({
  organization: one(organizations, {
    fields: [units.organizationId],
    references: [organizations.id],
  }),
  legalEntity: one(legalEntities, {
    fields: [units.legalEntityId],
    references: [legalEntities.id],
  }),
}));