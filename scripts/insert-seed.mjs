import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cdfjjhbczgyyogocioro.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function insertSeed() {
  console.log('\n🌱 INSERINDO SEED MÍNIMO\n');
  
  try {
    // 1. Inserir organization
    console.log('1️⃣  Inserindo organization...');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
    
    let orgId;
    if (orgs && orgs.length > 0) {
      orgId = orgs[0].id;
      console.log('✅ Organization já existe');
    } else {
      const { data: newOrg, error } = await supabase
        .from('organizations')
        .insert([{
          name: 'GroomerFlow Ltda',
          trading_name: 'GroomerFlow',
          email: 'contato@groomerflow.com',
          phone: '(11) 98765-4321',
          website: 'https://groomerflow.com',
          status: 'active'
        }])
        .select();
      
      if (error) {
        console.error('❌ Erro ao inserir organization:', error.message);
        return;
      }
      orgId = newOrg[0].id;
      console.log('✅ Organization criada');
    }
    
    // 2. Inserir clientes
    console.log('2️⃣  Inserindo clientes...');
    const { data: existingClientes } = await supabase
      .from('clientes')
      .select('id')
      .limit(5);
    
    if (!existingClientes || existingClientes.length < 5) {
      const clientesData = [
        { nome: 'Helena Silveira', email: 'helena@email.com', telefone: '(11) 99999-0001', cpf: '123.456.789-01', vip: true },
        { nome: 'Ricardo Mendes', email: 'ricardo@email.com', telefone: '(11) 99999-0002', cpf: '123.456.789-02', vip: false },
        { nome: 'Ana Beatriz', email: 'ana@email.com', telefone: '(11) 99999-0003', cpf: '123.456.789-03', vip: false },
        { nome: 'Lucas Ferreira', email: 'lucas@email.com', telefone: '(11) 99999-0004', cpf: '123.456.789-04', vip: false },
        { nome: 'Carla Dias', email: 'carla@email.com', telefone: '(11) 99999-0005', cpf: '123.456.789-05', vip: true }
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
    } else {
      console.log('✅ Clientes já existem');
    }
    
    // 3. Inserir pets
    console.log('3️⃣  Inserindo pets...');
    const { data: existingPets } = await supabase
      .from('pets')
      .select('id')
      .limit(6);
    
    if (!existingPets || existingPets.length < 6) {
      const { data: allClientes } = await supabase
        .from('clientes')
        .select('id')
        .limit(5);
      
      const petsData = [
        { cliente_id: allClientes[0].id, nome: 'Bento', raca: 'Poodle', especie: 'Cão', cor: 'Branco', peso: 8.5 },
        { cliente_id: allClientes[0].id, nome: 'Mimi', raca: 'Shih Tzu', especie: 'Cão', cor: 'Marrom', peso: 6.2 },
        { cliente_id: allClientes[1].id, nome: 'Thor', raca: 'Golden Retriever', especie: 'Cão', cor: 'Dourado', peso: 32.0 },
        { cliente_id: allClientes[2].id, nome: 'Bella', raca: 'Bulldog Francês', especie: 'Cão', cor: 'Preto', peso: 12.5 },
        { cliente_id: allClientes[3].id, nome: 'Max', raca: 'Labrador', especie: 'Cão', cor: 'Preto', peso: 28.0 },
        { cliente_id: allClientes[4].id, nome: 'Luna', raca: 'Dálmata', especie: 'Cão', cor: 'Branco com Manchas', peso: 25.0 }
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
    } else {
      console.log('✅ Pets já existem');
    }
    
    console.log('\n✅ SEED MÍNIMO INSERIDO COM SUCESSO!\n');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

insertSeed();
