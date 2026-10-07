# Resgate funcional Emergent → DWO

Levantamento inicial em 07/10/2026. Fonte: código local em `legacy-lux-dog/Meriely-da-Sila-Basilio-Lux-DOg`. Existência de rota ou tela não comprova funcionamento em produção. Os relatórios antigos precisam ser confrontados com testes atuais.

## Inventário identificado

| Área | Implementações encontradas no legado | Validação necessária no DWO |
| --- | --- | --- |
| Cobranças | Cadastro/busca de cliente Asaas, criação e consulta de cobranças, link de pagamento, boleto, QR Pix, parcelamento de cartão | Migrar serviço seguro; vínculo com cliente, unidade, atendimento e pacote; impedir duplicação |
| Financeiro | Visão geral, recebimentos, cobranças, detalhe do pagamento, conciliação, ledger | Reconciliar status e datas; vincular pagamento ao serviço executado |
| Splits | Regras configuráveis, regra padrão, cálculo, alocações, troca de parceiro, extrato por parceiro | O envio de split na criação de cobrança está comentado/desabilitado no legado; não copiar como funcional |
| Repasses | Criação, listagem, pendências e consulta de saldo | Integrar autorização e confirmação de crédito; evitar repasse duplicado |
| Fiscal | Verificação cadastral, criação/listagem/consulta/cancelamento de notas, nota a partir do pagamento | Validar configuração municipal e titular emissor antes de habilitar emissão real |
| Profissionais | Cadastro, atendimentos, extrato, subcontas Asaas, situação cadastral, requisitos e documentos KYC | Vincular profissional à carteira verificada e manter trilha de auditoria |
| Clientes e pets | Dados fiscais e endereço, cadastro de pets, histórico e extrato | Preservar relações e corrigir totais/filtros inconsistentes |
| Agenda | Cadastro/edição, status, conclusão, relatórios por unidade e consolidado | Conferir cobrança acessível pela agenda e consumo de pacote atômico |
| Pacotes | Modelos, atribuição comercial/educacional, sessões, histórico e vínculo com cliente/aluno | Conferir cobrança de pacote; implementar créditos por ciclo e validade acordada |
| Escola | Alunos, cursos, matrículas, aulas, horas práticas e estatísticas | Recuperação posterior à prioridade do salão; Greenn para digitais |
| Gestão | Organizações, CNPJs, unidades, configurações Asaas e fiscais | Isolamento por organização/unidade e permissões |
| Catálogo | Serviços, produtos, ajustes de estoque | Comparar campos, ações e relatórios com o DWO |
| Integrações | Eventos, detalhe de payload, reprocessamento, saúde, chaves, webhook Asaas | Autenticação, idempotência e separação sandbox/produção |
| Indicadores | Dashboard, gráficos, alertas, previsão de demanda, rentabilidade, desempenho por categoria | Validar fontes e cálculos; não confundir indicadores simulados com reais |

## Recuperação prioritária

1. Um único serviço de cobranças usado por Financeiro, Agendamento e Pacotes, com contexto pré-preenchido e referências persistidas.
2. Recebimento por webhook, conciliação com origem e confirmação do executor do atendimento.
3. Créditos de pacotes: cancelamento não consome; serviços realizados geram direito do executor; sessões não usadas valem 60 dias após o fim do ciclo de origem.
4. Fechamento mensal e descontos mensais de condomínio/marketing na parte do profissional; repasse autorizado e crédito conciliado.
5. Configuração fiscal e emissão/consulta/cancelamento de notas com validação específica.
6. Demais módulos e aprimoramento visual sem remover campos ou ações do legado.

## Limites deste levantamento

- Ainda não é uma auditoria completa de cada implementação nem uma migração concluída.
- Na busca inicial por `billing`/`cobrança` em `Schedule.js` e `Packages.js`, não apareceram ações diretas; é necessário rastrear componentes compartilhados e outras versões antes de concluir ausência.
- O Financeiro legado possui seleção de atendimento na criação de cobrança. O acesso pela agenda e cobrança de pacotes são requisitos explícitos do usuário, mesmo que não sejam encontrados nesta cópia.
- Não ativar cobranças, transferências ou notas reais enquanto o fluxo correspondente não tiver validação no sandbox e configuração adequada.
