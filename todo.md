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
- [ ] Aplicar padrão de ícones em todo o portal (Clientes, Agendamentos, Alunos, etc)

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
- [ ] Aplicar ícones padronizados em filtros de Agendamentos
- [ ] Aplicar ícones padronizados em filtros de Alunos


## DELTA 8: Correções e Melhorias - Card do Pet e Upload de Foto

### Card do Pet - Resumo Simplificado
- [x] Remover "Peso" da exibição inicial do card
- [x] Exibir apenas: nome, foto, raça (em subtítulo), data de nascimento, cor
- [x] Adicionar botão "Ver Histórico" para exibir atendimentos
- [x] Adicionar botão "Detalhes" para abrir formulário de edição

### Modal Detalhes do Pet
- [ ] Criar modal com todos os dados do cadastro
- [ ] Exibir: nome, foto, raça, porte, pelagem, cor, peso, data nascimento, microchip, espécie, status
- [ ] Exibir: vacinas, vermífugo, doenças/alergias

### Modal Histórico do Pet
- [ ] Exibir histórico de atendimentos com: data, profissional/aluno, procedimento, pacote ativo, saldo
- [ ] Usar dados disponíveis do banco

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
