import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cdfjjhbczgyyogocioro.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkZmpqaGJjemd5eW9nb2Npb3JvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzc3NzU2MCwiZXhwIjoxODc1NTQzNTYwfQ.K4usiPngwumDUEwU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  try {
    console.log('🏗️ Criando tabelas...\n');

    // SQL para criar todas as tabelas
    const sql = `
      -- Criar tabela units
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

      -- Criar tabela students
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

      -- Criar tabela appointment_students
      CREATE TABLE IF NOT EXISTS appointment_students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'assistant',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Criar tabela appointment_pets
      CREATE TABLE IF NOT EXISTS appointment_pets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
        pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Criar tabela appointment_status_history
      CREATE TABLE IF NOT EXISTS appointment_status_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
        old_status VARCHAR(50),
        new_status VARCHAR(50) NOT NULL,
        reason TEXT,
        changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Criar tabela package_sessions
      CREATE TABLE IF NOT EXISTS package_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
        session_number INTEGER NOT NULL,
        appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Criar tabela galeria_pets
      CREATE TABLE IF NOT EXISTS galeria_pets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
        photo_url VARCHAR(500) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Executar SQL via RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Erro ao criar tabelas:', error);
      
      // Tentar criar uma por uma
      console.log('\n🔄 Tentando criar tabelas uma por uma...\n');
      
      const tables = [
        { name: 'units', sql: `CREATE TABLE IF NOT EXISTS units (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, name VARCHAR(255) NOT NULL, code VARCHAR(50) NOT NULL UNIQUE, unit_type VARCHAR(50) DEFAULT 'salon', status VARCHAR(50) DEFAULT 'active', is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, updated_at TIMESTAMP WITH TIME ZONE);` },
        { name: 'students', sql: `CREATE TABLE IF NOT EXISTS students (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, unit_id UUID REFERENCES units(id) ON DELETE SET NULL, academic_id VARCHAR(100) UNIQUE, name VARCHAR(255) NOT NULL, email VARCHAR(255), phone VARCHAR(50), cpf VARCHAR(14) UNIQUE, photo_url VARCHAR(500), course VARCHAR(255), class_group VARCHAR(100), academic_status VARCHAR(50) DEFAULT 'active', enrollment_date TIMESTAMP WITH TIME ZONE NOT NULL, instructor_id UUID REFERENCES professionals(id) ON DELETE SET NULL, is_authorized BOOLEAN DEFAULT FALSE, block_reason TEXT, practice_level VARCHAR(50) DEFAULT 'beginner', allowed_services TEXT, allowed_dog_sizes TEXT, needs_supervision BOOLEAN DEFAULT TRUE, can_work_alone BOOLEAN DEFAULT FALSE, notes TEXT, data_origin VARCHAR(50) DEFAULT 'academic_portal', last_sync TIMESTAMP WITH TIME ZONE, sync_status VARCHAR(50) DEFAULT 'pending', status VARCHAR(50) DEFAULT 'active', progress INTEGER DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, updated_at TIMESTAMP WITH TIME ZONE);` }
      ];

      for (const table of tables) {
        const { data: tableData, error: tableError } = await supabase.rpc('exec_sql', { sql: table.sql });
        if (tableError) {
          console.error(`❌ Erro ao criar tabela ${table.name}:`, tableError.message);
        } else {
          console.log(`✅ Tabela ${table.name} criada com sucesso`);
        }
      }
    } else {
      console.log('✅ Todas as tabelas criadas com sucesso!');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTables();
