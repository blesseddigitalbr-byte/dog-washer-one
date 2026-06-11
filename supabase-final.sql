-- ============================================
-- SQL FINAL - ESTRUTURA EXATA DAS TABELAS
-- ============================================

-- ============================================
-- 1. CRIAR ORGANIZAÇÃO SE NÃO EXISTIR
-- ============================================

INSERT INTO organizations (name, status)
VALUES ('GroomerFlow', 'active')
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. INSERIR CLIENTES
-- ============================================

INSERT INTO clientes (
  nome, cpf, phone, email, data_nascimento, origem,
  telefone_nome, cep, logradouro, numero, bairro, cidade, uf,
  complemento, foto_uf, created_at, is_vip, is_model_dog, organization_id
) VALUES
  (
    'Ricardo Mendes', '12345678901', '(11) 98765-4321', 'ricardo@email.com',
    '1980-05-15'::date, 'website',
    'Residência', '01234-567', 'Rua A', '123', 'Centro', 'São Paulo', 'SP',
    '', '', NOW(), false, false, (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
  ),
  (
    'Ana Silva', '12345678902', '(11) 98765-4322', 'ana@email.com',
    '1985-08-20'::date, 'website',
    'Residência', '01234-568', 'Rua B', '456', 'Vila', 'São Paulo', 'SP',
    '', '', NOW(), false, false, (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
  ),
  (
    'Carlos Santos', '12345678903', '(11) 98765-4323', 'carlos@email.com',
    '1975-12-10'::date, 'referral',
    'Comercial', '01234-569', 'Rua C', '789', 'Bairro', 'São Paulo', 'SP',
    '', '', NOW(), false, false, (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
  ),
  (
    'Juliana Costa', '12345678904', '(11) 98765-4324', 'juliana@email.com',
    '1990-03-25'::date, 'website',
    'Residência', '01234-570', 'Rua D', '321', 'Zona', 'São Paulo', 'SP',
    '', '', NOW(), false, false, (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
  ),
  (
    'Roberto Alves', '12345678905', '(11) 98765-4325', 'roberto@email.com',
    '1978-07-30'::date, 'referral',
    'Residência', '01234-571', 'Rua E', '654', 'Bairro', 'São Paulo', 'SP',
    '', '', NOW(), false, false, (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. INSERIR PETS
-- ============================================

INSERT INTO pets (
  client_id, name, breed, data_nascimento, sexo, cor_pelagem, weight,
  is_vip, is_model_dog, possui_parasitas, alergias, notes, foto_url, created_at, organization_id
) VALUES
  (
    (SELECT id FROM clientes WHERE cpf = '12345678901' LIMIT 1),
    'Thor', 'Golden Retriever', '2020-01-15'::date, 'M', 'Dourado', '32.5',
    false, false, false, '', 'Cão amigável e dócil', '', NOW(),
    (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
  ),
  (
    (SELECT id FROM clientes WHERE cpf = '12345678902' LIMIT 1),
    'Max', 'Poodle', '2021-06-20'::date, 'M', 'Branco', '8.5',
    false, false, false, '', 'Pequeno e muito dócil', '', NOW(),
    (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
  ),
  (
    (SELECT id FROM clientes WHERE cpf = '12345678903' LIMIT 1),
    'Luna', 'Husky', '2019-11-10'::date, 'F', 'Cinza e Branco', '25.0',
    false, false, false, '', 'Muito energético', '', NOW(),
    (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
  ),
  (
    (SELECT id FROM clientes WHERE cpf = '12345678901' LIMIT 1),
    'Bella', 'Labrador', '2020-03-05'::date, 'F', 'Chocolate', '28.0',
    false, false, false, '', 'Muito calmo', '', NOW(),
    (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
  ),
  (
    (SELECT id FROM clientes WHERE cpf = '12345678904' LIMIT 1),
    'Rex', 'Bulldog', '2021-09-12'::date, 'M', 'Bege', '22.0',
    false, false, false, '', 'Precisa de cuidado especial', '', NOW(),
    (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
  ),
  (
    (SELECT id FROM clientes WHERE cpf = '12345678905' LIMIT 1),
    'Mimi', 'Shih Tzu', '2022-02-28'::date, 'F', 'Marrom', '5.5',
    false, false, false, '', 'Pequeno, requer tosa frequente', '', NOW(),
    (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. INSERIR SERVIÇOS (SEM organization_id)
-- ============================================

INSERT INTO services (
  name, description, price, duration_minutes, category, status
) VALUES
  ('Banho e Tosa', 'Banho completo com tosa profissional', 150.00, 90, 'grooming', 'active'),
  ('Banho Simples', 'Apenas banho sem tosa', 80.00, 45, 'grooming', 'active'),
  ('Tosa Criativa', 'Tosa com design e criatividade', 200.00, 120, 'grooming', 'active'),
  ('Hidratação', 'Tratamento hidratante para pelagem', 120.00, 60, 'treatment', 'active'),
  ('Tosa Higiênica', 'Tosa básica para higiene', 100.00, 60, 'grooming', 'active')
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. INSERIR PROFISSIONAIS (SEM organization_id)
-- ============================================

INSERT INTO professionals (
  name, email, phone, cpf, specialization, status
) VALUES
  ('João Groomer', 'joao@groomerflow.com', '(11) 99999-0001', '11111111111', 'Tosa Criativa', 'active'),
  ('Maria Silva', 'maria@groomerflow.com', '(11) 99999-0002', '22222222222', 'Banho e Tosa', 'active'),
  ('Pedro Costa', 'pedro@groomerflow.com', '(11) 99999-0003', '33333333333', 'Hidratação', 'active')
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. INSERIR AGENDAMENTOS (SEM organization_id)
-- ============================================

INSERT INTO appointments (
  client_id, pet_id, service_id, professional_id,
  appointment_date, start_time, duration_minutes, status, notes, send_email, created_at
) VALUES
  (
    (SELECT id FROM clientes WHERE cpf = '12345678901' LIMIT 1),
    (SELECT id FROM pets WHERE name = 'Thor' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Banho e Tosa' LIMIT 1),
    (SELECT id FROM professionals WHERE name = 'João Groomer' LIMIT 1),
    NOW() + INTERVAL '1 day' + INTERVAL '10 hours', '10:00', 90, 'pending', 'Agendamento para Thor', true, NOW()
  ),
  (
    (SELECT id FROM clientes WHERE cpf = '12345678902' LIMIT 1),
    (SELECT id FROM pets WHERE name = 'Max' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Banho Simples' LIMIT 1),
    (SELECT id FROM professionals WHERE name = 'Maria Silva' LIMIT 1),
    NOW() + INTERVAL '1 day' + INTERVAL '11 hours', '11:00', 45, 'pending', 'Agendamento para Max', true, NOW()
  ),
  (
    (SELECT id FROM clientes WHERE cpf = '12345678903' LIMIT 1),
    (SELECT id FROM pets WHERE name = 'Luna' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Tosa Criativa' LIMIT 1),
    (SELECT id FROM professionals WHERE name = 'Pedro Costa' LIMIT 1),
    NOW() + INTERVAL '2 days' + INTERVAL '14 hours', '14:00', 120, 'pending', 'Agendamento para Luna', true, NOW()
  ),
  (
    (SELECT id FROM clientes WHERE cpf = '12345678901' LIMIT 1),
    (SELECT id FROM pets WHERE name = 'Bella' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Hidratação' LIMIT 1),
    (SELECT id FROM professionals WHERE name = 'João Groomer' LIMIT 1),
    NOW() + INTERVAL '2 days' + INTERVAL '15 hours', '15:00', 60, 'pending', 'Agendamento para Bella', true, NOW()
  ),
  (
    (SELECT id FROM clientes WHERE cpf = '12345678904' LIMIT 1),
    (SELECT id FROM pets WHERE name = 'Rex' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Tosa Higiênica' LIMIT 1),
    (SELECT id FROM professionals WHERE name = 'Maria Silva' LIMIT 1),
    NOW() + INTERVAL '3 days' + INTERVAL '09 hours', '09:00', 60, 'pending', 'Agendamento para Rex', true, NOW()
  ),
  (
    (SELECT id FROM clientes WHERE cpf = '12345678905' LIMIT 1),
    (SELECT id FROM pets WHERE name = 'Mimi' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Banho e Tosa' LIMIT 1),
    (SELECT id FROM professionals WHERE name = 'Pedro Costa' LIMIT 1),
    NOW() + INTERVAL '3 days' + INTERVAL '10 hours', '10:00', 90, 'pending', 'Agendamento para Mimi', true, NOW()
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. VERIFICAR DADOS INSERIDOS
-- ============================================

SELECT 'Clientes' as table_name, COUNT(*) as count FROM clientes
UNION ALL
SELECT 'Pets', COUNT(*) FROM pets
UNION ALL
SELECT 'Services', COUNT(*) FROM services
UNION ALL
SELECT 'Professionals', COUNT(*) FROM professionals
UNION ALL
SELECT 'Appointments', COUNT(*) FROM appointments;
