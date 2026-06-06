import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cdfjjhbczgyyogocioro.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function check() {
  console.log('\n🔍 VERIFICANDO ESTRUTURA DE CLIENTES\n');
  
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('📊 Colunas encontradas:');
      Object.keys(data[0]).forEach(col => {
        console.log(`  - ${col}`);
      });
    } else {
      console.log('⚠️  Tabela vazia, mas estrutura acessível');
    }
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

check();
