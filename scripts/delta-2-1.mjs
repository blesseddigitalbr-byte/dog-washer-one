import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cdfjjhbczgyyogocioro.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function delta21() {
  console.log('\n🚀 DELTA 2.1 - SEED + PROCEDURES\n');
  
  try {
    // Verificar se org existe
    const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
    let orgId = orgs?.[0]?.id;
    
    if (!orgId) {
      const { data: newOrg } = await supabase.from('organizations').insert([{
        name: 'GroomerFlow Ltda',
        trading_name: 'GroomerFlow',
        email: 'contato@groomerflow.com',
        phone: '(11) 98765-4321',
        website: 'https://groomerflow.com',
        status: 'active'
      }]).select();
      orgId = newOrg[0].id;
      console.log('✅ Organization criada');
    } else {
      console.log('✅ Organization já existe');
    }
    
    // Verificar unit
    const { data: units } = await supabase.from('units').select('id').limit(1);
    let unitId = units?.[0]?.id;
    
    if (!unitId) {
      const { data: newUnit } = await supabase.from('units').insert([{
        organization_id: orgId,
        name: 'Unidade São Paulo',
        code: 'SP-001',
        cnpj: '12.345.678/0001-90',
        address: 'Rua das Flores, 123',
        phone: '(11) 98765-4321',
        email: 'sp@groomerflow.com',
        status: 'active'
      }]).select();
      unitId = newUnit[0].id;
      console.log('✅ Unit criada');
    } else {
      console.log('✅ Unit já existe');
    }
    
    // Verificar clientes
    const { data: existingClients } = await supabase.from('clients').select('id').limit(5);
    
    if (existingClients.length < 5) {
      const clientsData = [
        { name: 'Helena Silveira', email: 'helena@email.com', phone: '(11) 99999-0001', cpf: '123.456.789-01' },
        { name: 'Ricardo Mendes', email: 'ricardo@email.com', phone: '(11) 99999-0002', cpf: '123.456.789-02' },
        { name: 'Ana Beatriz', email: 'ana@email.com', phone: '(11) 99999-0003', cpf: '123.456.789-03' },
        { name: 'Lucas Ferreira', email: 'lucas@email.com', phone: '(11) 99999-0004', cpf: '123.456.789-04' },
        { name: 'Carla Dias', email: 'carla@email.com', phone: '(11) 99999-0005', cpf: '123.456.789-05' }
      ];
      
      const { data: newClients } = await supabase.from('clients').insert(
        clientsData.map(c => ({ ...c, organization_id: orgId, unit_id: unitId, status: 'active' }))
      ).select();
      console.log(`✅ ${newClients.length} clientes inseridos`);
    } else {
      console.log('✅ Clientes já existem');
    }
    
    console.log('\n✅ SEED MÍNIMO CONCLUÍDO!\n');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

delta21();
