import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cdfjjhbczgyyogocioro.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function delta21() {
  console.log('\n🚀 DELTA 2.1 - SEED FINAL\n');
  
  try {
    // 1. Inserir clientes
    console.log('1️⃣  Inserindo clientes...');
    const clientesData = [
      { nome: 'Helena Silveira', email: 'helena@email.com', phone: '(11) 99999-0001', cpf: '123.456.789-01', cidade: 'São Paulo', uf: 'SP' },
      { nome: 'Ricardo Mendes', email: 'ricardo@email.com', phone: '(11) 99999-0002', cpf: '123.456.789-02', cidade: 'São Paulo', uf: 'SP' },
      { nome: 'Ana Beatriz', email: 'ana@email.com', phone: '(11) 99999-0003', cpf: '123.456.789-03', cidade: 'São Paulo', uf: 'SP' },
      { nome: 'Lucas Ferreira', email: 'lucas@email.com', phone: '(11) 99999-0004', cpf: '123.456.789-04', cidade: 'São Paulo', uf: 'SP' },
      { nome: 'Carla Dias', email: 'carla@email.com', phone: '(11) 99999-0005', cpf: '123.456.789-05', cidade: 'São Paulo', uf: 'SP' }
    ];
    
    const { data: newClientes, error: clientesError } = await supabase
      .from('clientes')
      .insert(clientesData)
      .select();
    
    if (clientesError) {
      console.error('❌ Erro ao inserir clientes:', clientesError.message);
      return;
    }
    console.log(`✅ ${newClientes.length} clientes inseridos`);
    
    // 2. Inserir pets
    console.log('2️⃣  Inserindo pets...');
    const petsData = [
      { cliente_id: newClientes[0].id, nome: 'Bento', raca: 'Poodle', especie: 'Cão', cor: 'Branco', peso: 8.5 },
      { cliente_id: newClientes[0].id, nome: 'Mimi', raca: 'Shih Tzu', especie: 'Cão', cor: 'Marrom', peso: 6.2 },
      { cliente_id: newClientes[1].id, nome: 'Thor', raca: 'Golden Retriever', especie: 'Cão', cor: 'Dourado', peso: 32.0 },
      { cliente_id: newClientes[2].id, nome: 'Bella', raca: 'Bulldog Francês', especie: 'Cão', cor: 'Preto', peso: 12.5 },
      { cliente_id: newClientes[3].id, nome: 'Max', raca: 'Labrador', especie: 'Cão', cor: 'Preto', peso: 28.0 },
      { cliente_id: newClientes[4].id, nome: 'Luna', raca: 'Dálmata', especie: 'Cão', cor: 'Branco com Manchas', peso: 25.0 }
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
    
    console.log('\n✅ SEED MÍNIMO CONCLUÍDO!\n');
    console.log('📊 RESUMO:');
    console.log(`  - 5 clientes inseridos`);
    console.log(`  - 6 pets inseridos`);
    console.log(`  - Pronto para conectar tRPC\n`);
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

delta21();
