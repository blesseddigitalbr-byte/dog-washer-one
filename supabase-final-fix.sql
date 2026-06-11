-- ============================================
-- SINCRONIZAR COM SCHEMA.TS - NOMES CORRETOS
-- ============================================
-- Este SQL usa os nomes EXATOS do schema.ts:
-- - Tabela: clients (não clientes)
-- - Tabela: professionals (não professionals)
-- - Tabela: services (não services)
-- - Tabela: appointments (não appointments)

-- ============================================
-- 1. ADICIONAR COLUNAS FALTANTES
-- ============================================

-- Adicionar organization_id em professionals
ALTER TABLE professionals
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Adicionar unit_id em professionals
ALTER TABLE professionals
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id) ON DELETE CASCADE;

-- Adicionar organization_id em clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Adicionar unit_id em clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id) ON DELETE CASCADE;

-- Adicionar organization_id em services
ALTER TABLE services
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Adicionar unit_id em services
ALTER TABLE services
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id) ON DELETE CASCADE;

-- Adicionar organization_id em appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Adicionar unit_id em appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id) ON DELETE CASCADE;

-- ============================================
-- 2. POPULAR COLUNAS COM DADOS EXISTENTES
-- ============================================

-- Obter IDs da organização e unidade padrão
DO $$
DECLARE
  v_org_id UUID;
  v_unit_id UUID;
BEGIN
  -- Pegar primeira organização
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  
  -- Pegar primeira unidade
  SELECT id INTO v_unit_id FROM units LIMIT 1;
  
  -- Se não existir organização, criar uma
  IF v_org_id IS NULL THEN
    INSERT INTO organizations (name, status, is_active)
    VALUES ('GroomerFlow', 'active', true)
    RETURNING id INTO v_org_id;
  END IF;
  
  -- Se não existir unidade, criar uma
  IF v_unit_id IS NULL THEN
    INSERT INTO units (
      organization_id, 
      legal_entity_id,
      name, 
      code, 
      unit_type,
      address,
      phone,
      email,
      manager_name,
      manager_email,
      status,
      is_active
    ) VALUES (
      v_org_id,
      (SELECT id FROM legal_entities LIMIT 1),
      'Unidade Principal',
      'UNIT-001',
      'salon',
      'Rua Principal, 123',
      '(11) 9999-9999',
      'unidade@groomerflow.com',
      'Gerente',
      'gerente@groomerflow.com',
      'active',
      true
    )
    RETURNING id INTO v_unit_id;
  END IF;
  
  -- Atualizar professionals
  UPDATE professionals
  SET 
    organization_id = v_org_id,
    unit_id = v_unit_id
  WHERE organization_id IS NULL;
  
  -- Atualizar clients
  UPDATE clients
  SET 
    organization_id = v_org_id,
    unit_id = v_unit_id
  WHERE organization_id IS NULL;
  
  -- Atualizar services
  UPDATE services
  SET 
    organization_id = v_org_id,
    unit_id = v_unit_id
  WHERE organization_id IS NULL;
  
  -- Atualizar appointments
  UPDATE appointments
  SET 
    organization_id = v_org_id,
    unit_id = v_unit_id
  WHERE organization_id IS NULL;
  
END $$;

-- ============================================
-- 3. INSERIR DADOS DE EXEMPLO
-- ============================================

-- Obter IDs para uso nos inserts
DO $$
DECLARE
  v_org_id UUID;
  v_unit_id UUID;
  v_client_ricardo UUID;
  v_client_ana UUID;
  v_client_carlos UUID;
  v_client_juliana UUID;
  v_client_roberto UUID;
  v_pet_thor UUID;
  v_pet_max UUID;
  v_pet_luna UUID;
  v_pet_bella UUID;
  v_pet_rex UUID;
  v_pet_mimi UUID;
  v_service_banho_tosa UUID;
  v_service_banho_simples UUID;
  v_service_tosa_criativa UUID;
  v_service_hidratacao UUID;
  v_service_tosa_higienica UUID;
  v_prof_joao UUID;
  v_prof_maria UUID;
  v_prof_pedro UUID;
BEGIN
  -- Obter IDs base
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  SELECT id INTO v_unit_id FROM units LIMIT 1;
  
  -- ========== INSERIR CLIENTES ==========
  INSERT INTO clients (
    organization_id, unit_id, registration_code, name, email, phone, cpf, 
    city, state, status, is_active
  ) VALUES (
    v_org_id, v_unit_id, 'CLI-001', 'Ricardo Mendes', 'ricardo@email.com', 
    '(11) 98765-4321', '12345678901', 'São Paulo', 'SP', 'active', true
  )
  ON CONFLICT (registration_code) DO NOTHING
  RETURNING id INTO v_client_ricardo;
  
  IF v_client_ricardo IS NULL THEN
    SELECT id INTO v_client_ricardo FROM clients WHERE registration_code = 'CLI-001';
  END IF;
  
  INSERT INTO clients (
    organization_id, unit_id, registration_code, name, email, phone, cpf, 
    city, state, status, is_active
  ) VALUES (
    v_org_id, v_unit_id, 'CLI-002', 'Ana Silva', 'ana@email.com', 
    '(11) 98765-4322', '12345678902', 'São Paulo', 'SP', 'active', true
  )
  ON CONFLICT (registration_code) DO NOTHING
  RETURNING id INTO v_client_ana;
  
  IF v_client_ana IS NULL THEN
    SELECT id INTO v_client_ana FROM clients WHERE registration_code = 'CLI-002';
  END IF;
  
  INSERT INTO clients (
    organization_id, unit_id, registration_code, name, email, phone, cpf, 
    city, state, status, is_active
  ) VALUES (
    v_org_id, v_unit_id, 'CLI-003', 'Carlos Santos', 'carlos@email.com', 
    '(11) 98765-4323', '12345678903', 'São Paulo', 'SP', 'active', true
  )
  ON CONFLICT (registration_code) DO NOTHING
  RETURNING id INTO v_client_carlos;
  
  IF v_client_carlos IS NULL THEN
    SELECT id INTO v_client_carlos FROM clients WHERE registration_code = 'CLI-003';
  END IF;
  
  INSERT INTO clients (
    organization_id, unit_id, registration_code, name, email, phone, cpf, 
    city, state, status, is_active
  ) VALUES (
    v_org_id, v_unit_id, 'CLI-004', 'Juliana Costa', 'juliana@email.com', 
    '(11) 98765-4324', '12345678904', 'São Paulo', 'SP', 'active', true
  )
  ON CONFLICT (registration_code) DO NOTHING
  RETURNING id INTO v_client_juliana;
  
  IF v_client_juliana IS NULL THEN
    SELECT id INTO v_client_juliana FROM clients WHERE registration_code = 'CLI-004';
  END IF;
  
  INSERT INTO clients (
    organization_id, unit_id, registration_code, name, email, phone, cpf, 
    city, state, status, is_active
  ) VALUES (
    v_org_id, v_unit_id, 'CLI-005', 'Roberto Alves', 'roberto@email.com', 
    '(11) 98765-4325', '12345678905', 'São Paulo', 'SP', 'active', true
  )
  ON CONFLICT (registration_code) DO NOTHING
  RETURNING id INTO v_client_roberto;
  
  IF v_client_roberto IS NULL THEN
    SELECT id INTO v_client_roberto FROM clients WHERE registration_code = 'CLI-005';
  END IF;
  
  -- ========== INSERIR PETS ==========
  INSERT INTO pets (
    organization_id, client_id, registration_code, name, breed, species, 
    color, weight, status, is_active
  ) VALUES (
    v_org_id, v_client_ricardo, 'PET-001', 'Thor', 'Golden Retriever', 'Cachorro', 
    'Dourado', 32.5, 'active', true
  )
  ON CONFLICT (registration_code) DO NOTHING
  RETURNING id INTO v_pet_thor;
  
  IF v_pet_thor IS NULL THEN
    SELECT id INTO v_pet_thor FROM pets WHERE registration_code = 'PET-001';
  END IF;
  
  INSERT INTO pets (
    organization_id, client_id, registration_code, name, breed, species, 
    color, weight, status, is_active
  ) VALUES (
    v_org_id, v_client_ana, 'PET-002', 'Max', 'Poodle', 'Cachorro', 
    'Branco', 8.5, 'active', true
  )
  ON CONFLICT (registration_code) DO NOTHING
  RETURNING id INTO v_pet_max;
  
  IF v_pet_max IS NULL THEN
    SELECT id INTO v_pet_max FROM pets WHERE registration_code = 'PET-002';
  END IF;
  
  INSERT INTO pets (
    organization_id, client_id, registration_code, name, breed, species, 
    color, weight, status, is_active
  ) VALUES (
    v_org_id, v_client_carlos, 'PET-003', 'Luna', 'Husky', 'Cachorro', 
    'Cinza e Branco', 25.0, 'active', true
  )
  ON CONFLICT (registration_code) DO NOTHING
  RETURNING id INTO v_pet_luna;
  
  IF v_pet_luna IS NULL THEN
    SELECT id INTO v_pet_luna FROM pets WHERE registration_code = 'PET-003';
  END IF;
  
  INSERT INTO pets (
    organization_id, client_id, registration_code, name, breed, species, 
    color, weight, status, is_active
  ) VALUES (
    v_org_id, v_client_ricardo, 'PET-004', 'Bella', 'Labrador', 'Cachorro', 
    'Chocolate', 28.0, 'active', true
  )
  ON CONFLICT (registration_code) DO NOTHING
  RETURNING id INTO v_pet_bella;
  
  IF v_pet_bella IS NULL THEN
    SELECT id INTO v_pet_bella FROM pets WHERE registration_code = 'PET-004';
  END IF;
  
  INSERT INTO pets (
    organization_id, client_id, registration_code, name, breed, species, 
    color, weight, status, is_active
  ) VALUES (
    v_org_id, v_client_juliana, 'PET-005', 'Rex', 'Bulldog', 'Cachorro', 
    'Bege', 22.0, 'active', true
  )
  ON CONFLICT (registration_code) DO NOTHING
  RETURNING id INTO v_pet_rex;
  
  IF v_pet_rex IS NULL THEN
    SELECT id INTO v_pet_rex FROM pets WHERE registration_code = 'PET-005';
  END IF;
  
  INSERT INTO pets (
    organization_id, client_id, registration_code, name, breed, species, 
    color, weight, status, is_active
  ) VALUES (
    v_org_id, v_client_roberto, 'PET-006', 'Mimi', 'Shih Tzu', 'Cachorro', 
    'Marrom', 5.5, 'active', true
  )
  ON CONFLICT (registration_code) DO NOTHING
  RETURNING id INTO v_pet_mimi;
  
  IF v_pet_mimi IS NULL THEN
    SELECT id INTO v_pet_mimi FROM pets WHERE registration_code = 'PET-006';
  END IF;
  
  -- ========== INSERIR SERVIÇOS ==========
  INSERT INTO services (
    organization_id, unit_id, name, description, price, duration_minutes, 
    category, status
  ) VALUES (
    v_org_id, v_unit_id, 'Banho e Tosa', 'Banho completo com tosa', 150.00, 90, 
    'grooming', 'active'
  )
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO v_service_banho_tosa;
  
  IF v_service_banho_tosa IS NULL THEN
    SELECT id INTO v_service_banho_tosa FROM services WHERE name = 'Banho e Tosa';
  END IF;
  
  INSERT INTO services (
    organization_id, unit_id, name, description, price, duration_minutes, 
    category, status
  ) VALUES (
    v_org_id, v_unit_id, 'Banho Simples', 'Apenas banho', 80.00, 45, 
    'grooming', 'active'
  )
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO v_service_banho_simples;
  
  IF v_service_banho_simples IS NULL THEN
    SELECT id INTO v_service_banho_simples FROM services WHERE name = 'Banho Simples';
  END IF;
  
  INSERT INTO services (
    organization_id, unit_id, name, description, price, duration_minutes, 
    category, status
  ) VALUES (
    v_org_id, v_unit_id, 'Tosa Criativa', 'Tosa com design', 200.00, 120, 
    'grooming', 'active'
  )
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO v_service_tosa_criativa;
  
  IF v_service_tosa_criativa IS NULL THEN
    SELECT id INTO v_service_tosa_criativa FROM services WHERE name = 'Tosa Criativa';
  END IF;
  
  INSERT INTO services (
    organization_id, unit_id, name, description, price, duration_minutes, 
    category, status
  ) VALUES (
    v_org_id, v_unit_id, 'Hidratação', 'Tratamento hidratante', 120.00, 60, 
    'grooming', 'active'
  )
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO v_service_hidratacao;
  
  IF v_service_hidratacao IS NULL THEN
    SELECT id INTO v_service_hidratacao FROM services WHERE name = 'Hidratação';
  END IF;
  
  INSERT INTO services (
    organization_id, unit_id, name, description, price, duration_minutes, 
    category, status
  ) VALUES (
    v_org_id, v_unit_id, 'Tosa Higiênica', 'Tosa básica', 100.00, 60, 
    'grooming', 'active'
  )
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO v_service_tosa_higienica;
  
  IF v_service_tosa_higienica IS NULL THEN
    SELECT id INTO v_service_tosa_higienica FROM services WHERE name = 'Tosa Higiênica';
  END IF;
  
  -- ========== INSERIR PROFISSIONAIS ==========
  INSERT INTO professionals (
    organization_id, unit_id, name, email, phone, cpf, specialization, 
    status, is_active
  ) VALUES (
    v_org_id, v_unit_id, 'João Groomer', 'joao@groomerflow.com', 
    '(11) 99999-0001', '11111111111', 'Tosa Criativa', 'active', true
  )
  ON CONFLICT (cpf) DO NOTHING
  RETURNING id INTO v_prof_joao;
  
  IF v_prof_joao IS NULL THEN
    SELECT id INTO v_prof_joao FROM professionals WHERE name = 'João Groomer';
  END IF;
  
  INSERT INTO professionals (
    organization_id, unit_id, name, email, phone, cpf, specialization, 
    status, is_active
  ) VALUES (
    v_org_id, v_unit_id, 'Maria Silva', 'maria@groomerflow.com', 
    '(11) 99999-0002', '22222222222', 'Banho e Tosa', 'active', true
  )
  ON CONFLICT (cpf) DO NOTHING
  RETURNING id INTO v_prof_maria;
  
  IF v_prof_maria IS NULL THEN
    SELECT id INTO v_prof_maria FROM professionals WHERE name = 'Maria Silva';
  END IF;
  
  INSERT INTO professionals (
    organization_id, unit_id, name, email, phone, cpf, specialization, 
    status, is_active
  ) VALUES (
    v_org_id, v_unit_id, 'Pedro Costa', 'pedro@groomerflow.com', 
    '(11) 99999-0003', '33333333333', 'Hidratação', 'active', true
  )
  ON CONFLICT (cpf) DO NOTHING
  RETURNING id INTO v_prof_pedro;
  
  IF v_prof_pedro IS NULL THEN
    SELECT id INTO v_prof_pedro FROM professionals WHERE name = 'Pedro Costa';
  END IF;
  
  -- ========== INSERIR AGENDAMENTOS ==========
  INSERT INTO appointments (
    organization_id, unit_id, client_id, service_id, professional_id, 
    appointment_date, start_time, status
  ) VALUES (
    v_org_id, v_unit_id, v_client_ricardo, v_service_banho_tosa, v_prof_joao,
    NOW() + INTERVAL '1 day' + INTERVAL '10 hours', '10:00', 'pending'
  )
  ON CONFLICT DO NOTHING;
  
  INSERT INTO appointments (
    organization_id, unit_id, client_id, service_id, professional_id, 
    appointment_date, start_time, status
  ) VALUES (
    v_org_id, v_unit_id, v_client_ana, v_service_banho_simples, v_prof_maria,
    NOW() + INTERVAL '1 day' + INTERVAL '11 hours', '11:00', 'pending'
  )
  ON CONFLICT DO NOTHING;
  
  INSERT INTO appointments (
    organization_id, unit_id, client_id, service_id, professional_id, 
    appointment_date, start_time, status
  ) VALUES (
    v_org_id, v_unit_id, v_client_carlos, v_service_tosa_criativa, v_prof_pedro,
    NOW() + INTERVAL '2 days' + INTERVAL '14 hours', '14:00', 'pending'
  )
  ON CONFLICT DO NOTHING;
  
  INSERT INTO appointments (
    organization_id, unit_id, client_id, service_id, professional_id, 
    appointment_date, start_time, status
  ) VALUES (
    v_org_id, v_unit_id, v_client_ricardo, v_service_hidratacao, v_prof_joao,
    NOW() + INTERVAL '2 days' + INTERVAL '15 hours', '15:00', 'pending'
  )
  ON CONFLICT DO NOTHING;
  
  INSERT INTO appointments (
    organization_id, unit_id, client_id, service_id, professional_id, 
    appointment_date, start_time, status
  ) VALUES (
    v_org_id, v_unit_id, v_client_juliana, v_service_tosa_higienica, v_prof_maria,
    NOW() + INTERVAL '3 days' + INTERVAL '09 hours', '09:00', 'pending'
  )
  ON CONFLICT DO NOTHING;
  
  INSERT INTO appointments (
    organization_id, unit_id, client_id, service_id, professional_id, 
    appointment_date, start_time, status
  ) VALUES (
    v_org_id, v_unit_id, v_client_roberto, v_service_banho_tosa, v_prof_pedro,
    NOW() + INTERVAL '3 days' + INTERVAL '10 hours', '10:00', 'pending'
  )
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Dados inseridos com sucesso!';
END $$;

-- ============================================
-- 4. VERIFICAR DADOS INSERIDOS
-- ============================================

SELECT 'Organizations' as table_name, COUNT(*) as count FROM organizations
UNION ALL
SELECT 'Units', COUNT(*) FROM units
UNION ALL
SELECT 'Professionals', COUNT(*) FROM professionals
UNION ALL
SELECT 'Services', COUNT(*) FROM services
UNION ALL
SELECT 'Clients', COUNT(*) FROM clients
UNION ALL
SELECT 'Pets', COUNT(*) FROM pets
UNION ALL
SELECT 'Appointments', COUNT(*) FROM appointments;

-- Listar agendamentos com detalhes
SELECT 
  a.id,
  c.name as client_name,
  p.name as pet_name,
  s.name as service_name,
  pr.name as professional_name,
  a.appointment_date,
  a.status
FROM appointments a
LEFT JOIN clients c ON a.client_id = c.id
LEFT JOIN pets p ON a.client_id = p.client_id
LEFT JOIN services s ON a.service_id = s.id
LEFT JOIN professionals pr ON a.professional_id = pr.id
ORDER BY a.appointment_date;
