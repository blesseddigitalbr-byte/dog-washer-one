import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./drizzle/schema";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

async function checkTables() {
  try {
    console.log("\n🔍 Verificando tabelas no Supabase...\n");

    // Tentar listar clientes
    const clientsResult = await db.query.clients.findMany();
    console.log("✅ Tabela 'clients' existe e contém", clientsResult.length, "registros");

    const petsResult = await db.query.pets.findMany();
    console.log("✅ Tabela 'pets' existe e contém", petsResult.length, "registros");

    const servicesResult = await db.query.services.findMany();
    console.log("✅ Tabela 'services' existe e contém", servicesResult.length, "registros");

    const appointmentsResult = await db.query.appointments.findMany();
    console.log("✅ Tabela 'appointments' existe e contém", appointmentsResult.length, "registros");

    const studentsResult = await db.query.students.findMany();
    console.log("✅ Tabela 'students' existe e contém", studentsResult.length, "registros");

    console.log("\n✅ Todas as tabelas existem!\n");
  } catch (err) {
    console.error("\n❌ Erro ao verificar tabelas:", err instanceof Error ? err.message : err);
    console.log("\n⚠️ As tabelas precisam ser criadas manualmente via Supabase SQL Editor.\n");
  }
  process.exit(0);
}

checkTables();
