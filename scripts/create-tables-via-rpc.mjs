import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cdfjjhbczgyyogocioro.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function createTablesViaSQL() {
  console.log('\n🔧 CRIANDO TABELAS VIA SQL DIRETO\n');
  
  const sqlStatements = [
    // Criar legal_entities
    `CREATE TABLE IF NOT EXISTS legal_entities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      company_name VARCHAR(255) NOT NULL,
      tax_id VARCHAR(50),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(2),
      zip_code VARCHAR(10),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE
    );
    GRANT ALL ON legal_entities TO service_role;`,
    
    // Criar units
    `CREATE TABLE IF NOT EXISTS units (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      legal_entity_id UUID REFERENCES legal_entities(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50),
      cnpj VARCHAR(20),
      address TEXT,
      phone VARCHAR(50),
      email VARCHAR(255),
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE
    );
    GRANT ALL ON units TO service_role;`,
    
    // Criar clients
    `CREATE TABLE IF NOT EXISTS clients (
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
    GRANT ALL ON clients TO service_role;`,
    
    // Criar pets
    `CREATE TABLE IF NOT EXISTS pets (
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
    GRANT ALL ON pets TO service_role;`,
    
    // Criar services
    `CREATE TABLE IF NOT EXISTS services (
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
    GRANT ALL ON services TO service_role;`,
    
    // Criar appointments
    `CREATE TABLE IF NOT EXISTS appointments (
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
    GRANT ALL ON appointments TO service_role;`,
    
    // Criar students
    `CREATE TABLE IF NOT EXISTS students (
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
    GRANT ALL ON students TO service_role;`
  ];
  
  for (let i = 0; i < sqlStatements.length; i++) {
    try {
      const { error } = await supabase.rpc('exec', { sql: sqlStatements[i] });
      if (error) {
        console.log(`⚠️  Statement ${i + 1}: ${error.message}`);
      } else {
        console.log(`✅ Statement ${i + 1} executado`);
      }
    } catch (err) {
      console.log(`⚠️  Statement ${i + 1}: ${err.message}`);
    }
  }
}

createTablesViaSQL();
