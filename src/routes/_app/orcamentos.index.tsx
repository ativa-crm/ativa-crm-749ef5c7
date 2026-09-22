import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Check,
  Clock3,
  FileCheck2,
  FileText,
  Loader2,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { data as dataBR, numero, paraNumero, reais, rotulo } from "@/lib/formato";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarraFerramentas, CartaoIndicador, Painel, Tabela } from "@/components/painel";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/orcamentos/")({
  head: () => ({
    meta: [
      { title: "Orçamentos | CRM de Topografia" },
      {
        name: "description",
        content: "Orçamentos com busca, status, indicadores, espera de resposta e soma do filtro.",
      },
      { property: "og:title", content: "Orçamentos | CRM de Topografia" },
      {
        property: "og:description",
        content: "Lista de orçamentos com status, valores e criação em três passos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  enviado_em: string | null;
  clientes: { nome: string | null } | { nome: string | null }[] | null;
  imoveis: { nome: string | null } | { nome: string | null }[] | null;
};

type ItemNovo = { descricao: string; quantidade: string; valor_unitario: string };

function um<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function diasDesde(v: string | null | undefined): string {
  if (!v) return "—";
  const t = new Date(v).getTime();
  if (Number.isNaN(t)) return "—";
  const dias = Math.max(0, Math.floor((Date.now() - t) / 86400000));
  return dias === 0 ? "hoje" : `${dias} d`;
}

function Etiqueta({ status }: { status: string | null }) {
  const ponto =
    status === "aprovado"
      ? "bg-primary"
      : status === "recusado" || status === "expirado"
        ? "bg-destructive"
        : status === "enviado"
          ? "bg-warning"
          : "bg-muted-foreground";
  return (
    <Badge
      variant="outline"
      className="gap-1.5 rounded-full border-border bg-card px-2.5 py-1 text-xs text-foreground"
    >
      <span className={`size-2 rounded-full ${ponto}`} aria-hidden />
      {rotulo(status) || "—"}
    </Badge>
  );
}

function Pagina() {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<string>("");
  const [novoAberto, setNovoAberto] = useState(false);

  const {
    data: orcamentos,
    isPending,
    error,
  } = useQuery({
    queryKey: ["orcamentos"],
    queryFn: async (): Promise<Linha[]> => {
      const { data: linhas, error: erro } = await supabase
        .from("orcamentos")
        .select("id, numero, status, total, criado_em, enviado_em, clientes(nome), imoveis(nome)")
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
      return `${o.numero ?? ""} ${um(o.clientes)?.nome ?? ""} ${um(o.imoveis)?.nome ?? ""}`
        .toLowerCase()
        .includes(termo);
    });
  }, [orcamentos, busca, filtro]);

  const somaFiltro = filtrados.reduce((soma, o) => soma + Number(o.total ?? 0), 0);
  const emDecisao = filtrados.filter((o) => o.status === "enviado");
  const aprovados = filtrados.filter((o) => o.status === "aprovado");
  const maiorEspera = Math.max(
    0,
    ...emDecisao.map((o) => {
      const texto = diasDesde(o.enviado_em ?? o.criado_em);
      return texto === "hoje" || texto === "—" ? 0 : Number.parseInt(texto, 10) || 0;
    }),
  );

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <FileText className="size-6 text-primary" strokeWidth={2.5} />
          Orçamentos
        </h1>
        <Button onClick={() => setNovoAberto(true)} className="h-11 px-4 text-base">
          <Plus className="size-5" strokeWidth={3} />
          Novo orçamento
        </Button>
      </header>

      <BarraFerramentas>
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por número, cliente ou imóvel"
            className="h-11 rounded-full border pl-11"
          />
        </div>
        <div className="seg">
          {[{ valor: "", rotulo: "Todos" }, ...STATUS].map((s) => (
            <button
              key={s.valor || "todos"}
              type="button"
              onClick={() => setFiltro(s.valor)}
              data-ativo={filtro === s.valor}
              className="seg-item"
            >
              {s.rotulo}
            </button>
          ))}
        </div>
      </BarraFerramentas>

      <div className="grade-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CartaoIndicador
          icone={Clock3}
          valor={emDecisao.length}
          rotulo="Aguardando decisão"
          apoio={`${reais(emDecisao.reduce((s, o) => s + Number(o.total ?? 0), 0))} em jogo`}
          tom={emDecisao.length ? "atencao" : "neutro"}
          destino="/orcamentos"
        />
        <CartaoIndicador
          icone={FileCheck2}
          valor={aprovados.length}
          rotulo="Aprovados"
          apoio="viram contrato e OS"
          destino="/orcamentos"
        />
        <CartaoIndicador
          icone={TrendingUp}
          valor={maiorEspera}
          rotulo="Dias do mais antigo"
          apoio="entre enviados"
          tom={maiorEspera > 7 ? "critico" : "neutro"}
          destino="/orcamentos"
        />
      </div>

      <Painel
        titulo="Orçamentos"
        icone={FileText}
        acao={
          <span className="text-sm font-extrabold text-foreground">
            {reais(somaFiltro)} <span className="text-muted-foreground">no filtro</span>
          </span>
        }
      >
        {isPending ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="text-base font-bold text-destructive">
            Não foi possível carregar os orçamentos.
          </p>
        ) : filtrados.length === 0 ? (
          <p className="text-base font-medium text-muted-foreground">
            Nenhum orçamento encontrado.
          </p>
        ) : (
          <Tabela>
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border text-xs font-bold uppercase text-muted-foreground">
                  <th className="px-3 py-2">Nº</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Imóvel</th>
                  <th className="px-3 py-2">Criado</th>
                  <th className="px-3 py-2">Esperando</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                  <th className="px-3 py-2">Situação</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-3">
                      <Link
                        to="/orcamentos/$id"
                        params={{ id: o.id }}
                        className="font-extrabold text-foreground hover:text-primary"
                      >
                        {o.numero ? `#${o.numero}` : "Rascunho"}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-foreground">
                      {um(o.clientes)?.nome ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold text-muted-foreground">
                      {um(o.imoveis)?.nome ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold text-muted-foreground">
                      {dataBR(o.criado_em) || "—"}
                    </td>
                    <td className="px-3 py-3 text-sm font-extrabold text-foreground">
                      {o.status === "enviado" ? diasDesde(o.enviado_em ?? o.criado_em) : "—"}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-extrabold text-foreground">
                      {reais(o.total)}
                    </td>
                    <td className="px-3 py-3">
                      <Etiqueta status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tabela>
        )}
      </Painel>

      <NovoOrcamento aberto={novoAberto} onFechar={() => setNovoAberto(false)} />
    </section>
  );
}

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
    enabled: aberto,
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("id, nome").order("nome");
      if (error) throw error;
      return (data ?? []) as { id: string; nome: string }[];
    },
  });
  const imoveisQuery = useQuery({
    queryKey: ["imoveis", "do-cliente", clienteId],
    enabled: aberto && !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imoveis")
        .select("id, nome, municipio, uf")
        .eq("cliente_id", clienteId as string)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        nome: string;
        municipio: string | null;
        uf: string | null;
      }[];
    },
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
      const { error: erroItens } = await supabase
        .from("orcamento_itens")
        .insert(
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
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg border-2 sm:max-w-2xl">
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
              className="mt-2 h-12 rounded-lg border text-base font-semibold"
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
                    className={`flex w-full items-center justify-between rounded-lg border p-4 text-left text-base font-bold ${clienteId === c.id ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-accent"}`}
                  >
                    {c.nome}
                    {clienteId === c.id ? <Check className="size-5 text-primary" /> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : passo === 2 ? (
          <div>
            <p className="text-lg font-bold text-foreground">Escolha o imóvel deste cliente</p>
            {imoveisQuery.isPending ? (
              <div className="mt-6 flex justify-center">
                <Loader2 className="size-7 animate-spin text-primary" />
              </div>
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
                      className={`flex w-full items-center justify-between rounded-lg border p-4 text-left ${imovelId === i.id ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-accent"}`}
                    >
                      <span>
                        <span className="block text-base font-bold text-foreground">{i.nome}</span>
                        <span className="text-sm font-medium text-muted-foreground">
                          {[i.municipio, i.uf].filter(Boolean).join(" / ")}
                        </span>
                      </span>
                      {imovelId === i.id ? <Check className="size-5 text-primary" /> : null}
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
              <div key={indice} className="rounded-lg border border-border p-3">
                <Input
                  value={item.descricao}
                  onChange={(e) =>
                    setItens((atual) =>
                      atual.map((i, k) => (k === indice ? { ...i, descricao: e.target.value } : i)),
                    )
                  }
                  placeholder="Descrição do serviço"
                  className="h-12 rounded-lg border text-base font-semibold"
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
                    className="h-12 rounded-lg border text-base font-semibold"
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
                    className="h-12 rounded-lg border text-base font-semibold"
                  />
                </div>
                {itens.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setItens((atual) => atual.filter((_, k) => k !== indice))}
                    className="mt-2 text-sm font-extrabold text-destructive"
                  >
                    Remover
                  </button>
                ) : null}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setItens((atual) => [
                  ...atual,
                  { descricao: "", quantidade: "1", valor_unitario: "" },
                ])
              }
              className="h-12 w-full text-base font-extrabold"
            >
              <Plus className="size-5" />
              Adicionar item
            </Button>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={desconto}
                inputMode="decimal"
                onChange={(e) => setDesconto(e.target.value)}
                placeholder="Desconto em R$"
                className="h-12 rounded-lg border text-base font-semibold"
              />
              <Input
                value={validade}
                inputMode="numeric"
                onChange={(e) => setValidade(e.target.value)}
                placeholder="Validade em dias"
                className="h-12 rounded-lg border text-base font-semibold"
              />
              <Input
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                placeholder="Prazo de execução"
                className="h-12 rounded-lg border text-base font-semibold"
              />
              <Input
                value={condicoes}
                onChange={(e) => setCondicoes(e.target.value)}
                placeholder="Condições de pagamento"
                className="h-12 rounded-lg border text-base font-semibold"
              />
            </div>
            <div className="rounded-lg bg-accent p-4">
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
              className="h-12 text-base font-extrabold"
            >
              Voltar
            </Button>
          ) : null}
          {passo === 3 ? (
            <Button
              type="button"
              onClick={() => criar.mutate()}
              disabled={criar.isPending}
              className="h-12 text-base font-extrabold"
            >
              {criar.isPending ? <Loader2 className="size-5 animate-spin" /> : null}Salvar rascunho
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => setPasso((p) => p + 1)}
              disabled={(passo === 1 && !clienteId) || (passo === 2 && !imovelId)}
              className="h-12 text-base font-extrabold"
            >
              Continuar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
