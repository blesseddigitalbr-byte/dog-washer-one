import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cdfjjhbczgyyogocioro.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function finalAudit() {
  console.log('\n=== AUDITORIA FINAL DO SUPABASE ===\n');
  
  const tables = [
    'organizations',
    'legal_entities', 
    'units',
    'clients',
    'pets',
    'services',
    'appointments',
    'students',
    'users'
  ];
  
  console.log('📊 STATUS DAS TABELAS:\n');
  
  for (const table of tables) {
    try {
      const { data, error, status, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (status === 404) {
        console.log(`  ❌ ${table.padEnd(20)} - NÃO EXISTE`);
      } else if (error) {
        console.log(`  ⚠️  ${table.padEnd(20)} - ERRO: ${error.message.substring(0, 40)}`);
      } else {
        console.log(`  ✅ ${table.padEnd(20)} - ${count} registros`);
      }
    } catch (err) {
      console.log(`  ❌ ${table.padEnd(20)} - EXCEÇÃO: ${err.message.substring(0, 40)}`);
    }
  }
  
  console.log('\n');
}

finalAudit();
