# GroomerFlow Backend - Fase 1: Infraestrutura Multi-Tenant

## Schemas Drizzle ORM
- [x] Criar schema `organizations` com campos base
- [x] Criar schema `legal_entities` com FK para organizations
- [x] Criar schema `units` com FK para organizations e legal_entities
- [x] Gerar migrations SQL via `drizzle-kit generate`
- [x] Adicionar FKs reais com references() e cascade delete
- [ ] Aplicar migrations SQL via `webdev_execute_sql` (aguardando credenciais Supabase)

## Context Resolver
- [x] Traduzir `context_resolver.py` para `contextResolver.ts`
- [x] Implementar resolução de `unit_id` com fallback para `salon_id`
- [x] Implementar resolução de `organization_id` com fallback para `franchise_id`
- [x] Implementar resolução de `legal_entity_id` com lookup na tabela `units`

## CRUD de Unidades (tRPC)
- [x] Implementar `units.list` - listar todas as unidades
- [x] Implementar `units.getById` - buscar unidade por ID
- [x] Implementar `units.create` - criar nova unidade (com protectedProcedure)
- [x] Implementar `units.update` - atualizar unidade (com protectedProcedure)
- [x] Implementar `units.deactivate` - desativar unidade (soft delete com protectedProcedure)
- [x] Adicionar isolamento Multi-Tenant com protectedUnitProcedure
- [ ] Implementar validação real de ownership por organizationId (TODO em produção)

## Frontend - Layout e Navegação
- [x] Configurar DashboardLayout com sidebar
- [x] Criar menu lateral com seções: Organizações, Pessoas Jurídicas, Unidades, Clientes, Pets, Financeiro, Asaas
- [x] Implementar toast "Em breve" para itens não implementados
- [x] Criar rota para página de Unidades

## Frontend - Página de Listagem de Unidades
- [x] Criar componente de tabela de Unidades
- [x] Implementar estado de carregamento (skeleton/spinner)
- [x] Implementar estado vazio
- [x] Conectar ao tRPC `units.list`
- [x] Adicionar botão "Nova Unidade"
- [x] Corrigir integração de organizationId (remover dependência de user.id numérico)
- [ ] Implementar contexto de organização real no usuário (TODO em produção)

## Frontend - Formulário de Criação/Edição
- [ ] Criar formulário com campos obrigatórios: nome, código, endereço, telefone, email, gerente
- [ ] Adicionar campos opcionais: informações fiscais (CNPJ, razão social, etc.) e Asaas
- [ ] Implementar validação de formulário
- [ ] Conectar ao tRPC `units.create` e `units.update`
- [ ] Implementar feedback de sucesso/erro

## Configuração PostgreSQL/Supabase
- [x] Reconfigurar Drizzle ORM para PostgreSQL
- [x] Instalar drivers postgres-js
- [x] Criar arquivo .env.local com placeholder DATABASE_URL
- [x] Gerar migrations SQL para PostgreSQL
- [ ] Aplicar migrations quando credenciais Supabase forem fornecidas

## Testes Vitest
- [x] Criar testes para Units Router com mocks de database
- [x] Testar validação de autenticação (protectedProcedure)
- [x] Testar validação de schemas (Zod)
- [x] Testar casos de erro (unidade não encontrada, UUID inválido)
- [x] Todos os testes passando (13 testes)

## Validação Final
- [x] Servidor compilando sem erros
- [x] TypeScript sem erros
- [x] CRUD de Unidades com isolamento Multi-Tenant
- [x] Testes vitest passando
- [ ] Aplicar migrations SQL quando credenciais Supabase forem fornecidas
- [ ] Frontend exibindo painel estático com menu
- [ ] Tabela de Unidades carregando dados
- [ ] Formulário criando/editando unidades com sucesso

## Frontend - Design Premium
- [x] Paleta de cores oficial (Primary #07111E, Secondary #C5A059, Tertiary #8E6E3E)
- [x] Fundo creme (#F5E6D3) em todas as páginas
- [x] ClientsPage com cards premium e grid responsivo
- [x] SchedulePage com design premium
- [x] Dashboard com cards de métricas
- [x] Menu lateral com hover states e active states
- [x] Botões com cores corretas e hover effects
