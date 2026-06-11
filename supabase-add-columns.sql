-- ============================================
-- ADICIONAR COLUNAS FALTANTES
-- ============================================

-- 1. Adicionar organization_id em professionals
ALTER TABLE professionals
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 2. Adicionar organization_id em clientes
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 3. Adicionar organization_id em pets
ALTER TABLE pets
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 4. Adicionar client_id em appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clientes(id) ON DELETE SET NULL;

-- 5. Adicionar organization_id em appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- ============================================
-- POPULAR COLUNAS FALTANTES COM DADOS EXISTENTES
-- ============================================

-- 1. Atualizar organization_id em professionals
UPDATE professionals
SET organization_id = (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
WHERE organization_id IS NULL;

-- 2. Atualizar organization_id em clientes
UPDATE clientes
SET organization_id = (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
WHERE organization_id IS NULL;

-- 3. Atualizar organization_id em pets
UPDATE pets
SET organization_id = (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
WHERE organization_id IS NULL;

-- 4. Atualizar organization_id em appointments
UPDATE appointments
SET organization_id = (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
WHERE organization_id IS NULL;

-- 5. Atualizar client_id em appointments (baseado no pet)
UPDATE appointments
SET client_id = (SELECT client_id FROM pets WHERE pets.id = appointments.pet_id LIMIT 1)
WHERE client_id IS NULL AND pet_id IS NOT NULL;

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INSERIR AGENDAMENTOS COMPLETOS
-- ============================================

-- Inserir primeiro agendamento (Thor - Ricardo Mendes)
INSERT INTO appointments (organization_id, client_id, pet_id, service_id, professional_id, appointment_date, status) 
VALUES (
  (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1),
  (SELECT id FROM clientes WHERE name = 'Ricardo Mendes' LIMIT 1),
  (SELECT id FROM pets WHERE name = 'Thor' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Banho e Tosa' LIMIT 1),
  (SELECT id FROM professionals WHERE name = 'João Groomer' LIMIT 1),
  NOW() + INTERVAL '1 day' + INTERVAL '10 hours',
  'pending'
)
ON CONFLICT DO NOTHING;

-- Inserir segundo agendamento (Max - Ana Silva)
INSERT INTO appointments (organization_id, client_id, pet_id, service_id, professional_id, appointment_date, status) 
VALUES (
  (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1),
  (SELECT id FROM clientes WHERE name = 'Ana Silva' LIMIT 1),
  (SELECT id FROM pets WHERE name = 'Max' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Banho Simples' LIMIT 1),
  (SELECT id FROM professionals WHERE name = 'Maria Silva' LIMIT 1),
  NOW() + INTERVAL '1 day' + INTERVAL '11 hours',
  'pending'
)
ON CONFLICT DO NOTHING;

-- Inserir terceiro agendamento (Luna - Carlos Santos)
INSERT INTO appointments (organization_id, client_id, pet_id, service_id, professional_id, appointment_date, status) 
VALUES (
  (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1),
  (SELECT id FROM clientes WHERE name = 'Carlos Santos' LIMIT 1),
  (SELECT id FROM pets WHERE name = 'Luna' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Tosa Criativa' LIMIT 1),
  (SELECT id FROM professionals WHERE name = 'Pedro Costa' LIMIT 1),
  NOW() + INTERVAL '2 days' + INTERVAL '14 hours',
  'pending'
)
ON CONFLICT DO NOTHING;

-- Inserir quarto agendamento (Bella - Ricardo Mendes)
INSERT INTO appointments (organization_id, client_id, pet_id, service_id, professional_id, appointment_date, status) 
VALUES (
  (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1),
  (SELECT id FROM clientes WHERE name = 'Ricardo Mendes' LIMIT 1),
  (SELECT id FROM pets WHERE name = 'Bella' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Hidratação' LIMIT 1),
  (SELECT id FROM professionals WHERE name = 'João Groomer' LIMIT 1),
  NOW() + INTERVAL '2 days' + INTERVAL '15 hours',
  'pending'
)
ON CONFLICT DO NOTHING;

-- Inserir quinto agendamento (Rex - Juliana Costa)
INSERT INTO appointments (organization_id, client_id, pet_id, service_id, professional_id, appointment_date, status) 
VALUES (
  (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1),
  (SELECT id FROM clientes WHERE name = 'Juliana Costa' LIMIT 1),
  (SELECT id FROM pets WHERE name = 'Rex' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Tosa Higiênica' LIMIT 1),
  (SELECT id FROM professionals WHERE name = 'Maria Silva' LIMIT 1),
  NOW() + INTERVAL '3 days' + INTERVAL '09 hours',
  'pending'
)
ON CONFLICT DO NOTHING;

-- Inserir sexto agendamento (Mimi - Roberto Alves)
INSERT INTO appointments (organization_id, client_id, pet_id, service_id, professional_id, appointment_date, status) 
VALUES (
  (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1),
  (SELECT id FROM clientes WHERE name = 'Roberto Alves' LIMIT 1),
  (SELECT id FROM pets WHERE name = 'Mimi' LIMIT 1),
  (SELECT id FROM services WHERE name = 'Banho e Tosa' LIMIT 1),
  (SELECT id FROM professionals WHERE name = 'Pedro Costa' LIMIT 1),
  NOW() + INTERVAL '3 days' + INTERVAL '10 hours',
  'pending'
)
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
