-- Add registration_code columns to clients and pets tables
ALTER TABLE clients ADD COLUMN registration_code VARCHAR(50) NOT NULL UNIQUE DEFAULT 'CLI-' || LPAD(CAST(EXTRACT(EPOCH FROM NOW()) AS VARCHAR), 10, '0');
ALTER TABLE pets ADD COLUMN registration_code VARCHAR(50) NOT NULL UNIQUE DEFAULT 'PET-' || LPAD(CAST(EXTRACT(EPOCH FROM NOW()) AS VARCHAR), 10, '0');

-- Remove default after creation (PostgreSQL limitation)
ALTER TABLE clients ALTER COLUMN registration_code DROP DEFAULT;
ALTER TABLE pets ALTER COLUMN registration_code DROP DEFAULT;
