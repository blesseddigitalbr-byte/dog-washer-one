# CRM e WhatsApp oficial — piloto supervisionado

## Objetivo

Conectar o Dog Washer One à WhatsApp Cloud API oficial da Meta para que Salão e Escola atendam em uma caixa de entrada comum, sem automação por WhatsApp Web e sem acesso financeiro.

O piloto começa sempre supervisionado: o sistema recebe mensagens e pode preparar respostas, mas uma pessoa aprova cada envio. Autonomia só deve ser liberada por intenção, público e nível de risco depois que houver histórico auditável.

## Controles já implementados

- Credenciais somente no servidor; nunca usar variáveis `VITE_*` para segredos.
- Verificação do webhook por `WHATSAPP_VERIFY_TOKEN`.
- Validação `X-Hub-Signature-256` com o segredo do aplicativo Meta.
- Envio de teste disponível apenas para usuário autenticado com papel `owner`, `admin` ou `manager`.
- Destinatários do piloto limitados por lista no servidor.
- Conteúdo de mensagens não é escrito em logs da aplicação.
- `WHATSAPP_TEST_MODE=true` mantém o endpoint de teste isolado da operação normal.

## Variáveis da Vercel

Configurar em Project Settings > Environment Variables, inicialmente apenas no ambiente Preview:

```text
WHATSAPP_ACCESS_TOKEN=<token da Meta>
WHATSAPP_PHONE_NUMBER_ID=<identificador do número>
WHATSAPP_VERIFY_TOKEN=<frase aleatória criada para o webhook>
WHATSAPP_APP_SECRET=<segredo do aplicativo Meta>
WHATSAPP_GRAPH_API_VERSION=<versão exibida pela configuração atual da Meta>
WHATSAPP_TEST_RECIPIENTS=5561999885480,5561983038237
WHATSAPP_TEST_MODE=true
```

Nunca colar tokens em chat, issue, commit, captura de tela ou código-fonte. Após trocar variáveis na Vercel, fazer novo deploy do Preview.

## Configuração do webhook na Meta

- URL do callback: `https://<preview-vercel>/api/whatsapp/webhook`
- Token de verificação: exatamente o valor de `WHATSAPP_VERIFY_TOKEN`
- Objeto: WhatsApp Business Account
- Campo inicial: `messages`

O GET confirma o desafio da Meta. O POST só aceita eventos cuja assinatura tenha sido produzida pelo segredo correto do aplicativo.

## Roteiro de teste

1. Usar o número de teste fornecido pela Meta; não migrar os números operacionais ainda.
2. Autorizar Meriely e Flávio como destinatários de teste.
3. Abrir DWO > CRM e Agentes > WhatsApp oficial.
4. Confirmar o selo `Meta conectada`.
5. Enviar a mensagem padrão para um único destinatário autorizado.
6. Conferir o identificador `wamid` retornado e o recebimento no aparelho.
7. Responder pelo aparelho para validar a chegada ao webhook.
8. Somente depois criar a persistência e a caixa de entrada do CRM.

## Modelo de dados planejado

As tabelas ainda não foram criadas. A migration deverá ser gerada pela CLI oficial do Supabase e validada antes de ser aplicada.

- `crm_contacts`: identidade do contato, público Salão/Escola, consentimento e vínculo opcional com cliente/aluno.
- `crm_opportunities`: etapa do Kanban, responsável, oferta, próxima ação e origem.
- `whatsapp_conversations`: número empresarial, contato, janela de atendimento e estado.
- `whatsapp_messages`: identificador Meta, direção, tipo, conteúdo normalizado, status e timestamps.
- `agent_suggestions`: resposta sugerida, regras utilizadas, aprovação/rejeição e aprovador.
- `crm_audit_events`: movimentações de pipeline, envios, agendamentos e alterações sensíveis.

Todas precisam de `organization_id` e `unit_id`, RLS forçada, políticas por operação e grants explícitos. O webhook gravará pelo servidor com service role; o navegador acessará apenas registros permitidos pelas políticas de unidade.

## Critérios para usar números reais

- Recebimento e envio testados em Preview.
- Persistência idempotente por identificador da Meta.
- RLS e isolamento entre unidades testados.
- Fila de falhas e reprocessamento definidos.
- Consentimento e descadastro registrados.
- Templates aprovados para reativação e lembretes iniciados pela empresa.
- Limite de frequência e bloqueio de duplicidade.
- Operadores treinados para assumir manualmente a conversa.
- Backup e plano de reversão documentados.

## O que não fazer

- Não automatizar WhatsApp Web com navegador ou extensão.
- Não enviar prospecção em massa para listas compradas ou coletadas sem consentimento.
- Não colocar token Meta no frontend.
- Não permitir que o agente confirme preço, desconto, pacote ou agenda fora das regras cadastradas.
- Não migrar simultaneamente os números de Salão e Escola; validar um fluxo por vez.

