import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

async function checkTables() {
  try {
    console.log('\n🔍 Verificando tabelas no Supabase...\n');
    
    // Tentar listar clientes
    const clients = await db.execute(`SELECT * FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('organizations', 'units', 'clients', 'pets', 'services', 'appointments', 'students')`);
    
    console.log('✅ Tabelas encontradas:', clients.length);
    clients.forEach(t => console.log(`  ✅ ${t.table_name}`));
    
    if (clients.length === 0) {
      console.log('\n❌ Nenhuma tabela operacional encontrada!');
      console.log('As tabelas precisam ser criadas manualmente via Supabase SQL Editor.');
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
  process.exit(0);
}

checkTables();
