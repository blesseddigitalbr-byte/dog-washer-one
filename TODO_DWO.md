# DWO — plano de recuperação e checklist funcional

Atualizado em 07/10/2026. Prioridade: salão. Referência: código local do Emergent e requisitos acordados. Este documento é um backlog, não uma declaração de funcionalidades prontas.

Legenda: `[x]` etapa verificada; `[ ]` trabalho pendente. **Recuperar** = identificado no legado, mas sem equivalência completa validada no DWO. **Aprimorar** = existe parcialmente. **Novo** = requisito adicional. A ausência precisa ser confirmada por comparação detalhada antes de implementar duplicatas.

## 0. Auditoria e preservação

- [x] Inventário inicial de telas e rotas do Emergent (`RESGATE_EMERGENT.md`).
- [ ] Comparar cada ação, campo, regra e permissão entre os projetos.
- [ ] Confrontar testes e relatórios antigos com o comportamento atual.
- [ ] Identificar versão mais completa do legado e componentes compartilhados.
- [ ] Documentar funções desabilitadas, simuladas ou incompletas.
- [ ] Definir correspondência MongoDB → Supabase sem perder relações.
- [ ] Preparar backup, migrações reversíveis e plano de recuperação.

## 1. Cobranças — recuperar / prioridade P0

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
