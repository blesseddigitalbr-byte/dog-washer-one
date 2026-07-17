# DWO — Dog Washer One — fundação independente

Esta etapa substitui o login da plataforma original por Supabase Auth e deixa o
caminho principal do sistema independente de serviços de IA.

## O que já está preparado

- login por e-mail e senha no Supabase Auth;
- access token enviado ao backend em `Authorization: Bearer`;
- perfil interno com função, organização e unidade;
- todas as rotas de negócio exigem uma sessão válida;
- consultas de negócio usam o JWT do usuário e respeitam o RLS do Supabase;
- fotos em bucket privado `pet-photos`, com URL assinada por 10 minutos;
- bucket privado `contracts` preparado para contratos em PDF;
- configuração Vite sem plugins ou domínios da Manus.

## Configuração local

1. Copie `.env.example` para `.env`.
2. Preencha URL, chave anônima e chave `service_role` do projeto Supabase.
3. Execute as migrations em `supabase/migrations` na ordem dos nomes.
4. Crie o primeiro usuário no painel de Auth do Supabase.
5. Ajuste o registro desse usuário em `public.profiles`, definindo `role`,
   `organization_id` e `unit_id`.

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` em variável iniciada por `VITE_`, em
repositório Git ou em código enviado ao navegador.

## Isolamento por salão

A migration `202607170001_tenant_rls.sql` adiciona propriedade por organização
e unidade às tabelas operacionais. Ela também:

- força RLS nas tabelas principais e nas tabelas-filhas;
- preenche o tenant de novos registros com base no perfil autenticado;
- rejeita gravações destinadas a outra organização ou unidade;
- impede que consultas comuns usem a chave `service_role`.

Registros antigos que ainda estiverem com `organization_id` vazio ficam
invisíveis aos usuários. Isso é intencional: o backfill deve ser feito pelo
processo controlado de importação, associando cada registro ao salão correto.

## Próxima etapa

Criar a organização, pessoa jurídica e unidade Lux Dog; associar o primeiro
perfil administrativo; gerar uma prévia saneada da planilha e validar contagens
antes da importação definitiva.
