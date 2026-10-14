import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
const money = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100
  );
const quantity = (n: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(n);
const kinds = { purchase: "Entrada", consumption: "Consumo", loss: "Perda" };
function Supply({
  product,
  documents,
  refresh,
}: {
  product: any;
  documents: any[];
  refresh: () => void;
}) {
  const [name, setName] = useState(product.name),
    [minimum, setMinimum] = useState(String(product.minimum_stock));
  const [kind, setKind] = useState<keyof typeof kinds>("purchase"),
    [amount, setAmount] = useState(""),
    [cost, setCost] = useState(""),
    [reason, setReason] = useState("");
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [documentId, setDocumentId] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false),
    [offset, setOffset] = useState(0);
  const history = trpc.supplies.history.useQuery(
    { id: product.id, offset },
    { enabled: historyOpen, retry: false }
  );
  const move = trpc.supplies.move.useMutation({
    onSuccess: () => {
      setAmount("");
      setCost("");
      setReason("");
      setRequestId(crypto.randomUUID());
      refresh();
      void history.refetch();
      toast.success("Movimento registrado no estoque");
    },
    onError: e => {
      toast.error(e.message);
      if (e.data?.code === "CONFLICT") refresh();
    },
  });
  const update = trpc.supplies.update.useMutation({
    onSuccess: () => {
      refresh();
      toast.success("Cadastro atualizado");
    },
    onError: e => {
      toast.error(e.message);
      if (e.data?.code === "CONFLICT") refresh();
    },
  });
  const save = (isActive: boolean) =>
    update.mutate({
      id: product.id,
      name,
      minimumStock: Number(minimum),
      isActive,
      expectedUpdatedAt: product.updated_at,
    });
  const low =
    product.is_active &&
    Number(product.minimum_stock) > 0 &&
    Number(product.stock) < Number(product.minimum_stock);
  return (
    <section className="bg-white border rounded-xl p-5 space-y-4">
      <h2 className="font-semibold text-lg">
        {product.name} · {product.sku}
        {!product.is_active && " · Inativo"}
      </h2>
      <p>
        Estoque:{" "}
        <strong>
          {quantity(Number(product.stock))} {product.measure}
        </strong>{" "}
        · Mínimo: {quantity(Number(product.minimum_stock))} {product.measure}
      </p>
      {low && (
        <p role="status" className="text-amber-800">
          Abaixo do estoque mínimo
        </p>
      )}
      <details>
        <summary className="cursor-pointer">Editar cadastro</summary>
        <div className="space-y-3 pt-3">
          <label className="block">
            Nome
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={120}
            />
          </label>
          <label className="block">
            Estoque mínimo ({product.measure})
            <Input
              type="number"
              min="0"
              max="1000000000"
              step="0.001"
              value={minimum}
              onChange={e => setMinimum(e.target.value)}
            />
          </label>
          <div className="flex gap-3">
            <Button
              disabled={update.isPending}
              onClick={() => save(product.is_active)}
            >
              Salvar cadastro
            </Button>
            <Button
              variant="outline"
              disabled={update.isPending || move.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    product.is_active
                      ? "Inativar este insumo? O histórico será preservado."
                      : "Reativar este insumo?"
                  )
                )
                  save(!product.is_active);
              }}
            >
              {product.is_active ? "Inativar" : "Reativar"}
            </Button>
          </div>
          <p className="text-sm">
            Código e unidade de medida são preservados para manter o histórico
            consistente.
          </p>
        </div>
      </details>
      {product.is_active && (
        <form
          className="space-y-3 border-t pt-4"
          onSubmit={e => {
            e.preventDefault();
            move.mutate({
              id: product.id,
              requestId,
              version: product.version,
              kind,
              quantity: Number(amount),
              purchaseCostCents:
                kind === "purchase"
                  ? Math.round(Number(cost) * 100)
                  : undefined,
              documentId:
                kind === "purchase" ? documentId || undefined : undefined,
              reason,
            });
          }}
        >
          <fieldset
            disabled={move.isPending || update.isPending}
            className="space-y-3"
          >
            <legend className="font-medium">Movimentar insumo</legend>
            <label className="block">
              Movimento
              <select
                className="block border rounded p-2 w-full"
                value={kind}
                onChange={e => setKind(e.target.value as keyof typeof kinds)}
              >
                {Object.entries(kinds).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              Quantidade ({product.measure})
              <Input
                type="number"
                min="0.001"
                max="1000000000"
                step="0.001"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </label>
            {kind === "purchase" && (
              <label className="block">
                Custo total desta entrada (R$)
                <Input
                  type="number"
                  min="0"
                  max="10000000000"
                  step="0.01"
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  required
                />
              </label>
            )}
            {kind === "purchase" && (
              <label className="block">
                Nota de compra
                <select
                  className="block border rounded p-2 w-full"
                  value={documentId}
                  onChange={e => setDocumentId(e.target.value)}
                >
                  <option value="">Sem nota vinculada</option>
                  {documents.map(d => (
                    <option key={d.id} value={d.id}>
                      Nota {d.number} / {d.series || "sem série"} ·{" "}
                      {d.supplier_name ?? d.supplier_id}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block">
              Motivo / referência
              <Input
                value={reason}
                onChange={e => setReason(e.target.value)}
                minLength={3}
                maxLength={1000}
                required
              />
            </label>
            <Button
              disabled={!amount || reason.trim().length < 3 || move.isPending}
            >
              Registrar movimento
            </Button>
          </fieldset>
        </form>
      )}
      <Button variant="outline" onClick={() => setHistoryOpen(!historyOpen)}>
        {historyOpen ? "Fechar histórico" : "Ver movimentos"}
      </Button>
      {historyOpen &&
        (history.isLoading ? (
          <p>Carregando movimentos…</p>
        ) : history.error ? (
          <p role="alert">{history.error.message}</p>
        ) : (
          <div className="space-y-2">
            {!history.data?.total && <p>Nenhum movimento registrado.</p>}
            {history.data?.rows.map((m: any) => (
              <div className="border-t py-2 text-sm break-words" key={m.id}>
                {new Date(m.created_at).toLocaleString("pt-BR")} ·{" "}
                {kinds[m.kind as keyof typeof kinds]} ·{" "}
                {quantity(Number(m.quantity))} {product.measure}
                <br />
                Saldo: {quantity(Number(m.before_stock))} →{" "}
                {quantity(Number(m.after_stock))}
                {m.purchase_cost_cents !== null && (
                  <>
                    {" "}
                    · Custo da entrada: {money(Number(m.purchase_cost_cents))}
                  </>
                )}
                <br />
                Motivo: {m.reason}
                <br />
                Autor: {m.actor_id}
              </div>
            ))}
            {!!history.data?.total && (
              <div className="flex gap-3">
                <Button
                  disabled={!offset}
                  onClick={() => setOffset(Math.max(0, offset - 50))}
                >
                  Movimentos anteriores
                </Button>
                <span>
                  {offset + 1}–{Math.min(offset + 50, history.data.total)} de{" "}
                  {history.data.total}
                </span>
                <Button
                  disabled={offset + 50 >= history.data.total}
                  onClick={() => setOffset(offset + 50)}
                >
                  Mais movimentos
                </Button>
              </div>
            )}
          </div>
        ))}
    </section>
  );
}
export default function Products() {
  const [noteNumber, setNoteNumber] = useState("");
  const documents = trpc.purchases.documents.useQuery(
    { offset: 0, number: noteNumber || undefined },
    { retry: false }
  );
  const [offset, setOffset] = useState(0),
    [name, setName] = useState(""),
    [sku, setSku] = useState(""),
    [measure, setMeasure] = useState<"un" | "ml" | "g">("un"),
    [minimum, setMinimum] = useState("0");
  const query = trpc.supplies.list.useQuery({ offset }, { retry: false });
  const create = trpc.supplies.create.useMutation({
    onSuccess: () => {
      setName("");
      setSku("");
      setMinimum("0");
      setOffset(0);
      void query.refetch();
      toast.success("Insumo cadastrado com estoque zero");
    },
    onError: e => toast.error(e.message),
  });
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-5">
      <h1 className="text-3xl font-semibold">Produtos para consumo do salão</h1>
      <p>
        Insumos de uso interno, não mercadorias para venda. Quantidades são
        registradas na unidade escolhida; não há conversão automática de frascos
        para ml. Entradas, consumo e perdas não geram cobranças nem despesas
        financeiras automaticamente.
      </p>
      <label className="block">
        Filtrar notas pelo número exato para vincular entradas
        <Input
          value={noteNumber}
          onChange={e => setNoteNumber(e.target.value)}
          maxLength={80}
        />
      </label>
      <p className="text-sm">
        As listas mostram até 50 notas por vez. Cadastre a nota em Gestão →
        Fornecedores e compras antes de vincular uma entrada.
      </p>
      {documents.error && (
        <p role="alert">
          Notas indisponíveis para seleção. Não registre uma entrada sem vínculo
          se ela já possui nota cadastrada.
        </p>
      )}
      <details className="bg-white border rounded-xl p-5">
        <summary className="cursor-pointer font-semibold">
          Cadastrar insumo
        </summary>
        <form
          className="space-y-3 pt-4"
          onSubmit={e => {
            e.preventDefault();
            create.mutate({
              name,
              sku,
              measure,
              minimumStock: Number(minimum),
            });
          }}
        >
          <fieldset disabled={create.isPending} className="space-y-3">
            <label className="block">
              Nome do insumo
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                minLength={2}
                maxLength={120}
                required
              />
            </label>
            <label className="block">
              Código interno
              <Input
                value={sku}
                onChange={e => setSku(e.target.value.toUpperCase())}
                maxLength={40}
                pattern="[A-Z0-9._-]+"
                placeholder="SHAMPOO-01"
                required
              />
            </label>
            <label className="block">
              Unidade de medida
              <select
                className="block border rounded p-2"
                value={measure}
                onChange={e => setMeasure(e.target.value as typeof measure)}
              >
                <option value="un">Unidade (un)</option>
                <option value="ml">Mililitro (ml)</option>
                <option value="g">Grama (g)</option>
              </select>
            </label>
            <label className="block">
              Estoque mínimo
              <Input
                type="number"
                min="0"
                max="1000000000"
                step="0.001"
                value={minimum}
                onChange={e => setMinimum(e.target.value)}
                required
              />
            </label>
            <Button disabled={create.isPending}>
              Cadastrar com estoque zero
            </Button>
          </fieldset>
        </form>
      </details>
      {query.isLoading ? (
        <p>Carregando estoque…</p>
      ) : query.error ? (
        <p role="alert">{query.error.message}</p>
      ) : (
        <>
          {!query.data?.total && <p>Nenhum insumo cadastrado nesta unidade.</p>}
          {query.data?.rows.map((p: any) => (
            <Supply
              key={`${p.id}-${p.version}-${p.updated_at}`}
              product={p}
              documents={documents.data?.rows ?? []}
              refresh={() => void query.refetch()}
            />
          ))}
          {!!query.data?.total && (
            <div className="flex gap-3">
              <Button
                disabled={!offset}
                onClick={() => setOffset(Math.max(0, offset - 50))}
              >
                Anterior
              </Button>
              <span>
                {offset + 1}–{Math.min(offset + 50, query.data.total)} de{" "}
                {query.data.total}
              </span>
              <Button
                disabled={offset + 50 >= query.data.total}
                onClick={() => setOffset(offset + 50)}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
