import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ExternalLink,
  Loader2,
  MapPinned,
  Navigation,
  Plus,
  Route as RotaIcone,
  Search,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { data as dataBR, numero, paraNumero, reais, rotulo } from "@/lib/formato";
import { linkRota, type Ponto } from "@/lib/geo";
import {
  baseDoRoteiro,
  calcularCircuito,
  kmCircuito,
  rotuloStatusRoteiro,
  somar,
  um,
  type Parada,
  type Roteiro,
} from "@/lib/medicao";
import { ImportarKml } from "@/components/importar-kml";
import { MapaRoteiro, type ParadaMapa } from "@/components/mapa-roteiro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BarraFerramentas, CartaoIndicador, Painel, Tabela } from "@/components/painel";

export const Route = createFileRoute("/_app/medicao/")({
  head: () => ({
    meta: [
      { title: "Medição de campo | CRM de Topografia" },
      {
        name: "description",
        content:
          "Equipe, resumo do dia, roteiros, paradas, mapa Leaflet e importação de KML/KMZ ou link do Google Maps.",
      },
      { property: "og:title", content: "Medição de campo | CRM de Topografia" },
      {
        property: "og:description",
        content: "Planeje o roteiro de campo com equipe, mapa, paradas, custos e importação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pagina,
});

const SELECT_PARADA =
  "id, roteiro_id, ordem_servico_id, ordem, lat, lon, n_pontos, dispersao_km, status, sequencia_baixa, km_previsto, horas_previsto, custo_previsto, km_real, horas_real, custo_real, data_execucao, observacoes_campo, ordens_servico(id, numero, servico, status, responsavel_id, imovel_id, clientes(nome), imoveis(nome, municipio, uf))";

type RoteiroLista = Roteiro & { roteiro_paradas: Parada[] | null };
type Usuario = { id: string; nome: string | null; papel: string | null };
type OrdemDisponivel = {
  id: string;
  numero: string | null;
  servico: string | null;
  imovel_id: string | null;
  responsavel_id: string | null;
  clientes: { nome: string | null } | { nome: string | null }[] | null;
  imoveis:
    | { nome: string | null; municipio: string | null; uf: string | null }
    | { nome: string | null; municipio: string | null; uf: string | null }[]
    | null;
};
type Localizacao = { imovel_id: string; lat: number; lon: number; dispersao_km: number | null };

function nomeCliente(p: Parada): string {
  return um(um(p.ordens_servico)?.clientes)?.nome ?? "sem cliente";
}
function processo(p: Parada): string {
  const os = um(p.ordens_servico);
  return `${os?.numero ? `OS ${os.numero}` : "OS sem número"} · ${rotulo(os?.servico ?? "")}`;
}
function responsavelDaParada(p: Parada): string | null {
  const os = um(p.ordens_servico) as (OrdemDisponivel & { id: string }) | null;
  return os?.responsavel_id ?? null;
}
function cidade(p: Parada): string {
  const im = um(um(p.ordens_servico)?.imoveis);
  return [im?.municipio, im?.uf].filter(Boolean).join("/");
}
function mapaParadas(roteiro: Roteiro, paradas: Parada[]): ParadaMapa[] {
  const circuito = calcularCircuito(roteiro, paradas, roteiro.reotimizar_pendentes !== false);
  const todas = [...circuito.feitas, ...circuito.abertas];
  const primeiraAberta = circuito.abertas[0]?.id;
  return todas.map((p) => ({
    id: p.id,
    lat: Number(p.lat),
    lon: Number(p.lon),
    posicao: p.posicao,
    baixado: p.status === "baixado",
    proxima: p.id === primeiraAberta,
    cliente: nomeCliente(p),
    processo: processo(p),
  }));
}
function extrairLatLon(link: string): Ponto | null {
  const texto = link.trim();
  const padroes = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query|destination)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/,
  ];
  for (const p of padroes) {
    const m = texto.match(p);
    if (!m) continue;
    const lat = Number(m[1]);
    const lon = Number(m[2]);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
  }
  return null;
}

function Pagina() {
  const [novoAberto, setNovoAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [responsavel, setResponsavel] = useState("todos");
  const [roteiroId, setRoteiroId] = useState<string | null>(null);

  const roteirosQuery = useQuery({
    queryKey: ["roteiros"],
    queryFn: async (): Promise<RoteiroLista[]> => {
      const { data, error } = await supabase
        .from("roteiros")
        .select(`*, roteiro_paradas(${SELECT_PARADA})`)
        .order("data_prevista", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as unknown as RoteiroLista[];
    },
  });
  const usuariosQuery = useQuery({
    queryKey: ["medicao", "equipe"],
    queryFn: async (): Promise<Usuario[]> => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome, papel")
        .in("papel", ["eng_responsavel", "admin", "administrativo"])
        .order("nome");
      if (error) throw error;
      return (data ?? []) as Usuario[];
    },
  });

  useEffect(() => {
    if (!roteiroId && roteirosQuery.data?.[0]) setRoteiroId(roteirosQuery.data[0].id);
  }, [roteiroId, roteirosQuery.data]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (roteirosQuery.data ?? []).filter((r) => {
      const paradas = r.roteiro_paradas ?? [];
      if (responsavel !== "todos" && !paradas.some((p) => responsavelDaParada(p) === responsavel))
        return false;
      if (!termo) return true;
      return `${r.nome} ${r.base_endereco ?? ""} ${paradas.map((p) => `${nomeCliente(p)} ${processo(p)} ${cidade(p)}`).join(" ")}`
        .toLowerCase()
        .includes(termo);
    });
  }, [roteirosQuery.data, busca, responsavel]);

  const selecionado = filtrados.find((r) => r.id === roteiroId) ?? filtrados[0] ?? null;
  const paradas = selecionado?.roteiro_paradas ?? [];
  const circuito = selecionado
    ? calcularCircuito(selecionado, paradas, selecionado.reotimizar_pendentes !== false)
    : null;
  const todas = circuito ? [...circuito.feitas, ...circuito.abertas] : [];
  const totais = somar(todas);
  const hoje = new Date().toISOString().slice(0, 10);
  const roteirosHoje = filtrados.filter((r) => r.data_prevista === hoje);
  const paradasHoje = roteirosHoje.flatMap((r) => r.roteiro_paradas ?? []);
  const paradasPendentes = paradas.filter((p) => p.status !== "baixado").length;

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <RotaIcone className="size-6 text-primary" strokeWidth={2.5} />
          Medição
        </h1>
        <Button onClick={() => setNovoAberto(true)} className="h-11 px-4 text-base">
          <Plus className="size-5" strokeWidth={3} />
          Novo roteiro
        </Button>
      </header>
      <BarraFerramentas>
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por roteiro, cliente, OS ou cidade"
            className="h-11 rounded-full border pl-11"
          />
        </div>
        <select
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          className="h-11 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground"
        >
          <option value="todos">Toda equipe</option>
          {(usuariosQuery.data ?? []).map((u) => (
            <option key={u.id} value={u.id}>
              {u.nome ?? rotulo(u.papel)}
            </option>
          ))}
        </select>
      </BarraFerramentas>

      <div className="grade-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CartaoIndicador
          icone={CalendarDays}
          valor={roteirosHoje.length}
          rotulo="Roteiros hoje"
          apoio={`${paradasHoje.length} paradas`}
          destino="/servicos"
        />
        <CartaoIndicador
          icone={MapPinned}
          valor={paradasPendentes}
          rotulo="Paradas pendentes"
          apoio={selecionado?.nome ?? "roteiro selecionado"}
          tom={paradasPendentes ? "atencao" : "neutro"}
          destino="/servicos"
        />
        <CartaoIndicador
          icone={Navigation}
          valor={`${numero(totais.kmPrevisto, 0)} km`}
          rotulo="Circuito previsto"
          apoio={reais(totais.custoPrevisto)}
          destino="/servicos"
        />
      </div>

      {roteirosQuery.isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-10 animate-spin text-primary" />
        </div>
      ) : roteirosQuery.error ? (
        <p className="text-lg font-semibold text-destructive">
          Não foi possível carregar os roteiros.
        </p>
      ) : filtrados.length === 0 ? (
        <p className="text-lg font-medium text-muted-foreground">Nenhum roteiro encontrado.</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Painel titulo="Roteiros" icone={RotaIcone}>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 xl:mx-0 xl:block xl:space-y-3 xl:overflow-visible xl:px-0">
              {filtrados.map((r) => {
                const ps = r.roteiro_paradas ?? [];
                const feitas = ps.filter((p) => p.status === "baixado").length;
                const ativo = selecionado?.id === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRoteiroId(r.id)}
                    className={`w-[82vw] shrink-0 rounded-lg border p-4 text-left shadow-card sm:w-80 xl:w-full ${ativo ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-accent"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <strong className="block truncate text-lg text-foreground">{r.nome}</strong>
                        <span className="block text-sm font-semibold text-muted-foreground">
                          {r.data_prevista ? dataBR(r.data_prevista) : "sem data"}
                          {r.base_endereco ? ` · ${r.base_endereco}` : ""}
                        </span>
                      </span>
                      <Badge
                        variant="outline"
                        className="gap-1.5 rounded-full border-border bg-card px-2.5 py-1 text-xs text-foreground"
                      >
                        <span
                          className={`size-2 rounded-full ${r.status === "concluido" ? "bg-primary" : "bg-warning"}`}
                        />
                        {rotuloStatusRoteiro(r.status)}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm font-extrabold text-primary">
                      {feitas}/{ps.length} paradas · {numero(kmCircuito(r, ps), 1)} km
                    </p>
                  </button>
                );
              })}
            </div>
          </Painel>

          <div className="space-y-4">
            <Painel
              titulo="Mapa do roteiro"
              icone={MapPinned}
              acao={
                selecionado ? (
                  <Button asChild variant="outline" className="h-9 px-3 text-sm">
                    <Link to="/medicao/$id" params={{ id: selecionado.id }}>
                      Abrir roteiro
                    </Link>
                  </Button>
                ) : null
              }
            >
              {selecionado ? (
                <MapaRoteiro
                  base={baseDoRoteiro(selecionado, paradas)}
                  paradas={mapaParadas(selecionado, paradas)}
                  altura={360}
                />
              ) : (
                <p className="text-base font-medium text-muted-foreground">
                  Selecione um roteiro para ver o mapa.
                </p>
              )}
            </Painel>
            <Painel titulo="Paradas" icone={MapPinned}>
              <Tabela>
                <table className="w-full min-w-[820px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border text-xs font-bold uppercase text-muted-foreground">
                      <th className="px-3 py-2">Ordem</th>
                      <th className="px-3 py-2">Cliente</th>
                      <th className="px-3 py-2">Cidade</th>
                      <th className="px-3 py-2">Km</th>
                      <th className="px-3 py-2">Custo</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Rota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todas.map((p) => {
                      const base = selecionado ? baseDoRoteiro(selecionado, paradas) : null;
                      return (
                        <tr key={p.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-3 text-sm font-extrabold text-primary">
                            {p.posicao}
                          </td>
                          <td className="px-3 py-3">
                            <span className="block text-sm font-bold text-foreground">
                              {nomeCliente(p)}
                            </span>
                            <span className="block text-xs font-semibold text-muted-foreground">
                              {processo(p)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm font-semibold text-muted-foreground">
                            {cidade(p) || "—"}
                          </td>
                          <td className="px-3 py-3 text-sm font-bold text-foreground">
                            {numero(p.km_previsto ?? p.previsto.km, 1)}
                          </td>
                          <td className="px-3 py-3 text-sm font-bold text-foreground">
                            {reais(p.custo_previsto ?? p.previsto.custo)}
                          </td>
                          <td className="px-3 py-3">
                            <Badge
                              variant="outline"
                              className="gap-1.5 rounded-full border-border bg-card px-2.5 py-1 text-xs text-foreground"
                            >
                              <span
                                className={`size-2 rounded-full ${p.status === "baixado" ? "bg-primary" : "bg-warning"}`}
                              />
                              {p.status === "baixado" ? "Baixado" : "Pendente"}
                            </Badge>
                          </td>
                          <td className="px-3 py-3">
                            {base ? (
                              <a
                                href={linkRota(base, { lat: Number(p.lat), lon: Number(p.lon) })}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-sm font-extrabold text-primary"
                              >
                                Maps <ExternalLink className="size-3" />
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Tabela>
              {todas.length === 0 ? (
                <p className="text-base font-medium text-muted-foreground">
                  Nenhuma parada no roteiro selecionado.
                </p>
              ) : null}
            </Painel>
            {selecionado ? <PainelImportacao roteiroId={selecionado.id} paradas={paradas} /> : null}
          </div>
        </div>
      )}
      <NovoRoteiro aberta={novoAberto} onFechar={() => setNovoAberto(false)} />
    </section>
  );
}

function PainelImportacao({ roteiroId, paradas }: { roteiroId: string; paradas: Parada[] }) {
  const { perfil } = usePerfil();
  const queryClient = useQueryClient();
  const [ordemId, setOrdemId] = useState("");
  const [maps, setMaps] = useState("");
  const jaNoRoteiro = new Set(paradas.map((p) => p.ordem_servico_id));
  const ordensQuery = useQuery({
    queryKey: ["ordens_servico", "para-roteiro"],
    queryFn: async (): Promise<OrdemDisponivel[]> => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select(
          "id, numero, servico, imovel_id, responsavel_id, clientes(nome), imoveis(nome, municipio, uf)",
        )
        .not("imovel_id", "is", null)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrdemDisponivel[];
    },
  });
  const disponiveis = (ordensQuery.data ?? []).filter((o) => !jaNoRoteiro.has(o.id));
  const escolhida = disponiveis.find((o) => o.id === ordemId) ?? null;
  const imovelIds = disponiveis.map((o) => o.imovel_id).filter((v): v is string => !!v);
  const localizacoesQuery = useQuery({
    queryKey: ["imovel_localizacao", imovelIds.join(",")],
    enabled: imovelIds.length > 0,
    queryFn: async (): Promise<Localizacao[]> => {
      const { data, error } = await supabase
        .from("imovel_localizacao")
        .select("imovel_id, lat, lon, dispersao_km")
        .in("imovel_id", imovelIds);
      if (error) throw error;
      return (data ?? []) as Localizacao[];
    },
  });
  const localizacao = escolhida?.imovel_id
    ? localizacoesQuery.data?.find((l) => l.imovel_id === escolhida.imovel_id)
    : null;

  const adicionar = useMutation({
    mutationFn: async ({
      lat,
      lon,
      dispersao,
      nPontos,
    }: {
      lat: number;
      lon: number;
      dispersao: number | null;
      nPontos: number;
    }) => {
      if (!perfil || !escolhida) throw new Error("Escolha a OS.");
      if (escolhida.imovel_id) {
        await supabase.from("imovel_localizacao").upsert(
          {
            empresa_id: perfil.empresa_id,
            imovel_id: escolhida.imovel_id,
            lat,
            lon,
            dispersao_km: dispersao,
            atualizado_em: new Date().toISOString(),
          },
          { onConflict: "imovel_id" },
        );
      }
      const { error } = await supabase.from("roteiro_paradas").insert({
        empresa_id: perfil.empresa_id,
        roteiro_id: roteiroId,
        ordem_servico_id: escolhida.id,
        lat,
        lon,
        n_pontos: nPontos,
        dispersao_km: dispersao,
        status: "pendente",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roteiros"] });
      void queryClient.invalidateQueries({ queryKey: ["roteiro", roteiroId] });
      setOrdemId("");
      setMaps("");
      toast.success("Parada adicionada ao roteiro.");
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível adicionar a parada."),
  });

  function adicionarPorMaps() {
    const ponto = extrairLatLon(maps);
    if (!ponto) {
      toast.error("Cole um link do Google Maps com latitude e longitude.");
      return;
    }
    adicionar.mutate({ lat: ponto.lat, lon: ponto.lon, dispersao: null, nPontos: 1 });
  }

  return (
    <Painel titulo="Importação de paradas" icone={Upload}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <Label className="text-base font-bold text-foreground">Ordem de serviço</Label>
          <select
            value={ordemId}
            onChange={(e) => setOrdemId(e.target.value)}
            className="mt-1.5 h-12 w-full rounded-lg border border-border bg-card px-3 text-base font-semibold text-foreground"
          >
            <option value="">Escolha uma OS fora do roteiro</option>
            {disponiveis.map((o) => (
              <option key={o.id} value={o.id}>
                {o.numero ? `OS ${o.numero}` : "OS"} · {um(o.clientes)?.nome ?? "sem cliente"}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          {escolhida?.imovel_id ? (
            <ImportarKml
              imovelId={escolhida.imovel_id}
              rotulo="KML/KMZ"
              onPronto={(r) =>
                adicionar.mutate({
                  lat: r.lat,
                  lon: r.lon,
                  dispersao: r.dispersao,
                  nPontos: r.nPontos,
                })
              }
            />
          ) : (
            <Button variant="outline" disabled className="h-12">
              <Upload className="size-5" />
              KML/KMZ
            </Button>
          )}
        </div>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
        <Input
          value={maps}
          onChange={(e) => setMaps(e.target.value)}
          placeholder="Cole aqui o link do Google Maps ou lat,lon"
          className="h-12 rounded-lg border text-base font-semibold"
        />
        <Button
          onClick={adicionarPorMaps}
          disabled={!escolhida || adicionar.isPending}
          className="h-12 px-4 text-base"
        >
          <MapPinned className="size-5" />
          Adicionar por Maps
        </Button>
      </div>
      {localizacao ? (
        <p className="mt-3 text-sm font-bold text-primary">
          Imóvel já tem localização: {numero(localizacao.lat, 5)}, {numero(localizacao.lon, 5)}.
        </p>
      ) : null}
    </Painel>
  );
}

function NovoRoteiro({ aberta, onFechar }: { aberta: boolean; onFechar: () => void }) {
  const { perfil } = usePerfil();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");
  const [dataPrevista, setDataPrevista] = useState("");
  const [endereco, setEndereco] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  useEffect(() => {
    if (!aberta) {
      setNome("");
      setDataPrevista("");
      setEndereco("");
      setLat("");
      setLon("");
    }
  }, [aberta]);
  const criar = useMutation({
    mutationFn: async () => {
      if (!perfil) throw new Error("Perfil não carregado.");
      if (!nome.trim()) throw new Error("Informe o nome do roteiro.");
      const { data, error } = await supabase
        .from("roteiros")
        .insert({
          empresa_id: perfil.empresa_id,
          nome: nome.trim(),
          data_prevista: dataPrevista || null,
          base_endereco: endereco.trim() || null,
          base_lat: lat.trim() ? Number(lat.replace(",", ".")) : null,
          base_lon: lon.trim() ? Number(lon.replace(",", ".")) : null,
          criado_por: perfil.id,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      void queryClient.invalidateQueries({ queryKey: ["roteiros"] });
      onFechar();
      toast.success("Roteiro criado.");
      void navigate({ to: "/medicao/$id", params: { id } });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível criar o roteiro."),
  });
  return (
    <Dialog open={aberta} onOpenChange={(v) => (v ? null : onFechar())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg border-2">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">Novo roteiro de campo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="nome-roteiro" className="text-base font-bold text-foreground">
              Nome do roteiro
            </Label>
            <Input
              id="nome-roteiro"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Campo Itapeva — semana 12"
              className="mt-1.5 h-12 rounded-lg border text-base font-semibold"
            />
          </div>
          <div>
            <Label htmlFor="data-roteiro" className="text-base font-bold text-foreground">
              Data prevista
            </Label>
            <Input
              id="data-roteiro"
              type="date"
              value={dataPrevista}
              onChange={(e) => setDataPrevista(e.target.value)}
              className="mt-1.5 h-12 rounded-lg border text-base font-semibold"
            />
          </div>
          <div>
            <Label htmlFor="base-roteiro" className="text-base font-bold text-foreground">
              Base de saída
            </Label>
            <Input
              id="base-roteiro"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Ex.: Escritório — Itapeva/SP"
              className="mt-1.5 h-12 rounded-lg border text-base font-semibold"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="lat-roteiro" className="text-base font-bold text-foreground">
                Latitude da base
              </Label>
              <Input
                id="lat-roteiro"
                value={lat}
                inputMode="decimal"
                onChange={(e) => setLat(e.target.value)}
                placeholder="-23.98"
                className="mt-1.5 h-12 rounded-lg border text-base font-semibold"
              />
            </div>
            <div>
              <Label htmlFor="lon-roteiro" className="text-base font-bold text-foreground">
                Longitude da base
              </Label>
              <Input
                id="lon-roteiro"
                value={lon}
                inputMode="decimal"
                onChange={(e) => setLon(e.target.value)}
                placeholder="-48.87"
                className="mt-1.5 h-12 rounded-lg border text-base font-semibold"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => criar.mutate()}
            disabled={criar.isPending}
            className="h-12 w-full text-base font-extrabold"
          >
            {criar.isPending ? <Loader2 className="size-5 animate-spin" /> : "Criar roteiro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
