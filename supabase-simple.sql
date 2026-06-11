-- ============================================
-- SQL SIMPLES - APENAS COLUNAS BÁSICAS
-- ============================================

-- 1. CRIAR ORGANIZAÇÃO
INSERT INTO organizations (name, status)
VALUES ('GroomerFlow', 'active')
ON CONFLICT DO NOTHING;

-- 2. INSERIR CLIENTES (apenas colunas básicas)
INSERT INTO clientes (nome, cpf, phone, email, created_at)
VALUES
  ('Ricardo Mendes', '12345678901', '(11) 98765-4321', 'ricardo@email.com', NOW()),
  ('Ana Silva', '12345678902', '(11) 98765-4322', 'ana@email.com', NOW()),
  ('Carlos Santos', '12345678903', '(11) 98765-4323', 'carlos@email.com', NOW()),
  ('Juliana Costa', '12345678904', '(11) 98765-4324', 'juliana@email.com', NOW()),
  ('Roberto Alves', '12345678905', '(11) 98765-4325', 'roberto@email.com', NOW())
ON CONFLICT DO NOTHING;

-- 3. INSERIR PETS (apenas colunas básicas)
INSERT INTO pets (client_id, name, breed, created_at)
VALUES
  ((SELECT id FROM clientes WHERE cpf = '12345678901' LIMIT 1), 'Thor', 'Golden Retriever', NOW()),
  ((SELECT id FROM clientes WHERE cpf = '12345678902' LIMIT 1), 'Max', 'Poodle', NOW()),
  ((SELECT id FROM clientes WHERE cpf = '12345678903' LIMIT 1), 'Luna', 'Husky', NOW()),
  ((SELECT id FROM clientes WHERE cpf = '12345678901' LIMIT 1), 'Bella', 'Labrador', NOW()),
  ((SELECT id FROM clientes WHERE cpf = '12345678904' LIMIT 1), 'Rex', 'Bulldog', NOW()),
  ((SELECT id FROM clientes WHERE cpf = '12345678905' LIMIT 1), 'Mimi', 'Shih Tzu', NOW())
ON CONFLICT DO NOTHING;

-- 4. INSERIR SERVIÇOS
INSERT INTO services (name, price)
VALUES
  ('Banho e Tosa', 150.00),
  ('Banho Simples', 80.00),
  ('Tosa Criativa', 200.00),
  ('Hidratação', 120.00),
  ('Tosa Higiênica', 100.00)
ON CONFLICT DO NOTHING;

-- 5. INSERIR PROFISSIONAIS
INSERT INTO professionals (name, cpf)
VALUES
  ('João Groomer', '11111111111'),
  ('Maria Silva', '22222222222'),
  ('Pedro Costa', '33333333333')
ON CONFLICT DO NOTHING;

-- 6. INSERIR AGENDAMENTOS
INSERT INTO appointments (client_id, pet_id, service_id, professional_id, appointment_date, start_time, created_at)
VALUES
  (
    (SELECT id FROM clientes WHERE cpf = '12345678901' LIMIT 1),
    (SELECT id FROM pets WHERE name = 'Thor' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Banho e Tosa' LIMIT 1),
    (SELECT id FROM professionals WHERE name = 'João Groomer' LIMIT 1),
    NOW() + INTERVAL '1 day' + INTERVAL '10 hours', '10:00', NOW()
  ),
  (
    (SELECT id FROM clientes WHERE cpf = '12345678902' LIMIT 1),
    (SELECT id FROM pets WHERE name = 'Max' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Banho Simples' LIMIT 1),
    (SELECT id FROM professionals WHERE name = 'Maria Silva' LIMIT 1),
    NOW() + INTERVAL '1 day' + INTERVAL '11 hours', '11:00', NOW()
  ),
  (
    (SELECT id FROM clientes WHERE cpf = '12345678903' LIMIT 1),
    (SELECT id FROM pets WHERE name = 'Luna' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Tosa Criativa' LIMIT 1),
    (SELECT id FROM professionals WHERE name = 'Pedro Costa' LIMIT 1),
    NOW() + INTERVAL '2 days' + INTERVAL '14 hours', '14:00', NOW()
  ),
  (
    (SELECT id FROM clientes WHERE cpf = '12345678901' LIMIT 1),
    (SELECT id FROM pets WHERE name = 'Bella' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Hidratação' LIMIT 1),
    (SELECT id FROM professionals WHERE name = 'João Groomer' LIMIT 1),
    NOW() + INTERVAL '2 days' + INTERVAL '15 hours', '15:00', NOW()
  ),
  (
    (SELECT id FROM clientes WHERE cpf = '12345678904' LIMIT 1),
    (SELECT id FROM pets WHERE name = 'Rex' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Tosa Higiênica' LIMIT 1),
    (SELECT id FROM professionals WHERE name = 'Maria Silva' LIMIT 1),
    NOW() + INTERVAL '3 days' + INTERVAL '09 hours', '09:00', NOW()
  ),
  (
    (SELECT id FROM clientes WHERE cpf = '12345678905' LIMIT 1),
    (SELECT id FROM pets WHERE name = 'Mimi' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Banho e Tosa' LIMIT 1),
    (SELECT id FROM professionals WHERE name = 'Pedro Costa' LIMIT 1),
    NOW() + INTERVAL '3 days' + INTERVAL '10 hours', '10:00', NOW()
  )
ON CONFLICT DO NOTHING;

-- 7. VERIFICAR DADOS
SELECT 'Clientes' as table_name, COUNT(*) as count FROM clientes
UNION ALL
SELECT 'Pets', COUNT(*) FROM pets
UNION ALL
SELECT 'Services', COUNT(*) FROM services
UNION ALL
SELECT 'Professionals', COUNT(*) FROM professionals
UNION ALL
SELECT 'Appointments', COUNT(*) FROM appointments;
