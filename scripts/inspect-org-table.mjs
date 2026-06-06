import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cdfjjhbczgyyogocioro.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function inspectTable() {
  console.log('\n🔍 Verificando estrutura da tabela organizations\n');
  
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro ao consultar:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Tabela existe e tem dados');
      console.log('\nColunas encontradas:');
      Object.keys(data[0]).forEach(col => {
        console.log(`  - ${col}: ${typeof data[0][col]}`);
      });
    } else {
      console.log('✅ Tabela existe mas está vazia');
      console.log('Tentando inserir um registro de teste...');
      
      const { data: inserted, error: insertError } = await supabase
        .from('organizations')
        .insert([{
          name: 'Test Org',
          trading_name: 'Test',
          status: 'active'
        }])
        .select();
      
      if (insertError) {
        console.log('❌ Erro ao inserir:', insertError.message);
      } else {
        console.log('✅ Inserção bem-sucedida');
        console.log('\nColunas da tabela:');
        Object.keys(inserted[0]).forEach(col => {
          console.log(`  - ${col}: ${typeof inserted[0][col]}`);
        });
      }
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

inspectTable();
