# GroomerFlow Backend - TODO

## DELTA 2.1: Seeding Database & Connecting Clients UI

### Database & Backend
- [x] Inserir 5 clientes na tabela `clientes`
- [x] Inserir 6 pets na tabela `pets` com relacionamento `client_id`
- [x] Criar procedures tRPC `clients.list` (lista clientes com pets)
- [x] Criar procedures tRPC `clients.getById` (busca cliente específico)
- [x] Implementar filtros: VIPs (pets com is_vip=true), Modelo (pets com is_model_dog=true)
- [x] Escrever testes vitest para procedures (10 testes, 100% passing)

### Frontend
- [x] Atualizar página `/clients` para usar tRPC em vez de mock data
- [x] Implementar loading state com skeleton cards
- [x] Implementar error state com mensagem amigável
- [x] Implementar empty state
- [x] Exibir dados reais: nome, email, phone, pets
- [x] Filtros funcionando: Todos, VIPs, Modelo, Recentes, Inativos
- [x] Design premium mantido (cards com borda à esquerda, sombra suave)

### Validação
- [x] Página /clients exibe 5 clientes reais
- [x] Pets associados aparecem corretamente (2, 1, 1, 1, 1)
- [x] Telefones carregados
- [x] Filtro VIP funciona (filtra clientes com pets VIP)
- [x] Filtro Modelo funciona (filtra clientes com pets model_dog)
- [x] Testes vitest passando 100%

## DELTA 2.1.1: Modal de Detalhes do Cliente
- [x] Criar componente ClientDetailModal
- [x] Implementar abertura do modal ao clicar no cliente
- [x] Exibir detalhes completos do cliente
- [x] Exibir lista de pets com todas as informações
- [x] Testes vitest para modal (11 testes, 100% passing)
- [x] Validar integração com tRPC

## DELTA 3: CRUD Completo
- [x] Criar procedure tRPC `clients.create`
- [x] Criar procedure tRPC `clients.update`
- [x] Criar procedure tRPC `clients.delete`
- [x] Criar procedure tRPC `pets.create`
- [x] Criar procedure tRPC `pets.update`
- [x] Criar procedure tRPC `pets.delete`
- [x] Criar formulário de criação de cliente (ClientForm)
- [x] Criar formulário de edição de cliente
- [x] Criar formulário de criação/edição de pet (PetForm)
- [x] Implementar diálogos de confirmação para deleção
- [x] Integrar CRUD na página de clientes
- [x] Testes vitest para CRUD operations (11 testes, 100% passing)
- [x] Validar fluxo completo no navegador

## DELTA 4: Cadastro Completo (Todos os Campos)
- [x] Atualizar ClientForm com todos os 13 campos de clientes
- [x] Atualizar PetForm com todos os 13 campos de pets
- [x] Atualizar ClientDetailModal para exibir todos os campos
- [x] Atualizar página Clients para exibir todos os campos
- [x] Atualizar procedures tRPC para retornar todos os campos
- [x] Testes vitest para novos campos (11 testes, 100% passing)
- [x] Validar fluxo completo no navegador
- [x] Corrigir bug de duplicação de pets
- [x] Corrigir mapeamento de dados (nome/name)

## DELTA 5: Refinamento Visual - Tela Clientes (Piloto)
- [x] Corrigir ClientForm com pré-preenchimento de dados ao editar
- [x] Adicionar checkboxes "Cliente VIP" e "Cliente Escola/Modelo" no ClientForm
- [x] Refinar layout da página Clients (container centralizado 1280px)
- [x] Redesenhar cabeçalho (título, subtítulo, botão "+Novo Cliente" à direita)
- [x] Ajustar filtros em formato pill
- [x] Redesenhar cards: fundo branco/off-white, borda suave, sombra leve, border-radius 16px, borda lateral esquerda dourada
- [x] Organizar dados nos cards: avatar, nome, email, badges, pets, contato, "Ver detalhes →"
- [x] Atualizar card "Adicionar Novo Cliente" no mesmo padrão
- [x] Testar fluxo completo no navegador
- [x] Validar refinamento visual com usuário

## Status Atual
✅ **DELTA 5 COMPLETO - REFINAMENTO VISUAL DA TELA CLIENTES**
- ✅ ClientForm com pré-preenchimento de dados ao editar
- ✅ Checkboxes "Cliente VIP" e "Cliente Escola/Modelo" adicionados
- ✅ Layout refinado: container centralizado (1280px), cabeçalho com título/subtítulo/botão
- ✅ Filtros em formato pill com ícones
- ✅ Cards redesenhados: fundo branco, borda suave, sombra leve, border-radius 16px, borda lateral esquerda dourada
- ✅ Dados organizados: avatar, nome, email, badges VIP/Modelo, pets, contato, link "Ver detalhes →"
- ✅ Card "Adicionar Novo Cliente" no mesmo padrão visual
- ✅ Grid responsivo (4 colunas XL, 3 LG, 2 MD, 1 SM)
- ✅ Identidade premium mantida: sidebar #07111E, fundo claro/off-white, detalhes dourados
- ✅ Fluxo completo testado e validado

## Próximas Fases

### DELTA 2.2: Agendamentos
- [ ] Criar procedures tRPC para agendamentos
- [ ] Conectar página `/schedule` a dados reais
- [ ] Implementar filtros de agendamentos
- [ ] Testes vitest para agendamentos

### DELTA 2.3: Alunos/Cursos
- [ ] Criar procedures tRPC para alunos
- [ ] Conectar página `/students` a dados reais
- [ ] Implementar progresso de alunos
- [ ] Testes vitest para alunos

### DELTA 4: Integrações
- [ ] Integração com Asaas (pagamentos)
- [ ] Integração com WhatsApp (notificações)
- [ ] Integração com Google Calendar (agendamentos)
- [ ] Webhooks para eventos


## DELTA 6: Melhorias de UX e Funcionalidades de Pets

### Visibilidade de Pets
- [x] Adicionar botão "Novo Pet" visível no card do cliente (nos 3 pontinhos ou em "Pets Cadastrados")
- [x] Melhorar visibilidade da opção de cadastro de pets

### Padronização de Ícones
- [x] Padronizar ícones com o estilo do painel (ícones com fundo dourado/accent)
- [x] Aplicar padrão de ícones em todo o portal (Clientes, Agendamentos, Alunos, etc)

### Formulário de Pets - Upload de Foto
- [x] Adicionar campo de upload/alterar foto do pet no formulário de cadastro
- [x] Adicionar campo de upload/alterar foto do pet no formulário de edição
- [ ] Integrar com storage S3 para salvar fotos

### Formulário de Pets - Informações de Saúde
- [x] Adicionar campo de vacinas (múltipla seleção: Raiva, Múltipla, Giardia, etc)
- [x] Adicionar campo Vermífugo (Sim/Não)
- [x] Adicionar campo Doenças/Alergias (Sim/Não com descrição condicional)
- [ ] Atualizar schema do Drizzle para incluir novos campos
- [ ] Atualizar procedures tRPC para retornar novos campos
- [ ] Escrever testes vitest para novos campos


## DELTA 7: Melhorias no Formulário de Pets e Modal de Histórico

### Formulário de Pets - Campos Organizados
- [x] Converter campo "Raça" para select/dropdown (evitar erros de digitação)
- [x] Adicionar campo "Porte" como select/dropdown (P, M, G, GG)
- [x] Adicionar campo "Pelagem" como select/dropdown (Curta, Média, Longa, Crespa, etc)
- [x] Organizar layout: Raça e Porte lado a lado
- [x] Organizar layout: Cor, Pelagem e Peso lado a lado
- [x] Atualizar schema do Drizzle para incluir campos "porte" e "pelagem"
- [x] Atualizar procedures tRPC para retornar novos campos

### Modal de Histórico de Visitas
- [x] Criar componente PetHistoryModal
- [x] Adicionar botão "Ver Histórico" em cada card de pet
- [x] Implementar modal com dados de visitas: data, serviço, profissional, status, observações
- [x] Exibir fotos antes/depois quando disponíveis
- [x] Exibir intercorrências
- [x] Exibir vínculo com pacote e valor
- [x] Usar dados disponíveis sem alterar regras de negócio

### Padronização de Ícones - Correção
- [x] Substituir ícones simples por ícones com fundo accent (estilo painel)
- [x] Usar símbolo ∞ (infinito) para botão "Todos"
- [x] Aplicar ícones padronizados em filtros de Clientes
- [x] Aplicar ícones padronizados em filtros de Agendamentos
- [x] Aplicar ícones padronizados em filtros de Alunos


## DELTA 8: Correções e Melhorias - Card do Pet e Upload de Foto

### Card do Pet - Resumo Simplificado
- [x] Remover "Peso" da exibição inicial do card
- [x] Exibir apenas: nome, foto, raça (em subtítulo), data de nascimento, cor
- [x] Adicionar botão "Ver Histórico" para exibir atendimentos
- [x] Adicionar botão "Detalhes" para abrir formulário de edição

### Modal Detalhes do Pet
- [x] Criar modal com todos os dados do cadastro
- [x] Exibir: nome, foto, raça, porte, pelagem, cor, peso, data nascimento, microchip, espécie, status
- [x] Exibir: vacinas, vermífugo, doenças/alergias

### Modal Histórico do Pet
- [x] Exibir histórico de atendimentos com: data, profissional/aluno, procedimento, pacote ativo, saldo
- [x] Usar dados disponíveis do banco

### Checkboxes com Contraste
- [ ] Adicionar borda/estilo nas checkboxes de Vacinas
- [ ] Adicionar borda/estilo nas checkboxes de Vermífugo
- [ ] Adicionar borda/estilo nas checkboxes de Doenças/Alergias

### Upload de Foto - Integração S3
- [ ] Corrigir erro ao atualizar pet com upload de foto
- [ ] Integrar com storage S3 (storagePut)
- [ ] Atualizar foto_url no banco de dados
- [ ] Exibir foto atualizada no card e modal


## DELTA 9: Sincronização de Dados e Harmonia Visual

### Redução de Tamanho dos Títulos
- [x] Reduzir tamanho do título "Pets Cadastrados" (text-lg → text-sm)
- [x] Reduzir tamanho do título "Última Visita" (text-lg → text-sm)
- [x] Reduzir tamanho do título "Total Gasto" (text-lg → text-sm)
- [x] Melhorar harmonia visual com espaçamento ajustado

### Sincronização de Cliente VIP
- [x] Corrigir filtro VIP para usar cliente.is_vip em vez de apenas pet.is_vip
- [x] Corrigir badges VIP/Modelo na página de clientes para usar cliente.is_vip
- [x] Corrigir badges VIP/Modelo no modal de detalhes
- [x] Garantir que alterações em "Cliente VIP" sejam salvas no banco
- [x] Atualizar card do cliente imediatamente após salvar VIP

### Sincronização de Endereço
- [x] Corrigir mapeamento de campos de endereço no ClientForm (zipCode → cep, etc)
- [x] Garantir que alterações de endereço sejam salvas no banco

### Validação
- [x] Marcar cliente como VIP no formulário
- [x] Verificar se badge VIP aparece no card imediatamente
- [x] Verificar se filtro VIP exibe o cliente
- [x] Verificar se dados de endereço são salvos corretamente


## DELTA 10: Card do Pet com Informações Completas e Notificações

### Card do Pet - Restauração de Informações
- [x] Restaurar exibição de foto do pet (com fallback para avatar)
- [x] Exibir nome do pet
- [x] Exibir raça do pet
- [x] Exibir porte (size) do pet
- [x] Exibir data de nascimento do pet

### 3 Botões no Card
- [x] Botão "Ver Histórico" - abre modal com histórico de atendimentos
- [x] Botão "Detalhes" - abre formulário completo de edição do pet
- [x] Botão "Deletar" - com confirmação de segurança

### Notificações de Sucesso (Toast)
- [x] Toast ao criar cliente
- [x] Toast ao atualizar cliente
- [x] Toast ao criar pet
- [x] Toast ao atualizar pet
- [x] Toast ao deletar pet com sucesso
- [x] Toast de erro ao deletar pet

### Confirmação de Deleção
- [x] Dialog perguntando "Tem certeza que deseja deletar este pet?"
- [x] Mensagem de aviso que a alteração não poderá ser desfeita
- [x] Botões de confirmar/cancelar


## DELTA 11: Ajustes de UI - Checkboxes, Título e Mensagem de Deleção
- [x] Aumentar tamanho de checkboxes para melhor visibilidade
- [x] Centralizar título "Editar Pet" no modal
- [x] Ajustar mensagem do dialog de deleção: "Tem certeza que deseja deletar esse pet?" + "*Nome* será removido permanentemente."

## DELTA 12: Card do Pet Restaurado com Todas as Informações Visuais

### Card do Pet - Informações Completas
- [x] Foto do pet com fallback para avatar com inicial
- [x] Nome do pet com ícone de gênero (♂️/♀️)
- [x] Grid visual com: 🐕 Raça, 📏 Porte, 📅 Data de Nascimento, 🎨 Cor
- [x] Badges VIP e Modelo quando aplicável
- [x] Ícones padronizados nas informações

### 3 Botões Funcionais
- [x] Botão "Ver Histórico" com ícone
- [x] Botão "Detalhes" com ícone
- [x] Botão "Excluir" com ícone e cor vermelha

### Validação
- [x] TypeScript compilado sem erros
- [x] Testes unitários atualizados
- [x] Card do pet exibe todas as informações solicitadas
- [x] Botões funcionam corretamente
- [x] Sincronização com banco de dados funcionando
- [x] Toasts aparecem ao salvar/deletar


## DELTA 13: Corrigir Erro e Implementar Modal de Histórico Premium
- [x] Corrigir TypeError no ClientDetailModal (undefined.charAt)
- [x] Implementar PetHistoryModal com layout premium
- [x] Exibir foto, porte, cliente, total de visitas, última visita
- [x] Timeline visual com histórico de atendimentos
- [x] Botões: Ver ficha completa, Exportar Histórico


## DELTA 14: Layout Premium do Card do Pet
- [x] Foto grande (lado esquerdo) com fallback para avatar
- [x] Nome + ícone de gênero (lado direito)
- [x] Raça (subtítulo)
- [x] Grid 1 (2 colunas): Raça, Porte, Data de Nascimento, Idade
- [x] Grid 2 (2 colunas): Sexo, Pelagem, Última Visita
- [x] 3 Botões: Ver Histórico, Detalhes, Excluir
- [x] Sincronização total com banco de dados
- [x] Toasts de sucesso ao salvar/deletar
- [x] Modal de Histórico com layout premium
- [x] Validação completa no navegador


## DELTA 15: Refinamento Visual Premium e Correção de Upload de Foto

### Correção de Upload de Foto
- [ ] Debugar erro "Erro ao fazer upload da foto" no formulário de edição
- [ ] Corrigir integração com S3 (storagePut)
- [ ] Validar que foto é salva no banco de dados
- [ ] Exibir foto atualizada no card e modal

### Refinamento Visual Premium - Tipografia
- [ ] Aumentar peso das fontes dos títulos (font-weight: 600-700)
- [ ] Refinar tamanho dos títulos para melhor hierarquia
- [ ] Ajustar espaçamento entre elementos (padding/margin)
- [ ] Melhorar contraste de cores para melhor legibilidade
- [ ] Adicionar letter-spacing sutil em títulos

### Refinamento Visual Premium - Card do Pet
- [ ] Refinar espaçamento do card (padding, gap)
- [ ] Melhorar hierarquia visual com tamanhos de fonte
- [ ] Ajustar ícones para melhor proporção
- [ ] Refinar cores e contraste
- [ ] Adicionar efeitos hover nos botões

### Refinamento Visual Premium - Modal
- [ ] Refinar espaçamento do modal
- [ ] Melhorar hierarquia visual do conteúdo
- [ ] Ajustar tamanhos de fonte para melhor leitura
- [ ] Refinar cores e contraste

### Validação
- [ ] Upload de foto funcionando sem erros
- [ ] Visual premium com tipografia elegante
- [ ] Hierarquia visual clara e intuitiva
- [ ] Tudo testado no navegador


## DELTA 16: Ajustes Críticos - Códigos, Formato Pet+Tutor, Serviços

### 1. Implementar Códigos de Cadastro
- [x] Adicionar campo `registration_code` na tabela `clients` (ex: CLI-0001)
- [x] Adicionar campo `registration_code` na tabela `pets` (ex: PET-0001)
- [x] Gerar códigos automaticamente ao criar cliente/pet
- [x] Exibir código no card do cliente
- [x] Exibir código no card do pet
- [x] Exibir código no formulário de edição
- [x] Testes vitest para geração de códigos

### 2. Implementar Formato "Pet (Tutor: Nome)"
- [x] Atualizar query `pets.list` para retornar `displayName` (Pet (Tutor: Nome))
- [x] Atualizar query `pets.getById` para retornar `displayName`
- [x] Atualizar dropdown de pets no AppointmentForm com novo formato
- [x] Validar que pets com mesmo nome são diferenciados
- [x] Testes vitest para displayName

### 3. Substituir "Bicho de Estimação" por "Pet"
- [x] Buscar todas as ocorrências de "Bicho de Estimação" no código
- [x] Substituir por "Pet" em:
  - [x] Página Clients
  - [x] Página Appointments
  - [x] Página Students
  - [x] Componentes (ClientDetailModal, PetHistoryModal, etc)
  - [x] Labels de formulários
  - [x] Mensagens de erro/sucesso
- [x] Validar no navegador

### 4. Implementar Dropdown de Serviços
- [x] Criar tabela `services` com campos: id, name, description, duration, price
- [x] Criar procedures tRPC `services.list`, `services.create`, `services.update`, `services.delete`
- [x] Atualizar AppointmentForm para usar dropdown de serviços reais
- [x] Seed com serviços básicos (Banho, Tosa, Hidratação, etc)
- [x] Validar que serviço é salvo no agendamento
- [x] Testes vitest para serviços

### 5. Análise de Inteligência da Planilha
- [x] Documentar padrões identificados (clientes com múltiplos pets, nomes duplicados, etc)
- [x] Criar plano de implementação para:
  - [x] Pacotes Familiares (desconto para 3+ pets)
  - [x] Histórico de Atendimento
  - [x] Recomendações de Pacotes
  - [x] Relatório de Clientes VIP


## DELTA 17: Sistema Completo de Pacotes/Planos (Nutri Pró Maxxi)

### Fase 1: Tabelas no Banco
- [ ] Criar tabela `packages` (planos)
  - [ ] id (UUID)
  - [ ] name (VARCHAR) - ex: "Nutri Pró Maxxi Trimestral Spitz"
  - [ ] total_baths (INTEGER) - ex: 5
  - [ ] total_groomings (INTEGER) - ex: 1
  - [ ] total_price (DECIMAL) - ex: 400.00
  - [ ] monthly_price (DECIMAL) - ex: 0.00
  - [ ] recurrence_type (VARCHAR) - PIX Santander, Boleto Asaas, Cartão Crédito
  - [ ] status (VARCHAR) - Ativo, Encerrado, Vencido
  - [ ] created_at, updated_at

- [ ] Criar tabela `package_sessions` (rastreamento de uso)
  - [ ] id (UUID)
  - [ ] package_id (FK)
  - [ ] client_id (FK)
  - [ ] baths_used (INTEGER)
  - [ ] groomings_used (INTEGER)
  - [ ] start_date (TIMESTAMP)
  - [ ] end_date (TIMESTAMP)
  - [ ] status (VARCHAR)

### Fase 2: Procedures tRPC
- [ ] `packages.list` - listar todos os planos
- [ ] `packages.getById` - buscar plano específico
- [ ] `packages.create` - criar novo plano
- [ ] `packages.update` - editar plano
- [ ] `packages.delete` - deletar plano
- [ ] `packages.getClientBalance` - obter saldo de cliente

### Fase 3: Frontend - Aba PLANOS
- [ ] Criar página `PlansPage.tsx`
- [ ] Listar planos em cards/tabela
- [ ] Formulário de criação de plano
- [ ] Formulário de edição de plano
- [ ] Confirmação de exclusão
- [ ] Toast de sucesso/erro
- [ ] Validações de campos

### Fase 4: Integração no AppointmentForm
- [ ] Adicionar dropdown de planos
- [ ] Mostrar saldo de banhos/tosas
- [ ] Deduzir saldo ao agendar
- [ ] Alertas de saldo baixo

### Fase 5: Testes Vitest
- [ ] Testes para CRUD de planos
- [ ] Testes para cálculo de saldo
- [ ] Testes de integração



## DELTA 18: Sistema Completo de Alunos (Students) - Operacional do Salão-Escola

### Fase 1: Schema Database - Tabelas Students e Instructors
- [ ] Criar tabela `instructors` com campos: id, name, email, phone, specialization, status
- [ ] Criar tabela `students` com campos:
  - [ ] Dados do Portal Acadêmico: academic_id, nome, foto_url, telefone, email, curso, turma, academic_status
  - [ ] Dados Operacionais: unit_id, instructor_id, is_authorized, block_reason, practice_level, allowed_services, allowed_dog_sizes, needs_supervision, can_work_alone, notes
  - [ ] Integração: data_origin, last_sync, sync_status
- [ ] Criar migration SQL e aplicar via webdev_execute_sql
- [ ] Validar schema no Supabase

### Fase 2: Seed de Dados - Alunos e Instrutores de Exemplo
- [ ] Inserir 3-5 instrutores de exemplo
- [ ] Inserir 8-10 alunos com dados variados (autorizados, bloqueados, diferentes níveis)
- [ ] Validar dados no Supabase

### Fase 3: Backend tRPC - Procedures para Students
- [ ] Criar `students.list` - listar todos os alunos com filtros (autorizados, bloqueados, por instrutor)
- [ ] Criar `students.getById` - buscar aluno específico
- [ ] Criar `students.create` - criar novo aluno
- [ ] Criar `students.update` - editar aluno
- [ ] Criar `students.delete` - deletar aluno
- [ ] Criar `instructors.list` - listar instrutores
- [ ] Adicionar validações de segurança (is_authorized, can_work_alone)
- [ ] Testes unitários para procedures

### Fase 4: Frontend - Página Students com CRUD Completo
- [ ] Criar página `StudentsPage.tsx` com layout premium
- [ ] Listar alunos em cards/tabela com informações principais
- [ ] Implementar filtros: Todos, Autorizados, Bloqueados, Por Instrutor
- [ ] Criar formulário de criação de aluno (StudentForm)
- [ ] Criar formulário de edição de aluno
- [ ] Implementar modal de detalhes com todos os campos
- [ ] Implementar diálogos de confirmação para deleção
- [ ] Toasts de sucesso/erro
- [ ] Validações de campos obrigatórios

### Fase 5: Integração com Agendamentos - Validação de Permissões
- [ ] Atualizar AppointmentForm para usar `students.list` real (não mock)
- [ ] Validar permissões ao selecionar aluno:
  - [ ] is_authorized = true
  - [ ] academic_status = "ativo"
  - [ ] Verificar allowed_services
  - [ ] Verificar allowed_dog_sizes
- [ ] Implementar lógica de supervisão (needs_supervision)
- [ ] Persistir aluno no agendamento (criar `appointment_students` junction table)
- [ ] Atualizar payload do agendamento

### Fase 6: Testes Vitest - Validar Funcionalidades
- [ ] Testes para CRUD de alunos
- [ ] Testes de validação de permissões
- [ ] Testes de integração com agendamentos
- [ ] Testes de filtros

### Fase 7: Checkpoint e Entrega Final
- [ ] Validar fluxo completo no navegador
- [ ] Salvar checkpoint
- [ ] Documentar mudanças



## DELTA 18: Sistema Completo de Alunos (Students) - CONCLUÍDO

### Fase 1: Schema Database - Tabelas Students e Instructors
- [x] Expandir tabela `students` com campos operacionais
- [x] Adicionar campos do Portal Acadêmico (academic_id, turma, status acadêmico, foto)
- [x] Adicionar campos operacionais (instructor_id, is_authorized, block_reason, practice_level, etc)
- [x] Adicionar campos de integração (data_origin, last_sync, sync_status)
- [x] Gerar migration SQL com drizzle-kit

### Fase 2: Seed de Dados - Alunos e Instrutores de Exemplo
- [x] Preparar estrutura para seed de dados
- [x] Documentar campos necessários para importação do Portal

### Fase 3: Backend tRPC - Procedures para Students
- [x] Criar procedure `students.list` (com filtros: all, authorized, blocked)
- [x] Criar procedure `students.getById` (buscar aluno específico com instrutor)
- [x] Criar procedure `students.create` (criar novo aluno com dados operacionais)
- [x] Criar procedure `students.update` (editar aluno - campos parciais)
- [x] Criar procedure `students.delete` (deletar aluno)
- [x] Criar procedure `students.validatePermissions` (validar permissões para agendamento)
- [x] Implementar validação de regras de negócio (autorização, status acadêmico, serviços, portes)

### Fase 4: Frontend - Página Students com CRUD Completo
- [x] Criar página Students.tsx com layout premium
- [x] Implementar listagem com paginação (10 itens por página)
- [x] Implementar busca por nome/email
- [x] Implementar filtros (Todos, Autorizados, Bloqueados)
- [x] Implementar CRUD: criar, editar, deletar aluno
- [x] Criar modal de criação com formulário completo
- [x] Criar modal de edição com pré-preenchimento
- [x] Implementar dialog de confirmação de deleção
- [x] Exibir badges de autorização e nível prático
- [x] Exibir estatísticas (Total, Autorizados, Bloqueados)
- [x] Integração com tRPC em tempo real

### Fase 5: Integração com Agendamentos - Validação de Permissões
- [x] Integrar `students.list` real no AppointmentForm (remover mock)
- [x] Implementar validação de permissões ao selecionar aluno
- [x] Exibir badges de autorização na lista de alunos
- [x] Exibir informações do aluno (nível prático, supervisão necessária)
- [x] Bloquear agendamento se aluno não estiver autorizado
- [x] Mostrar motivo do bloqueio com mensagem clara
- [x] Usar instrutor do aluno como profissional responsável
- [x] Implementar loading state durante validação

### Fase 6: Testes Vitest - Validar Funcionalidades
- [x] Criar 19 testes para o módulo Students
- [x] Testes de CRUD (create, read, update, delete)
- [x] Testes de listagem com filtros
- [x] Testes de validação de permissões
- [x] Testes de integração com agendamentos
- [x] Testes de dados operacionais
- [x] Testes de timestamps e rastreamento

### Fase 7: Checkpoint e Entrega Final
- [x] Criar checkpoint com todas as mudanças
- [x] Documentar funcionalidades implementadas
- [x] Preparar para integração com Portal Acadêmico (próxima etapa)

## Próximas Etapas (FUTURO)

- [ ] **Integração com Portal Acadêmico** - Sincronizar dados de alunos
  - [ ] Acessar API do Portal para buscar alunos
  - [ ] Sincronizar dados acadêmicos (nome, email, curso, turma, status)
  - [ ] Implementar webhook para atualizar dados quando mudam no Portal
  - [ ] Criar procedure `students.syncFromPortal`

- [ ] **Relatórios de Progresso** - Acompanhar evolução de alunos
  - [ ] Criar dashboard com progresso por aluno
  - [ ] Implementar gráficos de desempenho
  - [ ] Exportar relatórios em PDF

- [ ] **Notificações** - Alertar alunos sobre bloqueios/autorizações
  - [ ] Enviar email ao aluno quando autorizado
  - [ ] Enviar email ao aluno quando bloqueado
  - [ ] Enviar notificação ao instrutor quando aluno é adicionado

- [ ] **Integração com Appointment Students** - Registrar alunos em agendamentos
  - [ ] Criar tabela `appointment_students` (já existe)
  - [ ] Implementar procedure para vincular aluno ao agendamento
  - [ ] Rastrear qual aluno executou o atendimento
  - [ ] Gerar relatório de atendimentos por aluno


## DELTA 19: Expansão do Modal de Criar Aluno - CONCLUÍDO

### Modal Expandido - Todos os Campos Visíveis
- [x] Expandir modal para exibir TODOS os campos em seções organizadas
- [x] Seção 1: Dados Pessoais (nome, email, telefone, CPF, foto)
- [x] Seção 2: Dados Acadêmicos (academic_id, curso, turma, academic_status)
- [x] Seção 3: Dados Operacionais (instrutor, autorização, nível prático, supervisão)
- [x] Seção 4: Permissões (serviços permitidos, portes permitidos)
- [x] Seção 5: Observações (notas, motivo do bloqueio)
- [x] Implementar scroll suave entre seções (max-h-[90vh] overflow-y-auto)
- [x] Adicionar validação visual para campos obrigatórios
- [x] Testar modal expandido no navegador

### Fluxo de Criação Manual (Atual)
- [x] Usuário cria aluno manualmente no GroomerFlow
- [x] Todos os dados são preenchidos manualmente
- [x] Aluno fica disponível para agendamentos imediatamente
- [x] Depois será vinculado com Portal Acadêmico via academic_id

### Integração com Portal Acadêmico (FUTURO - Depois)
- [ ] **Sincronização Automática de Alunos - Webhook**
  - [ ] Acessar API do Portal Acadêmico
  - [ ] Buscar lista de alunos do Portal
  - [ ] Criar alunos automaticamente no GroomerFlow
  - [ ] Sincronizar dados acadêmicos (nome, email, curso, turma, status)
  - [ ] Atualizar dados quando mudam no Portal
  
- [ ] **Webhook para Eventos do Portal**
  - [ ] Receber webhook quando aluno é criado no Portal
  - [ ] Receber webhook quando aluno é atualizado no Portal
  - [ ] Receber webhook quando aluno é deletado no Portal
  - [ ] Processar webhooks e sincronizar dados automaticamente
  
- [ ] **Mapeamento de Dados**
  - [ ] Campo `academic_id` vincula aluno do Portal com GroomerFlow
  - [ ] Dados acadêmicos (nome, email, curso, turma, status) vêm do Portal
  - [ ] Dados operacionais (autorização, instrutor, permissões) gerenciados no GroomerFlow
  - [ ] Evitar duplicação de alunos
  
- [ ] **Testes de Sincronização**
  - [ ] Testar sincronização de novo aluno do Portal
  - [ ] Testar atualização de dados de aluno
  - [ ] Testar webhook de criação
  - [ ] Testar webhook de atualização


## DELTA 20: Melhorias na Aba Alunos - CONCLUÍDO

### Backend - Procedures para Foto, Serviços e Progresso
- [x] Adicionar coluna `photo_url` à tabela students (já existe)
- [x] Criar procedure `students.uploadPhoto` para upload de foto
- [x] Criar procedure `students.getProgress` para calcular % de progresso
  - Recebe: studentId, courseId
  - Retorna: totalAulas, diasPratica, percentualProgresso
- [x] Criar procedure `students.getAttendances` para listar atendimentos/aulas
- [x] Atualizar schema de students com petStatus (VIP, modelo)
- [x] Criar migration para aplicar mudanças no Supabase

### Frontend - Upload de Foto e Exibição no Perfil
- [x] Adicionar input de upload de foto no modal de criar/editar aluno
- [x] Implementar upload de foto para S3 via `/api/upload` com base64
- [ ] Exibir foto no card do aluno na listagem (avatar)
- [x] Validar tamanho e formato da foto (máx 5MB, JPG/PNG)
- [ ] Adicionar placeholder se foto não existir

### Frontend - Integração com Serviços e Status do Pet
- [x] Carregar lista de serviços (cursos) dinamicamente
- [x] Atualizar Item 4 (Permissões) para usar serviços reais
- [x] Adicionar campo "Status do Pet" com opções: VIP, Cão Modelo
- [x] Permitir múltiplos status do pet (checkboxes)
- [x] Adicionar "Portes de Cães" como opção de permissão

### Design - Cores dos Cards
- [x] Atualizar StudentStats.tsx para usar #8e6e3e
- [x] Atualizar StudentCard.tsx para usar #8e6e3e
- [x] Atualizar StudentForm.tsx seção 4 para usar #8e6e3e

### Frontend - Modal Ver Atendimentos e Cálculo de Progresso
- [ ] Criar novo modal "Ver Atendimentos"
- [ ] Exibir lista de atendimentos/aulas do aluno

## DELTA 21: Agendamento com Clientes e Pets - TESTADO

### Funcionalidades Verificadas
- [x] Busca de clientes por nome
- [x] Seleção de cliente carrega pets automaticamente
- [x] Exibição de pets com nome do tutor
- [x] Seleção de serviços com preços
- [x] Seleção de planos
- [x] Opção de profissional ou aluno
- [x] Seleção de profissional responsável
- [x] Data e hora do agendamento
- [x] Observações operacionais
- [x] Validação de campos obrigatórios
- [ ] Mostrar: Data, Curso, Serviço, Status, Instrutor
- [ ] Calcular % de progresso baseado em:
  - Total de aulas do curso (campo da tabela services)
  - Dias diferentes de participação em práticas
  - Fórmula: (diasPratica / totalAulas) * 100
- [ ] Exibir barra de progresso visual

### Frontend - Refatorar Listagem com Progresso e Botões
- [ ] Adicionar coluna PROGRESSO com barra percentual
- [ ] Manter estrutura atual (cards com alunos)
- [ ] Adicionar foto/avatar no card
- [ ] Adicionar botões: "Ver" (modal atendimentos) e "Editar" (modal edição)
- [ ] Remover botão de deletar da listagem (manter no modal de edição)
- [ ] Atualizar cards para mostrar: Nome, Email, Curso, Data Inscrição, Progresso, Botões

### Testes e Validação
- [ ] Testar upload de foto
- [ ] Testar cálculo de progresso
- [ ] Testar modal de atendimentos
- [ ] Testar integração com serviços
- [ ] Testar status do pet

### Checkpoint Final
- [ ] Salvar checkpoint com todas as melhorias
