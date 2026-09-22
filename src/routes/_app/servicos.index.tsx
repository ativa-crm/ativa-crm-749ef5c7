import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  Plus,
  Search,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { data as dataBR, numero, reais, rotulo } from "@/lib/formato";
import { STATUS_ENCERRADOS, STATUS_OS, semaforoPrazo } from "@/lib/prazo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarraFerramentas, CartaoIndicador, Painel, Tabela } from "@/components/painel";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/servicos/")({
  head: () => ({
    meta: [
      { title: "Serviços | CRM de Topografia" },
      {
        name: "description",
        content:
          "Ordens de serviço em lista e por etapa, com checklist, progresso e semáforo de prazo.",
      },
      { property: "og:title", content: "Serviços | CRM de Topografia" },
      {
        property: "og:description",
        content: "OS com etapa atual, responsáveis, checklist e prazos em semáforo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pagina,
});

type Ordem = {
  id: string;
  numero: string | null;
  servico: string | null;
  status: string | null;
  prazo: string | null;
  criado_em: string | null;
  responsavel_id: string | null;
  clientes: { nome: string | null } | { nome: string | null }[] | null;
  imoveis:
    | { nome: string | null; municipio: string | null; uf: string | null }
    | { nome: string | null; municipio: string | null; uf: string | null }[]
    | null;
};

type Etapa = {
  id: string;
  os_id: string;
  nome: string | null;
  ordem: number | null;
  concluida_em: string | null;
  responsavel_id: string | null;
};
type Catalogo = {
  id: string;
  nome: string | null;
  preco_base: number | null;
  prazo_padrao_dias: number | null;
  ativo: boolean | null;
};
type Cliente = { id: string; nome: string | null };
type Imovel = { id: string; nome: string | null; municipio: string | null };

type Visao = "lista" | "etapa";

const CLASSE_SELECT =
  "mt-1.5 h-12 w-full rounded-lg border border-border bg-card px-3 text-base font-semibold text-foreground";

function um<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function progresso(osId: string, etapas: Etapa[]) {
  const itens = etapas
    .filter((e) => e.os_id === osId)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  const feitas = itens.filter((e) => e.concluida_em).length;
  return {
    itens,
    feitas,
    total: itens.length,
    valor: itens.length ? Math.round((feitas / itens.length) * 100) : 0,
  };
}

function Pagina() {
  const { perfil } = usePerfil();
  const [busca, setBusca] = useState("");
  const [visao, setVisao] = useState<Visao>("lista");
  const [novaAberta, setNovaAberta] = useState(false);

  const ordensQuery = useQuery({
    queryKey: ["ordens_servico"],
    queryFn: async (): Promise<Ordem[]> => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select(
          "id, numero, servico, status, prazo, criado_em, responsavel_id, clientes(nome), imoveis(nome, municipio, uf), usuarios(nome)",
        )
        .order("prazo", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as unknown as Ordem[];
    },
  });

  const usuariosQuery = useQuery({
    queryKey: ["usuarios", "responsaveis", perfil?.empresa_id],
    enabled: !!perfil?.empresa_id,
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome")
        .eq("empresa_id", perfil?.empresa_id as string)
        .order("nome");
      if (error) throw error;
      return Object.fromEntries(
        ((data ?? []) as { id: string; nome: string | null }[]).map((u) => [u.id, u.nome ?? "—"]),
      );
    },
  });

  const etapasQuery = useQuery({
    queryKey: ["os_etapas", "lista"],
    queryFn: async (): Promise<Etapa[]> => {
      const { data, error } = await supabase
        .from("os_etapas")
        .select("id, os_id, nome, ordem, concluida_em, responsavel_id")
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Etapa[];
    },
  });

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (ordensQuery.data ?? []).filter((o) => {
      if (!termo) return true;
      return `${o.numero ?? ""} ${um(o.clientes)?.nome ?? ""} ${um(o.imoveis)?.nome ?? ""} ${um(o.imoveis)?.municipio ?? ""} ${rotulo(o.servico)} ${rotulo(o.status)}`
        .toLowerCase()
        .includes(termo);
    });
  }, [ordensQuery.data, busca]);

  const abertas = filtradas.filter((o) => !STATUS_ENCERRADOS.includes(o.status ?? ""));
  const urgentes = abertas.filter((o) => {
    const sem = semaforoPrazo(o.prazo, o.status);
    return sem.nivel === "vermelho";
  });
  const concluidas = filtradas.filter((o) => STATUS_ENCERRADOS.includes(o.status ?? "")).length;
  const etapas = etapasQuery.data ?? [];

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Wrench className="size-6 text-primary" strokeWidth={2.5} />
          Serviços
        </h1>
        <Button onClick={() => setNovaAberta(true)} className="h-11 px-4 text-base">
          <Plus className="size-5" strokeWidth={3} />
          Nova OS
        </Button>
      </header>

      <BarraFerramentas>
        <div className="relative min-w-64 flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            strokeWidth={2.5}
          />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por número, cliente, imóvel, serviço ou etapa"
            className="h-11 rounded-full border pl-11"
          />
        </div>
        <div className="seg">
          <button
            type="button"
            data-ativo={visao === "lista"}
            onClick={() => setVisao("lista")}
            className="seg-item"
          >
            Lista
          </button>
          <button
            type="button"
            data-ativo={visao === "etapa"}
            onClick={() => setVisao("etapa")}
            className="seg-item"
          >
            Por etapa
          </button>
        </div>
      </BarraFerramentas>

      <div className="grade-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CartaoIndicador
          icone={ClipboardList}
          valor={abertas.length}
          rotulo="OS abertas"
          apoio="em execução"
          destino="/servicos"
        />
        <CartaoIndicador
          icone={TriangleAlert}
          valor={urgentes.length}
          rotulo="Prazo vermelho"
          apoio="atenção imediata"
          tom={urgentes.length ? "critico" : "neutro"}
          destino="/servicos"
        />
        <CartaoIndicador
          icone={CheckCircle2}
          valor={concluidas}
          rotulo="Encerradas"
          apoio="no filtro atual"
          destino="/servicos"
        />
      </div>

      {ordensQuery.isPending || etapasQuery.isPending || usuariosQuery.isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : ordensQuery.error || etapasQuery.error || usuariosQuery.error ? (
        <p className="text-lg font-semibold text-destructive">
          Não foi possível carregar as ordens de serviço.
        </p>
      ) : filtradas.length === 0 ? (
        <p className="text-lg font-medium text-muted-foreground">
          Nenhuma ordem de serviço encontrada.
        </p>
      ) : visao === "lista" ? (
        <Painel
          titulo="Ordens de serviço"
          icone={Wrench}
          acao={
            <span className="text-sm font-bold text-muted-foreground">
              {filtradas.length} itens
            </span>
          }
        >
          <Tabela>
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border text-xs font-bold uppercase text-muted-foreground">
                  <th className="px-3 py-2">OS</th>
                  <th className="px-3 py-2">Cliente / imóvel</th>
                  <th className="px-3 py-2">Serviço</th>
                  <th className="px-3 py-2">Etapa</th>
                  <th className="px-3 py-2">Checklist</th>
                  <th className="px-3 py-2">Responsável</th>
                  <th className="px-3 py-2">Prazo</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((o) => {
                  const p = progresso(o.id, etapas);
                  const atual = p.itens.find((e) => !e.concluida_em) ?? p.itens[p.itens.length - 1];
                  const sem = semaforoPrazo(o.prazo, o.status);
                  return (
                    <tr key={o.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-3">
                        <Link
                          to="/servicos/$id"
                          params={{ id: o.id }}
                          className="font-extrabold text-foreground hover:text-primary"
                        >
                          {o.numero ? `OS ${o.numero}` : "OS"}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <span className="block font-bold text-foreground">
                          {um(o.clientes)?.nome ?? "—"}
                        </span>
                        <span className="block text-sm font-semibold text-muted-foreground">
                          {[um(o.imoveis)?.nome, um(o.imoveis)?.municipio]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-foreground">
                        {rotulo(o.servico)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge
                          variant="outline"
                          className="gap-1.5 rounded-full border-border bg-card px-2.5 py-1 text-xs text-foreground"
                        >
                          <span className="size-2 rounded-full bg-primary" aria-hidden />
                          {rotulo(o.status) || atual?.nome || "—"}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <div className="min-w-36">
                          <Progress value={p.valor} className="h-2" />
                          <span className="mt-1 block text-xs font-bold text-muted-foreground">
                            {p.feitas}/{p.total} · {p.valor}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-muted-foreground">
                        {o.responsavel_id ? (usuariosQuery.data?.[o.responsavel_id] ?? "—") : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <Badge
                          variant="outline"
                          className="gap-1.5 rounded-full border-border bg-card px-2.5 py-1 text-xs text-foreground"
                        >
                          <span className={`size-2 rounded-full ${sem.ponto}`} aria-hidden />
                          {sem.texto || (o.prazo ? dataBR(o.prazo) : "—")}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Tabela>
        </Painel>
      ) : (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 md:mx-0 md:px-0">
          {STATUS_OS.map((status) => {
            const grupo = filtradas.filter((o) => (o.status ?? "") === status.valor);
            return (
              <section
                key={status.valor}
                className="w-[85vw] shrink-0 rounded-lg border border-border bg-background-light p-3 sm:w-80"
              >
                <header className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase text-foreground">{status.rotulo}</h2>
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground">
                    {grupo.length}
                  </span>
                </header>
                <div className="space-y-3">
                  {grupo.map((o) => {
                    const p = progresso(o.id, etapas);
                    const sem = semaforoPrazo(o.prazo, o.status);
                    return (
                      <Link
                        key={o.id}
                        to="/servicos/$id"
                        params={{ id: o.id }}
                        className="block rounded-lg border border-border bg-card p-3 shadow-card hover:bg-accent"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <strong className="truncate text-base text-foreground">
                            {o.numero ? `OS ${o.numero}` : "OS"}
                          </strong>
                          <span className={`size-3 rounded-full ${sem.ponto}`} />
                        </div>
                        <p className="mt-1 truncate text-sm font-bold text-foreground">
                          {um(o.clientes)?.nome ?? "Sem cliente"}
                        </p>
                        <p className="truncate text-sm font-semibold text-muted-foreground">
                          {um(o.imoveis)?.nome ?? "Sem imóvel"}
                        </p>
                        <Progress value={p.valor} className="mt-3 h-2" />
                        <p className="mt-1 text-xs font-bold uppercase text-muted-foreground">
                          {p.feitas}/{p.total} etapas · {sem.texto}
                        </p>
                      </Link>
                    );
                  })}
                  {grupo.length === 0 ? (
                    <p className="py-6 text-center text-base font-semibold text-muted-foreground">
                      Nenhuma OS
                    </p>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <NovaOs aberta={novaAberta} onFechar={() => setNovaAberta(false)} />
    </section>
  );
}

function NovaOs({ aberta, onFechar }: { aberta: boolean; onFechar: () => void }) {
  const { perfil } = usePerfil();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [clienteId, setClienteId] = useState("");
  const [imovelId, setImovelId] = useState("");
  const [catalogoId, setCatalogoId] = useState("");
  const [prazo, setPrazo] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (!aberta) {
      setClienteId("");
      setImovelId("");
      setCatalogoId("");
      setPrazo("");
      setObservacoes("");
    }
  }, [aberta]);

  const catalogoQuery = useQuery({
    queryKey: ["servicos_catalogo", "ativos"],
    enabled: aberta,
    queryFn: async (): Promise<Catalogo[]> => {
      const { data, error } = await supabase
        .from("servicos_catalogo")
        .select("id, nome, preco_base, prazo_padrao_dias, ativo")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as Catalogo[];
    },
  });
  const clientesQuery = useQuery({
    queryKey: ["clientes", "seletor"],
    enabled: aberta,
    queryFn: async (): Promise<Cliente[]> => {
      const { data, error } = await supabase.from("clientes").select("id, nome").order("nome");
      if (error) throw error;
      return (data ?? []) as Cliente[];
    },
  });
  const imoveisQuery = useQuery({
    queryKey: ["imoveis", "seletor", clienteId],
    enabled: aberta && clienteId !== "",
    queryFn: async (): Promise<Imovel[]> => {
      const { data, error } = await supabase
        .from("imoveis")
        .select("id, nome, municipio")
        .eq("cliente_id", clienteId)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as Imovel[];
    },
  });

  const selecionado = catalogoQuery.data?.find((s) => s.id === catalogoId);
  useEffect(() => {
    if (!selecionado?.prazo_padrao_dias || prazo) return;
    const data = new Date();
    data.setDate(data.getDate() + Number(selecionado.prazo_padrao_dias));
    setPrazo(data.toISOString().slice(0, 10));
  }, [selecionado, prazo]);

  const criar = useMutation({
    mutationFn: async () => {
      if (!perfil) throw new Error("Perfil não carregado.");
      if (!clienteId) throw new Error("Escolha o cliente.");
      if (!catalogoId || !selecionado?.nome) throw new Error("Escolha o serviço.");
      const { data: gerado, error: erroNumero } = await supabase.rpc("proximo_numero", {
        p_empresa: perfil.empresa_id,
        p_tipo: "os",
      });
      const numeroGerado = erroNumero ? null : (gerado as string);
      const { data: nova, error } = await supabase
        .from("ordens_servico")
        .insert({
          empresa_id: perfil.empresa_id,
          cliente_id: clienteId,
          imovel_id: imovelId || null,
          numero: numeroGerado,
          servico: selecionado.nome,
          status: "aguardando_documentos",
          prazo: prazo || null,
          responsavel_id: perfil.id,
          observacoes: observacoes.trim() || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      const osId = nova.id as string;
      const { error: erroEtapas } = await supabase.rpc("criar_etapas_padrao", {
        p_os: osId,
        p_servico: selecionado.nome,
      });
      if (erroEtapas) toast.error("OS criada, mas o checklist padrão não foi gerado.");
      return osId;
    },
    onSuccess: (osId) => {
      void queryClient.invalidateQueries({ queryKey: ["ordens_servico"] });
      onFechar();
      toast.success("Ordem de serviço criada.");
      void navigate({ to: "/servicos/$id", params: { id: osId } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível criar a OS."),
  });

  return (
    <Dialog open={aberta} onOpenChange={(v) => (v ? null : onFechar())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg border-2 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">Nova ordem de serviço</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-base font-bold text-foreground">Cliente</Label>
            <select
              value={clienteId}
              onChange={(e) => {
                setClienteId(e.target.value);
                setImovelId("");
              }}
              className={CLASSE_SELECT}
            >
              <option value="">Escolha o cliente</option>
              {(clientesQuery.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome ?? "sem nome"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-base font-bold text-foreground">Imóvel</Label>
            <select
              value={imovelId}
              onChange={(e) => setImovelId(e.target.value)}
              disabled={!clienteId}
              className={CLASSE_SELECT}
            >
              <option value="">
                {clienteId ? "Escolha o imóvel" : "Escolha o cliente primeiro"}
              </option>
              {(imoveisQuery.data ?? []).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome ?? "sem nome"}
                  {i.municipio ? ` — ${i.municipio}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-base font-bold text-foreground">Serviço</Label>
            <select
              value={catalogoId}
              onChange={(e) => {
                setCatalogoId(e.target.value);
                setPrazo("");
              }}
              className={CLASSE_SELECT}
            >
              <option value="">Escolha no catálogo</option>
              {(catalogoQuery.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome ?? "Serviço"}
                  {s.preco_base ? ` — ${reais(s.preco_base)}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="prazo-os" className="text-base font-bold text-foreground">
              Prazo
            </Label>
            <Input
              id="prazo-os"
              type="date"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              className="mt-1.5 h-12 rounded-lg border text-base font-semibold"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="obs-os" className="text-base font-bold text-foreground">
              Observações
            </Label>
            <Input
              id="obs-os"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações para a equipe"
              className="mt-1.5 h-12 rounded-lg border text-base font-semibold"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => criar.mutate()}
            disabled={!clienteId || !catalogoId || criar.isPending}
            className="h-12 w-full text-base font-extrabold"
          >
            {criar.isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Plus className="size-5" />
            )}
            Criar OS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
