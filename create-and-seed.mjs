import pg from 'pg';

const { Client } = pg;

// Parse DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres.cdfjjhbczgyyogocioro:K4usiPngwumDUEwU@aws-1-sa-east-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function createTablesAndSeed() {
  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado!\n');

    console.log('🏗️ Criando tabelas...\n');

    // 1. Criar tabela units
    console.log('📋 Criando tabela units...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS units (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        unit_type VARCHAR(50) DEFAULT 'salon',
        status VARCHAR(50) DEFAULT 'active',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('✅ Tabela units criada\n');

    // 2. Criar tabela students
    console.log('📋 Criando tabela students...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
        academic_id VARCHAR(100) UNIQUE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        cpf VARCHAR(14) UNIQUE,
        photo_url VARCHAR(500),
        course VARCHAR(255),
        class_group VARCHAR(100),
        academic_status VARCHAR(50) DEFAULT 'active',
        enrollment_date TIMESTAMP WITH TIME ZONE NOT NULL,
        instructor_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
        is_authorized BOOLEAN DEFAULT FALSE,
        block_reason TEXT,
        practice_level VARCHAR(50) DEFAULT 'beginner',
        allowed_services TEXT,
        allowed_dog_sizes TEXT,
        needs_supervision BOOLEAN DEFAULT TRUE,
        can_work_alone BOOLEAN DEFAULT FALSE,
        notes TEXT,
        data_origin VARCHAR(50) DEFAULT 'academic_portal',
        last_sync TIMESTAMP WITH TIME ZONE,
        sync_status VARCHAR(50) DEFAULT 'pending',
        status VARCHAR(50) DEFAULT 'active',
        progress INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('✅ Tabela students criada\n');

    // 3. Criar tabela appointment_students
    console.log('📋 Criando tabela appointment_students...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointment_students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'assistant',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela appointment_students criada\n');

    // 4. Criar tabela appointment_pets
    console.log('📋 Criando tabela appointment_pets...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointment_pets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
        pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela appointment_pets criada\n');

    // 5. Criar tabela appointment_status_history
    console.log('📋 Criando tabela appointment_status_history...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointment_status_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
        old_status VARCHAR(50),
        new_status VARCHAR(50) NOT NULL,
        reason TEXT,
        changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Tabela appointment_status_history criada\n');

    console.log('🌱 Populando dados de exemplo...\n');

    // 6. Inserir Organization
    const orgResult = await client.query(`
      INSERT INTO organizations (name) 
      VALUES ('GroomerFlow')
      ON CONFLICT DO NOTHING
      RETURNING id;
    `);
    const orgId = orgResult.rows[0]?.id || (await client.query('SELECT id FROM organizations LIMIT 1')).rows[0].id;
    console.log('✅ Organization:', orgId);

    // 7. Inserir Unit
    const unitResult = await client.query(`
      INSERT INTO units (organization_id, name, code) 
      VALUES ($1, 'Unidade Principal', 'UNIT-001')
      ON CONFLICT DO NOTHING
      RETURNING id;
    `, [orgId]);
    const unitId = unitResult.rows[0]?.id;
    console.log('✅ Unit:', unitId);

    // 8. Inserir Professionals
    const profResult = await client.query(`
      INSERT INTO professionals (organization_id, name, email, phone) 
      VALUES 
        ($1, 'João Groomer', 'joao@groomerflow.com', '11999999999'),
        ($1, 'Maria Silva', 'maria@groomerflow.com', '11988888888'),
        ($1, 'Pedro Costa', 'pedro@groomerflow.com', '11977777777')
      ON CONFLICT DO NOTHING
      RETURNING id, name;
    `, [orgId]);
    console.log('✅ Professionals:', profResult.rows.length);

    // 9. Inserir Services
    const servResult = await client.query(`
      INSERT INTO services (organization_id, name, price, duration_minutes) 
      VALUES 
        ($1, 'Banho e Tosa', 150.00, 60),
        ($1, 'Banho Simples', 80.00, 30),
        ($1, 'Hidratação', 120.00, 45),
        ($1, 'Tosa Criativa', 200.00, 90),
        ($1, 'Tosa Higiênica', 100.00, 45)
      ON CONFLICT DO NOTHING
      RETURNING id;
    `, [orgId]);
    console.log('✅ Services:', servResult.rows.length);

    // 10. Inserir Clients
    const clientResult = await client.query(`
      INSERT INTO clientes (organization_id, name, email, phone, cpf) 
      VALUES 
        ($1, 'Ricardo Mendes', 'ricardo@email.com', '11991234567', '12345678901'),
        ($1, 'Ana Silva', 'ana@email.com', '11992345678', '23456789012'),
        ($1, 'Carlos Santos', 'carlos@email.com', '11993456789', '34567890123'),
        ($1, 'Juliana Costa', 'juliana@email.com', '11994567890', '45678901234'),
        ($1, 'Roberto Alves', 'roberto@email.com', '11995678901', '56789012345')
      ON CONFLICT DO NOTHING
      RETURNING id;
    `, [orgId]);
    console.log('✅ Clients:', clientResult.rows.length);

    // 11. Inserir Pets
    const clientIds = clientResult.rows.map(r => r.id);
    const petResult = await client.query(`
      INSERT INTO pets (organization_id, client_id, name, breed, species, color) 
      VALUES 
        ($1, $2, 'Thor', 'Labrador', 'Cão', 'Preto'),
        ($1, $2, 'Bella', 'Poodle', 'Cão', 'Branco'),
        ($1, $3, 'Max', 'Golden Retriever', 'Cão', 'Dourado'),
        ($1, $4, 'Luna', 'Husky', 'Cão', 'Cinza'),
        ($1, $5, 'Rex', 'Pastor Alemão', 'Cão', 'Marrom'),
        ($1, $6, 'Mimi', 'Shih Tzu', 'Cão', 'Branco e Marrom')
      ON CONFLICT DO NOTHING
      RETURNING id;
    `, [orgId, clientIds[0], clientIds[1], clientIds[2], clientIds[3], clientIds[4]]);
    console.log('✅ Pets:', petResult.rows.length);

    // 12. Inserir Appointments
    const serviceIds = servResult.rows.map(r => r.id);
    const profIds = profResult.rows.map(r => r.id);
    const petIds = petResult.rows.map(r => r.id);

    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 1);
    appointmentDate.setHours(10, 0, 0, 0);

    const aptResult = await client.query(`
      INSERT INTO appointments (organization_id, client_id, pet_id, service_id, professional_id, appointment_date, status) 
      VALUES 
        ($1, $2, $3, $4, $5, $6, 'pending'),
        ($1, $7, $8, $9, $10, $11, 'pending')
      ON CONFLICT DO NOTHING
      RETURNING id;
    `, [
      orgId, clientIds[0], petIds[0], serviceIds[0], profIds[0], appointmentDate.toISOString(),
      orgId, clientIds[1], petIds[2], serviceIds[1], profIds[1], new Date(appointmentDate.getTime() + 3600000).toISOString()
    ]);
    console.log('✅ Appointments:', aptResult.rows.length);

    console.log('\n✅ 🎉 Dados criados e populados com sucesso!');
    console.log('📊 Resumo:');
    console.log(`  - Organization: 1`);
    console.log(`  - Units: 1`);
    console.log(`  - Professionals: ${profResult.rows.length}`);
    console.log(`  - Services: ${servResult.rows.length}`);
    console.log(`  - Clients: ${clientResult.rows.length}`);
    console.log(`  - Pets: ${petResult.rows.length}`);
    console.log(`  - Appointments: ${aptResult.rows.length}`);

    await client.end();
    console.log('\n✅ Desconectado do banco');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

createTablesAndSeed();
