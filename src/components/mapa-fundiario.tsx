import { useEffect, useRef, useState } from "react";
import { MapPinOff } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import type {
  GeoJSONSource,
  Map as MlMap,
  MapGeoJSONFeature,
  MapMouseEvent,
  Marker,
  Popup,
  StyleSpecification,
} from "maplibre-gl";
import {
  calcularVizinhanca,
  corToken,
  COR_CAR_PADRAO,
  COR_SELECIONADA,
  COR_SIGEF,
  COR_SOBREPOSICAO,
  type Camada,
  type FeicaoNoPonto,
  type FeicaoTile,
  type Selecao,
  type Vizinhanca,
} from "@/lib/mapa";

type Maplibre = typeof import("maplibre-gl");
// Expressões do estilo (o tipo ExpressionSpecification não é exportado pelo maplibre-gl 4.x)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Expressao = any;

let protocoloRegistrado = false;

const CAMADAS: Camada[] = ["car", "sigef"];

function rotuloFeicao(camada: Camada, f: MapGeoJSONFeature): string {
  const p = (f.properties ?? {}) as Record<string, unknown>;
  if (camada === "car") return `CAR ${String(p.cod_imovel ?? f.id ?? "")}`;
  const parcela = String(p.parcela_co ?? "");
  const imovel = p.codigo_imo ? ` · INCRA ${String(p.codigo_imo)}` : "";
  return `SIGEF ${parcela.slice(0, 8)}${imovel}`;
}

function idNumerico(f: MapGeoJSONFeature): number | null {
  const n = typeof f.id === "number" ? f.id : Number(f.id);
  return Number.isFinite(n) ? n : null;
}

function escapar(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function caixaGeoJson(c: [number, number, number, number] | null) {
  return {
    type: "FeatureCollection" as const,
    features: c
      ? [
          {
            type: "Feature" as const,
            properties: {},
            geometry: {
              type: "Polygon" as const,
              coordinates: [[[c[0], c[1]], [c[2], c[1]], [c[2], c[3]], [c[0], c[3]], [c[0], c[1]]]],
            },
          },
        ]
      : [],
  };
}

const VAZIO = { type: "FeatureCollection" as const, features: [] };

export function MapaFundiario({
  fontes,
  vista,
  camadasVisiveis,
  selecao,
  mostrarConfrontantes,
  realce,
  contornoMunicipio,
  pino,
  ajusteCaixa,
  onEscolher,
  onPontoAnalisado,
  onVizinhanca,
  onZoom,
}: {
  fontes: { car: string | null; sigef: string | null };
  vista: "satelite" | "ruas";
  camadasVisiveis: Record<Camada, boolean>;
  selecao: Selecao | null;
  mostrarConfrontantes: boolean;
  realce: { camada: Camada; fid: number } | null;
  contornoMunicipio: unknown | null;
  pino: { lon: number; lat: number; seq: number } | null;
  /** Enquadrar uma caixa sem selecionar nada (ex.: município). */
  ajusteCaixa: { caixa: [number, number, number, number]; seq: number } | null;
  onEscolher: (itens: FeicaoNoPonto[]) => void;
  onPontoAnalisado: (itens: FeicaoNoPonto[]) => void;
  onVizinhanca: (r: Vizinhanca | null, calculando: boolean) => void;
  onZoom?: (zoom: number) => void;
}) {
  const caixa = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<MlMap | null>(null);
  const lib = useRef<Maplibre | null>(null);
  const [pronto, setPronto] = useState(false);
  const [falhou, setFalhou] = useState(false);
  const popupHover = useRef<Popup | null>(null);
  const popupEscolha = useRef<Popup | null>(null);
  const marcadores = useRef<Marker[]>([]);
  const marcadorPino = useRef<Marker | null>(null);
  const hoverAtual = useRef<{ camada: Camada; fid: number } | null>(null);
  const realceAtual = useRef<{ camada: Camada; fid: number } | null>(null);
  const estados = useRef<{ camada: Camada; fid: number }[]>([]);
  const callbacks = useRef({ onEscolher, onPontoAnalisado, onVizinhanca, onZoom });
  callbacks.current = { onEscolher, onPontoAnalisado, onVizinhanca, onZoom };
  const fontesAtivas = useRef<Record<Camada, boolean>>({ car: false, sigef: false });
  const ultimoVoo = useRef<number | null>(null);
  const rodada = useRef(0);

  /** Executa `fn` quando o mapa terminar de se mover e carregar os tiles visíveis. */
  function quandoOcioso(fn: () => void, esperaMs = 0) {
    const m = mapa.current;
    if (!m) return;
    setTimeout(() => {
      if (mapa.current !== m) return;
      if (!m.isMoving() && m.areTilesLoaded()) fn();
      else m.once("idle", () => mapa.current === m && fn());
    }, esperaMs);
  }

  /* ---------------- montagem ---------------- */
  useEffect(() => {
    let cancelado = false;
    async function montar() {
      if (!caixa.current || mapa.current) return;
      try {
        const mod = (await import("maplibre-gl")) as Maplibre & { default?: Maplibre };
        const maplibregl: Maplibre = mod.default ?? mod;
        const { Protocol } = await import("pmtiles");
        if (cancelado || !caixa.current) return;
        if (!protocoloRegistrado) {
          const protocolo = new Protocol();
          maplibregl.addProtocol("pmtiles", protocolo.tile);
          protocoloRegistrado = true;
        }
        lib.current = maplibregl;
        const estilo: StyleSpecification = {
          version: 8,
          sources: {
            satelite: {
              type: "raster",
              tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
              tileSize: 256,
              maxzoom: 19,
              attribution: "Esri World Imagery",
            },
            ruas: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              maxzoom: 19,
              attribution: "© OpenStreetMap",
            },
          },
          layers: [
            { id: "base-satelite", type: "raster", source: "satelite" },
            { id: "base-ruas", type: "raster", source: "ruas", layout: { visibility: "none" } },
          ],
        };
        const m = new maplibregl.Map({
          container: caixa.current,
          style: estilo,
          center: [-48.87, -23.98],
          zoom: 10,
          maxZoom: 19,
          attributionControl: { compact: true },
        });
        m.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "bottom-right");
        m.addControl(new maplibregl.GeolocateControl({ trackUserLocation: false }), "bottom-right");
        m.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");
        m.on("load", () => {
          if (cancelado) return;
          m.addSource("municipio", { type: "geojson", data: VAZIO });
          m.addLayer({ id: "municipio-halo", type: "line", source: "municipio", paint: { "line-color": "#000000", "line-width": 5, "line-opacity": 0.5 } });
          m.addLayer({ id: "municipio-linha", type: "line", source: "municipio", paint: { "line-color": "#ffffff", "line-width": 3 } });
          m.addSource("caixa-sel", { type: "geojson", data: VAZIO });
          m.addLayer({ id: "caixa-sel-linha", type: "line", source: "caixa-sel", paint: { "line-color": COR_SELECIONADA, "line-width": 3, "line-dasharray": [2, 1] } });
          mapa.current = m;
          setPronto(true);
          callbacks.current.onZoom?.(m.getZoom());
        });
        m.on("zoomend", () => callbacks.current.onZoom?.(m.getZoom()));
        m.on("error", (e) => {
          // erros de tile isolados não devem derrubar a tela
          console.warn("Mapa:", e?.error?.message ?? e);
        });
      } catch (e) {
        console.error("Falha ao montar o mapa", e);
        setFalhou(true);
      }
    }
    void montar();
    return () => {
      cancelado = true;
      marcadores.current.forEach((mk) => mk.remove());
      marcadorPino.current?.remove();
      popupHover.current?.remove();
      popupEscolha.current?.remove();
      mapa.current?.remove();
      mapa.current = null;
    };
  }, []);

  /* ---------------- fontes vetoriais (PMTiles) ---------------- */
  useEffect(() => {
    const m = mapa.current;
    if (!pronto || !m) return;
    const corCar = corToken("--primary", COR_CAR_PADRAO);
    const cores: Record<Camada, string> = { car: corCar, sigef: COR_SIGEF };
    for (const camada of CAMADAS) {
      const url = fontes[camada];
      if (!url || m.getSource(camada)) continue;
      m.addSource(camada, { type: "vector", url: `pmtiles://${url}` });
      const sel: Expressao = ["boolean", ["feature-state", "sel"], false];
      const temCor: Expressao = ["!=", ["coalesce", ["feature-state", "cor"], ""], ""];
      const hover: Expressao = ["boolean", ["feature-state", "hover"], false];
      const corBase = cores[camada];
      const antes = m.getLayer("municipio-halo") ? "municipio-halo" : undefined;
      m.addLayer(
        {
          id: `${camada}-fill`,
          type: "fill",
          source: camada,
          "source-layer": camada,
          minzoom: 7,
          paint: {
            "fill-color": ["case", sel, COR_SELECIONADA, ["to-color", ["coalesce", ["feature-state", "cor"], corBase]]],
            "fill-opacity": ["case", sel, 0.35, temCor, 0.45, hover, 0.22, 0.12],
          },
        },
        antes,
      );
      m.addLayer(
        {
          id: `${camada}-line`,
          type: "line",
          source: camada,
          "source-layer": camada,
          minzoom: 7,
          paint: {
            "line-color": ["case", sel, COR_SELECIONADA, ["to-color", ["coalesce", ["feature-state", "cor"], corBase]]],
            "line-width": [
              "interpolate",
              ["linear"],
              ["zoom"],
              9,
              ["case", sel, 3, temCor, 2, hover, 2, 0.5],
              14,
              ["case", sel, 3.5, temCor, 2.5, hover, 2.5, 1.2],
            ],
          },
        },
        antes,
      );
      m.addLayer(
        {
          id: `${camada}-sob`,
          type: "line",
          source: camada,
          "source-layer": camada,
          minzoom: 7,
          paint: {
            "line-color": COR_SOBREPOSICAO,
            "line-width": 2,
            "line-dasharray": [2, 2],
            "line-opacity": ["case", ["boolean", ["feature-state", "sob"], false], 1, 0],
          },
        },
        antes,
      );
      fontesAtivas.current[camada] = true;

      m.on("mousemove", `${camada}-fill`, (e) => aoPassar(camada, e));
      m.on("mouseleave", `${camada}-fill`, () => sairHover());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, fontes.car, fontes.sigef]);

  /* ---------------- clique ---------------- */
  useEffect(() => {
    const m = mapa.current;
    if (!pronto || !m) return;
    const aoClicar = (e: MapMouseEvent) => {
      const itens = feicoesNoPonto(e.point.x, e.point.y);
      if (itens.length === 0) return;
      if (itens.length === 1) {
        callbacks.current.onEscolher(itens);
        return;
      }
      mostrarEscolha(itens, [e.lngLat.lng, e.lngLat.lat]);
    };
    m.on("click", aoClicar);
    return () => {
      m.off("click", aoClicar);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto]);

  function camadasDisponiveis(): string[] {
    const m = mapa.current;
    if (!m) return [];
    return CAMADAS.filter((c) => fontesAtivas.current[c] && m.getLayoutProperty(`${c}-fill`, "visibility") !== "none").map(
      (c) => `${c}-fill`,
    );
  }

  function feicoesNoPonto(x: number, y: number): FeicaoNoPonto[] {
    const m = mapa.current;
    const layers = camadasDisponiveis();
    if (!m || layers.length === 0) return [];
    const vistos = new Set<string>();
    const itens: FeicaoNoPonto[] = [];
    for (const f of m.queryRenderedFeatures([x, y], { layers })) {
      const camada = f.layer.id.startsWith("car") ? "car" : "sigef";
      const fid = idNumerico(f);
      if (fid === null) continue;
      const k = `${camada}:${fid}`;
      if (vistos.has(k)) continue;
      vistos.add(k);
      itens.push({ camada, fid, rotulo: rotuloFeicao(camada, f) });
    }
    return itens;
  }

  function mostrarEscolha(itens: FeicaoNoPonto[], lngLat: [number, number]) {
    const m = mapa.current;
    const maplibregl = lib.current;
    if (!m || !maplibregl) return;
    popupEscolha.current?.remove();
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.gap = "4px";
    div.style.minWidth = "220px";
    const titulo = document.createElement("strong");
    titulo.textContent = "Áreas neste ponto";
    titulo.style.fontSize = "12px";
    div.appendChild(titulo);
    for (const it of itens) {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = escapar(it.rotulo);
      b.style.cssText =
        "text-align:left;font-size:12px;font-weight:600;padding:8px 10px;border-radius:8px;border:1px solid rgba(0,0,0,.15);background:#fff;color:#111;cursor:pointer;min-height:36px";
      b.style.borderLeft = `5px solid ${it.camada === "car" ? corToken("--primary", COR_CAR_PADRAO) : COR_SIGEF}`;
      b.onclick = () => {
        popupEscolha.current?.remove();
        callbacks.current.onEscolher([it]);
      };
      div.appendChild(b);
    }
    popupEscolha.current = new maplibregl.Popup({ closeButton: true, maxWidth: "320px" }).setLngLat(lngLat).setDOMContent(div).addTo(m);
  }

  /* ---------------- hover ---------------- */
  function aoPassar(camada: Camada, e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) {
    const m = mapa.current;
    const maplibregl = lib.current;
    const f = e.features?.[0];
    if (!m || !maplibregl || !f) return;
    const fid = idNumerico(f);
    if (fid === null) return;
    m.getCanvas().style.cursor = "pointer";
    const atual = hoverAtual.current;
    if (!atual || atual.fid !== fid || atual.camada !== camada) {
      if (atual) m.setFeatureState({ source: atual.camada, sourceLayer: atual.camada, id: atual.fid }, { hover: false });
      m.setFeatureState({ source: camada, sourceLayer: camada, id: fid }, { hover: true });
      hoverAtual.current = { camada, fid };
    }
    if (!popupHover.current) {
      popupHover.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12, className: "mapa-hover" });
    }
    popupHover.current.setLngLat(e.lngLat).setHTML(`<span style="font-size:12px;font-weight:700">${escapar(rotuloFeicao(camada, f))}</span>`).addTo(m);
  }

  function sairHover() {
    const m = mapa.current;
    if (!m) return;
    m.getCanvas().style.cursor = "";
    const atual = hoverAtual.current;
    if (atual) m.setFeatureState({ source: atual.camada, sourceLayer: atual.camada, id: atual.fid }, { hover: false });
    hoverAtual.current = null;
    popupHover.current?.remove();
  }

  /* ---------------- base e visibilidade ---------------- */
  useEffect(() => {
    const m = mapa.current;
    if (!pronto || !m) return;
    m.setLayoutProperty("base-satelite", "visibility", vista === "satelite" ? "visible" : "none");
    m.setLayoutProperty("base-ruas", "visibility", vista === "ruas" ? "visible" : "none");
  }, [pronto, vista]);

  useEffect(() => {
    const m = mapa.current;
    if (!pronto || !m) return;
    for (const c of CAMADAS) {
      if (!fontesAtivas.current[c]) continue;
      for (const s of ["fill", "line", "sob"]) m.setLayoutProperty(`${c}-${s}`, "visibility", camadasVisiveis[c] ? "visible" : "none");
    }
  }, [pronto, camadasVisiveis.car, camadasVisiveis.sigef, fontes.car, fontes.sigef]);

  /* ---------------- contorno do município ---------------- */
  useEffect(() => {
    const m = mapa.current;
    if (!pronto || !m) return;
    (m.getSource("municipio") as GeoJSONSource | undefined)?.setData((contornoMunicipio ?? VAZIO) as never);
  }, [pronto, contornoMunicipio]);

  useEffect(() => {
    const m = mapa.current;
    if (!pronto || !m || !ajusteCaixa) return;
    const c = ajusteCaixa.caixa;
    m.fitBounds([[c[0], c[1]], [c[2], c[3]]], { padding: 40, duration: 1000 });
  }, [pronto, ajusteCaixa?.seq]);

  /* ---------------- pino de coordenada ---------------- */
  useEffect(() => {
    const m = mapa.current;
    const maplibregl = lib.current;
    if (!pronto || !m || !maplibregl) return;
    marcadorPino.current?.remove();
    marcadorPino.current = null;
    if (!pino) return;
    marcadorPino.current = new maplibregl.Marker({ color: COR_SELECIONADA }).setLngLat([pino.lon, pino.lat]).addTo(m);
    m.flyTo({ center: [pino.lon, pino.lat], zoom: Math.max(16, m.getZoom()), duration: 1200 });
    quandoOcioso(() => {
      const p = m.project([pino.lon, pino.lat]);
      callbacks.current.onPontoAnalisado(feicoesNoPonto(p.x, p.y));
    }, 1300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, pino?.seq]);

  /* ---------------- seleção + confrontantes ---------------- */
  function limparEstados() {
    const m = mapa.current;
    if (!m) return;
    for (const e of estados.current) {
      if (!m.getSource(e.camada)) continue;
      m.removeFeatureState({ source: e.camada, sourceLayer: e.camada, id: e.fid });
    }
    estados.current = [];
    marcadores.current.forEach((mk) => mk.remove());
    marcadores.current = [];
  }

  function aplicar(camada: Camada, fid: number, estado: Record<string, unknown>) {
    const m = mapa.current;
    if (!m || !m.getSource(camada)) return;
    m.setFeatureState({ source: camada, sourceLayer: camada, id: fid }, estado);
    estados.current.push({ camada, fid });
  }

  function pecas(camada: Camada): FeicaoTile[] {
    const m = mapa.current;
    if (!m || !m.getSource(camada)) return [];
    const r: FeicaoTile[] = [];
    for (const f of m.querySourceFeatures(camada, { sourceLayer: camada })) {
      const id = idNumerico(f);
      if (id === null) continue;
      r.push({ id, geometria: f.geometry as FeicaoTile["geometria"] });
    }
    return r;
  }

  function calcularEDesenhar(sel: Selecao, tentativa: number, minhaRodada: number) {
    if (minhaRodada !== rodada.current) return;
    const m = mapa.current;
    const maplibregl = lib.current;
    if (!m || !maplibregl || !sel.camada) return;
    const camada = sel.camada;
    const outra: Camada = camada === "car" ? "sigef" : "car";
    const r = calcularVizinhanca({
      selecionados: sel.fids,
      mesmaBase: pecas(camada),
      outraBase: camadasVisiveis[outra] ? pecas(outra) : [],
      camada,
      outraCamada: outra,
    });
    if (!r) {
      if (tentativa < 2) {
        quandoOcioso(() => calcularEDesenhar(sel, tentativa + 1, minhaRodada), 800);
        return;
      }
      callbacks.current.onVizinhanca({ confrontantes: [], sobreposicoes: [] }, false);
      return;
    }
    for (const v of r.confrontantes) {
      aplicar(v.camada, v.fid, { cor: v.cor });
      const el = document.createElement("div");
      el.textContent = String(v.numero);
      el.style.cssText = `width:26px;height:26px;border-radius:9999px;background:${v.cor};color:#fff;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5);text-shadow:0 1px 2px rgba(0,0,0,.6);pointer-events:none`;
      marcadores.current.push(new maplibregl.Marker({ element: el }).setLngLat([v.lon, v.lat]).addTo(m));
    }
    for (const v of r.sobreposicoes) aplicar(v.camada, v.fid, { sob: true });
    callbacks.current.onVizinhanca(r, false);
  }

  useEffect(() => {
    const m = mapa.current;
    if (!pronto || !m) return;
    const minhaRodada = ++rodada.current;
    limparEstados();
    popupEscolha.current?.remove();
    const fonteCaixa = m.getSource("caixa-sel") as GeoJSONSource | undefined;
    fonteCaixa?.setData(VAZIO as never);
    callbacks.current.onVizinhanca(null, false);
    if (!selecao) return;

    const temTiles = selecao.camada ? !!m.getSource(selecao.camada) : false;
    const novoVoo = ultimoVoo.current !== selecao.seq;
    ultimoVoo.current = selecao.seq;
    if (selecao.caixa && novoVoo) {
      const c = selecao.caixa;
      const celular = (caixa.current?.clientWidth ?? 800) < 640;
      m.fitBounds([[c[0], c[1]], [c[2], c[3]]], { padding: celular ? 40 : 80, maxZoom: 17, duration: 1200 });
    }
    if (selecao.caixa && (!temTiles || selecao.fids.length === 0)) fonteCaixa?.setData(caixaGeoJson(selecao.caixa) as never);
    if (!selecao.camada || !temTiles) return;
    for (const fid of selecao.fids) aplicar(selecao.camada, fid, { sel: true });
    if (!mostrarConfrontantes || selecao.fids.length === 0) return;
    callbacks.current.onVizinhanca(null, true);
    const atual = selecao;
    quandoOcioso(() => calcularEDesenhar(atual, 0, minhaRodada), novoVoo ? 1300 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto, selecao?.seq, mostrarConfrontantes, fontes.car, fontes.sigef]);

  /* ---------------- realce vindo da lista ---------------- */
  useEffect(() => {
    const m = mapa.current;
    if (!pronto || !m) return;
    const anterior = realceAtual.current;
    if (anterior && m.getSource(anterior.camada))
      m.setFeatureState({ source: anterior.camada, sourceLayer: anterior.camada, id: anterior.fid }, { hover: false });
    realceAtual.current = realce;
    if (realce && m.getSource(realce.camada))
      m.setFeatureState({ source: realce.camada, sourceLayer: realce.camada, id: realce.fid }, { hover: true });
  }, [pronto, realce?.camada, realce?.fid]);

  if (falhou) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 p-8 text-center">
        <MapPinOff className="size-8 text-primary" strokeWidth={2.5} />
        <p className="text-base font-bold text-foreground">Mapa indisponível agora</p>
        <p className="text-sm font-medium text-muted-foreground">A busca continua funcionando normalmente.</p>
      </div>
    );
  }

  return (
    <>
      <style>{`.mapa-hover .maplibregl-popup-content{padding:6px 10px;border-radius:8px}`}</style>
      <div ref={caixa} className="h-full w-full" />
    </>
  );
}
