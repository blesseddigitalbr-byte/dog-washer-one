import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cdfjjhbczgyyogocioro.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function check() {
  console.log('\n🔍 VERIFICANDO ORGANIZATIONS\n');
  
  try {
    const { data, error, count } = await supabase
      .from('organizations')
      .select('*', { count: 'exact' });
    
    if (error) {
      console.error('❌ Erro ao acessar:', error.message);
      return;
    }
    
    console.log(`✅ Registros encontrados: ${count}`);
    console.log('📊 Dados:', JSON.stringify(data, null, 2));
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

check();
