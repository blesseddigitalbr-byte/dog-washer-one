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

### DELTA 3: CRUD Completo
- [ ] Criar novo cliente
- [ ] Editar cliente
- [ ] Deletar cliente
- [ ] Criar novo pet
- [ ] Editar pet
- [ ] Deletar pet
- [ ] Testes para CRUD operations

### DELTA 4: Integrações
- [ ] Integração com Asaas (pagamentos)
- [ ] Integração com WhatsApp (notificações)
- [ ] Integração com Google Calendar (agendamentos)
- [ ] Webhooks para eventos

## Status Atual
✅ **DELTA 2.1 COMPLETO**
- Database seeded com 5 clientes e 6 pets
- Procedures tRPC criadas e testadas
- Frontend conectado a dados reais
- Todos os testes passando
