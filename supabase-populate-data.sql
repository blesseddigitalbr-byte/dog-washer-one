-- ============================================
-- POPULAR DADOS NO SUPABASE
-- ============================================
-- Este SQL usa os nomes EXATOS das tabelas e colunas
-- conforme visto nas screenshots do Supabase

-- ============================================
-- 1. INSERIR CLIENTES (tabela: clientes)
-- ============================================

INSERT INTO clientes (
  nome, cpf, phone, email, data_nascimento, origem, 
  endereco, cidade, estado, cep, 
  data_cadastro, status
) VALUES
  ('Ricardo Mendes', '12345678901', '(11) 98765-4321', 'ricardo@email.com', '1980-05-15', 'website', 'Rua A, 123', 'São Paulo', 'SP', '01234-567', NOW(), 'ativo'),
  ('Ana Silva', '12345678902', '(11) 98765-4322', 'ana@email.com', '1985-08-20', 'website', 'Rua B, 456', 'São Paulo', 'SP', '01234-568', NOW(), 'ativo'),
  ('Carlos Santos', '12345678903', '(11) 98765-4323', 'carlos@email.com', '1975-12-10', 'referral', 'Rua C, 789', 'São Paulo', 'SP', '01234-569', NOW(), 'ativo'),
  ('Juliana Costa', '12345678904', '(11) 98765-4324', 'juliana@email.com', '1990-03-25', 'website', 'Rua D, 321', 'São Paulo', 'SP', '01234-570', NOW(), 'ativo'),
  ('Roberto Alves', '12345678905', '(11) 98765-4325', 'roberto@email.com', '1978-07-30', 'referral', 'Rua E, 654', 'São Paulo', 'SP', '01234-571', NOW(), 'ativo')
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. INSERIR PETS (tabela: pets)
-- ============================================

INSERT INTO pets (
  nome, raca, especie, cor, peso, data_nascimento,
  microchip, notas, status, client_id
) VALUES
  ('Thor', 'Golden Retriever', 'Cachorro', 'Dourado', 32.5, '2020-01-15', NULL, 'Cão amigável', 'ativo', (SELECT id FROM clientes WHERE cpf = '12345678901' LIMIT 1)),
  ('Max', 'Poodle', 'Cachorro', 'Branco', 8.5, '2021-06-20', NULL, 'Pequeno e dócil', 'ativo', (SELECT id FROM clientes WHERE cpf = '12345678902' LIMIT 1)),
  ('Luna', 'Husky', 'Cachorro', 'Cinza e Branco', 25.0, '2019-11-10', NULL, 'Energético', 'ativo', (SELECT id FROM clientes WHERE cpf = '12345678903' LIMIT 1)),
  ('Bella', 'Labrador', 'Cachorro', 'Chocolate', 28.0, '2020-03-05', NULL, 'Muito calmo', 'ativo', (SELECT id FROM clientes WHERE cpf = '12345678901' LIMIT 1)),
  ('Rex', 'Bulldog', 'Cachorro', 'Bege', 22.0, '2021-09-12', NULL, 'Precisa de cuidado especial', 'ativo', (SELECT id FROM clientes WHERE cpf = '12345678904' LIMIT 1)),
  ('Mimi', 'Shih Tzu', 'Cachorro', 'Marrom', 5.5, '2022-02-28', NULL, 'Pequeno, requer tosa frequente', 'ativo', (SELECT id FROM clientes WHERE cpf = '12345678905' LIMIT 1))
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. INSERIR SERVIÇOS (tabela: services)
-- ============================================

INSERT INTO services (
  name, description, price, duration_minutes, category, status
) VALUES
  ('Banho e Tosa', 'Banho completo com tosa profissional', 150.00, 90, 'grooming', 'ativo'),
  ('Banho Simples', 'Apenas banho sem tosa', 80.00, 45, 'grooming', 'ativo'),
  ('Tosa Criativa', 'Tosa com design e criatividade', 200.00, 120, 'grooming', 'ativo'),
  ('Hidratação', 'Tratamento hidratante para pelagem', 120.00, 60, 'treatment', 'ativo'),
  ('Tosa Higiênica', 'Tosa básica para higiene', 100.00, 60, 'grooming', 'ativo')
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. INSERIR PROFISSIONAIS (tabela: professionals)
-- ============================================

INSERT INTO professionals (
  name, email, phone, cpf, specialization, status, organization_id
) VALUES
  ('João Groomer', 'joao@groomerflow.com', '(11) 99999-0001', '11111111111', 'Tosa Criativa', 'ativo', (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)),
  ('Maria Silva', 'maria@groomerflow.com', '(11) 99999-0002', '22222222222', 'Banho e Tosa', 'ativo', (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)),
  ('Pedro Costa', 'pedro@groomerflow.com', '(11) 99999-0003', '33333333333', 'Hidratação', 'ativo', (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1))
ON CONFLICT (cpf) DO NOTHING;

-- ============================================
-- 5. INSERIR AGENDAMENTOS (tabela: appointments)
-- ============================================

INSERT INTO appointments (
  client_id, pet_id, service_id, professional_id, 
  appointment_date, start_time, status, organization_id
) VALUES
  (
    (SELECT id FROM clientes WHERE cpf = '12345678901' LIMIT 1),
    (SELECT id FROM pets WHERE nome = 'Thor' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Banho e Tosa' LIMIT 1),
    (SELECT id FROM professionals WHERE name = 'João Groomer' LIMIT 1),
    NOW() + INTERVAL '1 day' + INTERVAL '10 hours',
    '10:00',
    'pending',
    (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
  ),
  (
    (SELECT id FROM clientes WHERE cpf = '12345678902' LIMIT 1),
    (SELECT id FROM pets WHERE nome = 'Max' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Banho Simples' LIMIT 1),
    (SELECT id FROM professionals WHERE name = 'Maria Silva' LIMIT 1),
    NOW() + INTERVAL '1 day' + INTERVAL '11 hours',
    '11:00',
    'pending',
    (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
  ),
  (
    (SELECT id FROM clientes WHERE cpf = '12345678903' LIMIT 1),
    (SELECT id FROM pets WHERE nome = 'Luna' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Tosa Criativa' LIMIT 1),
    (SELECT id FROM professionals WHERE name = 'Pedro Costa' LIMIT 1),
    NOW() + INTERVAL '2 days' + INTERVAL '14 hours',
    '14:00',
    'pending',
    (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
  ),
  (
    (SELECT id FROM clientes WHERE cpf = '12345678901' LIMIT 1),
    (SELECT id FROM pets WHERE nome = 'Bella' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Hidratação' LIMIT 1),
    (SELECT id FROM professionals WHERE name = 'João Groomer' LIMIT 1),
    NOW() + INTERVAL '2 days' + INTERVAL '15 hours',
    '15:00',
    'pending',
    (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
  ),
  (
    (SELECT id FROM clientes WHERE cpf = '12345678904' LIMIT 1),
    (SELECT id FROM pets WHERE nome = 'Rex' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Tosa Higiênica' LIMIT 1),
    (SELECT id FROM professionals WHERE name = 'Maria Silva' LIMIT 1),
    NOW() + INTERVAL '3 days' + INTERVAL '09 hours',
    '09:00',
    'pending',
    (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
  ),
  (
    (SELECT id FROM clientes WHERE cpf = '12345678905' LIMIT 1),
    (SELECT id FROM pets WHERE nome = 'Mimi' LIMIT 1),
    (SELECT id FROM services WHERE name = 'Banho e Tosa' LIMIT 1),
    (SELECT id FROM professionals WHERE name = 'Pedro Costa' LIMIT 1),
    NOW() + INTERVAL '3 days' + INTERVAL '10 hours',
    '10:00',
    'pending',
    (SELECT id FROM organizations WHERE name = 'GroomerFlow' LIMIT 1)
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. VERIFICAR DADOS INSERIDOS
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

-- Listar agendamentos com detalhes
SELECT 
  a.id,
  c.nome as cliente,
  p.nome as pet,
  s.name as servico,
  pr.name as profissional,
  a.appointment_date,
  a.status
FROM appointments a
LEFT JOIN clientes c ON a.client_id = c.id
LEFT JOIN pets p ON a.pet_id = p.id
LEFT JOIN services s ON a.service_id = s.id
LEFT JOIN professionals pr ON a.professional_id = pr.id
ORDER BY a.appointment_date;
