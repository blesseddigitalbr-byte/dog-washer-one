import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cdfjjhbczgyyogocioro.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurado');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function checkTables() {
  console.log('\n🔍 Verificando tabelas no Supabase via API...\n');
  
  const tables = ['organizations', 'units', 'clients', 'pets', 'services', 'appointments', 'students'];
  const results = {};
  
  for (const table of tables) {
    try {
      const { data, error, status } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error && status === 404) {
        results[table] = { exists: false, error: '404 - Tabela não encontrada' };
      } else if (error) {
        results[table] = { exists: false, error: error.message };
      } else {
        results[table] = { exists: true, count: data?.length || 0 };
      }
    } catch (err) {
      results[table] = { exists: false, error: err.message };
    }
  }
  
  console.log('📊 RESULTADO:\n');
  tables.forEach(table => {
    const result = results[table];
    if (result.exists) {
      console.log(`  ✅ ${table} - ${result.count} registros`);
    } else {
      console.log(`  ❌ ${table} - ${result.error}`);
    }
  });
  
  const existingTables = tables.filter(t => results[t].exists);
  console.log(`\n✅ Tabelas existentes: ${existingTables.length}/${tables.length}\n`);
  
  if (existingTables.length < tables.length) {
    console.log('⚠️ Tabelas faltando:', tables.filter(t => !results[t].exists).join(', '));
    console.log('\nGere o SQL e cole no Supabase SQL Editor.\n');
  }
}

checkTables().catch(console.error);
