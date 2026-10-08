import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Crosshair,
  Download,
  ExternalLink,
  Layers,
  Loader2,
  Map as MapaIcone,
  MapPin,
  Plus,
  Satellite,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapaFundiario } from "@/components/mapa-fundiario";
import { supabase } from "@/lib/supabase";
import { areaHa, numero } from "@/lib/formato";
import { paraGms } from "@/lib/geo";
import {
  baixarCsv,
  buscarNoMapa,
  caixaDe,
  corToken,
  COR_CAR_PADRAO,
  COR_CCIR,
  COR_SELECIONADA,
  COR_SIGEF,
  detalhesMapa,
  lerCoordenada,
  PALETA_CONFRONTANTES,
  ROTULO_CAMADA,
  semAcento,
  useBuscaMapa,
  useDetalhesMapa,
  useFontesMapa,
  useMunicipiosMapa,
  type Camada,
  type DetalheArea,
  type FeicaoNoPonto,
  type MunicipioMapa,
  type ResultadoBusca,
  type Selecao,
  type TipoResultado,
  type Vizinhanca,
} from "@/lib/mapa";

type BuscaUrl = { busca?: string; car?: string; sigef?: string; ccir?: string };

export const Route = createFileRoute("/_app/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa | CRM de Topografia" },
      { name: "description", content: "Camadas CAR, SIGEF e CCIR de São Paulo com busca, confrontantes e ligação com o CRM." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): BuscaUrl => ({
    busca: typeof s.busca === "string" && s.busca ? s.busca : undefined,
    car: typeof s.car === "string" && s.car ? s.car : undefined,
    sigef: typeof s.sigef === "string" && s.sigef ? s.sigef : undefined,
    ccir: typeof s.ccir === "string" && s.ccir ? s.ccir : undefined,
  }),
  component: PaginaMapa,
});

function corTipo(tipo: TipoResultado): string {
  if (tipo === "car") return corToken("--primary", COR_CAR_PADRAO);
  if (tipo === "sigef") return COR_SIGEF;
  if (tipo === "ccir") return COR_CCIR;
  return "";
}

function BadgeTipo({ tipo }: { tipo: TipoResultado }) {
  const cor = corTipo(tipo);
  if (!cor)
    return (
      <Badge variant="outline" className="shrink-0 text-[11px] font-extrabold uppercase">
        {ROTULO_CAMADA[tipo]}
      </Badge>
    );
  return (
    <Badge
      className={`shrink-0 border-transparent text-[11px] font-extrabold uppercase ${tipo === "ccir" ? "text-black" : "text-white"}`}
      style={{ background: cor }}
    >
      {ROTULO_CAMADA[tipo]}
    </Badge>
  );
}

function SeloCrm({ nome }: { nome: string | null }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-extrabold text-primary">
      No CRM{nome ? ` · ${nome}` : ""}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Seletor de município (lista filtrada por digitação)                 */
/* ------------------------------------------------------------------ */
function SeletorMunicipio({
  municipios,
  valor,
  onEscolher,
  permitirTodos = true,
}: {
  municipios: MunicipioMapa[];
  valor: MunicipioMapa | null;
  onEscolher: (m: MunicipioMapa | null) => void;
  permitirTodos?: boolean;
}) {
  const [texto, setTexto] = useState("");
  const [aberto, setAberto] = useState(false);
  const filtrados = useMemo(() => {
    const t = semAcento(texto);
    const lista = t ? municipios.filter((m) => semAcento(m.nome).includes(t)) : municipios;
    return lista.slice(0, 60);
  }, [municipios, texto]);

  return (
    <div className="relative">
      <Input
        value={aberto ? texto : (valor?.nome ?? "")}
        placeholder={permitirTodos ? "Todo o estado (filtrar por município…)" : "Digite o município…"}
        onFocus={() => {
          setTexto("");
          setAberto(true);
        }}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        onChange={(e) => setTexto(e.target.value)}
        className="h-11 pr-10"
        aria-label="Município"
      />
      {valor && !aberto && permitirTodos && (
        <button
          type="button"
          aria-label="Limpar município"
          onClick={() => onEscolher(null)}
          className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      )}
      {aberto && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-card">
          {permitirTodos && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onEscolher(null);
                setAberto(false);
              }}
              className="flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm font-bold text-muted-foreground hover:bg-muted"
            >
              Todo o estado
            </button>
          )}
          {filtrados.map((m) => (
            <button
              key={m.cod_municipio}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onEscolher(m);
                setAberto(false);
              }}
              className="flex min-h-10 w-full items-center justify-between gap-2 rounded-md px-3 text-left text-sm font-semibold text-foreground hover:bg-muted"
            >
              <span className="truncate">{m.nome}</span>
              <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                {m.n_car} CAR · {m.n_sigef} SIGEF
              </span>
            </button>
          ))}
          {filtrados.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum município.</p>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */
function PaginaMapa() {
  const params = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fontesQuery = useFontesMapa();
  const municipiosQuery = useMunicipiosMapa();
  const municipios = municipiosQuery.data ?? [];

  const [aba, setAba] = useState<"numero" | "municipio" | "coordenada">("numero");
  const [texto, setTexto] = useState("");
  const [municipio, setMunicipio] = useState<MunicipioMapa | null>(null);
  const [coordTexto, setCoordTexto] = useState("");
  const [selecao, setSelecao] = useState<Selecao | null>(null);
  const [vista, setVista] = useState<"satelite" | "ruas">("satelite");
  const [camadas, setCamadas] = useState<Record<Camada, boolean>>({ car: true, sigef: true, ccir: true });
  const [mostrarConf, setMostrarConf] = useState(true);
  const [vizinhanca, setVizinhanca] = useState<Vizinhanca | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [realce, setRealce] = useState<{ camada: Camada; fid: number } | null>(null);
  const [contorno, setContorno] = useState<unknown | null>(null);
  const [pino, setPino] = useState<{ lon: number; lat: number; seq: number } | null>(null);
  const [ajusteCaixa, setAjusteCaixa] = useState<{ caixa: [number, number, number, number]; seq: number } | null>(null);
  const [zoom, setZoom] = useState(10);
  const [painelAberto, setPainelAberto] = useState(true);
  const [painelCamadas, setPainelCamadas] = useState(false);
  const [noPonto, setNoPonto] = useState<FeicaoNoPonto[] | null>(null);
  const [ativo, setAtivo] = useState(0);
  const seq = useRef(1);

  const fontes = fontesQuery.data ?? { car: null, sigef: null, ccir: null };
  const busca = useBuscaMapa(texto, municipio?.cod_municipio ?? null);
  const resultados = busca.data ?? [];
  const coordenada = useMemo(() => lerCoordenada(coordTexto), [coordTexto]);

  const recolherNoCelular = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) setPainelAberto(false);
  };

  /* ---------- contorno IBGE ---------- */
  const carregarContorno = useCallback(async (cod: number) => {
    setContorno(null);
    try {
      const r = await fetch(
        `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${cod}?formato=application/vnd.geo+json`,
      );
      if (r.ok) setContorno(await r.json());
    } catch {
      /* falha silenciosa */
    }
  }, []);

  const escolherMunicipio = useCallback(
    (m: MunicipioMapa | null) => {
      setMunicipio(m);
      if (!m) {
        setContorno(null);
        return;
      }
      const c = caixaDe(m);
      if (c) setAjusteCaixa({ caixa: c, seq: seq.current++ });
      void carregarContorno(m.cod_municipio);
    },
    [carregarContorno],
  );

  /* ---------- seleção ---------- */
  const selecionarResultado = useCallback(
    (r: ResultadoBusca) => {
      if (r.tipo === "municipio") {
        const m = municipios.find((x) => x.cod_municipio === r.cod_municipio);
        if (m) {
          escolherMunicipio(m);
          setAba("municipio");
        }
        return;
      }
      // CCIR: usa a camada própria (parcelas unidas) quando publicada; senão destaca as parcelas SIGEF
      const camada: Camada | null = r.car_fids?.length
        ? "car"
        : r.ccir_fids?.length && fontes.ccir
          ? "ccir"
          : r.sigef_fids?.length
            ? "sigef"
            : null;
      const fids = (camada === "car" ? r.car_fids : camada === "ccir" ? r.ccir_fids : r.sigef_fids) ?? [];
      if (camada) setCamadas((c) => (c[camada] ? c : { ...c, [camada]: true }));
      setNoPonto(null);
      setSelecao({ tipo: r.tipo, camada, fids, caixa: caixaDe(r), chave: r.chave, titulo: r.titulo, seq: seq.current++ });
      recolherNoCelular();
    },
    [municipios, escolherMunicipio, fontes.ccir],
  );

  const selecionarFeicao = useCallback(async (camada: Camada, fid: number) => {
    try {
      const det = await detalhesMapa(
        camada === "car" ? [fid] : [],
        camada === "sigef" ? [fid] : [],
        camada === "ccir" ? [fid] : [],
      );
      const d = det[0];
      setCamadas((c) => (c[camada] ? c : { ...c, [camada]: true }));
      setNoPonto(null);
      setSelecao({
        tipo: camada,
        camada,
        fids: [fid],
        caixa: d ? caixaDe(d) : null,
        chave: d?.chave ?? String(fid),
        titulo: d?.titulo ?? ROTULO_CAMADA[camada],
        seq: seq.current++,
      });
      recolherNoCelular();
    } catch {
      toast.error("Não foi possível carregar os dados desta área.");
    }
  }, []);

  const limparSelecao = useCallback(() => {
    setSelecao(null);
    setVizinhanca(null);
    setRealce(null);
  }, []);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") limparSelecao();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [limparSelecao]);

  /* ---------- abrir já buscando (vindo da ficha do imóvel) ---------- */
  const inicial = params.sigef ?? params.car ?? params.ccir ?? params.busca ?? "";
  const jaBuscou = useRef(false);
  useEffect(() => {
    if (!inicial || jaBuscou.current) return;
    jaBuscou.current = true;
    setTexto(inicial);
    setAba("numero");
    buscarNoMapa(inicial, null)
      .then((rs) => {
        const primeiro = rs.find((r) => r.tipo !== "municipio") ?? rs[0];
        if (primeiro) selecionarResultado(primeiro);
        else toast.info("Nenhuma área encontrada para este código nas bases de SP.");
      })
      .catch(() => toast.error("Não foi possível buscar agora."));
  }, [inicial, selecionarResultado]);

  useEffect(() => setAtivo(0), [resultados.length, texto]);

  /* ---------- detalhes ---------- */
  const detSel = useDetalhesMapa(
    selecao?.camada === "car" ? selecao.fids : [],
    selecao?.camada === "sigef" ? selecao.fids : [],
    selecao?.camada === "ccir" ? selecao.fids : [],
  );
  const detalhe: DetalheArea | undefined = detSel.data?.[0];

  const vizinhos = useMemo(() => [...(vizinhanca?.confrontantes ?? []), ...(vizinhanca?.sobreposicoes ?? [])], [vizinhanca]);
  const detViz = useDetalhesMapa(
    vizinhos.filter((v) => v.camada === "car").map((v) => v.fid),
    vizinhos.filter((v) => v.camada === "sigef").map((v) => v.fid),
    vizinhos.filter((v) => v.camada === "ccir").map((v) => v.fid),
  );
  const detVizPorChave = useMemo(() => {
    const m = new Map<string, DetalheArea>();
    for (const d of detViz.data ?? []) m.set(`${d.camada}:${d.fid}`, d);
    return m;
  }, [detViz.data]);

  const cadastrar = useMutation({
    mutationFn: async ({ camada, fid }: { camada: Camada; fid: number }) => {
      const { data, error } = await supabase.rpc("mapa_cadastrar_imovel", { p_camada: camada, p_fid: fid });
      if (error) throw error;
      return String(data);
    },
    onSuccess: async (id) => {
      toast.success("Imóvel cadastrado no CRM.");
      await queryClient.invalidateQueries({ queryKey: ["mapa"] });
      navigate({ to: "/imoveis/$id", params: { id } });
    },
    onError: () => toast.error("Não foi possível cadastrar o imóvel."),
  });

  const copiar = (v: string) => {
    void navigator.clipboard
      ?.writeText(v)
      .then(() => toast.success("Copiado"))
      .catch(() => toast.error("Não foi possível copiar."));
  };

  const exportarConfrontantes = () => {
    const linhas: (string | number | null)[][] = [["Nº", "Base", "Código", "Título", "Município", "Área (ha)", "Rumo", "Imóvel no CRM"]];
    for (const v of vizinhanca?.confrontantes ?? []) {
      const d = detVizPorChave.get(`${v.camada}:${v.fid}`);
      linhas.push([
        v.numero,
        ROTULO_CAMADA[v.camada],
        d?.chave ?? String(v.fid),
        d?.titulo ?? "",
        d?.municipio ?? "",
        d?.area_ha != null ? numero(d.area_ha, 4) : "",
        v.rumo,
        d?.imovel_nome ?? "",
      ]);
    }
    baixarCsv(`confrontantes-${(selecao?.chave ?? "area").slice(0, 24)}.csv`, linhas);
  };

  const aoVizinhanca = useCallback((r: Vizinhanca | null, calc: boolean) => {
    setVizinhanca(r);
    setCalculando(calc);
  }, []);

  const aoPontoAnalisado = useCallback(
    (itens: FeicaoNoPonto[]) => {
      if (itens.length === 1) void selecionarFeicao(itens[0]!.camada, itens[0]!.fid);
      else setNoPonto(itens);
    },
    [selecionarFeicao],
  );

  const aoEscolher = useCallback(
    (itens: FeicaoNoPonto[]) => {
      const it = itens[0];
      if (it) void selecionarFeicao(it.camada, it.fid);
    },
    [selecionarFeicao],
  );

  const faltando = fontesQuery.isPending
    ? []
    : (["car", "sigef", "ccir"] as Camada[]).filter((c) => !fontes[c]).map((c) => ROTULO_CAMADA[c]);
  const semFonte = faltando.length > 0;
  const corCar = corToken("--primary", COR_CAR_PADRAO);

  /* ------------------------------------------------------------------ */
  return (
    <div className="relative h-[calc(100dvh-8.5rem)] w-full overflow-hidden rounded-lg border border-border bg-muted/30 md:h-[calc(100dvh-7.5rem)]">
      <MapaFundiario
        fontes={fontes}
        vista={vista}
        camadasVisiveis={camadas}
        selecao={selecao}
        mostrarConfrontantes={mostrarConf}
        realce={realce}
        contornoMunicipio={contorno}
        pino={pino}
        ajusteCaixa={ajusteCaixa}
        onEscolher={aoEscolher}
        onPontoAnalisado={aoPontoAnalisado}
        onVizinhanca={aoVizinhanca}
        onZoom={setZoom}
      />

      {/* Avisos sobre o mapa */}
      <div className="pointer-events-none absolute left-1/2 top-3 z-10 flex -translate-x-1/2 flex-col items-center gap-2 md:left-[calc(50%+190px)]">
        {semFonte && (
          <p className="pointer-events-auto max-w-[90vw] rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-card">
            Camada {faltando.join(", ")} ainda não publicada. A busca funciona normalmente e a área é indicada por um retângulo.
          </p>
        )}
        {zoom < 9 && (
          <p className="rounded-full bg-card/90 px-3 py-1.5 text-xs font-bold text-foreground shadow-card">
            Aproxime para ver as áreas
          </p>
        )}
      </div>

      {/* Base + camadas (canto superior direito) */}
      <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
        <div className="flex gap-1 rounded-full bg-card p-1 shadow-card">
          <Button
            type="button"
            size="sm"
            variant={vista === "ruas" ? "default" : "ghost"}
            onClick={() => setVista("ruas")}
            className="h-9 rounded-full px-3 text-xs font-bold"
          >
            <MapaIcone className="size-4" aria-hidden />
            Mapa
          </Button>
          <Button
            type="button"
            size="sm"
            variant={vista === "satelite" ? "default" : "ghost"}
            onClick={() => setVista("satelite")}
            className="h-9 rounded-full px-3 text-xs font-bold"
          >
            <Satellite className="size-4" aria-hidden />
            Satélite
          </Button>
          <Button
            type="button"
            size="sm"
            variant={painelCamadas ? "default" : "ghost"}
            onClick={() => setPainelCamadas((v) => !v)}
            className="h-9 rounded-full px-3 text-xs font-bold"
            aria-label="Camadas"
          >
            <Layers className="size-4" aria-hidden />
            <span className="hidden sm:inline">Camadas</span>
          </Button>
        </div>
        {painelCamadas && (
          <div className="w-60 rounded-lg border border-border bg-card p-3 text-card-foreground shadow-card">
            {(["car", "sigef", "ccir"] as Camada[]).map((c) => {
              const cor = c === "car" ? corCar : c === "sigef" ? COR_SIGEF : COR_CCIR;
              return (
              <label key={c} className="flex min-h-11 items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-bold">
                  <span className="size-4 rounded-sm border-2" style={{ borderColor: cor, background: `${cor}33` }} />
                  {c === "car" ? "CAR (SICAR)" : c === "sigef" ? "SIGEF (parcelas)" : "CCIR (imóvel INCRA)"}
                </span>
                <Switch checked={camadas[c]} onCheckedChange={(v) => setCamadas((x) => ({ ...x, [c]: v }))} />
              </label>
              );
            })}
            <p className="mt-1 text-[11px] font-medium leading-snug text-muted-foreground">
              CCIR desenhado pela união das parcelas SIGEF do mesmo imóvel INCRA; imóveis sem parcela certificada não têm polígono.
            </p>
            <div className="mt-2 space-y-1.5 border-t border-border pt-2 text-xs font-semibold text-muted-foreground">
              <p className="flex items-center gap-2">
                <span className="size-3 rounded-sm" style={{ background: COR_SELECIONADA }} /> Área selecionada
              </p>
              <p className="flex items-center gap-2">
                <span className="flex">
                  {PALETA_CONFRONTANTES.slice(0, 4).map((c) => (
                    <span key={c} className="size-3 rounded-sm" style={{ background: c }} />
                  ))}
                </span>
                Confrontantes
              </p>
              <p className="flex items-center gap-2">
                <span className="size-3 rounded-sm border border-dashed border-foreground" /> Mesma terra na outra base
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Painel (lateral no computador, gaveta no celular) */}
      <aside
        className={`absolute inset-x-2 bottom-2 z-20 flex flex-col overflow-hidden rounded-2xl border border-border bg-card/95 text-card-foreground shadow-card backdrop-blur transition-[max-height] duration-200 md:inset-x-auto md:bottom-auto md:left-3 md:top-3 md:w-[380px] ${
          painelAberto ? "max-h-[70%] md:max-h-[calc(100%-1.5rem)]" : "max-h-12"
        }`}
      >
        <button
          type="button"
          onClick={() => setPainelAberto((v) => !v)}
          className="flex min-h-12 w-full shrink-0 items-center justify-between gap-2 px-4 text-sm font-extrabold uppercase hover:bg-muted/60"
          aria-label={painelAberto ? "Recolher painel" : "Abrir painel"}
          title={painelAberto ? "Recolher" : "Abrir busca"}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Search className="size-4 shrink-0 text-primary" strokeWidth={2.5} />
            <span className="truncate">{selecao ? selecao.titulo : "Buscar no mapa"}</span>
          </span>
          {painelAberto ? <ChevronUp className="size-5 shrink-0" /> : <ChevronDown className="size-5 shrink-0" />}
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <Tabs value={aba} onValueChange={(v) => setAba(v as typeof aba)}>
            <TabsList className="grid h-11 w-full grid-cols-3">
              <TabsTrigger value="numero" className="text-xs font-bold">Número</TabsTrigger>
              <TabsTrigger value="municipio" className="text-xs font-bold">Município</TabsTrigger>
              <TabsTrigger value="coordenada" className="text-xs font-bold">Coordenada</TabsTrigger>
            </TabsList>

            {/* ---------- Número ---------- */}
            <TabsContent value="numero" className="mt-3 space-y-2">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setAtivo((a) => Math.min(a + 1, Math.max(resultados.length - 1, 0)));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setAtivo((a) => Math.max(a - 1, 0));
                    } else if (e.key === "Enter" && resultados[ativo]) {
                      e.preventDefault();
                      selecionarResultado(resultados[ativo]!);
                    }
                  }}
                  placeholder="Nº do CAR, SIGEF, CCIR, matrícula ou nome da área"
                  className="h-11 pl-9"
                  aria-label="Buscar"
                />
              </label>
              <SeletorMunicipio municipios={municipios} valor={municipio} onEscolher={(m) => setMunicipio(m)} />

              {texto.trim().length >= 3 && (
                <div className="space-y-1.5 pt-1">
                  {busca.isFetching && resultados.length === 0 ? (
                    [0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
                  ) : busca.isError ? (
                    <p className="text-sm font-semibold text-destructive">Não foi possível buscar agora.</p>
                  ) : resultados.length === 0 ? (
                    <p className="py-2 text-sm font-semibold text-muted-foreground">Nada encontrado.</p>
                  ) : (
                    resultados.map((r, i) => (
                      <button
                        key={`${r.tipo}:${r.chave}:${i}`}
                        type="button"
                        onClick={() => selecionarResultado(r)}
                        onMouseEnter={() => setAtivo(i)}
                        data-ativo={i === ativo ? "1" : "0"}
                        className="flex w-full flex-col gap-1 rounded-lg border border-border px-3 py-2 text-left transition-colors hover:bg-muted data-[ativo=1]:border-primary data-[ativo=1]:bg-muted"
                      >
                        <span className="flex w-full items-center gap-2">
                          <BadgeTipo tipo={r.tipo} />
                          <span className="min-w-0 flex-1 truncate text-sm font-extrabold text-foreground">{r.titulo}</span>
                        </span>
                        {r.subtitulo && <span className="truncate text-xs font-medium text-muted-foreground">{r.subtitulo}</span>}
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-muted-foreground">
                          {r.municipio}
                          {r.area_ha != null && <> · {areaHa(r.area_ha)}</>}
                          {r.imovel_id && <SeloCrm nome={r.imovel_nome} />}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </TabsContent>

            {/* ---------- Município ---------- */}
            <TabsContent value="municipio" className="mt-3 space-y-3">
              <SeletorMunicipio
                municipios={municipios}
                valor={municipio}
                onEscolher={(m) => escolherMunicipio(m)}
              />
              {municipio && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { r: "CAR", v: municipio.n_car },
                    { r: "SIGEF", v: municipio.n_sigef },
                    { r: "CCIR", v: municipio.n_ccir },
                  ].map((x) => (
                    <div key={x.r} className="rounded-lg border border-border p-2 text-center">
                      <p className="text-lg font-extrabold tabular-nums text-foreground">{x.v.toLocaleString("pt-BR")}</p>
                      <p className="text-[11px] font-bold uppercase text-muted-foreground">{x.r}</p>
                    </div>
                  ))}
                </div>
              )}
              {municipio && (
                <p className="text-xs font-medium text-muted-foreground">
                  A aba Número agora busca só em {municipio.nome}. Clique numa área no mapa para ver os detalhes.
                </p>
              )}
            </TabsContent>

            {/* ---------- Coordenada ---------- */}
            <TabsContent value="coordenada" className="mt-3 space-y-2">
              <Input
                value={coordTexto}
                onChange={(e) => setCoordTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && coordenada) {
                    setPino({ lon: coordenada.lon, lat: coordenada.lat, seq: seq.current++ });
                    setNoPonto(null);
                  }
                }}
                placeholder={"-23.98, -48.87 · 23°58'12\"S 48°52'10\"W · 22J 712345 7345678"}
                className="h-11"
                aria-label="Coordenada"
              />
              {coordTexto.trim() && !coordenada && (
                <p className="text-xs font-semibold text-destructive">Coordenada não reconhecida.</p>
              )}
              {coordenada && (
                <div className="rounded-lg border border-border p-2 text-xs font-semibold text-foreground">
                  <p>
                    {coordenada.lat.toFixed(6)}, {coordenada.lon.toFixed(6)}{" "}
                    <span className="text-muted-foreground">({coordenada.formato.toUpperCase()})</span>
                  </p>
                  <p className="text-muted-foreground">
                    {paraGms(coordenada.lat, "lat")} · {paraGms(coordenada.lon, "lon")}
                  </p>
                </div>
              )}
              <Button
                type="button"
                className="h-11 w-full font-bold"
                disabled={!coordenada}
                onClick={() => {
                  if (!coordenada) return;
                  setPino({ lon: coordenada.lon, lat: coordenada.lat, seq: seq.current++ });
                  setNoPonto(null);
                }}
              >
                <Crosshair className="size-4" aria-hidden /> Ir
              </Button>
              {noPonto && (
                <div className="space-y-1.5 pt-1">
                  {noPonto.length === 0 ? (
                    <p className="text-sm font-semibold text-muted-foreground">Nenhuma área CAR/SIGEF neste ponto.</p>
                  ) : (
                    <>
                      <p className="text-xs font-extrabold uppercase text-muted-foreground">Áreas neste ponto</p>
                      {noPonto.map((it) => (
                        <button
                          key={`${it.camada}:${it.fid}`}
                          type="button"
                          onClick={() => void selecionarFeicao(it.camada, it.fid)}
                          className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-border px-3 text-left hover:bg-muted"
                        >
                          <BadgeTipo tipo={it.camada} />
                          <span className="truncate text-sm font-bold">{it.rotulo}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* ---------- Cartão da área selecionada ---------- */}
          {selecao && selecao.tipo !== "municipio" && (
            <section className="mt-4 rounded-lg border-2 p-3" style={{ borderColor: COR_SELECIONADA }}>
              <div className="flex items-start gap-2">
                <BadgeTipo tipo={selecao.tipo} />
                <h2 className="min-w-0 flex-1 text-base font-extrabold leading-tight text-foreground">
                  {detalhe?.titulo ?? selecao.titulo}
                </h2>
                <button
                  type="button"
                  onClick={limparSelecao}
                  aria-label="Limpar seleção"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-2 flex items-center gap-1">
                <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 text-[11px] font-semibold">
                  {selecao.chave}
                </code>
                <Button type="button" size="icon" variant="ghost" className="size-9" onClick={() => copiar(selecao.chave)} aria-label="Copiar código">
                  <Copy className="size-4" />
                </Button>
              </div>

              {detSel.isPending && selecao.fids.length > 0 ? (
                <Skeleton className="mt-2 h-16 w-full" />
              ) : (
                <div className="mt-2 space-y-1 text-sm">
                  <p className="font-semibold text-foreground">
                    <MapPin className="mr-1 inline size-4 text-muted-foreground" />
                    {detalhe?.municipio ?? "—"}
                    {detalhe?.area_ha != null && <> · {areaHa(detalhe.area_ha)}</>}
                  </p>
                  {detalhe?.subtitulo && <p className="text-xs font-medium text-muted-foreground">{detalhe.subtitulo}</p>}
                  {selecao.fids.length > 1 && (
                    <p className="text-xs font-semibold text-muted-foreground">{selecao.fids.length} parcelas SIGEF destacadas.</p>
                  )}
                  {detalhe?.camada === "sigef" && detalhe.ccir && (
                    <div className="mt-2 rounded-md bg-muted p-2 text-xs">
                      <p className="font-extrabold uppercase text-muted-foreground">CCIR / imóvel INCRA</p>
                      <p className="font-bold text-foreground">{detalhe.ccir}</p>
                      {detalhe.ccir_denominacao && <p className="font-semibold text-foreground">{detalhe.ccir_denominacao}</p>}
                      {detalhe.ccir_area_ha != null && <p className="text-muted-foreground">Área no CCIR: {areaHa(detalhe.ccir_area_ha)}</p>}
                    </div>
                  )}
                  {selecao.fids.length === 0 && (
                    <p className="rounded-md bg-muted p-2 text-xs font-semibold text-muted-foreground">
                      {selecao.tipo === "ccir"
                        ? "Imóvel sem parcela SIGEF — sem polígono; mostrando o município."
                        : "Área sem polígono disponível."}
                    </p>
                  )}
                </div>
              )}

              {/* Ligação com o CRM */}
              {selecao.camada && selecao.fids.length > 0 && (
                <div className="mt-3">
                  {detalhe?.imovel_id ? (
                    <>
                      <Button asChild className="h-11 w-full font-bold">
                        <Link to="/imoveis/$id" params={{ id: detalhe.imovel_id }}>
                          <ExternalLink className="size-4" aria-hidden /> Abrir no CRM
                        </Link>
                      </Button>
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">
                        {detalhe.imovel_nome}
                        {detalhe.cliente_nome ? ` · Cliente: ${detalhe.cliente_nome}` : ""}
                      </p>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full font-bold"
                      disabled={cadastrar.isPending || !detalhe}
                      onClick={() => detalhe && cadastrar.mutate({ camada: detalhe.camada, fid: detalhe.fid })}
                    >
                      {cadastrar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                      Cadastrar no CRM
                    </Button>
                  )}
                </div>
              )}

              {/* Confrontantes */}
              {selecao.camada && selecao.fids.length > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <label className="flex min-h-11 items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-foreground">Mostrar confrontantes</span>
                    <Switch checked={mostrarConf} onCheckedChange={setMostrarConf} />
                  </label>

                  {mostrarConf && calculando && (
                    <p className="flex items-center gap-2 py-2 text-sm font-semibold text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" /> Calculando confrontantes…
                    </p>
                  )}

                  {mostrarConf && vizinhanca && (
                    <>
                      <p className="mt-1 text-xs font-extrabold uppercase text-muted-foreground">
                        Confrontantes ({vizinhanca.confrontantes.length})
                      </p>
                      {vizinhanca.confrontantes.length === 0 && (
                        <p className="py-1 text-sm font-medium text-muted-foreground">
                          Nenhum confrontante encontrado na base {ROTULO_CAMADA[selecao.camada]}.
                        </p>
                      )}
                      <ul className="mt-1 space-y-1">
                        {vizinhanca.confrontantes.map((v) => {
                          const d = detVizPorChave.get(`${v.camada}:${v.fid}`);
                          return (
                            <li key={`c:${v.camada}:${v.fid}`}>
                              <button
                                type="button"
                                onMouseEnter={() => setRealce({ camada: v.camada, fid: v.fid })}
                                onMouseLeave={() => setRealce(null)}
                                onClick={() => void selecionarFeicao(v.camada, v.fid)}
                                className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted"
                              >
                                <span
                                  className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-white text-xs font-extrabold text-white shadow"
                                  style={{ background: v.cor }}
                                >
                                  {v.numero}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-bold text-foreground">
                                    {d?.titulo ?? `${ROTULO_CAMADA[v.camada]} ${v.fid}`}
                                  </span>
                                  <span className="flex flex-wrap items-center gap-x-2 text-xs font-medium text-muted-foreground">
                                    {v.rumo}
                                    {d?.area_ha != null && <> · {areaHa(d.area_ha)}</>}
                                    {d?.imovel_id && <SeloCrm nome={d.imovel_nome} />}
                                  </span>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>

                      {vizinhanca.sobreposicoes.length > 0 && (
                        <>
                          <p className="mt-3 text-xs font-extrabold uppercase text-muted-foreground">
                            Mesma terra na outra base ({vizinhanca.sobreposicoes.length})
                          </p>
                          <ul className="mt-1 space-y-1">
                            {vizinhanca.sobreposicoes.map((v) => {
                              const d = detVizPorChave.get(`${v.camada}:${v.fid}`);
                              return (
                                <li key={`s:${v.camada}:${v.fid}`}>
                                  <button
                                    type="button"
                                    onMouseEnter={() => setRealce({ camada: v.camada, fid: v.fid })}
                                    onMouseLeave={() => setRealce(null)}
                                    onClick={() => void selecionarFeicao(v.camada, v.fid)}
                                    className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted"
                                  >
                                    <BadgeTipo tipo={v.camada} />
                                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                                      {d?.titulo ?? v.fid}
                                      {d?.area_ha != null && (
                                        <span className="text-xs font-medium text-muted-foreground"> · {areaHa(d.area_ha)}</span>
                                      )}
                                    </span>
                                    {d?.imovel_id && <SeloCrm nome={null} />}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      )}

                      {vizinhanca.confrontantes.length > 0 && (
                        <Button type="button" variant="outline" className="mt-3 h-11 w-full font-bold" onClick={exportarConfrontantes}>
                          <Download className="size-4" aria-hidden /> Exportar confrontantes (CSV)
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
