# DWO — plano de recuperação e checklist funcional

Atualizado em 07/10/2026. Prioridade: salão. Referência: código local do Emergent e requisitos acordados. Este documento é um backlog, não uma declaração de funcionalidades prontas.

## Prioridade retomada — agenda e contratação de planos (08/10/2026)

### Renovação retroativa e serviços avulsos (09/10/2026)

- [x] Preparar função pura de prévia de alocação retroativa com cobertura inicial explícita, identidade unidade/tutor/pet, atendimento concluído, proteção contra seleção duplicada/consumo existente, saldo por serviço e ordenação cronológica. 14 testes e verificação de tipos aprovados. Ainda não integrada à API/UI ou ao banco.
- [x] Integrar consulta autenticada e prévia somente leitura ao detalhe do pacote. Busca limitada a 200 atendimentos, filtros unidade/tutor/pet, conferência de consumos existentes, data no fuso São Paulo e falha fechada em erro de consulta. Quatro testes de API aprovados; tipos e build aprovados. Não confirma alocação nem corrige dados reais.
- [ ] Homologar consulta e interface com sessão real, resolver acesso seguro ao Supabase e validar confirmação no banco antes de habilitar desconto. Ambiente local sem credenciais Supabase configuradas nesta execução.
- [ ] Corrigir quatro suítes legadas de testes (adjustments, appointments, students, upload), com isolamento de banco e expectativas atuais de autenticação; execução completa em 09/10/2026: 184 testes passaram em 42 arquivos, quatro arquivos falharam na preparação. Build e tipos passaram. Não declarar suíte completa aprovada.
- [ ] Integrar seleção de atendimentos pendentes à contratação; persistir cobertura autorizada, motivo e auditoria. Confirmar alocação em transação com trava e idempotência. Nunca mover consumo já registrado sem reversão auditada.
- [ ] Permitir banho de pacote e tosa avulsa no mesmo atendimento, conferindo cobrança histórica antes de criar outra. Não consumir tosa do pacote quando contratada por fora.
- [ ] Conciliar histórico importado: renovação semestral após contrato trimestral, preservando contratos antigos e separando parcelas de renovações. Dados pessoais/financeiros de origem não devem ser publicados no GitHub. Nenhuma correção real aplicada nesta etapa.

### Critérios de liberação e arquitetura segura

- [x] Preparar procedimento transacional 202610090001 para confirmação da simulação: trava, repetição sem nova inclusão, autorização, vínculos, validade/saldo, sobreposição, atendimentos/serviços/itens na mesma transação e proteção de edição de itens confirmados.
- [x] Validar criação de 202610090001 no Supabase com rollback, sem persistência; dois testes de contrato SQL e tipos aprovados. Vercel Ready confirmado para 8fa7979 (alertas de feriados); conferência visual autenticada ainda pendente.
- [ ] Executar cenários reais, falha parcial, concorrência e repetição de 202610090001; aplicar e substituir escrita multietapas da API somente após homologação. Ainda não ativo. Reserva entre contratos/simulações e acesso direto às tabelas exigem validações adicionais.

- [x] Implementar alertas de feriados nacionais fixos e DF (30/11 e móveis verificados de 2026), em geração/edição do simulador, com sugestão de próxima data sem feriado conhecido. Não alterar datas automaticamente nem presumir disponibilidade.
- [ ] Configuração persistida por unidade de feriados municipais/estaduais, datas móveis de outros anos, expediente/fechamentos e autorização de abertura em feriado. Cobertura local ainda não é completa.
- [ ] Homologar alertas publicados e política de confirmação. Avisos continuam permitindo revisão/inclusão e não bloqueiam automaticamente expediente.

- [x] Revalidar antes de confirmar simulação: saldo banho/tosa separado, vigência com fuso São Paulo, pertencimento tutor/pet/unidade, datas inválidas/sobrepostas e item já publicado. Aviso de simulação não autoriza ultrapassar saldo/validade.
- [ ] Tornar confirmação da simulação transacional/idempotente no banco; fluxo atual grava em etapas e não está liberado como seguro contra concorrência ou falha parcial. Reservas de créditos entre simulações também pendentes.

- [x] Integrar contratação ao simulador por opção Planejar datas após salvar, com tutor/pet/contrato explícitos; adicionar acesso no detalhe do pacote. Não agenda nem envia mensagens automaticamente.
- [x] Não substituir silenciosamente um contrato explícito ausente pelo primeiro contrato encontrado no simulador.
- [ ] Homologar contratação → simulação → revisão → agenda, incluindo contrato indisponível, quantidades e prevenção de duplicatas.
- [ ] Integração Google Agenda: calendário do salão, convidados tutor/profissional, identificadores permanentes e atualização/cancelamento idempotentes; conexão autorizada pendente. Sem envio externo nesta etapa.

- [x] Adicionar opção explícita Combo Higiene + Trimming/Tosa na agenda, persistir include_grooming em criação/edição e preservar seleção ao reabrir.
- [x] Corrigir baixa preparada: todo atendimento consome banho; somente include_grooming consome tosa/trimming. Tosa higiênica não deve ser inferida pelo nome.
- [x] Remover inferência por palavra tosa/trimming da escolha de saldo no simulador: banho como base e crédito adicional quando solicitado.
- [ ] Homologar agenda/simulador e aplicar migração 202610080010. Rotina atualmente publicada no banco ainda usa inferência por nome; não considerar correção de baixa ativa.

- [x] Separar contratos substituídos da visão atual: pacote vencido/consumido com nova contratação válida do mesmo tutor/pet/unidade aparece só no histórico como encerrado/consumido; retirar do radar de vencidos/sem saldo sem apagar situação original ou financeiro.
- [x] Testar substituição e exceções (outro tutor/pet/unidade, contrato futuro, cancelado, vencido ou zerado). Disponibilizar botão Mostrar histórico.
- [ ] Conferir apresentação publicada com uma jornada real de homologação.

- [x] Preparar continuidade de pacotes na baixa: mesma unidade/tutor/pet, validade, saldo integral para combo, menor vencimento primeiro, trava concorrente e registro de pacote solicitado versus consumido. Não juntar saldos nem estender validade.
- [x] Validar criação da versão ampliada da migração 202610080010 no Supabase com rollback; três testes de contrato SQL, tipos e build aprovados. Não equivale a teste de consumo real.
- [ ] Homologar consumo, concorrência, reversão e aplicar migração de continuidade. Não converter atendimento de pacote em avulso automaticamente quando faltar saldo.
- [x] Exibir jornada de contratações/renovações por tutor/pet no detalhe do pacote, com código, origem, saldo, validade e situação; incluir código/validade na seleção da agenda.
- [ ] Homologar jornada publicada e exibir alocação real no histórico; vínculo renewal_source_id preserva contratos independentes e não comprova recebimento.

- [x] Preparar migração 202610080010: histórico de consumo/visita somente leitura direta; baixa privilegiada com autorização explícita, isolamento, validade, repetição e bloqueio de execução revertida.
- [x] Validar criação da migração 202610080010 no Supabase em transação com rollback, sem persistir alterações; oito testes selecionados, tipos e build aprovados.
- [ ] Executar cenários reais de baixa/permissão/concorrência e aplicar 202610080010 no banco. Proteção nova ainda não está ativa em produção. Saldo direto de contratos continua exigindo endurecimento separado.

- [x] Configurar app.luxdog.com.br como alias HTTPS do projeto DWO, preservando site principal.
- [x] Adicionar app.dogwasher.com.br ao mesmo projeto e criar CNAME exclusivo app na Hostinger, preservando site/email; resolução pública confirmada.
- [ ] Confirmar validação final Vercel/HTTPS do domínio geral após propagação. Alias não implementa central administrativa nem seleção de empresa por hostname.
- [ ] Homologar autenticação/recuperação de senha nos dois domínios; não duplicar dados, empresas ou credenciais.
- [ ] Preparar central comercial multiempresa após homologação do salão, com marca/permissões/conta financeira próprias e testes de isolamento.

- [ ] Só liberar salão após testes de banco e navegador do cadastro à conclusão, não apenas testes que inspecionam código.
- [ ] Matriz de acesso por perfil: tutor/pet, agenda, contratação, descontos, correção, fiscal e repasses; verificar também acesso direto pela API/Supabase.
- [ ] Auditar políticas FOR ALL dos saldos e históricos: isolamento de unidade não substitui autorização por papel/ação. Restringir mutações críticas a procedimentos auditados antes de produção.
- [ ] Concorrência: cancelar/concluir, consumir último crédito, renovar e repetir reversão. Confirmar rollback integral após falha.
- [ ] Backup, restauração ensaiada, migrações versionadas, retenção e acesso a anexos privados; segredos só no servidor.
- [ ] Evidência financeira por conta e ID do provedor, origem de pagamento/ciclo/serviço e razão de ajustes; não apagar fatos históricos.
- [ ] Alertas e trilha de revisão para reversão após repasse ou integração acadêmica. Não afirmar que houve recuperação de dinheiro ou cancelamento externo.
- [ ] Revisar monitoramento, erros seguros, limites de requisição, LGPD, exclusão/retensão e dependências antes de disponibilização comercial.
- [x] Implementar reversão de baixa pela gestão com motivo e lançamento único: restaurar somente consumo registrado, preservar validade/histórico e sinalizar revisão financeira/acadêmica.
- [x] Excluir execução revertida da elegibilidade de apuração e da lista de práticas válidas; apresentar reversão como cancelada na agenda, preservando conclusão original no banco.
- [ ] Homologar reversão e isolamento com execução real de testes no banco/browser. Não considerar o módulo concluído antes dessas evidências.

### Critério transversal confirmado pelo usuário

- [x] Aplicar comparação Emergent → DWO em todas as etapas, não somente agenda: cadastro, contratação, cobrança, agendamento, execução, créditos, conciliação, repasse, fiscal, relatórios e integrações.
- [ ] Para cada etapa, documentar ações/campos/regras encontrados, equivalente atual DWO, diferença e evidência de teste; presença de tela/rota não é homologação.
- [ ] Recuperar vantagens funcionais do legado preservando melhorias de segurança, isolamento e transações do DWO; não ativar código financeiro comentado nem copiar parâmetros fiscais presumidos.
- [ ] Auditar cancelamento antes de execução versus correção de baixa indevida; reversão exige lançamento único, motivo, autorização e análise de efeitos financeiros/acadêmicos. Não devolver crédito ao cancelar sem consumo.
- [x] Comparar status no legado: conclusão/cancelamento são finais; o trecho revisado não fornece reversão completa de consumo para copiar.
- [x] Implementar cancelamento pré-conclusão transacional, com motivo e responsável, repetição sem novo efeito e sem modificar créditos/cobranças/pagamentos.
- [x] Adicionar botão e confirmação de cancelamento na agenda; consumo incompatível com status bloqueia operação e exige conferência.
- [ ] Homologar concorrência cancelar/concluir e comportamento publicado; testes de contrato SQL não substituem execução de cenários no banco.
- [ ] Implementar correção de baixa concluída com reversão única e análise de repasses/fechamentos e registros acadêmicos. Continua bloqueada para não devolver crédito nem desfazer direito financeiro indevidamente.
- [ ] Revisar o fluxo inteiro após cada recuperação, incluindo exceções, histórico, filtros/totais e interface. Escola permanece por último, salvo regras necessárias a atendimentos por aluno.

- [x] Corrigir cancelamento de pacote: preservar situação financeira sem declarar reembolso inexistente.
- [x] Somar pagamentos registrados mesmo com contrato cancelado; estorno precisa de confirmação separada.
- [x] Contratação inicia pendente por padrão; validar pertencimento do pet ao tutor/unidade e validade anterior à contratação.
- [x] Renovação transacional, uma sucessora por pacote, resistente a repetição; preservar saldo e prazo do pacote anterior sem desativá-lo.
- [x] Testes selecionados de pacote/agenda aprovados (17); validação de tipos aprovada.
- [ ] Homologar criação/renovação concorrente na interface e consumo de saldo anterior. Testes atuais incluem inspeção de código, não substituem ponta a ponta.
- [ ] Implementar ciclo mensal separado da validade dos créditos, expiração em 60 dias e consumo por vencimento; não confundir duração do plano com ciclo de cobrança.
- [ ] Associar pagamento confirmado ao ciclo, inadimplência/estorno e prestação executada; recorrência Asaas ainda não fechada.
- [ ] Homologar agenda profissional/aluno, cancelamento sem consumo, combo e conclusão única com cobrança/pacote.
- [ ] Validar peso financeiro dos serviços e fechamento mensal antes de automatizar repasses de pacotes.

Legenda: `[x]` etapa verificada; `[ ]` trabalho pendente. **Recuperar** = identificado no legado, mas sem equivalência completa validada no DWO. **Aprimorar** = existe parcialmente. **Novo** = requisito adicional. A ausência precisa ser confirmada por comparação detalhada antes de implementar duplicatas.

## 0. Auditoria e preservação

### Estrutura empresarial — 08/10/2026

- [x] Implementar edição de pessoa jurídica para owner/admin, restrita à organização e sem alterar contas financeiras.
- [x] Mostrar empresa vinculada à unidade e alertar divergência/ausência de CNPJ entre os cadastros.
- [ ] Homologar gravação de pessoa jurídica no ambiente publicado.
- [ ] Localizar cadastro original da Blessed e verificar migração/permissões antes de recuperar; não criar duplicata sem dados confirmados.
- [ ] Definir fonte fiscal única sem sobrescrever CNPJs de filiais ou vínculos existentes.

### Backlog novo — Portal do Tutor

Solicitado em 07/10/2026. Apenas planejamento; implementação futura, sem alterar a prioridade atual do salão nem a orientação de deixar o item 10 por último.

- [ ] Criar portal do tutor com identidade visual da empresa (white-label).
- [ ] Autenticação e acesso restrito aos próprios dados e pets, com isolamento entre empresas.
- [ ] Consultar próximos agendamentos e respectivas situações.
- [ ] Consultar histórico de atendimentos por pet.
- [ ] Consultar pagamentos, cobranças pendentes e links de pagamento disponíveis.
- [ ] Calendário de disponibilidade para solicitar/criar novos agendamentos, respeitando horários, serviços e profissionais.
- [ ] Definir regras de confirmação e permissões de reagendamento/cancelamento antes de implementar essas ações.
- [ ] Validar experiência responsiva em celular e segurança de acesso.

- [x] Inventário inicial de telas e rotas do Emergent (`RESGATE_EMERGENT.md`).
- [ ] Comparar cada ação, campo, regra e permissão entre os projetos.
- [ ] Confrontar testes e relatórios antigos com o comportamento atual.
- [ ] Identificar versão mais completa do legado e componentes compartilhados.
- [ ] Documentar funções desabilitadas, simuladas ou incompletas.
- [ ] Definir correspondência MongoDB → Supabase sem perder relações.
- [ ] Preparar backup, migrações reversíveis e plano de recuperação.

## 1. Cobranças — recuperar / prioridade P0

### Etapa 08/10 — emissão sandbox e proteção da agenda

- [x] Implementar emissão sandbox de rascunho com conta vinculada à pessoa jurídica da unidade, cadastro/localização do cliente e fatura hospedada.
- [x] Proteger contra POST duplicado concorrente com reserva atômica do rascunho; resultados incertos ficam para consulta sem novo POST automático.
- [x] Conferir referência, cliente, valor e modalidade antes de vincular resposta do Asaas.
- [x] Aplicar migrações de emissão e proteção de horários/executor no Supabase; tipos, build e 20 testes selecionados aprovados.
- [ ] Homologar emissão pela interface, pagamento recebido e conciliação com serviço real de teste; não liberar produção antes disso.
- [ ] Bloqueio confirmado em 08/10: Vercel sem `ASAAS_LUX_DOG_SANDBOX_API_KEY` (somente webhook configurado). Nova chave sandbox preparada sem saques; geração aguarda validação SMS do titular no Asaas. Não foi gerada cobrança nesta tentativa.
- [x] Bloqueio da credencial resolvido: chave exposta desabilitada, nova chave sandbox salva como Secret na Vercel e redeploy Ready em 08/10, sem permissão de saque.
- [x] Emissão pela interface homologada: cobrança fictícia `pay_p5iym3vcso3adm2j`, R$ 5,00, fatura sandbox e referência do rascunho persistidas. Não confirma pagamento ou repasse.
- [ ] Verificar webhook/recebimento desta cobrança (painel inicialmente `awaiting_webhook`) e continuar homologação de serviço/repasse.
- [x] Tutor/pet fictícios `DWO Homologação Financeiro` e rascunho `DWO TESTE SANDBOX emissão 08-10`, R$ 1,00, criados pela interface para continuidade da homologação. Manter identificados como teste e remover/arquivar após conclusão.
- [ ] QR Pix/copia e cola, recorrência, recuperação operacional auditada e cancelamento/estorno ainda pendentes.
- [ ] Homologar concorrência de agendamento em duas sessões e fluxo completo de baixa protegida.

- [x] Etapa preparatória: formulário único e rascunhos persistidos, acessíveis pelo Financeiro, Agendamento e Pacotes (migração aplicada, gravação via plataforma e entrada contextual de pacote verificadas; publicação 6151c2c).

- [ ] Serviço único de criação de cobranças no servidor, usado por todas as telas.
- [ ] Tela Financeiro: nova cobrança, listagem, filtros e detalhes.
- [ ] Agendamento: gerar cobrança com cliente, pet, serviço, profissional e valor preenchidos.
- [ ] Pacotes: gerar cobrança com contrato/pacote, cliente e ciclo preenchidos.
- [ ] Cadastro e vinculação do cliente Asaas por conta/unidade.
- [ ] Pix: QR Code, copia e cola, validade e link de pagamento.
- [ ] Boleto: vencimento, link e identificação da cobrança.
- [ ] Cartão via checkout seguro e parcelamento validado; não guardar dados de cartão.
- [ ] Compartilhar/copiar link, com envio ao cliente somente mediante ação autorizada.
- [ ] Gravar referências entre cobrança, atendimento, pacote e ciclo no banco.
- [ ] Prevenir cobrança duplicada, inclusive após timeout ou repetição do clique.
- [ ] Consultar/sincronizar cobrança e tratar cancelamento, estorno e atraso.
- [ ] Definir cobrança recorrente dos planos e alteração/cancelamento da recorrência.
- [ ] Separar rigorosamente sandbox e produção.

## 2. Recebimentos e conciliação — aprimorar / P0

- [x] Painel inicial por unidade de cobranças emitidas com recebimento, bruto/líquido e situação do atendimento; cruzamento por conta e ID do pagamento.
- [x] Regras testadas: confirmação não libera apuração; exigir execução, recebimento, executor e valor coerente; pacotes sem rateio não geram direito automático.
- [ ] Homologar painel com webhook de cobrança emitida pelo novo fluxo.

- [ ] Unificar estados: pendente, confirmado, recebido, vencido, cancelado e estornado.
- [ ] Não confundir confirmação de cartão com saldo disponível.
- [ ] Conciliar cobrança com atendimento/pacote/ciclo e executor.
- [ ] Listar recebimentos sem vínculo e permitir correção auditada.
- [ ] Mostrar bruto, taxas, líquido, origem, cliente e datas.
- [ ] Processar eventos duplicados e fora de ordem sem regredir estado.
- [ ] Tratar estorno parcial, total e chargeback sem duplicar direitos.
- [ ] Tela de divergências, histórico e reprocessamento controlado.
- [ ] Conferir totais por período e unidade com o Asaas.

## 3. Agenda e execução — aprimorar / P0

- [ ] Persistir e exibir cliente, pet, plano/pacote, serviço e profissional em todas as vistas e no modal.
- [ ] Padronizar estados e cores entre legenda, filtros e modal.
- [ ] Distinguir confirmação do agendamento da confirmação do serviço realizado.
- [ ] Registrar executor efetivo, conclusão e responsável pela validação.
- [ ] Alterar executor com histórico, sem perder a origem financeira.
- [ ] Validar conflitos de horário, duração e unidade.
- [ ] Cancelar/remarcar sem consumir crédito nem gerar remuneração.
- [ ] Dar baixa uma única vez e impedir repetição concorrente.
- [ ] Vincular cobrança existente ou gerar nova cobrança pela agenda.
- [ ] Preservar observações e histórico operacional.

## 4. Planos, pacotes e créditos — aprimorar + novo / P0

- [ ] Quantidades do simulador provenientes do plano/pacote contratado.
- [ ] Nome correto do plano, quantidades e renovação na mensagem editável.
- [ ] Datas, horários e serviços da agenda sugerida editáveis.
- [ ] Modelos comerciais e atribuição a cliente/pets com histórico.
- [ ] Separar contratação, recebimento, crédito concedido e consumo.
- [ ] Criar lote de créditos por ciclo e pagamento de origem.
- [ ] Combo Higiene + Tosa/Trimming consome 1 banho e 1 tosa na mesma visita.
- [ ] Consumir primeiro os créditos com vencimento mais próximo.
- [ ] Sessões não utilizadas: validade de 60 dias após o fim do ciclo de origem.
- [ ] Renovação não prolonga os créditos antigos.
- [ ] Exibir concedidos, utilizados, disponíveis, expirados e respectivos prazos.
- [ ] Vincular cada crédito utilizado ao profissional que executou o serviço.
- [ ] Definir pesos/valores de banho e tosa dentro do pacote antes do cálculo financeiro.
- [ ] Definir tratamento de inadimplência, estorno e créditos já utilizados.
- [ ] Validar política contratual de expiração e eventuais restituições.

## 5. Profissionais e estrutura PJ — recuperar / P1

- [ ] Cadastro PF/PJ, dados fiscais, contatos e especialidades.
- [ ] Vinculação a unidade e carteira Asaas verificada.
- [ ] Criação/consulta de subconta, situação cadastral e requisitos.
- [ ] Documentos KYC com acesso restrito e tratamento de erros.
- [ ] Histórico de atendimentos com filtros e executor efetivo.
- [ ] Extrato financeiro por profissional com origens e períodos.
- [ ] Regra de comissão individual e vigência histórica.
- [ ] Configuração de estação/uso da estrutura dentro do cadastro profissional.
- [ ] Taxas mensais de condomínio e marketing, com vigência e lançamentos.
- [ ] Registrar documentos contratuais; não apresentar o cadastro PJ como garantia de ausência de vínculo trabalhista.

## 6. Fechamento e repasses — recuperar + novo / P0

- [x] Teste sandbox de split imediato com crédito verificado na carteira fictícia.
- [x] Teste sandbox de transferência de R$ 10 autorizada e concluída; crédito verificado.
- [x] Base de cálculo em centavos: serviço realizado e recebido, descontos mensais e rejeição de duplicatas; seis testes aprovados.
- [ ] Ligar cálculo ao banco, créditos e telas; a base isolada ainda não executa fechamento.
- [ ] Regras de percentual configuráveis e base bruto/líquido claramente definida.
- [ ] Preservar regra aplicada por serviço, sem alterar passado ao editar percentuais.
- [ ] Para pacotes, apurar direito pelo serviço realizado; não dividir automaticamente toda a cobrança mensal.
- [ ] Fechamento mensal por profissional, unidade e competência.
- [ ] Descontar condomínio e marketing uma vez por mês da parte do profissional.
- [ ] Mostrar insuficiência para taxas sem criar transferência negativa; decidir política do saldo devedor.
- [ ] Revisão, aprovação e bloqueio de alterações após fechamento.
- [ ] Criar transferência uma única vez; recuperar resultado após timeout.
- [ ] Acompanhar pendente, autorizada, concluída, falha e cancelada.
- [ ] Conciliar crédito com identificador e evidência do provedor, não apenas cálculo local.
- [ ] Extrato detalhado: atendimento → cobrança → crédito → direito → fechamento → transferência.
- [ ] Reversão/ajuste auditado para erros e estornos posteriores.
- [ ] Definir se futuros fechamentos serão manuais ou automáticos; começar com aprovação.

## 7. Fiscal — recuperar / P1 antes de operação fiscal real

- [ ] Dados fiscais do salão, unidade, cliente e profissional.
- [ ] Validar município, inscrição municipal, serviço e configuração NFS-e.
- [ ] Definir com contabilidade quem emite e a base tributável; não aplicar automaticamente a lei de salão humano ao mercado pet.
- [ ] Emissão a partir de cobrança/recebimento, conforme regra fiscal validada.
- [ ] Consultar status, documento e erros; prevenir emissão duplicada.
- [ ] Cancelamento/substituição quando permitido pelo município.
- [ ] Reconciliação nota ↔ cobrança ↔ serviço ↔ estorno.
- [ ] Validar cenário atual sem parceiros e cenário futuro com profissionais PJ.
- [ ] Homologação fiscal específica; o teste de transferência não valida notas.

## 8. Clientes e pets — recuperar / P1

- [ ] Preservar dados, endereço completo, observações e dados fiscais.
- [ ] Modal com abas Dados, Pets, Extrato e Histórico.
- [ ] Histórico de serviços, status, profissional, valor e pacote.
- [ ] Extrato com totais corretos e filtros de cliente/período.
- [ ] Corrigir inconsistências entre linhas e cartões de totais.
- [ ] Dados médicos, nascimento, vacinas, vermífugo, fotos e características do pet.
- [ ] Filtros VIP e cão modelo e indicadores sem dados fictícios.
- [ ] Validar importação da planilha existente, deduplicação e relações.

## 9. Integrações e segurança — aprimorar / P0

- [ ] Inventariar configuração atual de webhooks e permissões.
- [ ] Eventos de pagamento, transferência e documentos fiscais, conforme suporte do provedor.
- [ ] Logs, detalhe, falha, reprocessamento e rastreabilidade.
- [ ] Segredos apenas no servidor; nunca no frontend, logs ou repositório.
- [ ] Permissões por função e isolamento por organização/unidade via RLS.
- [ ] Auditoria de cobranças, baixa, fechamento, repasse e alterações de carteira.
- [ ] Limites, validação de entradas e mensagens de erro seguras.
- [ ] Ambiente de teste com dados fictícios e notificações controladas.

## 10. Escola — recuperar após salão / P2

- [ ] Cursos, alunos e matrículas com dados completos.
- [ ] Aulas, horas práticas, progresso e conclusão.
- [ ] Pacotes educacionais e atendimentos vinculados a alunos.
- [ ] Financeiro da escola separado do salão e configuração própria de conta.
- [ ] Greenn para produtos digitais: mapear vendas, clientes, produtos e eventos.
- [ ] Tratar pagamento, cancelamento e reembolso sem matrículas duplicadas.
- [ ] Testar integração Greenn; presença de hub genérico não comprova integração específica pronta.

## 11. Gestão, catálogo e indicadores — recuperar / P2

- [ ] Organizações, CNPJs, unidades e configurações por unidade.
- [ ] Serviços: preços, duração, categorias e edição.
- [ ] Produtos e ajustes de estoque com histórico.
- [ ] Dashboard operacional/financeiro com dados reais.
- [ ] Relatórios por unidade e consolidados, receita e utilização de pacotes.
- [ ] Alertas: leitura, resolução e fontes confiáveis.
- [ ] Previsão de demanda, rentabilidade e desempenho por categoria: validar cálculos antes de exibir.

## 12. Design e qualidade — transversal

- [x] Base white-label: marca e cores por organização, assinatura by/rede e tela de personalização (429c919 publicado; leitura, tema e gravação pela tela verificados).
- [ ] Licenciamento comercial de módulos com validação no servidor; esconder menus não é suficiente.
- [ ] Onboarding de empresas, contas financeiras próprias e carteiras de parceiros por CNPJ.
- [ ] Definir contrato comercial, preços por módulo, cobrança SaaS, domínio e política de suporte.
- [ ] Revisar cores fixas das telas antigas para aderirem ao tema configurável.

### Refinamento visual LUX DOG

- [x] Logo original vinculado à organização LUX DOG, mantendo o arquivo intacto.
- [x] Cores de marca antigas substituídas por tokens de tema nas páginas internas e formulários compartilhados.
- [x] Tema propagado aos modais; títulos mais leves, foco visível, números alinháveis e respeito à preferência de movimento reduzido.
- [ ] Revisão visual final em desktop e celular de todas as telas; logo configurável para outros clientes continua pendente.

- [ ] Padronizar identidade DWO — Dog Washer One, cores e tipografia.
- [ ] Preservar a estrutura de dados e ações úteis do Emergent.
- [ ] Melhorar organização visual, tabelas, modais e responsividade.
- [ ] Estados de carregamento, vazio, sucesso e erro em todas as operações.
- [ ] Navegação clara entre operação, financeiro e configurações.
- [ ] Acessibilidade básica, contraste e uso por teclado.
- [x] Corrigir testes existentes de pacotes e modal de cliente (33 testes aprovados neste bloco).
- [ ] Preparar ambiente de testes de banco sem depender de credenciais reais.
- [ ] Testes de concorrência, duplicidade, permissões e isolamento de unidades.
- [ ] Verificação de tipos, build e testes por entrega.
- [ ] Testar no navegador e conferir dados após recarregar.

## Critérios para declarar a operação pronta

- [ ] Cliente fictício → cobrança → recebimento → atendimento concluído → crédito consumido → remuneração correta.
- [ ] Pacote com renovação, sessão acumulada, troca de executor e expiração testados.
- [ ] Cancelamento e ausência não consomem crédito nem geram remuneração.
- [ ] Fechamento com taxas mensais → aprovação → transferência → crédito conciliado.
- [ ] Estorno e repetição de eventos não provocam pagamentos duplicados.
- [ ] Emissão fiscal homologada e validada com contabilidade.
- [ ] Nenhuma movimentação real criada por testes.
- [ ] Backup, observabilidade, procedimento de recuperação e publicação controlada.
- [ ] Homologação final do usuário antes de habilitar operação financeira real.

## Decisões ainda necessárias

- [ ] Peso/valor de cada serviço no pacote e rateio de descontos comerciais.
- [ ] Política de inadimplência e de taxas mensais superiores à remuneração.
- [ ] Competência de serviços executados após o mês do recebimento.
- [ ] Regras contratuais/fiscais com contabilidade e assessoria jurídica.
- [ ] Periodicidade e autorização dos repasses em produção.

## Registro da entrega 1 — cobranças preparatórias

- Migração `202610070003_billing_drafts.sql` aplicada no Supabase.
- Gravação/leitura autenticada homologada em transação com rollback; sem emissão no Asaas.
- 42 testes selecionados aprovados; verificação de tipos e build aprovados.
- Formulário e rotas publicados em `https://dog-washer-one.vercel.app/financial`; Vercel Ready (6151c2c).
- Gravação pelo formulário e preenchimento contextual de pacote verificados no navegador. Rascunho temporário de homologação removido, sem cobrança no Asaas.
- Emissão de cobrança, QR Pix, recorrência e repasse automático continuam pendentes; nenhum desses itens foi marcado como pronto.

## Ordem das entregas

### Ajustes de cadastro do tutor — 07/10/2026

- [x] Captura por câmera para tutor e pet, com prévia, permissão explícita, encerramento dos tracks e alternativa de upload.
- [x] Testes de permissão negada e encerramento da câmera; tipos e build aprovados.
- [ ] Homologar captura com webcam física e persistência da foto no dispositivo do usuário.

- [x] Campo de foto do tutor (JPG/PNG/WebP até 5 MB), armazenamento privado e exibição no cadastro.
- [x] Botões Cancelar e Salvar explícitos, com contraste e rodapé fixo.
- [x] Checkboxes VIP/Escola e campos com bordas visíveis; preservação das marcações existentes.
- [x] Nove testes selecionados aprovados; formulário publicado conferido no navegador sem alterar dados reais.
- [ ] Homologar envio e leitura de uma foto em cadastro de teste ponta a ponta.

1. Cobranças integradas às três telas e persistência segura.
2. Conciliação e baixa de serviço com créditos de pacote.
3. Fechamento, extrato e transferência conciliada.
4. Fiscal e homologação completa do salão.
5. Recuperação complementar e aprimoramento visual.
6. Escola e Greenn (item 10), por último, conforme orientação do usuário.
# Homologação — confirmação controlada de pagamento

## Revisão de publicação — 09/10/2026

- [x] Tipos aprovados; suíte ampla executada: 35 arquivos aprovados, 149 testes aprovados, 7 arquivos falharam na preparação (incluindo configuração Supabase ausente). Não interpretar como homologação completa.
- [x] Retirar diagnóstico público privilegiado de saúde: rota antiga retorna 410 sem consultar usuários, resposta básica sem ambiente/uptime, cache desabilitado.
- [ ] Corrigir isolamento/configuração das sete suítes pendentes e repetir testes completos.
- [x] Reforçar adminProcedure com autenticação JWT e contexto de organização; cinco testes locais de barreira de autenticação/saúde aprovados e tipos aprovados.
- [ ] Atualizar testes legados que pressupõem listagens sem login ou gravação direta em banco; não fornecer credenciais reais para executar essas suítes antigas.
- [x] Atualizar clients.test.ts com quatro testes do roteador real, sem banco/credenciais: clientes, agenda, profissionais e alunos rejeitam acesso anônimo antes de consultar dados. Tipos aprovados.
- [ ] Recriar cobertura autenticada de listagem/detalhes de clientes com fixtures isoladas; não presumir cinco cadastros reais nem acesso público aos pets.
- [x] Atualizar validação autenticada de clientes: cinco casos inválidos rejeitados sem acessar banco; nome e telefone apenas com espaços não são aceitos.
- [ ] Homologar logout na interface e revogação de sessão; testes atualizados distinguem signOut do cliente do reconhecimento da API, sem cookies do legado.
- [ ] Validar fluxo real de cadastro, agenda, consumo/reversão e financeiro em homologação antes de liberar operação.
- [ ] Publicação desta revisão ainda não realizada; migração de hospedagem permanece pendente.

- [x] Adicionar simulação de pagamento exclusivamente no Asaas sandbox, com confirmação explícita e validação de unidade, conta, cliente, valor e referência.
- [x] Validar compilação e tipos após a alteração. A situação financeira continua sendo atualizada pelo webhook, não pelo botão de simulação.
- [x] Confirmar pagamento fictício de R$ 5,00 e verificar o webhook recebido no DWO: pay_p5iym3vcso3adm2j mudou de pending para received; líquido R$ 4,01. Cobrança avulsa permanece bloqueada para apuração por não possuir atendimento vinculado. Verificado na interface publicada em 08/10/2026.
- [ ] Fechar teste vinculado a atendimento realizado, apuração do profissional e crédito do repasse; não considerar o módulo liberado antes dessas evidências.

# Recuperação do agendamento Emergent — profissional e aluno

- [x] Comparar AppointmentDialog.js do legado com AppointmentForm.tsx do DWO. Identificado vínculo de aluno apenas no console e removido.
- [x] Persistir aluno executor no atendimento, separado do profissional supervisor; reabrir edição mantendo executor.
- [x] Aplicar migração 202610080003 no Supabase (validação com rollback seguida de aplicação bem-sucedida).
- [x] Validar no banco autorização, unidade, supervisor, serviço e porte permitidos ao aluno; impedir alteração do executor após conclusão.
- [x] Regra confirmada pela proprietária: aluno não gera split nem repasse, também não para o supervisor; teste automatizado de conciliação.
- [ ] Validar na interface um agendamento de aluno com cadastro completo e executar o fluxo até conclusão.
- [ ] Incorporar múltiplos serviços por visita do legado com duração, preço e baixa de pacote consistentes.
- [ ] Revisar disponibilidade, recorrência, filtros por executor e histórico prático do aluno.
- [ ] Integrar cobrança pela agenda com conciliação do atendimento do profissional.

# Portfólio acadêmico do aluno

- [x] Regra: somente atendimentos concluídos pelo aluno compõem a base do portfólio; sem split ou repasse.
- [x] Consulta protegida e limitada à unidade/organização do aluno, usando appointments.student_id e status completed como fonte de verdade.
- [x] Adicionar acesso ao portfólio pela tela Alunos, com pet, serviço, supervisor, data e duração prevista. Identificador do atendimento evita duplicação na consulta.
- [ ] Integrar portal acadêmico com autenticação, identificador externo e sincronização idempotente. Nenhum envio externo foi implementado ou realizado.
- [ ] Incorporar fotos autorizadas, avaliação da prática e horas efetivamente validadas pelo supervisor. Duração prevista não equivale a carga horária acadêmica validada.
- [ ] Testar interface com prática concluída e verificar isolamento entre unidades e exclusão de cancelamentos.

# Sincronização com o portfólio EXISTENTE no Portal Unidogwasher

- [x] Consultar código local portal-github: HistoricoEscolar.tsx, attendance.studentRegister e attendance.review. Portfólio usa attendance_records, com pending_review/reviewed.
- [x] Corrigir nomenclatura do DWO para histórico de práticas, não portfólio paralelo.
- [x] Definir contrato de referência operacional que exige registro do aluno e proíbe repasses; testar sequência registro do aluno → avaliação do instrutor.
- [ ] Conectar identidade DWO (UUID) à identidade do portal (ID numérico), curso e sessão prática.
- [ ] Implementar recebimento seguro e idempotente de referências no portal, sem criar presença automaticamente.
- [ ] Preencher a tela do aluno com cão e serviços da referência; aluno completa protocolos e ocorrências antes de submeter.
- [ ] Retornar ao DWO os estados registro pendente, avaliação pendente e avaliado, com autenticação e proteção contra eventos duplicados/fora de ordem.
- [ ] Conectar os dois sistemas e testar ponta a ponta. Nenhuma sincronização externa executada nesta etapa.

# Fila durável de referências acadêmicas

- [x] Aplicar migração 202610080004 após validação transacional com rollback: uma referência por atendimento concluído do aluno, sem criar presença ou avaliação.
- [x] Guardar referências em awaiting_mapping; acesso de leitura limitado à organização/unidade, sem escrita direta para usuários autenticados.
- [x] Exibir situação de preparação/envio no histórico de práticas, distinguindo referência entregue de presença registrada.
- [ ] Implementar vínculo explícito aluno DWO → usuário, curso e sessão do portal. Não inferir identidade pelo nome.
- [ ] Configurar canal autenticado entre servidores e receptor no portal antes de habilitar qualquer envio.
- [ ] Validar concorrência, reenvio e retorno de avaliação com dados de homologação. Sincronização externa permanece desligada.

# Planilha Lux Dog e conferência Asaas — 08/10/2026

- [x] Inspecionar em modo somente leitura o Excel enviado em outubro: 21 abas; cabeçalhos de clientes, pets, pacotes e financeiro confirmados. Linhas pré-preenchidas não foram contadas como registros reais.
- [x] Identificar extrato histórico EXTRATO_ASAAS_BRUTO com período declarado 01/07/2026–20/07/2026; não considerar saldo ou recebimento atual.
- [x] Adicionar conferência pontual por GET de cobrança sandbox emitida pelo DWO: comparar identidade, referência, modalidade, bruto, estado e líquido com o recebimento local. Não altera saldo, cobrança ou repasse.
- [x] Teste de divergências (identidade, estado, líquido, pagamento externo e ausência local), tipos e build aprovados.
- [ ] Homologar botão de conferência na interface publicada e guardar evidência.
- [ ] Mapear e limpar dados da planilha; importação e reconciliação de saldos continuam pendentes.
- [ ] Vincular cobranças históricas por ID Asaas + conta de origem, não somente por nome/valor.
- [ ] Conectar conta Asaas de produção em modo de consulta/webhook e homologar antes de automatizar recebimentos reais. Implementação atual permanece exclusivamente sandbox.
- [ ] Pagamentos em outras contas/bancos não devem ser presumidos recebidos no Asaas; conferir extratos de origem separadamente.

# Financeiro: saldo, extrato e relatório de conferência automática

- [x] Prioridade confirmada: salão opera somente com Asaas; demais bancos ficam para fase posterior.
- [x] Implementar consulta direta sandbox de saldo atual e extrato paginado, período até 93 dias, restrita à conta da empresa vinculada ao salão.
- [x] Separar entradas/saídas por página e tarifas de recebimentos; não tratar totais de página como período completo ou saldo atual como fechamento histórico.
- [x] Cruzar IDs Asaas do extrato com cobranças DWO da unidade e conta: informar recebimento com valor correspondente, divergência, origem vinculada não verificada ou sem vínculo.
- [x] Testar normalização, centavos, duplicatas, novos tipos de movimentação e períodos inválidos; tipos e build aprovados.
- [ ] Homologar consulta publicada contra API sandbox e verificar eventuais formatos/campos ausentes.
- [ ] Relatório completo persistido, paginação integral, taxas, transferências, repasses, estornos e vínculo operacional ainda pendentes.
- [ ] Ativar produção somente com credencial segura e homologação de consulta/webhooks; não habilitar saques neste fluxo.

# Preparação fiscal — salão e escola

- [x] Registrar divisão atual: contabilidade emite notas do salão; responsável emite notas da escola. Não modificar esse processo automaticamente.
- [x] Revisar implementação legada e não copiar códigos municipais ou alíquotas presumidas.
- [x] Implementar rascunho vinculado a uma cobrança emitida, limitado à organização/unidade e sem envio ao Asaas ou à contabilidade.
- [x] Aplicar migração 202610080005 após teste transacional com rollback e validar tipos.
- [x] Preencher valor da cobrança de agendamento a partir do atendimento selecionado.
- [ ] Homologar preparação fiscal na interface publicada; revisar/exportar dados e registrar notas emitidas externamente.
- [ ] Confirmar código municipal, ISS, competência, dados fiscais e processo de emissão com a contabilidade.
- [ ] Implementar e homologar emissão Asaas, estados fiscais, PDF/XML e prevenção de duplicidade com notas externas. Emissão automática continua desabilitada.
- [ ] Configurar fluxo fiscal separado da escola e empresa responsável; não utilizar configuração do salão.
- [x] Disponibilizar dois caminhos na tela: preparação para DWO/Asaas (emissão bloqueada) e exportação CSV individual para a contabilidade.
- [x] Exportar identificação da organização/unidade, tutor, CPF informado, email, descrição, valor e IDs de cobrança/pagamento; proteger CSV contra fórmulas e delimitações maliciosas.
- [ ] Homologar download na interface e complementar dados do emitente/endereço e formato exigido pelo escritório. Exportação não é envio nem documento fiscal.
- [ ] Registrar número, data e comprovante da nota emitida externamente, com bloqueio de emissão duplicada, antes de habilitar DWO/Asaas.
- [x] Implementar registro de nota externa com número, chave, data, valor e descrição; permitir cobrança ainda não identificada e distinguir essa pendência na tela.
- [x] Bloquear nova preparação para cobrança com nota externa vinculada e cancelar rascunho ainda não emitido de forma transacional. Registro não valida autenticidade nem confirma pagamento.
- [ ] Anexar PDF/XML, homologar interface e implementar vínculo posterior auditado. Ainda não registrar a NF enviada contra cobrança presumida.
- [ ] Importar cadastros/histórico com revisão de duplicatas e identificar a parcela do plano mensal correspondente à NF nº 1; não associar somente por nome ou valor.

