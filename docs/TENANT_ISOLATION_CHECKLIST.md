# Checklist de ativação do isolamento

Não aplique a importação de dados antes de concluir estes itens:

1. Executar as migrations Supabase na ordem dos nomes.
2. Criar a organização Lux Dog.
3. Criar a pessoa jurídica e a unidade operacional.
4. Preencher `organization_id` e `unit_id` do primeiro usuário em `profiles`.
5. Confirmar que o usuário consegue ler somente a própria organização.
6. Criar um segundo usuário de teste em outra organização.
7. Confirmar que clientes, pets, agenda, serviços, alunos e pacotes da Lux Dog
   não aparecem para o segundo usuário.
8. Confirmar que tentativa de gravar outro `organization_id` é rejeitada.
9. Importar primeiro em modo de prévia e comparar as contagens com a planilha.

## Comportamento esperado

- Perfis sem organização ativa não acessam dados operacionais.
- Registros antigos sem organização ficam invisíveis até o backfill.
- Usuários vinculados a uma unidade não podem escrever em outra unidade.
- Fotos são gravadas em um caminho privado por organização.
- A chave `service_role` é usada somente em tarefas administrativas controladas,
  como armazenamento privado e provisionamento.
