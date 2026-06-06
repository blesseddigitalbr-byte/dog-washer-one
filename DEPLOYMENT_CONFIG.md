# 🔧 DEPLOYMENT CONFIGURATION - DATABASE_URL

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
