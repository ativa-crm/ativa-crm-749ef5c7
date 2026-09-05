import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, FileText, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { data as dataBR, numero, paraNumero, reais, rotulo } from "@/lib/formato";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/orcamentos/")({
  head: () => ({
    meta: [
      { title: "Orçamentos | CRM de Topografia" },
      {
        name: "description",
        content:
          "Orçamentos por cliente e imóvel, com itens, desconto, validade e controle de status.",
      },
      { property: "og:title", content: "Orçamentos | CRM de Topografia" },
      {
        property: "og:description",
        content: "Lista de orçamentos com filtro por status e criação em três passos.",
      },
    ],
  }),
  component: Pagina,
});

const STATUS = [
  { valor: "rascunho", rotulo: "Rascunho" },
  { valor: "enviado", rotulo: "Enviado" },
  { valor: "aprovado", rotulo: "Aprovado" },
  { valor: "recusado", rotulo: "Recusado" },
  { valor: "expirado", rotulo: "Expirado" },
];

type Linha = {
  id: string;
  numero: string | null;
  status: string | null;
  total: number | null;
  criado_em: string | null;
  clientes: { nome: string | null } | { nome: string | null }[] | null;
  imoveis: { nome: string | null } | { nome: string | null }[] | null;
};

function um<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function Etiqueta({ status }: { status: string | null }) {
  const cor =
    status === "aprovado"
      ? "bg-primary text-primary-foreground"
      : status === "recusado" || status === "expirado"
        ? "bg-destructive text-destructive-foreground"
        : status === "enviado"
          ? "bg-accent text-accent-foreground"
          : "bg-muted text-muted-foreground";
  return (
    <span className={`rounded-lg px-2.5 py-1 text-sm font-extrabold ${cor}`}>
      {rotulo(status) || "—"}
    </span>
  );
}

function Pagina() {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<string>("");
  const [novoAberto, setNovoAberto] = useState(false);

  const { data: orcamentos, isPending, error } = useQuery({
    queryKey: ["orcamentos"],
    queryFn: async (): Promise<Linha[]> => {
      const { data: linhas, error: erro } = await supabase
        .from("orcamentos")
        .select("id, numero, status, total, criado_em, clientes(nome), imoveis(nome)")
        .order("criado_em", { ascending: false });
      if (erro) throw erro;
      return (linhas ?? []) as unknown as Linha[];
    },
  });

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (orcamentos ?? []).filter((o) => {
      if (filtro && (o.status ?? "") !== filtro) return false;
      if (!termo) return true;
      const alvo = `${o.numero ?? ""} ${um(o.clientes)?.nome ?? ""} ${
        um(o.imoveis)?.nome ?? ""
      }`.toLowerCase();
      return alvo.includes(termo);
    });
  }, [orcamentos, busca, filtro]);

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-3xl font-extrabold text-foreground">
          <FileText className="size-8 text-primary" strokeWidth={2.5} />
          Orçamentos
        </h1>
        <Button
          onClick={() => setNovoAberto(true)}
          className="h-14 rounded-xl px-5 text-lg font-extrabold"
        >
          <Plus className="size-6" strokeWidth={3} />
          Novo orçamento
        </Button>
      </header>

      <div className="mt-4 relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por número, cliente ou imóvel"
          className="h-14 rounded-xl border-2 pl-12 text-lg font-semibold"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {[{ valor: "", rotulo: "Todos" }, ...STATUS].map((s) => {
          const ativo = filtro === s.valor;
          return (
            <button
              key={s.valor || "todos"}
              type="button"
              onClick={() => setFiltro(s.valor)}
              className={`h-12 rounded-xl border-2 px-4 text-base font-extrabold transition-colors ${
                ativo
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-accent"
              }`}
            >
              {s.rotulo}
            </button>
          );
        })}
      </div>

      {isPending ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <p className="mt-8 text-lg font-semibold text-destructive">
          Não foi possível carregar os orçamentos.
        </p>
      ) : filtrados.length === 0 ? (
        <p className="mt-8 text-lg font-medium text-muted-foreground">
          Nenhum orçamento encontrado.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {filtrados.map((o) => (
            <li key={o.id}>
              <Link
                to="/orcamentos/$id"
                params={{ id: o.id }}
                className="block rounded-2xl border-2 border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xl font-extrabold text-foreground">
                    {o.numero ? `Nº ${o.numero}` : "Sem número"}
                  </span>
                  <Etiqueta status={o.status} />
                </div>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {um(o.clientes)?.nome ?? "Cliente não informado"}
                </p>
                <p className="text-base font-medium text-muted-foreground">
                  {um(o.imoveis)?.nome ?? "Imóvel não informado"}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-xl font-extrabold text-primary">{reais(o.total)}</span>
                  <span className="text-base font-semibold text-muted-foreground">
                    {dataBR(o.criado_em)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <NovoOrcamento aberto={novoAberto} onFechar={() => setNovoAberto(false)} />
    </section>
  );
}

type ItemNovo = { descricao: string; quantidade: string; valor_unitario: string };

function NovoOrcamento({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { perfil } = usePerfil();
  const navigate = useNavigate();
  const [passo, setPasso] = useState(1);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [imovelId, setImovelId] = useState<string | null>(null);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [itens, setItens] = useState<ItemNovo[]>([
    { descricao: "", quantidade: "1", valor_unitario: "" },
  ]);
  const [desconto, setDesconto] = useState("");
  const [validade, setValidade] = useState("15");
  const [prazo, setPrazo] = useState("");
  const [condicoes, setCondicoes] = useState("");

  const clientesQuery = useQuery({
    queryKey: ["clientes", "resumo"],
    queryFn: async () => {
      const { data: linhas, error } = await supabase
        .from("clientes")
        .select("id, nome")
        .order("nome");
      if (error) throw error;
      return (linhas ?? []) as { id: string; nome: string }[];
    },
    enabled: aberto,
  });

  const imoveisQuery = useQuery({
    queryKey: ["imoveis", "do-cliente", clienteId],
    queryFn: async () => {
      const { data: linhas, error } = await supabase
        .from("imoveis")
        .select("id, nome, municipio, uf")
        .eq("cliente_id", clienteId as string)
        .order("nome");
      if (error) throw error;
      return (linhas ?? []) as { id: string; nome: string; municipio: string | null; uf: string | null }[];
    },
    enabled: aberto && !!clienteId,
  });

  const totalItens = itens.reduce(
    (soma, i) => soma + (paraNumero(i.quantidade) ?? 0) * (paraNumero(i.valor_unitario) ?? 0),
    0,
  );
  const totalGeral = Math.max(0, totalItens - (paraNumero(desconto) ?? 0));

  function limpar() {
    setPasso(1);
    setClienteId(null);
    setImovelId(null);
    setBuscaCliente("");
    setItens([{ descricao: "", quantidade: "1", valor_unitario: "" }]);
    setDesconto("");
    setValidade("15");
    setPrazo("");
    setCondicoes("");
  }

  const criar = useMutation({
    mutationFn: async () => {
      if (!perfil) throw new Error("Perfil não carregado.");
      const validos = itens.filter(
        (i) => i.descricao.trim() !== "" || (paraNumero(i.valor_unitario) ?? 0) > 0,
      );
      if (validos.length === 0) throw new Error("Inclua ao menos um item.");

      const { data: novo, error: erro } = await supabase
        .from("orcamentos")
        .insert({
          empresa_id: perfil.empresa_id,
          cliente_id: clienteId,
          imovel_id: imovelId,
          status: "rascunho",
          desconto: paraNumero(desconto) ?? 0,
          validade_dias: paraNumero(validade) ?? null,
          prazo_execucao: prazo.trim() || null,
          condicoes: condicoes.trim() || null,
          criado_por: perfil.id,
        })
        .select("id")
        .single();
      if (erro) throw erro;

      const { error: erroItens } = await supabase.from("orcamento_itens").insert(
        validos.map((i, indice) => ({
          orcamento_id: novo.id,
          descricao: i.descricao.trim() || "Serviço",
          quantidade: paraNumero(i.quantidade) ?? 1,
          valor_unitario: paraNumero(i.valor_unitario) ?? 0,
          ordem: indice + 1,
        })),
      );
      if (erroItens) throw erroItens;
      return novo.id as string;
    },
    onSuccess: (id) => {
      onFechar();
      limpar();
      navigate({ to: "/orcamentos/$id", params: { id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível criar."),
  });

  const clientesFiltrados = (clientesQuery.data ?? []).filter((c) =>
    c.nome.toLowerCase().includes(buscaCliente.trim().toLowerCase()),
  );

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        if (!v) {
          onFechar();
          limpar();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">
            Novo orçamento — passo {passo} de 3
          </DialogTitle>
        </DialogHeader>

        {passo === 1 ? (
          <div>
            <p className="text-lg font-bold text-foreground">Escolha o cliente</p>
            <Input
              value={buscaCliente}
              onChange={(e) => setBuscaCliente(e.target.value)}
              placeholder="Buscar cliente"
              className="mt-2 h-14 rounded-xl border-2 text-lg font-semibold"
            />
            <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {clientesFiltrados.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setClienteId(c.id);
                      setImovelId(null);
                      setPasso(2);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border-2 p-4 text-left text-lg font-bold transition-colors ${
                      clienteId === c.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    {c.nome}
                    {clienteId === c.id ? <Check className="size-6 text-primary" /> : null}
                  </button>
                </li>
              ))}
              {clientesFiltrados.length === 0 ? (
                <li className="text-base font-medium text-muted-foreground">
                  Nenhum cliente encontrado.
                </li>
              ) : null}
            </ul>
          </div>
        ) : passo === 2 ? (
          <div>
            <p className="text-lg font-bold text-foreground">Escolha o imóvel deste cliente</p>
            {imoveisQuery.isPending ? (
              <div className="mt-6 flex justify-center">
                <Loader2 className="size-7 animate-spin text-primary" />
              </div>
            ) : (imoveisQuery.data ?? []).length === 0 ? (
              <p className="mt-3 text-base font-semibold text-muted-foreground">
                Este cliente ainda não tem imóveis cadastrados. Cadastre o imóvel na tela de
                Imóveis antes de fazer o orçamento.
              </p>
            ) : (
              <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                {(imoveisQuery.data ?? []).map((i) => (
                  <li key={i.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setImovelId(i.id);
                        setPasso(3);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition-colors ${
                        imovelId === i.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:bg-accent"
                      }`}
                    >
                      <span>
                        <span className="block text-lg font-bold text-foreground">{i.nome}</span>
                        <span className="text-base font-medium text-muted-foreground">
                          {[i.municipio, i.uf].filter(Boolean).join(" / ")}
                        </span>
                      </span>
                      {imovelId === i.id ? <Check className="size-6 text-primary" /> : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-lg font-bold text-foreground">Itens do orçamento</p>
            {itens.map((item, indice) => (
              <div key={indice} className="rounded-xl border-2 border-border p-3">
                <Input
                  value={item.descricao}
                  onChange={(e) =>
                    setItens((atual) =>
                      atual.map((i, k) => (k === indice ? { ...i, descricao: e.target.value } : i)),
                    )
                  }
                  placeholder="Descrição do serviço"
                  className="h-14 rounded-xl border-2 text-lg font-semibold"
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Input
                    value={item.quantidade}
                    inputMode="decimal"
                    onChange={(e) =>
                      setItens((atual) =>
                        atual.map((i, k) =>
                          k === indice ? { ...i, quantidade: e.target.value } : i,
                        ),
                      )
                    }
                    placeholder="Quantidade"
                    className="h-14 rounded-xl border-2 text-lg font-semibold"
                  />
                  <Input
                    value={item.valor_unitario}
                    inputMode="decimal"
                    onChange={(e) =>
                      setItens((atual) =>
                        atual.map((i, k) =>
                          k === indice ? { ...i, valor_unitario: e.target.value } : i,
                        ),
                      )
                    }
                    placeholder="Valor unitário"
                    className="h-14 rounded-xl border-2 text-lg font-semibold"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-extrabold text-foreground">
                    {reais((paraNumero(item.quantidade) ?? 0) * (paraNumero(item.valor_unitario) ?? 0))}
                  </span>
                  {itens.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => setItens((atual) => atual.filter((_, k) => k !== indice))}
                      className="text-base font-extrabold text-destructive"
                    >
                      Remover
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setItens((atual) => [...atual, { descricao: "", quantidade: "1", valor_unitario: "" }])
              }
              className="h-14 w-full rounded-xl border-2 text-lg font-extrabold"
            >
              <Plus className="size-6" strokeWidth={3} />
              Adicionar item
            </Button>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={desconto}
                inputMode="decimal"
                onChange={(e) => setDesconto(e.target.value)}
                placeholder="Desconto em R$"
                className="h-14 rounded-xl border-2 text-lg font-semibold"
              />
              <Input
                value={validade}
                inputMode="numeric"
                onChange={(e) => setValidade(e.target.value)}
                placeholder="Validade em dias"
                className="h-14 rounded-xl border-2 text-lg font-semibold"
              />
              <Input
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                placeholder="Prazo de execução"
                className="h-14 rounded-xl border-2 text-lg font-semibold"
              />
              <Input
                value={condicoes}
                onChange={(e) => setCondicoes(e.target.value)}
                placeholder="Condições de pagamento"
                className="h-14 rounded-xl border-2 text-lg font-semibold"
              />
            </div>

            <div className="rounded-xl bg-accent p-4">
              <p className="text-base font-bold text-accent-foreground">
                Itens: {reais(totalItens)} · Desconto: {reais(paraNumero(desconto) ?? 0)}
              </p>
              <p className="text-2xl font-extrabold text-foreground">Total {reais(totalGeral)}</p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {passo > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setPasso((p) => p - 1)}
              className="h-14 rounded-xl border-2 text-lg font-extrabold"
            >
              Voltar
            </Button>
          ) : null}
          {passo === 3 ? (
            <Button
              type="button"
              onClick={() => criar.mutate()}
              disabled={criar.isPending}
              className="h-14 rounded-xl text-lg font-extrabold"
            >
              {criar.isPending ? <Loader2 className="size-6 animate-spin" /> : null}
              Salvar rascunho
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => setPasso((p) => p + 1)}
              disabled={(passo === 1 && !clienteId) || (passo === 2 && !imovelId)}
              className="h-14 rounded-xl text-lg font-extrabold"
            >
              Continuar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { numero as formatarNumero };
