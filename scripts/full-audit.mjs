import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cdfjjhbczgyyogocioro.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function auditDatabase() {
  console.log('\n🔍 AUDITORIA COMPLETA DO SUPABASE\n');
  
  // Listar TODAS as tabelas
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name, table_schema')
    .eq('table_schema', 'public')
    .order('table_name');
  
  if (tablesError) {
    console.error('❌ Erro ao listar tabelas:', tablesError.message);
    return;
  }
  
  console.log('📊 TABELAS NO SUPABASE:\n');
  const tableNames = tables.map(t => t.table_name);
  tableNames.forEach(name => console.log(`  • ${name}`));
  
  console.log('\n📈 CONTAGEM DE REGISTROS:\n');
  
  for (const table of tableNames) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`  ❌ ${table}: erro`);
      } else {
        console.log(`  ✅ ${table}: ${count} registros`);
      }
    } catch (err) {
      console.log(`  ❌ ${table}: ${err.message}`);
    }
  }
  
  console.log('\n');
}

auditDatabase().catch(console.error);
