# DWO: arquitetura comercial white-label

## Base entregue

- DWO é a plataforma; a identidade exibida pertence à organização autenticada.
- Primeira marca: LUX DOG by Dog Washer. Alternativa: LUX DOG — Um salão Dog Washer.
- Nome, assinatura e cores são persistidos por organização; somente owner/admin podem alterar.
- RLS separa leitura e edição entre organizações. O cliente não escolhe o organization_id da gravação.
- O catálogo de módulos é informativo, não é um sistema de licenciamento.

## Próximas camadas obrigatórias

1. Licenças por organização com módulos, vigência, limites e suspensão. Validar em cada operação no servidor, além de menus e rotas.
2. Onboarding empresarial: organização, unidades, usuários, marca e contas por CNPJ.
3. Identidade completa: logotipo em armazenamento próprio, domínio verificado, emails e revisão das cores fixas legadas.
4. Cobrança da assinatura do DWO separada das cobranças de clientes do salão.
5. Portabilidade, backup, auditoria, política de suporte, privacidade e contrato comercial.

## Pagamentos de parceiros

- Marca visual não determina titularidade financeira ou fiscal.
- Conta Asaas pertence ao CNPJ configurado; não usar a conta LUX DOG como conta padrão de outros clientes.
- Carteira de parceiro deve ser vinculada e verificada no contexto de conta/unidade; um UUID informado não basta.
- Taxas e percentuais têm vigência e histórico por organização.
- O módulo de parceiros depende dos vínculos de operação e financeiro. Não permitir repasse sem serviço, cobrança/recebimento e conciliação correspondentes.
- Carteiras, cobranças, fechamentos, transferências e notas precisam manter a organização de origem.
- Validar o modelo comercial e os requisitos Asaas antes de habilitar onboarding automático de subcontas de terceiros. A estrutura de software não representa aprovação do provedor.

## Limites atuais

Esta entrega personaliza o layout compartilhado. Telas antigas ainda possuem cores fixas. Logotipo configurável, domínio, contratação/licenciamento de módulos e onboarding de contas financeiras ainda não estão implementados. Não comercializar como solução financeira totalmente homologada antes dos critérios do TODO_DWO.md.
