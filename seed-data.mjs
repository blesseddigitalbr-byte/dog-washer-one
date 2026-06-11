import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cdfjjhbczgyyogocioro.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkZmpqaGJjemd5eW9nb2Npb3JvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzc3NzU2MCwiZXhwIjoxODc1NTQzNTYwfQ.K4usiPngwumDUEwU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedData() {
  try {
    console.log('🌱 Iniciando população de dados...');

    // 1. Criar Organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert([{ name: 'GroomerFlow' }])
      .select()
      .single();

    if (orgError) throw orgError;
    const orgId = orgData.id;
    console.log('✅ Organization criada:', orgId);

    // 2. Criar Professionals
    const { data: profData, error: profError } = await supabase
      .from('professionals')
      .insert([
        {
          organization_id: orgId,
          name: 'João Groomer',
          email: 'joao@groomerflow.com',
          phone: '11999999999'
        },
        {
          organization_id: orgId,
          name: 'Maria Silva',
          email: 'maria@groomerflow.com',
          phone: '11988888888'
        },
        {
          organization_id: orgId,
          name: 'Pedro Costa',
          email: 'pedro@groomerflow.com',
          phone: '11977777777'
        }
      ])
      .select();

    if (profError) throw profError;
    console.log('✅ Professionals criados:', profData.length);

    // 3. Criar Services
    const { data: servData, error: servError } = await supabase
      .from('services')
      .insert([
        {
          organization_id: orgId,
          name: 'Banho e Tosa',
          price: 150.00,
          duration_minutes: 60
        },
        {
          organization_id: orgId,
          name: 'Banho Simples',
          price: 80.00,
          duration_minutes: 30
        },
        {
          organization_id: orgId,
          name: 'Hidratação',
          price: 120.00,
          duration_minutes: 45
        },
        {
          organization_id: orgId,
          name: 'Tosa Criativa',
          price: 200.00,
          duration_minutes: 90
        },
        {
          organization_id: orgId,
          name: 'Tosa Higiênica',
          price: 100.00,
          duration_minutes: 45
        }
      ])
      .select();

    if (servError) throw servError;
    console.log('✅ Services criados:', servData.length);

    // 4. Criar Clients
    const { data: clientData, error: clientError } = await supabase
      .from('clientes')
      .insert([
        {
          organization_id: orgId,
          name: 'Ricardo Mendes',
          email: 'ricardo@email.com',
          phone: '11991234567',
          cpf: '12345678901'
        },
        {
          organization_id: orgId,
          name: 'Ana Silva',
          email: 'ana@email.com',
          phone: '11992345678',
          cpf: '23456789012'
        },
        {
          organization_id: orgId,
          name: 'Carlos Santos',
          email: 'carlos@email.com',
          phone: '11993456789',
          cpf: '34567890123'
        },
        {
          organization_id: orgId,
          name: 'Juliana Costa',
          email: 'juliana@email.com',
          phone: '11994567890',
          cpf: '45678901234'
        },
        {
          organization_id: orgId,
          name: 'Roberto Alves',
          email: 'roberto@email.com',
          phone: '11995678901',
          cpf: '56789012345'
        }
      ])
      .select();

    if (clientError) throw clientError;
    console.log('✅ Clients criados:', clientData.length);

    // 5. Criar Pets
    const { data: petData, error: petError } = await supabase
      .from('pets')
      .insert([
        {
          organization_id: orgId,
          client_id: clientData[0].id,
          name: 'Thor',
          breed: 'Labrador',
          species: 'Cão',
          color: 'Preto'
        },
        {
          organization_id: orgId,
          client_id: clientData[0].id,
          name: 'Bella',
          breed: 'Poodle',
          species: 'Cão',
          color: 'Branco'
        },
        {
          organization_id: orgId,
          client_id: clientData[1].id,
          name: 'Max',
          breed: 'Golden Retriever',
          species: 'Cão',
          color: 'Dourado'
        },
        {
          organization_id: orgId,
          client_id: clientData[2].id,
          name: 'Luna',
          breed: 'Husky',
          species: 'Cão',
          color: 'Cinza'
        },
        {
          organization_id: orgId,
          client_id: clientData[3].id,
          name: 'Rex',
          breed: 'Pastor Alemão',
          species: 'Cão',
          color: 'Marrom'
        },
        {
          organization_id: orgId,
          client_id: clientData[4].id,
          name: 'Mimi',
          breed: 'Shih Tzu',
          species: 'Cão',
          color: 'Branco e Marrom'
        }
      ])
      .select();

    if (petError) throw petError;
    console.log('✅ Pets criados:', petData.length);

    // 6. Criar Appointments
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 1);
    appointmentDate.setHours(10, 0, 0, 0);

    const { data: aptData, error: aptError } = await supabase
      .from('appointments')
      .insert([
        {
          organization_id: orgId,
          client_id: clientData[0].id,
          pet_id: petData[0].id,
          service_id: servData[0].id,
          professional_id: profData[0].id,
          appointment_date: appointmentDate.toISOString(),
          status: 'pending'
        },
        {
          organization_id: orgId,
          client_id: clientData[1].id,
          pet_id: petData[2].id,
          service_id: servData[1].id,
          professional_id: profData[1].id,
          appointment_date: new Date(appointmentDate.getTime() + 3600000).toISOString(),
          status: 'pending'
        }
      ])
      .select();

    if (aptError) throw aptError;
    console.log('✅ Appointments criados:', aptData.length);

    console.log('\n✅ 🎉 Dados populados com sucesso!');
    console.log('📊 Resumo:');
    console.log(`  - Organization: 1`);
    console.log(`  - Professionals: ${profData.length}`);
    console.log(`  - Services: ${servData.length}`);
    console.log(`  - Clients: ${clientData.length}`);
    console.log(`  - Pets: ${petData.length}`);
    console.log(`  - Appointments: ${aptData.length}`);

  } catch (error) {
    console.error('❌ Erro ao popular dados:', error);
    process.exit(1);
  }
}

seedData();
