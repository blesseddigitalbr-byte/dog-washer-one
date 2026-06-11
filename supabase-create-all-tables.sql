-- ============================================
-- CRIAR TODAS AS TABELAS DO SCHEMA.TS
-- ============================================
-- Este SQL cria a estrutura completa do banco de dados
-- baseado no schema.ts do projeto

-- ============================================
-- 1. TABELAS CORE
-- ============================================

-- Tabela: organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  trading_name VARCHAR(255),
  description TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  settings JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Tabela: legal_entities
CREATE TABLE IF NOT EXISTS legal_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  trading_name VARCHAR(255),
  tax_id VARCHAR(20) UNIQUE,
  state_registration VARCHAR(50),
  municipal_registration VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(50) DEFAULT 'BR',
  email VARCHAR(255),
  phone VARCHAR(50),
  legal_representative_name VARCHAR(255),
  legal_representative_cpf VARCHAR(20),
  tax_regime VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Tabela: units
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  legal_entity_id UUID NOT NULL REFERENCES legal_entities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  unit_type VARCHAR(50) DEFAULT 'salon',
  cnpj VARCHAR(20) UNIQUE,
  razao_social VARCHAR(255),
  inscricao_municipal VARCHAR(50),
  inscricao_estadual VARCHAR(50),
  cnae VARCHAR(20),
  service_code VARCHAR(50),
  nfse_description_template TEXT,
  nfse_default_value DECIMAL(10, 2),
  codigo_tributacao_nacional VARCHAR(50),
  codigo_nbs VARCHAR(50),
  asaas_api_key TEXT,
  asaas_account_id VARCHAR(255),
  asaas_wallet_id VARCHAR(255),
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  manager_name VARCHAR(255) NOT NULL,
  manager_email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 2. TABELAS OPERACIONAIS
-- ============================================

-- Tabela: clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  registration_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  cpf VARCHAR(14) UNIQUE,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  is_vip BOOLEAN DEFAULT false,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  last_visit TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Tabela: pets
CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  registration_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  breed VARCHAR(100),
  species VARCHAR(50),
  color VARCHAR(100),
  birth_date TIMESTAMP WITH TIME ZONE,
  weight DECIMAL(5, 2),
  microchip VARCHAR(50),
  notes TEXT,
  vaccines TEXT,
  dewormed BOOLEAN DEFAULT false,
  has_diseases_or_allergies BOOLEAN DEFAULT false,
  diseases_or_allergies_description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Tabela: galeria_pets
CREATE TABLE IF NOT EXISTS galeria_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela: services
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
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Tabela: professionals
CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  cpf VARCHAR(14) UNIQUE,
  specialization VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Tabela: appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  executed_by VARCHAR(50) DEFAULT 'professional',
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_time VARCHAR(5) NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  actual_start_time VARCHAR(5),
  actual_end_time VARCHAR(5),
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  cancellation_reason TEXT,
  created_by UUID,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  package_session_decremented BOOLEAN DEFAULT false,
  products_decremented BOOLEAN DEFAULT false,
  productivity_recorded BOOLEAN DEFAULT false,
  student_hours_recorded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS appointment_date_idx ON appointments(appointment_date);

-- Tabela: appointment_pets
CREATE TABLE IF NOT EXISTS appointment_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  sequence_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: appointment_students
CREATE TABLE IF NOT EXISTS appointment_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'assistant',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: appointment_status_history
CREATE TABLE IF NOT EXISTS appointment_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. TABELAS EDUCACIONAIS
-- ============================================

-- Tabela: students
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
  is_authorized BOOLEAN DEFAULT false,
  block_reason TEXT,
  practice_level VARCHAR(50) DEFAULT 'beginner',
  allowed_services TEXT,
  allowed_dog_sizes TEXT,
  needs_supervision BOOLEAN DEFAULT true,
  can_work_alone BOOLEAN DEFAULT false,
  notes TEXT,
  data_origin VARCHAR(50) DEFAULT 'academic_portal',
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(50) DEFAULT 'pending',
  status VARCHAR(50) DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 4. INSERIR DADOS DE EXEMPLO
-- ============================================

DO $$
DECLARE
  v_org_id UUID;
  v_legal_entity_id UUID;
  v_unit_id UUID;
BEGIN
  -- Criar organização
  INSERT INTO organizations (name, trading_name, status, is_active)
  VALUES ('GroomerFlow', 'GroomerFlow Grooming', 'active', true)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_org_id;
  
  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1;
  END IF;
  
  -- Criar pessoa jurídica
  INSERT INTO legal_entities (
    organization_id, company_name, trading_name, tax_id, status, is_active
  ) VALUES (
    v_org_id, 'GroomerFlow LTDA', 'GroomerFlow', '12345678000190', 'active', true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_legal_entity_id;
  
  IF v_legal_entity_id IS NULL THEN
    SELECT id INTO v_legal_entity_id FROM legal_entities 
    WHERE organization_id = v_org_id LIMIT 1;
  END IF;
  
  -- Criar unidade
  INSERT INTO units (
    organization_id, legal_entity_id, name, code, unit_type,
    address, phone, email, manager_name, manager_email, status, is_active
  ) VALUES (
    v_org_id, v_legal_entity_id, 'Unidade Principal', 'UNIT-001', 'salon',
    'Rua Principal, 123', '(11) 9999-9999', 'unidade@groomerflow.com',
    'Gerente', 'gerente@groomerflow.com', 'active', true
  )
  ON CONFLICT (code) DO NOTHING
  RETURNING id INTO v_unit_id;
  
  IF v_unit_id IS NULL THEN
    SELECT id INTO v_unit_id FROM units WHERE code = 'UNIT-001' LIMIT 1;
  END IF;
  
  -- Inserir clientes
  INSERT INTO clients (
    organization_id, unit_id, registration_code, name, email, phone, cpf,
    city, state, status, is_active
  ) VALUES
    (v_org_id, v_unit_id, 'CLI-001', 'Ricardo Mendes', 'ricardo@email.com', '(11) 98765-4321', '12345678901', 'São Paulo', 'SP', 'active', true),
    (v_org_id, v_unit_id, 'CLI-002', 'Ana Silva', 'ana@email.com', '(11) 98765-4322', '12345678902', 'São Paulo', 'SP', 'active', true),
    (v_org_id, v_unit_id, 'CLI-003', 'Carlos Santos', 'carlos@email.com', '(11) 98765-4323', '12345678903', 'São Paulo', 'SP', 'active', true),
    (v_org_id, v_unit_id, 'CLI-004', 'Juliana Costa', 'juliana@email.com', '(11) 98765-4324', '12345678904', 'São Paulo', 'SP', 'active', true),
    (v_org_id, v_unit_id, 'CLI-005', 'Roberto Alves', 'roberto@email.com', '(11) 98765-4325', '12345678905', 'São Paulo', 'SP', 'active', true)
  ON CONFLICT (registration_code) DO NOTHING;
  
  -- Inserir pets
  INSERT INTO pets (
    organization_id, client_id, registration_code, name, breed, species, color, weight, status
  ) VALUES
    (v_org_id, (SELECT id FROM clients WHERE registration_code = 'CLI-001'), 'PET-001', 'Thor', 'Golden Retriever', 'Cachorro', 'Dourado', 32.5, 'active'),
    (v_org_id, (SELECT id FROM clients WHERE registration_code = 'CLI-002'), 'PET-002', 'Max', 'Poodle', 'Cachorro', 'Branco', 8.5, 'active'),
    (v_org_id, (SELECT id FROM clients WHERE registration_code = 'CLI-003'), 'PET-003', 'Luna', 'Husky', 'Cachorro', 'Cinza e Branco', 25.0, 'active'),
    (v_org_id, (SELECT id FROM clients WHERE registration_code = 'CLI-001'), 'PET-004', 'Bella', 'Labrador', 'Cachorro', 'Chocolate', 28.0, 'active'),
    (v_org_id, (SELECT id FROM clients WHERE registration_code = 'CLI-004'), 'PET-005', 'Rex', 'Bulldog', 'Cachorro', 'Bege', 22.0, 'active'),
    (v_org_id, (SELECT id FROM clients WHERE registration_code = 'CLI-005'), 'PET-006', 'Mimi', 'Shih Tzu', 'Cachorro', 'Marrom', 5.5, 'active')
  ON CONFLICT (registration_code) DO NOTHING;
  
  -- Inserir serviços
  INSERT INTO services (
    organization_id, unit_id, name, description, price, duration_minutes, category, status
  ) VALUES
    (v_org_id, v_unit_id, 'Banho e Tosa', 'Banho completo com tosa', 150.00, 90, 'grooming', 'active'),
    (v_org_id, v_unit_id, 'Banho Simples', 'Apenas banho', 80.00, 45, 'grooming', 'active'),
    (v_org_id, v_unit_id, 'Tosa Criativa', 'Tosa com design', 200.00, 120, 'grooming', 'active'),
    (v_org_id, v_unit_id, 'Hidratação', 'Tratamento hidratante', 120.00, 60, 'grooming', 'active'),
    (v_org_id, v_unit_id, 'Tosa Higiênica', 'Tosa básica', 100.00, 60, 'grooming', 'active')
  ON CONFLICT (name) DO NOTHING;
  
  -- Inserir profissionais
  INSERT INTO professionals (
    organization_id, unit_id, name, email, phone, cpf, specialization, status, is_active
  ) VALUES
    (v_org_id, v_unit_id, 'João Groomer', 'joao@groomerflow.com', '(11) 99999-0001', '11111111111', 'Tosa Criativa', 'active', true),
    (v_org_id, v_unit_id, 'Maria Silva', 'maria@groomerflow.com', '(11) 99999-0002', '22222222222', 'Banho e Tosa', 'active', true),
    (v_org_id, v_unit_id, 'Pedro Costa', 'pedro@groomerflow.com', '(11) 99999-0003', '33333333333', 'Hidratação', 'active', true)
  ON CONFLICT (cpf) DO NOTHING;
  
  -- Inserir agendamentos
  INSERT INTO appointments (
    organization_id, unit_id, client_id, service_id, professional_id, appointment_date, start_time, status
  ) VALUES
    (v_org_id, v_unit_id, (SELECT id FROM clients WHERE registration_code = 'CLI-001'), (SELECT id FROM services WHERE name = 'Banho e Tosa'), (SELECT id FROM professionals WHERE name = 'João Groomer'), NOW() + INTERVAL '1 day' + INTERVAL '10 hours', '10:00', 'pending'),
    (v_org_id, v_unit_id, (SELECT id FROM clients WHERE registration_code = 'CLI-002'), (SELECT id FROM services WHERE name = 'Banho Simples'), (SELECT id FROM professionals WHERE name = 'Maria Silva'), NOW() + INTERVAL '1 day' + INTERVAL '11 hours', '11:00', 'pending'),
    (v_org_id, v_unit_id, (SELECT id FROM clients WHERE registration_code = 'CLI-003'), (SELECT id FROM services WHERE name = 'Tosa Criativa'), (SELECT id FROM professionals WHERE name = 'Pedro Costa'), NOW() + INTERVAL '2 days' + INTERVAL '14 hours', '14:00', 'pending'),
    (v_org_id, v_unit_id, (SELECT id FROM clients WHERE registration_code = 'CLI-001'), (SELECT id FROM services WHERE name = 'Hidratação'), (SELECT id FROM professionals WHERE name = 'João Groomer'), NOW() + INTERVAL '2 days' + INTERVAL '15 hours', '15:00', 'pending'),
    (v_org_id, v_unit_id, (SELECT id FROM clients WHERE registration_code = 'CLI-004'), (SELECT id FROM services WHERE name = 'Tosa Higiênica'), (SELECT id FROM professionals WHERE name = 'Maria Silva'), NOW() + INTERVAL '3 days' + INTERVAL '09 hours', '09:00', 'pending'),
    (v_org_id, v_unit_id, (SELECT id FROM clients WHERE registration_code = 'CLI-005'), (SELECT id FROM services WHERE name = 'Banho e Tosa'), (SELECT id FROM professionals WHERE name = 'Pedro Costa'), NOW() + INTERVAL '3 days' + INTERVAL '10 hours', '10:00', 'pending')
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Todas as tabelas criadas e dados inseridos com sucesso!';
END $$;

-- ============================================
-- 5. VERIFICAR DADOS
-- ============================================

SELECT 'Organizations' as table_name, COUNT(*) as count FROM organizations
UNION ALL
SELECT 'Legal Entities', COUNT(*) FROM legal_entities
UNION ALL
SELECT 'Units', COUNT(*) FROM units
UNION ALL
SELECT 'Clients', COUNT(*) FROM clients
UNION ALL
SELECT 'Pets', COUNT(*) FROM pets
UNION ALL
SELECT 'Services', COUNT(*) FROM services
UNION ALL
SELECT 'Professionals', COUNT(*) FROM professionals
UNION ALL
SELECT 'Appointments', COUNT(*) FROM appointments;
