import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔍 Verificando tabelas existentes...\n');
    
    // Verificar quais tabelas já existem
    const existingTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('organizations', 'units', 'clients', 'pets', 'services', 'appointments', 'students')
      ORDER BY table_name
    `);
    
    console.log(`✅ Tabelas encontradas: ${existingTables.rows.length}\n`);
    existingTables.rows.forEach(row => console.log(`  ✅ ${row.table_name}`));
    
    if (existingTables.rows.length === 7) {
      console.log('\n✅ Todas as tabelas já existem!\n');
      return;
    }
    
    console.log('\n⚠️ Criando tabelas faltantes...\n');
    
    // Criar tabelas
    const createTablesSQL = `
      -- Clients
      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        cpf VARCHAR(14) UNIQUE,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(2),
        zip_code VARCHAR(10),
        is_vip BOOLEAN DEFAULT FALSE,
        total_spent DECIMAL(10, 2) DEFAULT 0,
        last_visit TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Pets
      CREATE TABLE IF NOT EXISTS pets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        breed VARCHAR(100),
        species VARCHAR(50),
        color VARCHAR(100),
        birth_date TIMESTAMP WITH TIME ZONE,
        weight DECIMAL(5, 2),
        microchip VARCHAR(50),
        notes TEXT,
        photo VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Services
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        duration_minutes INTEGER,
        category VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Appointments
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
        service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Students
      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        cpf VARCHAR(14) UNIQUE,
        course VARCHAR(255),
        enrollment_date TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        progress INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON clients(organization_id);
      CREATE INDEX IF NOT EXISTS idx_clients_unit_id ON clients(unit_id);
      CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
      CREATE INDEX IF NOT EXISTS idx_pets_organization_id ON pets(organization_id);
      CREATE INDEX IF NOT EXISTS idx_pets_client_id ON pets(client_id);
      CREATE INDEX IF NOT EXISTS idx_services_organization_id ON services(organization_id);
      CREATE INDEX IF NOT EXISTS idx_services_unit_id ON services(unit_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_organization_id ON appointments(organization_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_unit_id ON appointments(unit_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_pet_id ON appointments(pet_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
      CREATE INDEX IF NOT EXISTS idx_students_organization_id ON students(organization_id);
      CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
    `;
    
    await client.query(createTablesSQL);
    console.log('✅ Tabelas criadas com sucesso!\n');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();
