-- ============================================
-- CRIAR TABELAS FALTANTES
-- ============================================

-- 1. Criar tabela units
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

-- 2. Criar tabela students
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

-- 3. Criar tabela appointment_students
CREATE TABLE IF NOT EXISTS appointment_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'assistant',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar tabela appointment_pets
CREATE TABLE IF NOT EXISTS appointment_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar tabela appointment_status_history
CREATE TABLE IF NOT EXISTS appointment_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  reason TEXT,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- POPULAR DADOS DE EXEMPLO
-- ============================================

-- 1. Inserir Organization (se não existir)
INSERT INTO organizations (name) 
VALUES ('GroomerFlow')
ON CONFLICT DO NOTHING;

-- 2. Obter IDs necessários
WITH org AS (
  SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1
),
unit_insert AS (
  INSERT INTO units (organization_id, name, code) 
  SELECT id, 'Unidade Principal', 'UNIT-001' FROM org
  ON CONFLICT (code) DO NOTHING
  RETURNING id, organization_id
),
prof_insert AS (
  INSERT INTO professionals (organization_id, name, email, phone) 
  SELECT org.id, 'João Groomer', 'joao@groomerflow.com', '11999999999' FROM org
  UNION ALL
  SELECT org.id, 'Maria Silva', 'maria@groomerflow.com', '11988888888' FROM org
  UNION ALL
  SELECT org.id, 'Pedro Costa', 'pedro@groomerflow.com', '11977777777' FROM org
  ON CONFLICT DO NOTHING
  RETURNING id, name
),
serv_insert AS (
  INSERT INTO services (organization_id, name, price, duration_minutes) 
  SELECT org.id, 'Banho e Tosa', 150.00, 60 FROM org
  UNION ALL
  SELECT org.id, 'Banho Simples', 80.00, 30 FROM org
  UNION ALL
  SELECT org.id, 'Hidratação', 120.00, 45 FROM org
  UNION ALL
  SELECT org.id, 'Tosa Criativa', 200.00, 90 FROM org
  UNION ALL
  SELECT org.id, 'Tosa Higiênica', 100.00, 45 FROM org
  ON CONFLICT DO NOTHING
  RETURNING id, name
),
client_insert AS (
  INSERT INTO clientes (organization_id, name, email, phone, cpf) 
  SELECT org.id, 'Ricardo Mendes', 'ricardo@email.com', '11991234567', '12345678901' FROM org
  UNION ALL
  SELECT org.id, 'Ana Silva', 'ana@email.com', '11992345678', '23456789012' FROM org
  UNION ALL
  SELECT org.id, 'Carlos Santos', 'carlos@email.com', '11993456789', '34567890123' FROM org
  UNION ALL
  SELECT org.id, 'Juliana Costa', 'juliana@email.com', '11994567890', '45678901234' FROM org
  UNION ALL
  SELECT org.id, 'Roberto Alves', 'roberto@email.com', '11995678901', '56789012345' FROM org
  ON CONFLICT DO NOTHING
  RETURNING id, name
),
pet_insert AS (
  INSERT INTO pets (organization_id, client_id, name, breed, species, color) 
  SELECT org.id, (SELECT id FROM clientes WHERE cpf = '12345678901' LIMIT 1), 'Thor', 'Labrador', 'Cão', 'Preto' FROM org
  UNION ALL
  SELECT org.id, (SELECT id FROM clientes WHERE cpf = '12345678901' LIMIT 1), 'Bella', 'Poodle', 'Cão', 'Branco' FROM org
  UNION ALL
  SELECT org.id, (SELECT id FROM clientes WHERE cpf = '23456789012' LIMIT 1), 'Max', 'Golden Retriever', 'Cão', 'Dourado' FROM org
  UNION ALL
  SELECT org.id, (SELECT id FROM clientes WHERE cpf = '34567890123' LIMIT 1), 'Luna', 'Husky', 'Cão', 'Cinza' FROM org
  UNION ALL
  SELECT org.id, (SELECT id FROM clientes WHERE cpf = '45678901234' LIMIT 1), 'Rex', 'Pastor Alemão', 'Cão', 'Marrom' FROM org
  UNION ALL
  SELECT org.id, (SELECT id FROM clientes WHERE cpf = '56789012345' LIMIT 1), 'Mimi', 'Shih Tzu', 'Cão', 'Branco e Marrom' FROM org
  ON CONFLICT DO NOTHING
  RETURNING id, name
)
-- 3. Inserir Appointments
INSERT INTO appointments (organization_id, client_id, pet_id, service_id, professional_id, appointment_date, status) 
SELECT 
  org.id,
  (SELECT id FROM clientes WHERE cpf = '12345678901' LIMIT 1),
  (SELECT id FROM pets WHERE name = 'Thor' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Banho e Tosa' LIMIT 1),
  (SELECT id FROM professionals WHERE name = 'João Groomer' LIMIT 1),
  NOW() + INTERVAL '1 day' + INTERVAL '10 hours',
  'pending'
FROM (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1) org
ON CONFLICT DO NOTHING;

-- Inserir segundo agendamento
INSERT INTO appointments (organization_id, client_id, pet_id, service_id, professional_id, appointment_date, status) 
SELECT 
  org.id,
  (SELECT id FROM clientes WHERE cpf = '23456789012' LIMIT 1),
  (SELECT id FROM pets WHERE name = 'Max' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Banho Simples' LIMIT 1),
  (SELECT id FROM professionals WHERE name = 'Maria Silva' LIMIT 1),
  NOW() + INTERVAL '1 day' + INTERVAL '11 hours',
  'pending'
FROM (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1) org
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICAR DADOS INSERIDOS
-- ============================================

SELECT 'Organizations' as table_name, COUNT(*) as count FROM organizations
UNION ALL
SELECT 'Units', COUNT(*) FROM units
UNION ALL
SELECT 'Professionals', COUNT(*) FROM professionals
UNION ALL
SELECT 'Services', COUNT(*) FROM services
UNION ALL
SELECT 'Clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'Pets', COUNT(*) FROM pets
UNION ALL
SELECT 'Appointments', COUNT(*) FROM appointments;
