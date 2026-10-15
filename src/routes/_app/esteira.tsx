import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  CheckSquare,
  ClipboardList,
  Landmark,
  Loader2,
  Plus,
  Trash2,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { data as dataBR, dataHora } from "@/lib/formato";
import { semaforoPrazo } from "@/lib/prazo";
import {
  MODELOS_ESTEIRA,
  ORGAOS,
  etapasComPrazo,
  modeloPorServico,
  rotuloOrgao,
} from "@/lib/esteira";
import { Bloco, CampoLongo } from "@/components/campos";
import { PainelAnuencias } from "@/components/painel-anuencias";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Busca = { p?: string | undefined; ver?: "ativos" | "encerrados" | undefined };

export const Route = createFileRoute("/_app/esteira")({
  head: () => ({
    meta: [
      { title: "Esteira técnica | CRM de Topografia" },
      {
        name: "description",
        content:
          "Acompanhamento técnico pós-venda: etapas com prazo, exigências de SIGEF, cartório e prefeitura, e anuências dos confrontantes.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Busca => ({
    p: typeof s["p"] === "string" && s["p"] ? s["p"] : undefined,
    ver: s["ver"] === "encerrados" ? "encerrados" : undefined,
  }),
  component: Pagina,
});

/* ------------------------------------------------------------------ */
/* Tipos                                                               */

type Um<T> = T | T[] | null;
function um<T>(v: Um<T> | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

type Processo = {
  id: string;
  titulo: string | null;
  servico: string | null;
  inicio: string;
  encerrado_em: string | null;
  observacoes: string | null;
  cliente_id: string | null;
  imovel_id: string | null;
  os_id: string | null;
  criado_em: string;
  clientes: Um<{ nome: string | null; telefone: string | null }>;
  imoveis: Um<{ nome: string | null; municipio: string | null }>;
  ordens_servico: Um<{ numero: string | null }>;
};

type Etapa = {
  id: string;
  processo_id: string;
  nome: string;
  ordem: number;
  codigo: string | null;
  prazo: string | null;
  concluida_em: string | null;
  responsavel_id: string | null;
};

type Exigencia = {
  id: string;
  processo_id: string;
  orgao: string;
  protocolo: string | null;
  descricao: string | null;
  recebida_em: string;
  prazo: string | null;
  respondida_em: string | null;
};

const COLS_PROCESSO =
  "id, titulo, servico, inicio, encerrado_em, observacoes, cliente_id, imovel_id, os_id, criado_em, clientes(nome, telefone), imoveis(nome, municipio), ordens_servico(numero)";

const CLASSE_SELECT =
  "mt-1.5 h-12 w-full rounded-xl border-2 border-border bg-card px-3 text-base font-semibold text-foreground";

function hojeIso() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function proximaEtapa(etapas: Etapa[]) {
  return [...etapas].sort((a, b) => a.ordem - b.ordem).find((e) => !e.concluida_em) ?? null;
}

/* ------------------------------------------------------------------ */
/* Página                                                              */

function Pagina() {
  const { p } = Route.useSearch();
  return p ? <DetalheProcesso id={p} /> : <ListaProcessos />;
}

function ListaProcessos() {
  const { ver } = Route.useSearch();
  const navigate = useNavigate({ from: "/esteira" });
  const [novo, setNovo] = useState(false);
  const encerrados = ver === "encerrados";

  const processos = useQuery({
    queryKey: ["esteira", "processos"],
    queryFn: async (): Promise<Processo[]> => {
      const { data, error } = await supabase
        .from("processos")
        .select(COLS_PROCESSO)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Processo[];
    },
  });

  const etapas = useQuery({
    queryKey: ["esteira", "etapas-todas"],
    queryFn: async (): Promise<Etapa[]> => {
      const { data, error } = await supabase
        .from("processo_etapas")
        .select("id, processo_id, nome, ordem, codigo, prazo, concluida_em, responsavel_id");
      if (error) throw error;
      return (data ?? []) as Etapa[];
    },
  });

  const exigencias = useQuery({
    queryKey: ["esteira", "exigencias-abertas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processo_exigencias")
        .select("processo_id, prazo")
        .is("respondida_em", null);
      if (error) throw error;
      return (data ?? []) as { processo_id: string; prazo: string | null }[];
    },
  });

  const porProcesso = useMemo(() => {
    const m = new Map<string, Etapa[]>();
    for (const e of etapas.data ?? []) m.set(e.processo_id, [...(m.get(e.processo_id) ?? []), e]);
    return m;
  }, [etapas.data]);

  const exigPorProcesso = useMemo(() => {
    const m = new Map<string, number>();
    for (const x of exigencias.data ?? []) m.set(x.processo_id, (m.get(x.processo_id) ?? 0) + 1);
    return m;
  }, [exigencias.data]);

  const lista = (processos.data ?? []).filter((p) => (encerrados ? p.encerrado_em : !p.encerrado_em));

  const resumo = useMemo(() => {
    const ativos = (processos.data ?? []).filter((p) => !p.encerrado_em);
    let atrasados = 0;
    for (const p of ativos) {
      const prox = proximaEtapa(porProcesso.get(p.id) ?? []);
      if (prox && semaforoPrazo(prox.prazo).nivel === "vermelho") atrasados++;
    }
    const exig = ativos.reduce((s, p) => s + (exigPorProcesso.get(p.id) ?? 0), 0);
    return { ativos: ativos.length, atrasados, exig };
  }, [processos.data, porProcesso, exigPorProcesso]);

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Workflow className="size-7 text-primary" strokeWidth={2.5} />
          Esteira técnica
        </h1>
        <Button type="button" className="h-12 font-extrabold" onClick={() => setNovo(true)}>
          <Plus className="size-5" strokeWidth={2.5} /> Novo processo
        </Button>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Resumo rotulo="Em andamento" valor={resumo.ativos} />
        <Resumo rotulo="Etapa vencendo/atrasada" valor={resumo.atrasados} destaque={resumo.atrasados > 0} />
        <Resumo rotulo="Exigências em aberto" valor={resumo.exig} destaque={resumo.exig > 0} />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={encerrados ? "outline" : "default"}
          className="font-bold"
          onClick={() => void navigate({ search: {} })}
        >
          Em andamento
        </Button>
        <Button
          type="button"
          variant={encerrados ? "default" : "outline"}
          className="font-bold"
          onClick={() => void navigate({ search: { ver: "encerrados" } })}
        >
          Encerrados
        </Button>
      </div>

      {processos.isPending ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : lista.length === 0 ? (
        <p className="rounded-3xl border-2 border-dashed border-border p-6 text-lg font-medium text-muted-foreground">
          {encerrados
            ? "Nenhum processo encerrado."
            : "Nenhum processo em andamento. Use “Novo processo” para montar a esteira de um serviço contratado."}
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {lista.map((p) => {
            const ets = porProcesso.get(p.id) ?? [];
            const feitas = ets.filter((e) => e.concluida_em).length;
            const pct = ets.length ? Math.round((feitas / ets.length) * 100) : 0;
            const prox = proximaEtapa(ets);
            const sem = semaforoPrazo(prox?.prazo ?? null, p.encerrado_em ? "concluida" : null);
            const nExig = exigPorProcesso.get(p.id) ?? 0;
            const cli = um(p.clientes);
            const im = um(p.imoveis);
            return (
              <li key={p.id}>
                <Link
                  to="/esteira"
                  search={{ p: p.id }}
                  className="block rounded-3xl border-2 border-border bg-card p-4 shadow-sm transition hover:border-primary"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-extrabold text-foreground">
                        {p.titulo || p.servico || "Processo"}
                      </p>
                      <p className="truncate text-sm font-semibold text-muted-foreground">
                        {[cli?.nome, im ? `${im.nome ?? "imóvel"}${im.municipio ? ` · ${im.municipio}` : ""}` : null]
                          .filter(Boolean)
                          .join(" — ") || "sem cliente vinculado"}
                      </p>
                    </div>
                    {nExig > 0 ? (
                      <span className="shrink-0 rounded-lg bg-destructive px-2 py-1 text-xs font-extrabold text-destructive-foreground">
                        {nExig} exigência{nExig > 1 ? "s" : ""}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm font-bold text-foreground">
                    <span>
                      {feitas} de {ets.length} etapas
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <Progress value={pct} className="mt-1.5 h-2.5" />
                  {prox ? (
                    <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                      <span className="text-muted-foreground">Agora:</span> {prox.nome}
                      {prox.prazo ? (
                        <span className={`rounded-md px-2 py-0.5 text-xs font-extrabold ${sem.cor}`}>
                          {dataBR(prox.prazo)} · {sem.texto}
                        </span>
                      ) : null}
                    </p>
                  ) : ets.length > 0 ? (
                    <p className="mt-3 text-sm font-bold text-primary">Todas as etapas concluídas</p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <NovoProcesso aberto={novo} onFechar={() => setNovo(false)} />
    </section>
  );
}

function Resumo({ rotulo, valor, destaque = false }: { rotulo: string; valor: number; destaque?: boolean }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-3">
      <p className={`text-2xl font-extrabold ${destaque ? "text-destructive" : "text-foreground"}`}>{valor}</p>
      <p className="text-xs font-bold text-muted-foreground sm:text-sm">{rotulo}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Novo processo                                                       */

function NovoProcesso({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const navigate = useNavigate({ from: "/esteira" });
  const queryClient = useQueryClient();
  const [clienteId, setClienteId] = useState("");
  const [imovelId, setImovelId] = useState("");
  const [osId, setOsId] = useState("");
  const [modelo, setModelo] = useState(MODELOS_ESTEIRA[0]!.chave);
  const [titulo, setTitulo] = useState("");
  const [inicio, setInicio] = useState(hojeIso());

  const [buscaCliente, setBuscaCliente] = useState("");
  const termo = buscaCliente.trim();
  const clientes = useQuery({
    queryKey: ["esteira", "clientes", termo],
    enabled: aberto,
    queryFn: async () => {
      let q = supabase.from("clientes").select("id, nome, cidade").order("nome").limit(40);
      if (termo.length >= 2) {
        const t = termo.replace(/[%,()]/g, " ");
        q = q.or(`nome.ilike.%${t}%,documento.ilike.%${t}%`);
      } else {
        q = q.or("origem.is.null,origem.neq.prospeccao");
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as { id: string; nome: string | null; cidade: string | null }[];
    },
  });

  const imoveis = useQuery({
    queryKey: ["esteira", "imoveis", clienteId],
    enabled: aberto && !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imoveis")
        .select("id, nome, municipio")
        .eq("cliente_id", clienteId)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as { id: string; nome: string | null; municipio: string | null }[];
    },
  });

  const ordens = useQuery({
    queryKey: ["esteira", "ordens", clienteId],
    enabled: aberto && !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select("id, numero, servico, imovel_id")
        .eq("cliente_id", clienteId)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as { id: string; numero: string | null; servico: string | null; imovel_id: string | null }[];
    },
  });

  const limpar = () => {
    setBuscaCliente("");
    setClienteId("");
    setImovelId("");
    setOsId("");
    setModelo(MODELOS_ESTEIRA[0]!.chave);
    setTitulo("");
    setInicio(hojeIso());
  };

  const criar = useMutation({
    mutationFn: async () => {
      const rotuloModelo = MODELOS_ESTEIRA.find((m) => m.chave === modelo)?.rotulo ?? null;
      const im = (imoveis.data ?? []).find((i) => i.id === imovelId);
      const tituloFinal =
        titulo.trim() ||
        [rotuloModelo?.split(" (")[0], im?.nome, im?.municipio].filter(Boolean).join(" – ") ||
        "Processo";
      const { data: proc, error } = await supabase
        .from("processos")
        .insert({
          cliente_id: clienteId || null,
          imovel_id: imovelId || null,
          os_id: osId || null,
          titulo: tituloFinal,
          servico: rotuloModelo,
          inicio,
        })
        .select("id")
        .single();
      if (error) throw error;
      const id = proc.id as string;
      const linhas = etapasComPrazo(modelo, inicio).map((e) => ({ ...e, processo_id: id }));
      const { error: erroEtapas } = await supabase.from("processo_etapas").insert(linhas);
      if (erroEtapas) toast.error("Processo criado, mas as etapas não foram geradas.");
      return id;
    },
    onSuccess: (id) => {
      void queryClient.invalidateQueries({ queryKey: ["esteira"] });
      limpar();
      onFechar();
      toast.success("Processo criado.");
      void navigate({ search: { p: id } });
    },
    onError: () => toast.error("Não foi possível criar o processo."),
  });

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">Novo processo</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="text-base font-bold">Tipo de serviço</Label>
            <select value={modelo} onChange={(e) => setModelo(e.target.value)} className={CLASSE_SELECT}>
              {MODELOS_ESTEIRA.map((m) => (
                <option key={m.chave} value={m.chave}>
                  {m.rotulo}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="proc-busca-cliente" className="text-base font-bold">
              Cliente
            </Label>
            <Input
              id="proc-busca-cliente"
              value={buscaCliente}
              onChange={(e) => setBuscaCliente(e.target.value)}
              placeholder="Buscar por nome ou CPF/CNPJ"
              className="mt-1.5 h-12 rounded-xl border-2 text-base font-semibold"
            />
            <select
              value={clienteId}
              onChange={(e) => {
                setClienteId(e.target.value);
                setImovelId("");
                setOsId("");
              }}
              className={CLASSE_SELECT}
            >
              <option value="">
                {clientes.isPending ? "Carregando…" : `Escolha o cliente (${(clientes.data ?? []).length} encontrados)`}
              </option>
              {(clientes.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome ?? "sem nome"}
                  {c.cidade ? ` · ${c.cidade}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label className="text-base font-bold">Imóvel</Label>
            <select
              value={imovelId}
              onChange={(e) => setImovelId(e.target.value)}
              className={CLASSE_SELECT}
              disabled={!clienteId}
            >
              <option value="">{clienteId ? "Escolha o imóvel" : "Escolha o cliente antes"}</option>
              {(imoveis.data ?? []).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome ?? "imóvel"}
                  {i.municipio ? ` · ${i.municipio}` : ""}
                </option>
              ))}
            </select>
          </div>
          {(ordens.data ?? []).length > 0 ? (
            <div className="sm:col-span-2">
              <Label className="text-base font-bold">Ordem de serviço (opcional)</Label>
              <select
                value={osId}
                onChange={(e) => {
                  setOsId(e.target.value);
                  const os = (ordens.data ?? []).find((o) => o.id === e.target.value);
                  if (os?.imovel_id && !imovelId) setImovelId(os.imovel_id);
                  if (os?.servico) setModelo(modeloPorServico(os.servico));
                }}
                className={CLASSE_SELECT}
              >
                <option value="">sem vínculo com OS</option>
                {(ordens.data ?? []).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.numero ? `OS ${o.numero}` : "OS"} · {o.servico ?? "serviço"}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <Label htmlFor="proc-inicio" className="text-base font-bold">
              Início
            </Label>
            <Input
              id="proc-inicio"
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value || hojeIso())}
              className="mt-1.5 h-12 rounded-xl border-2 text-base font-semibold"
            />
          </div>
          <div>
            <Label htmlFor="proc-titulo" className="text-base font-bold">
              Título (opcional)
            </Label>
            <Input
              id="proc-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="gerado automaticamente"
              className="mt-1.5 h-12 rounded-xl border-2 text-base font-semibold"
            />
          </div>
          <p className="text-sm font-semibold text-muted-foreground sm:col-span-2">
            As etapas do modelo são criadas com prazos somados a partir do início. Tudo pode ser ajustado
            depois, dentro do processo.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
          <Button type="button" disabled={criar.isPending} onClick={() => criar.mutate()}>
            {criar.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Criar processo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Detalhe                                                             */

function DetalheProcesso({ id }: { id: string }) {
  const { perfil } = usePerfil();
  const navigate = useNavigate({ from: "/esteira" });
  const queryClient = useQueryClient();
  const [novaEtapa, setNovaEtapa] = useState("");

  const processo = useQuery({
    queryKey: ["esteira", "processo", id],
    queryFn: async (): Promise<Processo | null> => {
      const { data, error } = await supabase.from("processos").select(COLS_PROCESSO).eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Processo | null;
    },
  });

  const etapas = useQuery({
    queryKey: ["esteira", "etapas", id],
    queryFn: async (): Promise<Etapa[]> => {
      const { data, error } = await supabase
        .from("processo_etapas")
        .select("id, processo_id, nome, ordem, codigo, prazo, concluida_em, responsavel_id")
        .eq("processo_id", id)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Etapa[];
    },
  });

  const usuarios = useQuery({
    queryKey: ["usuarios", "seletor"],
    queryFn: async () => {
      const { data, error } = await supabase.from("usuarios").select("id, nome").order("nome");
      if (error) throw error;
      return (data ?? []) as { id: string; nome: string | null }[];
    },
  });

  const invalidar = () => void queryClient.invalidateQueries({ queryKey: ["esteira"] });

  const salvarProcesso = useMutation({
    mutationFn: async (campos: Record<string, unknown>) => {
      const { error } = await supabase.from("processos").update(campos).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidar(),
    onError: () => toast.error("Não foi possível salvar."),
  });

  const salvarEtapa = useMutation({
    mutationFn: async ({ etapaId, campos }: { etapaId: string; campos: Record<string, unknown> }) => {
      const { error } = await supabase.from("processo_etapas").update(campos).eq("id", etapaId);
      if (error) throw error;
    },
    onSuccess: () => invalidar(),
    onError: () => toast.error("Não foi possível atualizar a etapa."),
  });

  const adicionarEtapa = useMutation({
    mutationFn: async (nome: string) => {
      const ordem = Math.max(0, ...(etapas.data ?? []).map((e) => e.ordem)) + 1;
      const { error } = await supabase.from("processo_etapas").insert({ processo_id: id, nome, ordem });
      if (error) throw error;
    },
    onSuccess: () => {
      setNovaEtapa("");
      invalidar();
    },
    onError: () => toast.error("Não foi possível adicionar a etapa."),
  });

  const removerEtapa = useMutation({
    mutationFn: async (etapaId: string) => {
      const { error } = await supabase.from("processo_etapas").delete().eq("id", etapaId);
      if (error) throw error;
    },
    onSuccess: () => invalidar(),
    onError: () => toast.error("Não foi possível remover a etapa."),
  });

  const excluir = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("processos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidar();
      toast.success("Processo excluído.");
      void navigate({ search: {} });
    },
    onError: () => toast.error("Não foi possível excluir."),
  });

  if (processo.isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }
  const proc = processo.data;
  if (!proc) {
    return (
      <section>
        <Link to="/esteira" className="text-lg font-extrabold text-primary">
          Voltar para a esteira
        </Link>
        <p className="mt-4 text-lg font-semibold text-destructive">Processo não encontrado.</p>
      </section>
    );
  }

  const ets = etapas.data ?? [];
  const feitas = ets.filter((e) => e.concluida_em).length;
  const pct = ets.length ? Math.round((feitas / ets.length) * 100) : 0;
  const atual = proximaEtapa(ets);
  const cli = um(proc.clientes);
  const im = um(proc.imoveis);
  const os = um(proc.ordens_servico);
  const nomeUsuario = (uid: string | null) => (usuarios.data ?? []).find((u) => u.id === uid)?.nome ?? "";

  return (
    <section className="space-y-5">
      <Link to="/esteira" className="inline-flex items-center gap-2 text-lg font-extrabold text-primary">
        <ArrowLeft className="size-6" strokeWidth={3} />
        Esteira técnica
      </Link>

      <header className="rounded-3xl border-2 border-border bg-card p-4 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{proc.titulo || "Processo"}</h1>
            <p className="mt-1 text-lg font-bold text-primary">{proc.servico ?? ""}</p>
          </div>
          {proc.encerrado_em ? (
            <span className="rounded-lg bg-muted px-3 py-1.5 text-base font-extrabold text-muted-foreground">
              Encerrado em {dataBR(proc.encerrado_em)}
            </span>
          ) : atual ? (
            <span className="rounded-lg bg-primary px-3 py-1.5 text-base font-extrabold text-primary-foreground">
              {atual.nome}
            </span>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <span className="text-base font-bold text-foreground">Cliente</span>
            <p className="text-lg font-semibold">
              {proc.cliente_id ? (
                <Link to="/clientes/$id" params={{ id: proc.cliente_id }} className="text-primary">
                  {cli?.nome ?? "ver cliente"}
                </Link>
              ) : (
                <span className="text-muted-foreground">não vinculado</span>
              )}
            </p>
          </div>
          <div>
            <span className="text-base font-bold text-foreground">Imóvel</span>
            <p className="text-lg font-semibold">
              {proc.imovel_id ? (
                <Link to="/imoveis/$id" params={{ id: proc.imovel_id }} className="text-primary">
                  {im?.nome ?? "ver imóvel"}
                  {im?.municipio ? ` · ${im.municipio}` : ""}
                </Link>
              ) : (
                <span className="text-muted-foreground">não vinculado</span>
              )}
            </p>
          </div>
          <div>
            <span className="text-base font-bold text-foreground">OS</span>
            <p className="text-lg font-semibold">
              {proc.os_id ? (
                <Link to="/servicos/$id" params={{ id: proc.os_id }} className="text-primary">
                  {os?.numero ? `OS ${os.numero}` : "ver OS"}
                </Link>
              ) : (
                <span className="text-muted-foreground">sem OS</span>
              )}
            </p>
          </div>
        </div>
      </header>

      <Bloco titulo="Etapas" Icone={CheckSquare}>
        {etapas.isPending ? (
          <Loader2 className="size-6 animate-spin text-primary" />
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between text-base font-bold text-foreground">
                <span>
                  {feitas} de {ets.length} etapas
                </span>
                <span>{pct}%</span>
              </div>
              <Progress value={pct} className="mt-2 h-3" />
            </div>
            <ul className="space-y-2">
              {ets.map((e) => {
                const feita = Boolean(e.concluida_em);
                const sem = semaforoPrazo(e.prazo, feita ? "concluida" : null);
                return (
                  <li key={e.id} className="rounded-2xl border-2 border-border p-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={feita}
                        onCheckedChange={(v) =>
                          salvarEtapa.mutate({
                            etapaId: e.id,
                            campos:
                              v === true
                                ? { concluida_em: new Date().toISOString(), responsavel_id: perfil?.id ?? null }
                                : { concluida_em: null, responsavel_id: null },
                          })
                        }
                        className="mt-1 size-7 rounded-md border-2"
                        aria-label={e.nome}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-lg font-bold ${feita ? "text-muted-foreground line-through" : "text-foreground"}`}
                        >
                          {e.nome}
                        </p>
                        {feita ? (
                          <p className="text-sm font-semibold text-muted-foreground">
                            Concluída em {dataHora(e.concluida_em)}
                            {nomeUsuario(e.responsavel_id) ? ` · ${nomeUsuario(e.responsavel_id)}` : ""}
                            {e.codigo === "anuencias" && !e.responsavel_id ? " · automática (todas assinadas)" : ""}
                          </p>
                        ) : e.codigo === "anuencias" ? (
                          <p className="text-sm font-semibold text-muted-foreground">
                            Conclui sozinha quando todas as cartas forem assinadas.
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Label htmlFor={`prazo-${e.id}`} className="flex items-center gap-1 text-sm font-bold">
                            <CalendarClock className="size-4" /> Prazo
                          </Label>
                          <Input
                            id={`prazo-${e.id}`}
                            type="date"
                            defaultValue={e.prazo ?? ""}
                            onBlur={(ev) => {
                              const novo = ev.target.value || null;
                              if (novo !== (e.prazo ?? null)) salvarEtapa.mutate({ etapaId: e.id, campos: { prazo: novo } });
                            }}
                            className="h-10 w-auto rounded-lg border-2 text-sm font-semibold"
                          />
                          {e.prazo && !feita ? (
                            <span className={`rounded-md px-2 py-0.5 text-xs font-extrabold ${sem.cor}`}>{sem.texto}</span>
                          ) : null}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="ml-auto text-destructive"
                            aria-label="Remover etapa"
                            onClick={() => {
                              if (window.confirm(`Remover a etapa “${e.nome}”?`)) removerEtapa.mutate(e.id);
                            }}
                          >
                            <Trash2 className="size-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(ev) => {
                ev.preventDefault();
                const nome = novaEtapa.trim();
                if (nome) adicionarEtapa.mutate(nome);
              }}
            >
              <Input
                value={novaEtapa}
                onChange={(ev) => setNovaEtapa(ev.target.value)}
                placeholder="Nova etapa (ex.: Retificação de exigência do cartório)"
                className="h-11 rounded-xl border-2 text-base"
              />
              <Button type="submit" variant="outline" className="font-bold" disabled={adicionarEtapa.isPending}>
                <Plus className="size-5" /> Adicionar
              </Button>
            </form>
          </>
        )}
      </Bloco>

      <Exigencias processoId={id} />

      {proc.imovel_id ? <PainelAnuencias imovelId={proc.imovel_id} osId={proc.os_id} /> : null}

      <Bloco titulo="Observações" Icone={ClipboardList}>
        <CampoLongo
          rotulo="Observações do processo"
          valor={proc.observacoes ?? ""}
          onSalvar={(v) => salvarProcesso.mutate({ observacoes: v || null })}
        />
      </Bloco>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="font-bold"
          onClick={() =>
            salvarProcesso.mutate(
              { encerrado_em: proc.encerrado_em ? null : new Date().toISOString() },
              { onSuccess: () => toast.success(proc.encerrado_em ? "Processo reaberto." : "Processo encerrado.") },
            )
          }
        >
          {proc.encerrado_em ? "Reabrir processo" : "Encerrar processo"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="font-bold text-destructive"
          onClick={() => {
            if (window.confirm("Excluir este processo e suas etapas e exigências? (as anuências do imóvel são mantidas)"))
              excluir.mutate();
          }}
        >
          <Trash2 className="size-5" /> Excluir processo
        </Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Exigências de órgãos                                                */

function Exigencias({ processoId }: { processoId: string }) {
  const queryClient = useQueryClient();
  const [aberto, setAberto] = useState(false);

  const lista = useQuery({
    queryKey: ["esteira", "exigencias", processoId],
    queryFn: async (): Promise<Exigencia[]> => {
      const { data, error } = await supabase
        .from("processo_exigencias")
        .select("id, processo_id, orgao, protocolo, descricao, recebida_em, prazo, respondida_em")
        .eq("processo_id", processoId)
        .order("recebida_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Exigencia[];
    },
  });

  const invalidar = () => void queryClient.invalidateQueries({ queryKey: ["esteira"] });

  const criar = useMutation({
    mutationFn: async (campos: Record<string, string | null>) => {
      const { error } = await supabase.from("processo_exigencias").insert({ processo_id: processoId, ...campos });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidar();
      setAberto(false);
      toast.success("Exigência registrada.");
    },
    onError: () => toast.error("Não foi possível registrar."),
  });

  const atualizar = useMutation({
    mutationFn: async ({ exId, campos }: { exId: string; campos: Record<string, unknown> }) => {
      const { error } = await supabase.from("processo_exigencias").update(campos).eq("id", exId);
      if (error) throw error;
    },
    onSuccess: () => invalidar(),
    onError: () => toast.error("Não foi possível salvar."),
  });

  const remover = useMutation({
    mutationFn: async (exId: string) => {
      const { error } = await supabase.from("processo_exigencias").delete().eq("id", exId);
      if (error) throw error;
    },
    onSuccess: () => invalidar(),
    onError: () => toast.error("Não foi possível remover."),
  });

  const itens = lista.data ?? [];
  const abertas = itens.filter((x) => !x.respondida_em).length;

  return (
    <Bloco
      titulo={`Exigências de órgãos${abertas ? ` (${abertas} em aberto)` : ""}`}
      Icone={Landmark}
      acao={
        <Button type="button" variant="outline" className="font-bold" onClick={() => setAberto(true)}>
          <Plus className="size-5" strokeWidth={2.5} /> Registrar
        </Button>
      }
    >
      {lista.isPending ? (
        <Loader2 className="size-6 animate-spin text-primary" />
      ) : itens.length === 0 ? (
        <p className="text-lg font-medium text-muted-foreground">
          Nenhuma exigência registrada. Quando SIGEF, cartório ou prefeitura pedirem algo, registre aqui com o
          prazo de resposta.
        </p>
      ) : (
        <ul className="space-y-2">
          {itens.map((x) => {
            const sem = semaforoPrazo(x.prazo, x.respondida_em ? "concluida" : null);
            return (
              <li key={x.id} className="rounded-2xl border-2 border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-foreground">
                      {rotuloOrgao(x.orgao)}
                      {x.protocolo ? <span className="text-muted-foreground"> · {x.protocolo}</span> : null}
                    </p>
                    <p className="whitespace-pre-line text-base font-medium text-foreground">{x.descricao}</p>
                    <p className="text-sm font-semibold text-muted-foreground">
                      Recebida em {dataBR(x.recebida_em)}
                      {x.respondida_em ? ` · respondida em ${dataBR(x.respondida_em)}` : ""}
                    </p>
                  </div>
                  {x.respondida_em ? (
                    <span className="rounded-lg bg-muted px-2 py-1 text-sm font-extrabold text-muted-foreground">
                      Respondida
                    </span>
                  ) : x.prazo ? (
                    <span className={`rounded-lg px-2 py-1 text-sm font-extrabold ${sem.cor}`}>
                      {dataBR(x.prazo)} · {sem.texto}
                    </span>
                  ) : (
                    <span className="rounded-lg bg-amber-500 px-2 py-1 text-sm font-extrabold text-white">Em aberto</span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      atualizar.mutate({ exId: x.id, campos: { respondida_em: x.respondida_em ? null : hojeIso() } })
                    }
                  >
                    {x.respondida_em ? "Reabrir" : "Marcar como respondida"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      if (window.confirm("Remover esta exigência?")) remover.mutate(x.id);
                    }}
                  >
                    <Trash2 className="size-4" /> Remover
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Registrar exigência</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(ev) => {
              ev.preventDefault();
              const fd = new FormData(ev.currentTarget);
              const v = (k: string) => String(fd.get(k) ?? "").trim() || null;
              if (!v("descricao")) {
                toast.error("Descreva a exigência.");
                return;
              }
              criar.mutate({
                orgao: v("orgao") ?? "sigef",
                protocolo: v("protocolo"),
                descricao: v("descricao"),
                recebida_em: v("recebida_em") ?? hojeIso(),
                prazo: v("prazo"),
              });
            }}
          >
            <div>
              <Label className="text-base font-bold">Órgão</Label>
              <select name="orgao" defaultValue="sigef" className={CLASSE_SELECT}>
                {ORGAOS.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.rotulo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="ex-protocolo" className="text-base font-bold">
                Protocolo / nº do processo
              </Label>
              <Input id="ex-protocolo" name="protocolo" className="mt-1.5 h-12 rounded-xl border-2 text-base" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="ex-desc" className="text-base font-bold">
                O que foi exigido
              </Label>
              <Textarea id="ex-desc" name="descricao" className="mt-1.5 rounded-xl border-2 text-base" />
            </div>
            <div>
              <Label htmlFor="ex-receb" className="text-base font-bold">
                Recebida em
              </Label>
              <Input
                id="ex-receb"
                name="recebida_em"
                type="date"
                defaultValue={hojeIso()}
                className="mt-1.5 h-12 rounded-xl border-2 text-base"
              />
            </div>
            <div>
              <Label htmlFor="ex-prazo" className="text-base font-bold">
                Prazo para responder
              </Label>
              <Input id="ex-prazo" name="prazo" type="date" className="mt-1.5 h-12 rounded-xl border-2 text-base" />
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={criar.isPending}>
                {criar.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Bloco>
  );
}
