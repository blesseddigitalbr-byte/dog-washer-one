-- Criar tabelas faltantes (sem foreign keys para simplificar)

-- Services (Serviços de Grooming)
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration_minutes INTEGER,
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Professionals (Profissionais)
CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  cpf VARCHAR(14) UNIQUE,
  specialization VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Appointments (Agendamentos)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  pet_id UUID NOT NULL,
  service_id UUID,
  professional_id UUID,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_time VARCHAR(5),
  duration_minutes INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  send_email BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_professionals_status ON professionals(status);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_pet_id ON appointments(pet_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Habilitar RLS mas com políticas permissivas
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para leitura pública
CREATE POLICY "Allow public read on services" ON services FOR SELECT USING (true);
CREATE POLICY "Allow public read on professionals" ON professionals FOR SELECT USING (true);
CREATE POLICY "Allow public read on appointments" ON appointments FOR SELECT USING (true);

-- Políticas para escrita autenticada
CREATE POLICY "Allow authenticated insert on services" ON services FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert on professionals" ON professionals FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated insert on appointments" ON appointments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on services" ON services FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on professionals" ON professionals FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update on appointments" ON appointments FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on services" ON services FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on professionals" ON professionals FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete on appointments" ON appointments FOR DELETE USING (auth.role() = 'authenticated');

-- Inserir alguns serviços de exemplo
INSERT INTO services (name, description, price, duration_minutes, category, status) VALUES
('Banho e Tosa', 'Banho completo com tosa higiênica', 89.90, 60, 'grooming', 'active'),
('Tosa Criativa', 'Tosa com design personalizado', 149.90, 90, 'grooming', 'active'),
('Banho Simples', 'Apenas banho sem tosa', 49.90, 30, 'grooming', 'active'),
('Tosa Higiênica', 'Tosa apenas higiênica', 69.90, 45, 'grooming', 'active'),
('Hidratação', 'Tratamento de hidratação profunda', 59.90, 30, 'tratamento', 'active')
ON CONFLICT DO NOTHING;

-- Inserir alguns profissionais de exemplo
INSERT INTO professionals (name, email, phone, cpf, specialization, status) VALUES
('João Groomer', 'joao@example.com', '11999999999', '12345678901', 'Tosa Criativa', 'active'),
('Maria Silva', 'maria@example.com', '11988888888', '98765432101', 'Banho e Tosa', 'active'),
('Pedro Costa', 'pedro@example.com', '11977777777', '55544433322', 'Tosa Higiênica', 'active')
ON CONFLICT DO NOTHING;
