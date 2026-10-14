export const importSheets = ["CLIENTES", "PETS", "PACOTES", "FINANCEIROPACOTES"] as const;
const headers: Record<string, Record<string,string>> = {
 CLIENTES:{A:"ID cliente na origem",B:"Nome do tutor",C:"Telefone",D:"CPF",E:"Email",F:"Endereço",G:"Quantidade de pets",H:"Origem/perfil",I:"Contrato enviado",J:"Contrato assinado",K:"Incluído no simulador"},
 PETS:{A:"ID pet na origem",B:"Tutor",C:"ID cliente na origem",D:"Nome do pet",E:"Pet e tutor",F:"Raça",G:"Porte",H:"Pelagem",I:"Nascimento (valor da origem)",J:"Sexo",K:"Condição especial",L:"Observações"},
 PACOTES:{A:"ID pacote na origem",B:"Pet e tutor",C:"ID pet na origem",D:"ID cliente na origem",E:"Frequência",F:"Plano",G:"Banhos contratados",H:"Tosas contratadas",I:"Banhos utilizados",J:"Tosas utilizadas",K:"Saldo de banhos",L:"Saldo de tosas",M:"Status",N:"Validade (valor da origem)",O:"Status no radar",P:"Ação",Q:"Vínculo financeiro"},
 FINANCEIROPACOTES:{A:"Contrato (valor da origem)",B:"Pagamento (valor da origem)",C:"Pet e tutor",D:"ID pacote na origem",E:"Tipo",F:"Plano",G:"Valor (origem)",H:"Meio de pagamento",I:"Status",J:"Competência",K:"Descrição"},
};
export function importFieldLabel(sheet:string,field:string){return `${field} · ${headers[sheet]?.[field]??"Coluna da origem"}`;}
