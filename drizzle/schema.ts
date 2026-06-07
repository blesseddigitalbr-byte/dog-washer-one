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

// ========== OPERATIONAL ENTITIES ==========

/**
 * Clients - Clientes do Grooming
 */
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  unitId: uuid("unit_id").notNull().references(() => units.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  cpf: varchar("cpf", { length: 14 }).unique(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zip_code", { length: 10 }),
  isVip: boolean("is_vip").default(false),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0"),
  lastVisit: timestamp("last_visit", { withTimezone: true }),
  status: varchar("status", { length: 50 }).default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Pets - Animais dos Clientes
 */
export const pets = pgTable("pets", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  breed: varchar("breed", { length: 100 }),
  species: varchar("species", { length: 50 }),
  color: varchar("color", { length: 100 }),
  birthDate: timestamp("birth_date", { withTimezone: true }),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  microchip: varchar("microchip", { length: 50 }),
  notes: text("notes"),
  photo: varchar("photo", { length: 255 }),
  vaccines: text("vaccines"), // JSON array de vacinas
  dewormed: boolean("dewormed").default(false), // Vermífugo
  hasDiseasesOrAllergies: boolean("has_diseases_or_allergies").default(false),
  diseasesOrAllergiesDescription: text("diseases_or_allergies_description"),
  status: varchar("status", { length: 50 }).default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export type Pet = typeof pets.$inferSelect;
export type InsertPet = typeof pets.$inferInsert;

/**
 * Services - Serviços de Grooming
 */
export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  unitId: uuid("unit_id").notNull().references(() => units.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  durationMinutes: serial("duration_minutes"),
  category: varchar("category", { length: 100 }),
  status: varchar("status", { length: 50 }).default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * Professionals - Profissionais de Grooming
 */
export const professionals = pgTable("professionals", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  unitId: uuid("unit_id").notNull().references(() => units.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  cpf: varchar("cpf", { length: 14 }).unique(),
  specialization: varchar("specialization", { length: 255 }),
  status: varchar("status", { length: 50 }).default("active"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export type Professional = typeof professionals.$inferSelect;
export type InsertProfessional = typeof professionals.$inferInsert;

/**
 * Appointments - Agendamentos
 */
export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  unitId: uuid("unit_id").notNull().references(() => units.id, { onDelete: "cascade" }),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  petId: uuid("pet_id").notNull().references(() => pets.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  professionalId: uuid("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  appointmentDate: timestamp("appointment_date", { withTimezone: true }).notNull(),
  startTime: varchar("start_time", { length: 5 }),
  durationMinutes: serial("duration_minutes"),
  actualStartTime: varchar("actual_start_time", { length: 5 }),
  actualEndTime: varchar("actual_end_time", { length: 5 }),
  status: varchar("status", { length: 50 }).default("pending"),
  notes: text("notes"),
  cancellationReason: text("cancellation_reason"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  packageSessionDecremented: boolean("package_session_decremented").default(false),
  productsDecremented: boolean("products_decremented").default(false),
  productivityRecorded: boolean("productivity_recorded").default(false),
  studentHoursRecorded: boolean("student_hours_recorded").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

/**
 * AppointmentStudents - Relação M:N entre Agendamentos e Alunos
 */
export const appointmentStudents = pgTable("appointment_students", {
  id: uuid("id").primaryKey().defaultRandom(),
  appointmentId: uuid("appointment_id").notNull().references(() => appointments.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }), // "executor", "supervisor", "participant"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AppointmentStudent = typeof appointmentStudents.$inferSelect;
export type InsertAppointmentStudent = typeof appointmentStudents.$inferInsert;

/**
 * AppointmentStatusHistory - Histórico de Mudanças de Status
 */
export const appointmentStatusHistory = pgTable("appointment_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  appointmentId: uuid("appointment_id").notNull().references(() => appointments.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull(),
  changedBy: uuid("changed_by").references(() => users.id, { onDelete: "set null" }),
  changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
  reason: text("reason"),
});

export type AppointmentStatusHistoryRecord = typeof appointmentStatusHistory.$inferSelect;
export type InsertAppointmentStatusHistory = typeof appointmentStatusHistory.$inferInsert;

/**
 * Students - Alunos/Aprendizes
 */
export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  unitId: uuid("unit_id").references(() => units.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  cpf: varchar("cpf", { length: 14 }).unique(),
  course: varchar("course", { length: 255 }),
  enrollmentDate: timestamp("enrollment_date", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 50 }).default("active"),
  progress: serial("progress").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;