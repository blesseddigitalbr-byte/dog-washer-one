import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cdfjjhbczgyyogocioro.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function checkTables() {
  console.log('\n🔍 VERIFICAÇÃO DIRETA DE TABELAS\n');
  
  const tablesToCheck = [
    'users',
    'organizations', 
    'legal_entities',
    'units',
    'clients',
    'pets',
    'services',
    'appointments',
    'students'
  ];
  
  console.log('📊 TABELAS:\n');
  
  for (const table of tablesToCheck) {
    try {
      const { data, error, status, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (status === 404) {
        console.log(`  ❌ ${table}: NÃO EXISTE`);
      } else if (error) {
        console.log(`  ⚠️  ${table}: ${error.message}`);
      } else {
        console.log(`  ✅ ${table}: ${count} registros`);
      }
    } catch (err) {
      console.log(`  ❌ ${table}: ${err.message}`);
    }
  }
  
  console.log('\n');
}

checkTables().catch(console.error);
