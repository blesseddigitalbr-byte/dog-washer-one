import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cdfjjhbczgyyogocioro.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function delta21() {
  console.log('\n🚀 DELTA 2.1 - SEED COMPLETO\n');
  
  try {
    // 1. Buscar clientes inseridos
    console.log('1️⃣  Buscando clientes...');
    const { data: clientes } = await supabase
      .from('clientes')
      .select('id')
      .limit(5);
    
    if (!clientes || clientes.length === 0) {
      console.error('❌ Nenhum cliente encontrado');
      return;
    }
    console.log(`✅ ${clientes.length} clientes encontrados`);
    
    // 2. Inserir pets
    console.log('2️⃣  Inserindo pets...');
    const petsData = [
      { client_id: clientes[0].id, name: 'Bento', breed: 'Poodle', sexo: 'M', cor_pelagem: 'Branco', weight: '8.5' },
      { client_id: clientes[0].id, name: 'Mimi', breed: 'Shih Tzu', sexo: 'F', cor_pelagem: 'Marrom', weight: '6.2' },
      { client_id: clientes[1].id, name: 'Thor', breed: 'Golden Retriever', sexo: 'M', cor_pelagem: 'Dourado', weight: '32.0' },
      { client_id: clientes[2].id, name: 'Bella', breed: 'Bulldog Francês', sexo: 'F', cor_pelagem: 'Preto', weight: '12.5' },
      { client_id: clientes[3].id, name: 'Max', breed: 'Labrador', sexo: 'M', cor_pelagem: 'Preto', weight: '28.0' },
      { client_id: clientes[4].id, name: 'Luna', breed: 'Dálmata', sexo: 'F', cor_pelagem: 'Branco com Manchas', weight: '25.0' }
    ];
    
    const { data: newPets, error: petsError } = await supabase
      .from('pets')
      .insert(petsData)
      .select();
    
    if (petsError) {
      console.error('❌ Erro ao inserir pets:', petsError.message);
      return;
    }
    console.log(`✅ ${newPets.length} pets inseridos`);
    
    console.log('\n✅ SEED COMPLETO CONCLUÍDO!\n');
    console.log('📊 RESUMO:');
    console.log(`  - 5 clientes`);
    console.log(`  - 6 pets vinculados`);
    console.log(`  - Pronto para conectar tRPC\n`);
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

delta21();
