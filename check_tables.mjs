import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_FRONTEND_FORGE_API_URL || 'https://cdfjjhbczgyyogocioro.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurado');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    // Listar todas as tabelas do schema public
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (error) {
      console.error('❌ Erro ao listar tabelas:', error);
      process.exit(1);
    }

    console.log('\n📊 TABELAS ENCONTRADAS NO SUPABASE:\n');
    const tableNames = data.map(t => t.table_name).sort();
    tableNames.forEach(name => console.log(`  ✅ ${name}`));
    
    console.log('\n📋 TABELAS ESPERADAS:\n');
    const expected = ['organizations', 'units', 'clients', 'pets', 'services', 'appointments', 'students'];
    expected.forEach(name => {
      const found = tableNames.includes(name);
      console.log(`  ${found ? '✅' : '❌'} ${name}`);
    });
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

checkTables();
