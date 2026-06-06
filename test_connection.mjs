import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTables() {
  try {
    console.log('\n🔍 Verificando tabelas no Supabase...\n');
    
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('organizations', 'units', 'clients', 'pets', 'services', 'appointments', 'students')
      ORDER BY table_name
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Nenhuma tabela operacional encontrada!\n');
      console.log('Tabelas esperadas:');
      console.log('  ❌ organizations');
      console.log('  ❌ units');
      console.log('  ❌ clients');
      console.log('  ❌ pets');
      console.log('  ❌ services');
      console.log('  ❌ appointments');
      console.log('  ❌ students');
    } else {
      console.log('✅ Tabelas encontradas:\n');
      result.rows.forEach(row => console.log(`  ✅ ${row.table_name}`));
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
  } finally {
    await pool.end();
  }
}

checkTables();
