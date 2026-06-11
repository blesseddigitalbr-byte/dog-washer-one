# Análise Exata das Tabelas - Baseado nas Screenshots

## Tabela: clientes
**Colunas (conforme screenshot):**
- id (uuid) - PRIMARY KEY
- nome (text) - NON-NULLABLE
- cpf (text) - NON-NULLABLE
- phone (text) - NON-NULLABLE
- email (text) - NULLABLE
- data_nascimento (date) - NULLABLE
- origem (text) - NULLABLE
- telefone_nome (text) - NULLABLE
- cep (text) - NULLABLE
- logradouro (text) - NULLABLE
- numero (text) - NULLABLE
- bairro (text) - NULLABLE
- cidade (text) - NULLABLE
- uf (text) - NULLABLE
- complemento (text) - NULLABLE
- foto_uf (text) - NULLABLE
- created_at (timestamptz) - NON-NULLABLE
- is_vip (bool) - NULLABLE
- is_model_dog (bool) - NULLABLE
- organization_id (uuid) - FOREIGN KEY, NULLABLE

## Tabela: pets
**Colunas (conforme screenshot):**
- id (uuid) - PRIMARY KEY
- client_id (uuid) - FOREIGN KEY, NON-NULLABLE
- name (text) - NON-NULLABLE
- breed (text) - NULLABLE
- data_nascimento (date) - NULLABLE
- sexo (text) - NULLABLE
- cor_pelagem (text) - NULLABLE
- weight (text) - NULLABLE
- is_vip (bool) - NULLABLE
- is_model_dog (bool) - NULLABLE
- possui_parasitas (bool) - NULLABLE
- alergias (text) - NULLABLE
- notes (text) - NULLABLE
- foto_url (text) - NULLABLE
- created_at (timestamptz) - NULLABLE
- organization_id (uuid) - FOREIGN KEY, NULLABLE

## Tabela: appointments
**Colunas (conforme screenshot):**
- id (uuid) - PRIMARY KEY
- client_id (uuid) - FOREIGN KEY, NON-NULLABLE
- pet_id (uuid) - FOREIGN KEY, NON-NULLABLE
- service_id (uuid) - FOREIGN KEY, NULLABLE
- professional_id (uuid) - FOREIGN KEY, NULLABLE
- appointment_date (timestamptz) - NON-NULLABLE
- start_time (varchar) - NULLABLE
- duration_minutes (int4) - NULLABLE
- status (varchar) - NULLABLE
- notes (text) - NULLABLE
- send_email (bool) - NULLABLE
- created_at (timestamptz) - NON-NULLABLE
- updated_at (timestamptz) - NULLABLE
- organization_id (uuid) - FOREIGN KEY, NULLABLE

## Tabela: services
**Colunas (conforme screenshot):**
- id (uuid) - PRIMARY KEY
- name (varchar) - NON-NULLABLE
- description (text) - NULLABLE
- price (numeric) - NON-NULLABLE
- duration_minutes (int4) - NULLABLE
- category (varchar) - NULLABLE
- status (varchar) - NULLABLE
- (NÃO TEM organization_id)

## Tabela: professionals
**Colunas (conforme screenshot):**
- id (uuid) - PRIMARY KEY
- name (varchar) - NON-NULLABLE
- email (varchar) - NULLABLE
- phone (varchar) - NULLABLE
- cpf (varchar) - NULLABLE
- specialization (varchar) - NULLABLE
- status (varchar) - NULLABLE
- (NÃO TEM organization_id)
