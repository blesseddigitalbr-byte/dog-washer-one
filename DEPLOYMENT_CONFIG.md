# DWO — configuração de homologação Hostinger (12/10/2026)

## Configuração atual

Somente o repositório `blesseddigitalbr-byte/dog-washer-one`, branch
`codex/lux-dog-release-safety`. Criar uma aplicação Node isolada em endereço
temporário de homologação; não substituir o site Lux Dog nem o portal acadêmico.
Se a Hostinger oferecer somente hospedagem estática/PHP, parar: o DWO exige Node.

- Diretório raiz: raiz do repositório (contém package.json), não a pasta `app` do computador local.
- Instalação: `pnpm install --frozen-lockfile`, com pnpm 10.4.1 disponível no build.
- Build: `pnpm build` (dependências de desenvolvimento necessárias nesta etapa).
- Início: `node dist/index.js`, com `NODE_ENV=production`.
- Saída: servidor `dist/index.js` e frontend `dist/public`, ambos na mesma aplicação.
- Porta: respeitar `PORT` fornecida pela hospedagem, escuta em 0.0.0.0.
- Runtime Node: selecionar versão compatível com o lockfile e validar instalação/build no painel; não presumir compatibilidade apenas pela lista de versões.

## Variáveis

Frontend, disponíveis DURANTE o build: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
Servidor: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
Usar somente o projeto Lux Dog aprovado. Nunca prefixar chave privada com `VITE_`.
Asaas de teste: `ASAAS_LUX_DOG_SANDBOX_API_KEY` e
`ASAAS_LUX_DOG_SANDBOX_WEBHOOK_TOKEN`, correspondentes à conta sandbox configurada.
Inserir valores somente nas configurações privadas; não enviar no chat/GitHub/logs.
Não copiar variáveis de outro projeto nem substituir o conjunto completo sem preservar configurações necessárias.

## Gates antes de liberar

1. Confirmar plano Node e configuração da aplicação isolada, build, logs e HTTPS.
2. Verificar `/api/health`, login/logout, recarga de `/clients` e acesso negado sem login.
3. Homologar com tutor/pet/profissional/contrato fictícios: agenda, baixa, renovação,
   reversão e concorrência. Registrar resultado, limpar fixtures sem apagar históricos reais.
4. Testar Asaas exclusivamente sandbox e webhooks repetidos. Repasse/NF não homologados continuam bloqueados.
5. Validar backup/restauração e prévia da importação antes de gravar dados reais.
6. Só depois revisar domínio final e liberação. Manter a instalação anterior como caminho de retorno;
   retorno de código não significa reversão automática de migrations/dados.

Status atualizado em 12/10/2026: proprietária concluiu implantação na Hostinger em
https://olivedrab-emu-744435.hostingersite.com, com Node 22.x, pnpm e entrada dist/index.js.
HTTP público, busca publicada e capturas autenticadas foram conferidos. Acesso direto
ao painel Node/navegador não está disponível neste chat; chaves privadas locais ausentes.
Gates pendentes estão consolidados no início de TODO_DWO.md. Não considerar deployment
concluído como autorização para importar dados ou habilitar financeiro de produção.

Referências oficiais:
- https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
- https://www.hostinger.com/support/how-to-add-environment-variables-during-node-js-application-deployment/

---

# Histórico legado — Manus (não utilizar na implantação atual)

As informações abaixo são antigas, referem-se a outro ambiente e não comprovam
o estado atual. Não executar orientações de diagnóstico que imprimem variáveis secretas.

## Onde o Backend Lê DATABASE_URL?

### Ordem de Precedência (do mais alto para o mais baixo):

1. **Variáveis de Ambiente do Sistema Manus** ⭐ (PREVALECE EM PRODUÇÃO)
   - Injetadas pelo painel Manus
   - Arquivo: `.project-config.json` (env_vars)
   - Não pode ser editado via `webdev_request_secrets` (é built-in)
   - **Status:** Atualmente aponta para Supabase ANTIGO (problema conhecido)

2. **`.env.local`** (FALLBACK EM DESENVOLVIMENTO)
   - Lido pelo Node.js em tempo de execução
   - Arquivo: `/home/ubuntu/groomerflow-backend/.env.local`
   - Pode ser editado manualmente
   - **Status:** Atualizado com nova senha Supabase

3. **`.project-config.json`** (CONFIGURAÇÃO MANUS)
   - Arquivo: `/home/ubuntu/groomerflow-backend/.project-config.json`
   - Campo: `env_vars.DATABASE_URL`
   - **Status:** Contém novo Supabase, mas não está sendo usado

---

## Problema Identificado

O sistema Manus está **injetando DATABASE_URL** com o Supabase ANTIGO, sobrescrevendo `.env.local`.

### Solução Necessária

**Você precisa atualizar a DATABASE_URL no painel Manus:**

1. Acesse: Management UI → Settings → Secrets
2. Procure por `DATABASE_URL`
3. Atualize com: `postgresql://postgres.cdfjjhbczgyyogocioro:***@aws-1-sa-east-1.pooler.supabase.com:6543/postgres`
4. Clique em Save
5. Reinicie o servidor

---

## Verificação

Para confirmar qual DATABASE_URL está sendo usado:

```bash
# Ver variável em tempo de execução
echo $DATABASE_URL

# Ver no processo Node
ps aux | grep node | grep -v grep
cat /proc/{PID}/environ | tr '\0' '\n' | grep DATABASE
```

---

## Segurança

- ✅ Senha rotacionada em 06/06/2026
- ✅ Nunca commitar `.env.local` com credenciais
- ✅ `.env.local` está em `.gitignore`
- ✅ Connection string mascarada em documentação
- ✅ Usar variáveis de ambiente para credenciais

---

## Próximos Passos

1. Atualizar DATABASE_URL no painel Manus
2. Reiniciar servidor
3. Testar `/supabase/health` endpoint
4. Testar login/registro pela UI
