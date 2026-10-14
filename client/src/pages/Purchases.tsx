import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLocation } from "wouter";
const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    n / 100
  );
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
const methods = {
  PIX: "Pix",
  BOLETO: "Boleto",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  BANK_TRANSFER: "Transferência",
  CASH: "Dinheiro",
  OTHER: "Outro",
};
function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  maxLength = 160,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="block">
      {label}
      <Input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        maxLength={maxLength}
      />
    </label>
  );
}
function Supplier({
  row,
  refresh,
  onUse,
}: {
  row: any;
  refresh: () => void;
  onUse: () => void;
}) {
  const [name, setName] = useState(row.name),
    [document, setDocument] = useState(row.document ?? ""),
    [email, setEmail] = useState(row.email ?? ""),
    [phone, setPhone] = useState(row.phone ?? "");
  const update = trpc.purchases.updateSupplier.useMutation({
    onSuccess: () => {
      refresh();
      toast.success("Fornecedor atualizado");
    },
    onError: e => {
      toast.error(e.message);
      if (e.data?.code === "CONFLICT") refresh();
    },
  });
  const save = (active: boolean) =>
    update.mutate({
      id: row.id,
      name,
      document,
      email,
      phone,
      isActive: active,
      expectedUpdatedAt: row.updated_at,
    });
  return (
    <section className="border rounded-lg p-4 space-y-2">
      <h3 className="font-semibold">
        {row.name}
        {!row.is_active && " · Inativo"}
      </h3>
      <p className="text-sm">
        {row.document || "Documento não informado"} ·{" "}
        {row.email || "Email não informado"} ·{" "}
        {row.phone || "Telefone não informado"}
      </p>
      <Button variant="outline" disabled={!row.is_active} onClick={onUse}>
        Usar em nota
      </Button>
      <details>
        <summary className="cursor-pointer">Editar fornecedor</summary>
        <form
          className="space-y-2 pt-2"
          onSubmit={e => {
            e.preventDefault();
            save(row.is_active);
          }}
        >
          <fieldset disabled={update.isPending} className="space-y-2">
            <Field
              label="Nome do fornecedor"
              value={name}
              onChange={setName}
              required
            />
            <Field
              label="CPF/CNPJ"
              value={document}
              onChange={setDocument}
              maxLength={30}
            />
            <Field
              label="Email do fornecedor"
              value={email}
              onChange={setEmail}
              type="email"
              maxLength={254}
            />
            <Field
              label="Telefone do fornecedor"
              value={phone}
              onChange={setPhone}
              maxLength={40}
            />
            <Button>Salvar fornecedor</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (
                  window.confirm(
                    "Alterar a situação deste fornecedor? O histórico será preservado."
                  )
                )
                  save(!row.is_active);
              }}
            >
              {row.is_active ? "Inativar" : "Reativar"}
            </Button>
          </fieldset>
        </form>
      </details>
    </section>
  );
}
function PurchaseDocument({ doc, refresh }: { doc: any; refresh: () => void }) {
  const [amount, setAmount] = useState(""),
    [date, setDate] = useState(today),
    [method, setMethod] = useState<keyof typeof methods>("PIX"),
    [reference, setReference] = useState("");
  const [requestId, setRequestId] = useState(() => crypto.randomUUID()),
    [show, setShow] = useState(false),
    [offset, setOffset] = useState(0);
  const history = trpc.purchases.payments.useQuery(
    { documentId: doc.id, offset },
    { enabled: show, retry: false }
  );
  const pay = trpc.purchases.recordPayment.useMutation({
    onSuccess: () => {
      setAmount("");
      setReference("");
      setRequestId(crypto.randomUUID());
      refresh();
      void history.refetch();
      toast.success("Pagamento informado registrado; não conciliado");
    },
    onError: e => toast.error(e.message),
  });
  const remaining = Number(doc.total_cents) - Number(doc.paid_cents);
  return (
    <section className="bg-white border rounded-xl p-5 space-y-3">
      <h2 className="font-semibold">
        Nota {doc.number}
        {doc.series && ` · Série ${doc.series}`}
      </h2>
      <p>
        Fornecedor: {doc.supplier_name ?? doc.supplier_id} · Emissão:{" "}
        {doc.issue_date}
      </p>
      <p>
        Total: {money(Number(doc.total_cents))} · Pago informado:{" "}
        {money(Number(doc.paid_cents))} · Saldo informado: {money(remaining)}
      </p>
      <p>
        Custo já vinculado às entradas de estoque:{" "}
        {money(Number(doc.entries_cost_cents))}
      </p>
      {doc.access_key && (
        <p className="break-all text-sm">Chave/referência: {doc.access_key}</p>
      )}
      {doc.notes && <p className="break-words">{doc.notes}</p>}
      {remaining > 0 && (
        <details>
          <summary className="cursor-pointer">
            Informar pagamento já realizado
          </summary>
          <form
            className="space-y-3 pt-3"
            onSubmit={e => {
              e.preventDefault();
              pay.mutate({
                documentId: doc.id,
                requestId,
                amountCents: Math.round(Number(amount) * 100),
                date,
                method,
                reference,
              });
            }}
          >
            <fieldset disabled={pay.isPending} className="space-y-3">
              <Field
                label="Valor pago (R$)"
                value={amount}
                onChange={setAmount}
                type="number"
                required
              />
              <label className="block">
                Data do pagamento
                <Input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  max={today()}
                  required
                />
              </label>
              <label className="block">
                Meio do pagamento
                <select
                  className="block border rounded p-2"
                  value={method}
                  onChange={e => setMethod(e.target.value as typeof method)}
                >
                  {Object.entries(methods).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="Referência / comprovante conferido"
                value={reference}
                onChange={setReference}
                maxLength={200}
                required
              />
              <p className="text-sm">
                Registro manual, sem transferência ou confirmação Asaas. Não
                registrar pagamento apenas agendado.
              </p>
              <Button
                disabled={
                  !amount || reference.trim().length < 3 || pay.isPending
                }
              >
                Registrar pagamento informado
              </Button>
            </fieldset>
          </form>
        </details>
      )}
      <Button variant="outline" onClick={() => setShow(!show)}>
        {show ? "Fechar pagamentos" : "Ver pagamentos informados"}
      </Button>
      {show &&
        (history.isLoading ? (
          <p>Carregando pagamentos…</p>
        ) : history.error ? (
          <p role="alert">{history.error.message}</p>
        ) : (
          <div className="space-y-2">
            {!history.data?.total && <p>Nenhum pagamento informado.</p>}
            {history.data?.rows.map((p: any) => (
              <p className="border-t py-2 text-sm" key={p.id}>
                {p.payment_date} · {money(Number(p.amount_cents))} ·{" "}
                {methods[p.method as keyof typeof methods]}
                <br />
                {p.reference}
                <br />
                Registrado por {p.actor_id}
              </p>
            ))}
            {!!history.data?.total && (
              <div className="flex gap-3">
                <Button
                  disabled={!offset}
                  onClick={() => setOffset(Math.max(0, offset - 50))}
                >
                  Anterior
                </Button>
                <span>
                  {offset + 1}–{Math.min(offset + 50, history.data.total)} de{" "}
                  {history.data.total}
                </span>
                <Button
                  disabled={offset + 50 >= history.data.total}
                  onClick={() => setOffset(offset + 50)}
                >
                  Próxima
                </Button>
              </div>
            )}
          </div>
        ))}
    </section>
  );
}
export default function Purchases() {
  const [, navigate] = useLocation();
  const [supplierOffset, setSupplierOffset] = useState(0),
    [offset, setOffset] = useState(0),
    [filter, setFilter] = useState("");
  const [name, setName] = useState(""),
    [document, setDocument] = useState(""),
    [email, setEmail] = useState(""),
    [phone, setPhone] = useState("");
  const [supplierId, setSupplierId] = useState(""),
    [number, setNumber] = useState(""),
    [series, setSeries] = useState(""),
    [date, setDate] = useState(today),
    [total, setTotal] = useState(""),
    [key, setKey] = useState(""),
    [notes, setNotes] = useState("");
  const suppliers = trpc.purchases.suppliers.useQuery(
      { offset: supplierOffset },
      { retry: false }
    ),
    docs = trpc.purchases.documents.useQuery(
      { offset, number: filter || undefined },
      { retry: false }
    );
  const create = trpc.purchases.createSupplier.useMutation({
    onSuccess: () => {
      setName("");
      setDocument("");
      setEmail("");
      setPhone("");
      setSupplierId("");
      void suppliers.refetch();
      toast.success("Fornecedor cadastrado");
    },
    onError: e => toast.error(e.message),
  });
  const invoice = trpc.purchases.createDocument.useMutation({
    onSuccess: () => {
      setNumber("");
      setSeries("");
      setTotal("");
      setKey("");
      setNotes("");
      setOffset(0);
      setFilter("");
      void docs.refetch();
      toast.success(
        "Nota de compra registrada; estoque e pagamentos não alterados"
      );
    },
    onError: e => toast.error(e.message),
  });
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-5">
      <h1 className="text-3xl font-semibold">Fornecedores e compras</h1>
      <p>
        Registro manual das notas de compra e dos pagamentos informados. Não
        emite nota fiscal, não valida autenticidade e não confirma pagamento
        bancário. Ainda não importa XML/PDF nem lança despesas no painel
        financeiro.
      </p>
      <Button variant="outline" onClick={() => navigate("/products")}>
        Ir para entradas e consumo de produtos
      </Button>
      <details className="border rounded-xl bg-white p-5">
        <summary className="font-semibold cursor-pointer">
          Cadastrar fornecedor
        </summary>
        <form
          className="space-y-3 pt-3"
          onSubmit={e => {
            e.preventDefault();
            create.mutate({ name, document, email, phone });
          }}
        >
          <fieldset disabled={create.isPending} className="space-y-3">
            <Field
              label="Razão social / nome"
              value={name}
              onChange={setName}
              maxLength={160}
              required
            />
            <Field
              label="CPF/CNPJ (opcional)"
              value={document}
              onChange={setDocument}
              maxLength={30}
            />
            <Field
              label="Email (opcional)"
              value={email}
              onChange={setEmail}
              type="email"
              maxLength={254}
            />
            <Field
              label="Telefone (opcional)"
              value={phone}
              onChange={setPhone}
              maxLength={40}
            />
            <Button>Cadastrar fornecedor</Button>
          </fieldset>
        </form>
      </details>
      <details className="border rounded-xl bg-white p-5">
        <summary className="font-semibold cursor-pointer">
          Consultar / editar fornecedores
        </summary>
        <div className="space-y-3 pt-3">
          {suppliers.isLoading ? (
            <p>Carregando fornecedores…</p>
          ) : suppliers.error ? (
            <p role="alert">{suppliers.error.message}</p>
          ) : (
            <>
              {!suppliers.data?.total && <p>Nenhum fornecedor cadastrado.</p>}
              {suppliers.data?.rows.map((s: any) => (
                <Supplier
                  key={`${s.id}-${s.updated_at}`}
                  row={s}
                  refresh={() => void suppliers.refetch()}
                  onUse={() => setSupplierId(s.id)}
                />
              ))}
              {!!suppliers.data?.total && (
                <div className="flex gap-3">
                  <Button
                    disabled={!supplierOffset}
                    onClick={() => {
                      setSupplierOffset(Math.max(0, supplierOffset - 50));
                      setSupplierId("");
                    }}
                  >
                    Fornecedores anteriores
                  </Button>
                  <span>
                    {supplierOffset + 1}–
                    {Math.min(supplierOffset + 50, suppliers.data.total)} de{" "}
                    {suppliers.data.total}
                  </span>
                  <Button
                    disabled={supplierOffset + 50 >= suppliers.data.total}
                    onClick={() => {
                      setSupplierOffset(supplierOffset + 50);
                      setSupplierId("");
                    }}
                  >
                    Mais fornecedores
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </details>
      <details className="border rounded-xl bg-white p-5">
        <summary className="font-semibold cursor-pointer">
          Registrar nota de compra
        </summary>
        <form
          className="space-y-3 pt-3"
          onSubmit={e => {
            e.preventDefault();
            invoice.mutate({
              supplierId,
              number,
              series,
              issueDate: date,
              totalCents: Math.round(Number(total) * 100),
              accessKey: key,
              notes,
            });
          }}
        >
          <fieldset
            disabled={invoice.isPending || !!suppliers.error}
            className="space-y-3"
          >
            <label className="block">
              Fornecedor da nota
              <select
                className="block border rounded p-2 w-full"
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                required
              >
                <option value="">Selecione</option>
                {suppliers.data?.rows
                  .filter((s: any) => s.is_active)
                  .map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </label>
            <p className="text-sm">
              Os fornecedores desta página aparecem na lista. Use a consulta
              acima para navegar entre páginas.
            </p>
            <Field
              label="Número da nota / documento"
              value={number}
              onChange={setNumber}
              maxLength={80}
              required
            />
            <Field
              label="Série (opcional)"
              value={series}
              onChange={setSeries}
              maxLength={20}
            />
            <Field
              label="Data de emissão"
              value={date}
              onChange={setDate}
              type="date"
              required
            />
            <Field
              label="Total da nota (R$)"
              value={total}
              onChange={setTotal}
              type="number"
              required
            />
            <Field
              label="Chave / referência (opcional)"
              value={key}
              onChange={setKey}
              maxLength={100}
            />
            <Field
              label="Observações (opcional)"
              value={notes}
              onChange={setNotes}
              maxLength={1000}
            />
            <p className="text-sm">
              Cadastrar a nota não aumenta estoque nem registra pagamento.
              Depois, vincule cada entrada na tela Produtos. Notas e pagamentos
              registrados não podem ser apagados por esta tela.
            </p>
            <Button disabled={!supplierId || invoice.isPending}>
              Registrar nota
            </Button>
          </fieldset>
        </form>
      </details>
      <label className="block">
        Consultar pelo número exato da nota
        <Input
          value={filter}
          onChange={e => {
            setFilter(e.target.value);
            setOffset(0);
          }}
          maxLength={80}
        />
      </label>
      {docs.isLoading ? (
        <p>Carregando notas…</p>
      ) : docs.error ? (
        <p role="alert">{docs.error.message}</p>
      ) : (
        <>
          {!docs.data?.total && <p>Nenhuma nota encontrada nesta unidade.</p>}
          {docs.data?.rows.map((d: any) => (
            <PurchaseDocument
              key={d.id}
              doc={d}
              refresh={() => void docs.refetch()}
            />
          ))}
          {!!docs.data?.total && (
            <div className="flex gap-3">
              <Button
                disabled={!offset}
                onClick={() => setOffset(Math.max(0, offset - 50))}
              >
                Notas anteriores
              </Button>
              <span>
                {offset + 1}–{Math.min(offset + 50, docs.data.total)} de{" "}
                {docs.data.total}
              </span>
              <Button
                disabled={offset + 50 >= docs.data.total}
                onClick={() => setOffset(offset + 50)}
              >
                Mais notas
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
