import { useEffect, useRef, useState } from "react";
import {
  MapPinOff,
  Satellite,
  Map as MapaIcone,
  PenLine,
  Undo2,
  Check,
  X,
  Pencil,
  Trash2,
  Download,
  Loader2,
  CloudDownload,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";
import type * as L from "leaflet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { areaHa } from "@/lib/formato";
import { buscarPoligonoCar } from "@/lib/car.functions";
import {
  areaHaVertices,
  baixarKml,
  chavePoligono,
  chavePoligonosTodos,
  paraGeoJson,
  usePoligonoImovel,
  usePoligonosTodos,
  verticesDe,
  type GeoPoligono,
} from "@/lib/poligono";

export type PontoImovel = {
  id: string;
  lat: number;
  lon: number;
  nome: string;
  municipio: string;
  servico: string;
  comContato: boolean;
};

function token(nome: string, alternativa: string): string {
  if (typeof window === "undefined") return alternativa;
  const v = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  return v || alternativa;
}

function semAcento(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

type MunicipioIbge = { id: number; nome: string };

const cacheMunicipios = new Map<string, Promise<MunicipioIbge[]>>();
const cacheMalhas = new Map<number, Promise<unknown>>();

function listaMunicipios(uf: string): Promise<MunicipioIbge[]> {
  const chave = uf.toUpperCase();
  const existente = cacheMunicipios.get(chave);
  if (existente) return existente;
  const busca = fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${chave}/municipios`,
  )
    .then((r) =>
      r.ok ? (r.json() as Promise<MunicipioIbge[]>) : Promise.reject(new Error("ibge")),
    )
    .catch(() => [] as MunicipioIbge[]);
  cacheMunicipios.set(chave, busca);
  return busca;
}

function malhaMunicipio(codigo: number): Promise<unknown> {
  const existente = cacheMalhas.get(codigo);
  if (existente) return existente;
  const busca = fetch(
    `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${codigo}?formato=application/vnd.geo+json`,
  )
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("malha"))))
    .catch(() => null);
  cacheMalhas.set(codigo, busca);
  return busca;
}

export function MapaProspeccao({
  pontos,
  selecionado,
  onSelecionar,
  municipio = null,
  uf = "SP",
  altura = 420,
  foco = 0,
  nomeSelecionado = "",
  areaCadastroHa = null,
  car = null,
  sigef = null,
}: {
  pontos: PontoImovel[];
  selecionado?: string | null;
  onSelecionar: (imovelId: string) => void;
  /** Nome do município selecionado; null = todos (sem contorno). */
  municipio?: string | null;
  uf?: string;
  altura?: number;
  /** Muda a cada pedido de "ir até o lead" (ex.: clique na tabela). */
  foco?: number;
  nomeSelecionado?: string;
  areaCadastroHa?: number | null;
  car?: string | null;
  sigef?: string | null;
}) {
  const queryClient = useQueryClient();
  const poligonoQuery = usePoligonoImovel(selecionado ?? null);
  const todosQuery = usePoligonosTodos();
  const leafletRef = useRef<typeof L | null>(null);
  const contornosTodos = useRef<L.LayerGroup | null>(null);
  const desenhoCamada = useRef<L.LayerGroup | null>(null);
  const linhaCursor = useRef<L.Polyline | null>(null);
  const [modo, setModo] = useState<"nada" | "desenho" | "edicao">("nada");
  const modoRef = useRef(modo);
  modoRef.current = modo;
  const [vertices, setVertices] = useState<[number, number][]>([]);
  const verticesRef = useRef(vertices);
  verticesRef.current = vertices;
  const concluirRef = useRef<() => void>(() => {});
  const poligonoRef = useRef<[number, number][] | null>(null);
  const caixa = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<L.Map | null>(null);
  const camada = useRef<L.LayerGroup | null>(null);
  const contorno = useRef<L.GeoJSON | null>(null);
  const ruas = useRef<L.TileLayer | null>(null);
  const satelite = useRef<L.TileLayer | null>(null);
  const poligono = useRef<L.Layer | null>(null);
  const [infoArea, setInfoArea] = useState<string | null>(null);
  const [vista, setVista] = useState<"ruas" | "satelite">("satelite");
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function montar() {
      if (!caixa.current || mapa.current) return;
      try {
        const leaflet = await import("leaflet");
        if (cancelado || !caixa.current) return;
        leafletRef.current = leaflet;
        const m = leaflet.map(caixa.current, { scrollWheelZoom: true });
        ruas.current = leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 19,
        });
        satelite.current = leaflet.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          { attribution: "Esri World Imagery", maxZoom: 19 },
        );
        satelite.current.addTo(m);
        m.setView([-23.98, -48.87], 8);
        camada.current = leaflet.layerGroup().addTo(m);
        contornosTodos.current = leaflet.layerGroup();
        desenhoCamada.current = leaflet.layerGroup().addTo(m);
        linhaCursor.current = leaflet
          .polyline([], { color: token("--primary", "#9ab137"), weight: 2, dashArray: "6 6" })
          .addTo(m);
        m.on("click", (e: L.LeafletMouseEvent) => {
          if (modoRef.current !== "desenho") return;
          const ultimo = verticesRef.current[verticesRef.current.length - 1];
          if (ultimo) {
            const a = m.latLngToContainerPoint(ultimo);
            const b = m.latLngToContainerPoint(e.latlng);
            if (a.distanceTo(b) < 4) return;
          }
          setVertices((v) => [...v, [e.latlng.lat, e.latlng.lng]]);
        });
        m.on("mousemove", (e: L.LeafletMouseEvent) => {
          const ultimo = verticesRef.current[verticesRef.current.length - 1];
          if (modoRef.current !== "desenho" || !ultimo) return;
          linhaCursor.current?.setLatLngs([ultimo, e.latlng]);
        });
        m.on("dblclick", () => {
          if (modoRef.current === "desenho") concluirRef.current();
        });
        m.on("zoomend", () => atualizarContornosRef.current());
        mapa.current = m;
        desenhar(leaflet);
      } catch {
        setFalhou(true);
      }
    }

    void montar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = mapa.current;
    if (!m || !ruas.current || !satelite.current) return;
    const ativa = vista === "ruas" ? ruas.current : satelite.current;
    const inativa = vista === "ruas" ? satelite.current : ruas.current;
    if (m.hasLayer(inativa)) m.removeLayer(inativa);
    if (!m.hasLayer(ativa)) ativa.addTo(m);
  }, [vista]);

  const atualizarContornosRef = useRef<() => void>(() => {});
  atualizarContornosRef.current = () => {
    const m = mapa.current;
    const grupo = contornosTodos.current;
    const leaflet = leafletRef.current;
    if (!m || !grupo || !leaflet) return;
    grupo.clearLayers();
    if (m.getZoom() < 12) {
      if (m.hasLayer(grupo)) m.removeLayer(grupo);
      return;
    }
    for (const r of todosQuery.data ?? []) {
      if (r.imovel_id === selecionado) continue;
      try {
        leaflet
          .geoJSON(r.geojson as never, {
            style: { color: token("--primary", "#9ab137"), weight: 2, fillOpacity: 0.08 },
          })
          .on("click", () => onSelecionar(r.imovel_id))
          .addTo(grupo);
      } catch {
        /* geometria inválida: ignora */
      }
    }
    if (!m.hasLayer(grupo)) grupo.addTo(m);
  };

  useEffect(() => {
    atualizarContornosRef.current();
  }, [todosQuery.data, selecionado]);

  function enquadrar(leaflet: typeof L) {
    const m = mapa.current;
    if (!m) return;
    const alvo = selecionado ? pontos.find((p) => p.id === selecionado) : null;
    const pol = selecionado ? poligonoRef.current : null;
    if (pol) {
      const lim = leaflet.latLngBounds(pol);
      if (lim.isValid()) {
        m.flyToBounds(lim.pad(0.3), { duration: 0.8 });
        return;
      }
    }
    if (alvo) {
      m.flyTo([alvo.lat, alvo.lon], Math.max(m.getZoom(), 15), { duration: 0.8 });
      return;
    }
    if (contorno.current) {
      const limites = contorno.current.getBounds();
      if (limites.isValid()) {
        m.fitBounds(limites.pad(0.05));
        return;
      }
    }
    const coords = pontos.map((p) => [p.lat, p.lon] as [number, number]);
    if (coords.length > 0) m.fitBounds(leaflet.latLngBounds(coords).pad(0.2));
  }

  function desenhar(leaflet: typeof L) {
    const m = mapa.current;
    const grupo = camada.current;
    if (!m || !grupo) return;
    grupo.clearLayers();

    const cor = token("--primary", "#9ab137");

    for (const p of pontos) {
      const destaque = selecionado === p.id;
      const fundo = destaque
        ? token("--destructive", "#b3261e")
        : p.comContato
          ? cor
          : token("--muted-foreground", "#6b7280");
      const tamanho = destaque ? 26 : 12;
      const marcador = leaflet
        .marker([p.lat, p.lon], {
          zIndexOffset: destaque ? 1000 : 0,
          icon: leaflet.divIcon({
            className: "",
            html: destaque
              ? `<span class="prosp-pulso" style="background:${fundo}"></span>`
              : `<span style="display:block;width:${tamanho}px;height:${tamanho}px;border-radius:9999px;background:${fundo};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)"></span>`,
            iconSize: [tamanho, tamanho],
            iconAnchor: [tamanho / 2, tamanho / 2],
          }),
        })
        .bindTooltip(`${p.nome} · ${p.municipio}<br/>${p.servico}`)
        .on("click", () => onSelecionar(p.id));
      marcador.addTo(grupo);
    }

    enquadrar(leaflet);
  }

  useEffect(() => {
    if (!mapa.current) return;
    void import("leaflet").then((leaflet) => desenhar(leaflet));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pontos, selecionado]);

  // Contorno administrativo do município (IBGE). Falhas são silenciosas.
  useEffect(() => {
    let cancelado = false;

    async function aplicar() {
      const m = mapa.current;
      if (!m) return;
      const leaflet = await import("leaflet");
      if (cancelado) return;

      if (contorno.current) {
        m.removeLayer(contorno.current);
        contorno.current = null;
      }
      if (!municipio) {
        enquadrar(leaflet);
        return;
      }

      const lista = await listaMunicipios(uf);
      if (cancelado) return;
      const alvo = lista.find((mu) => semAcento(mu.nome) === semAcento(municipio));
      if (!alvo) return;
      const geo = await malhaMunicipio(alvo.id);
      if (cancelado || !geo || !mapa.current) return;
      const camadaGeo = leaflet.geoJSON(geo as never, {
        style: {
          color: token("--primary", "#9ab137"),
          weight: 3,
          opacity: 0.95,
          fillOpacity: 0.05,
        },
      });
      camadaGeo.addTo(mapa.current);
      contorno.current = camadaGeo;
      enquadrar(leaflet);
    }

    void aplicar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [municipio, uf]);

  // Polígono do imóvel selecionado: RPC obter_poligono_imovel; se não houver,
  // usa os vértices importados por KML (imovel_pontos) só para exibir.
  const [verticesKml, setVerticesKml] = useState<[number, number][] | null>(null);
  useEffect(() => {
    let cancelado = false;
    setVerticesKml(null);
    setModo("nada");
    setVertices([]);
    if (!selecionado) return;
    void supabase
      .from("imovel_pontos")
      .select("lat, lon, criado_em")
      .eq("imovel_id", selecionado)
      .order("criado_em", { ascending: true })
      .limit(5000)
      .then(({ data, error }) => {
        if (cancelado || error) return;
        const v = (data ?? [])
          .map((p) => [Number(p.lat), Number(p.lon)] as [number, number])
          .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
        setVerticesKml(v.length >= 3 ? v : null);
      });
    return () => {
      cancelado = true;
    };
  }, [selecionado]);

  const salvoGeo = poligonoQuery.data?.geojson ?? null;
  const verticesSalvos = salvoGeo ? verticesDe(salvoGeo) : null;
  const verticesExibidos =
    verticesSalvos && verticesSalvos.length >= 3 ? verticesSalvos : verticesKml;

  // Desenha o polígono salvo (fora dos modos de desenho/edição).
  useEffect(() => {
    const m = mapa.current;
    const leaflet = leafletRef.current;
    if (!m || !leaflet) return;
    if (poligono.current) {
      m.removeLayer(poligono.current);
      poligono.current = null;
    }
    poligonoRef.current = verticesExibidos;
    if (!selecionado || modo !== "nada" || !verticesExibidos) {
      setInfoArea(
        selecionado && modo === "nada" && !poligonoQuery.isPending
          ? "Sem polígono cadastrado — mostrando só a localização."
          : null,
      );
      return;
    }
    const cor = token("--destructive", "#b3261e");
    const camadaPol = leaflet.polygon(verticesExibidos, {
      color: cor,
      weight: 3,
      fillColor: cor,
      fillOpacity: 0.18,
    });
    camadaPol.addTo(m);
    poligono.current = camadaPol;
    setInfoArea(
      salvoGeo
        ? `Polígono salvo: ${areaHa(poligonoQuery.data?.area_ha_calculada ?? 0)}.`
        : `Área importada do KML com ${verticesExibidos.length} vértices.`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecionado, modo, poligonoQuery.data, poligonoQuery.isPending, verticesKml]);

  // Ir até o lead: ao trocar a seleção, ao pedir foco ou quando o polígono carrega.
  useEffect(() => {
    const leaflet = leafletRef.current;
    if (!leaflet || !selecionado || modo !== "nada") return;
    enquadrar(leaflet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foco, selecionado, poligonoQuery.data, verticesKml]);

  // Camada de desenho/edição.
  useEffect(() => {
    const m = mapa.current;
    const leaflet = leafletRef.current;
    const grupo = desenhoCamada.current;
    if (!m || !leaflet || !grupo) return;
    grupo.clearLayers();
    if (modo === "nada") {
      linhaCursor.current?.setLatLngs([]);
      m.doubleClickZoom.enable();
      m.getContainer().style.cursor = "";
      return;
    }
    if (modo === "desenho") {
      m.doubleClickZoom.disable();
      m.getContainer().style.cursor = "crosshair";
    } else {
      linhaCursor.current?.setLatLngs([]);
      m.getContainer().style.cursor = "";
    }
    const cor = token("--primary", "#9ab137");
    if (vertices.length >= 2) {
      leaflet
        .polygon(vertices, {
          color: cor,
          weight: 3,
          fillColor: cor,
          fillOpacity: 0.2,
          interactive: false,
        })
        .addTo(grupo);
    }
    vertices.forEach((v, idx) => {
      const mk = leaflet.marker(v, {
        draggable: modo === "edicao",
        icon: leaflet.divIcon({
          className: "",
          html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#fff;border:3px solid ${cor};box-shadow:0 1px 3px rgba(0,0,0,.4)"></span>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        }),
      });
      if (modo === "edicao") {
        mk.on("dragend", () => {
          const p = mk.getLatLng();
          setVertices((atual) => atual.map((x, j) => (j === idx ? [p.lat, p.lng] : x)));
        });
      } else if (idx === 0) {
        mk.on("click", () => concluirRef.current());
      }
      mk.addTo(grupo);
    });
  }, [modo, vertices]);

  const salvar = useMutation({
    mutationFn: async (v: [number, number][]) => {
      const { data, error } = await supabase.rpc("salvar_poligono_imovel", {
        p_imovel: selecionado,
        p_geojson: paraGeoJson(v),
      });
      if (error) throw error;
      const d = (typeof data === "string" ? JSON.parse(data) : data) as {
        ok?: boolean;
        area_ha_calculada?: number;
      } | null;
      if (d && d.ok === false) throw new Error("recusado");
      return Number(d?.area_ha_calculada ?? areaHaVertices(v));
    },
    onSuccess: async (area) => {
      toast.success(`Polígono salvo: ${areaHa(area)}.`);
      setModo("nada");
      setVertices([]);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: chavePoligono(selecionado ?? "") }),
        queryClient.invalidateQueries({ queryKey: chavePoligonosTodos }),
        queryClient.invalidateQueries({ queryKey: ["prospeccao"] }),
      ]);
    },
    onError: () => toast.error("Não foi possível salvar o polígono."),
  });

  const remover = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("remover_poligono_imovel", {
        p_imovel: selecionado,
      });
      if (error) throw error;
      const d = (typeof data === "string" ? JSON.parse(data) : data) as { ok?: boolean } | null;
      if (d && d.ok === false) throw new Error("nada");
    },
    onSuccess: async () => {
      toast.success("Polígono removido.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: chavePoligono(selecionado ?? "") }),
        queryClient.invalidateQueries({ queryKey: chavePoligonosTodos }),
        queryClient.invalidateQueries({ queryKey: ["prospeccao"] }),
      ]);
    },
    onError: () => toast.error("Não foi possível remover o polígono."),
  });

  concluirRef.current = () => {
    const v = verticesRef.current;
    if (v.length < 3) {
      toast.error("Marque pelo menos 3 pontos para fechar a área.");
      return;
    }
    salvar.mutate(v);
  };

  const buscarCar = useServerFn(buscarPoligonoCar);
  const importarCar = useMutation({
    mutationFn: async (numero: string) => {
      const r = await buscarCar({ data: { car: numero } });
      if (!r.ok) throw new Error(r.erro);
      const geo = r.geojson as GeoPoligono;
      const partes: GeoPoligono[] =
        geo.type === "Polygon"
          ? [geo]
          : geo.coordinates.map((c) => ({ type: "Polygon", coordinates: c }) as GeoPoligono);
      const aneis = partes.map((p) => verticesDe(p)).filter((v) => v.length >= 3);
      if (aneis.length === 0) throw new Error("nao_encontrado");
      aneis.sort((a, b) => areaHaVertices(b) - areaHaVertices(a));
      return { vertices: aneis[0]!, partes: aneis.length };
    },
    onSuccess: ({ vertices: v, partes }) => {
      setVertices(v);
      setModo("edicao");
      const leaflet = leafletRef.current;
      if (leaflet && mapa.current) mapa.current.flyToBounds(leaflet.latLngBounds(v), { padding: [30, 30] });
      toast.info(
        partes > 1
          ? `Contorno do CAR carregado (${partes} partes; mostrando a maior). Confira e clique em Concluir para gravar.`
          : "Contorno do CAR carregado. Confira e clique em Concluir para gravar.",
      );
    },
    onError: (e) => {
      const m = e instanceof Error ? e.message : "";
      if (m === "nao_encontrado") toast.error("CAR não encontrado");
      else if (m === "invalido") toast.error("Número do CAR em formato inválido");
      else toast.error("Serviço indisponível, tente de novo");
    },
  });

  {
    void 0;
  };

  const areaDesenho = areaHaVertices(vertices);
  const areaAtual = modo !== "nada" ? areaDesenho : (poligonoQuery.data?.area_ha_calculada ?? null);
  const diferenca =
    areaAtual && areaCadastroHa ? ((areaAtual - areaCadastroHa) / areaCadastroHa) * 100 : null;

  if (falhou) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 p-8 text-center">
        <MapPinOff className="size-8 text-primary" strokeWidth={2.5} />
        <p className="text-base font-bold text-foreground">Mapa indisponível agora</p>
        <p className="text-sm font-medium text-muted-foreground">
          A tabela e os filtros continuam funcionando normalmente.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <style>{`
        .prosp-pulso{display:block;width:26px;height:26px;border-radius:9999px;border:3px solid #fff;box-shadow:0 0 0 4px rgba(0,0,0,.12);animation:prospPulso 1.4s ease-out infinite}
        @keyframes prospPulso{0%{box-shadow:0 0 0 0 rgba(179,38,30,.55)}70%{box-shadow:0 0 0 16px rgba(179,38,30,0)}100%{box-shadow:0 0 0 0 rgba(179,38,30,0)}}
      `}</style>
      <div className="absolute right-3 top-3 z-[500] flex gap-1 rounded-full bg-card p-1 shadow-card">
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
      </div>
      {selecionado && (
        <div className="absolute bottom-10 left-3 z-[500] flex max-w-[calc(100%-1.5rem)] flex-col gap-2 rounded-lg border border-border bg-card p-2 text-card-foreground shadow-card">
          {modo === "nada" ? (
            <div className="flex flex-wrap gap-1">
              {!salvoGeo ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 text-xs font-bold"
                    onClick={() => {
                      setVertices([]);
                      setModo("desenho");
                    }}
                  >
                    <PenLine className="size-4" aria-hidden /> Traçar polígono
                  </Button>
                  {car?.trim() && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 text-xs font-bold"
                      disabled={importarCar.isPending}
                      onClick={() => importarCar.mutate(car)}
                    >
                      {importarCar.isPending ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <CloudDownload className="size-4" aria-hidden />
                      )}
                      {importarCar.isPending ? "Buscando no CAR…" : "Importar do CAR"}
                    </Button>
                  )}
                  {sigef?.trim() && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-9 text-xs font-bold"
                      disabled
                      title="Serviço do SIGEF indisponível no momento"
                    >
                      <CloudDownload className="size-4" aria-hidden /> Importar do SIGEF
                      <span className="sr-only"> — Serviço do SIGEF indisponível no momento</span>
                    </Button>
                  )}
                  {sigef?.trim() && (
                    <p className="w-full text-xs font-semibold text-muted-foreground">
                      Serviço do SIGEF indisponível no momento.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs font-bold"
                    onClick={() => {
                      setVertices(verticesSalvos ?? []);
                      setModo("edicao");
                    }}
                  >
                    <Pencil className="size-4" aria-hidden /> Editar polígono
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs font-bold"
                    onClick={() => baixarKml(nomeSelecionado || "Imóvel", salvoGeo)}
                  >
                    <Download className="size-4" aria-hidden /> Baixar KML
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs font-bold text-destructive"
                    disabled={remover.isPending}
                    onClick={() => {
                      if (window.confirm("Remover o polígono deste imóvel?")) remover.mutate();
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden /> Remover
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-muted-foreground">
                {modo === "desenho"
                  ? "Clique no mapa para marcar os vértices. Duplo clique ou clique no 1º ponto para concluir."
                  : "Arraste os vértices para ajustar a área."}
              </p>
              <div className="flex flex-wrap gap-1">
                {modo === "desenho" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs font-bold"
                    disabled={vertices.length === 0}
                    onClick={() => setVertices((v) => v.slice(0, -1))}
                  >
                    <Undo2 className="size-4" aria-hidden /> Desfazer último ponto
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  className="h-9 text-xs font-bold"
                  disabled={vertices.length < 3 || salvar.isPending}
                  onClick={() => concluirRef.current()}
                >
                  {salvar.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Check className="size-4" aria-hidden />
                  )}
                  Concluir
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-9 text-xs font-bold"
                  onClick={() => {
                    setModo("nada");
                    setVertices([]);
                  }}
                >
                  <X className="size-4" aria-hidden /> Cancelar
                </Button>
              </div>
            </>
          )}
          {(areaAtual !== null || areaCadastroHa !== null) && (
            <p className="text-xs font-bold text-foreground">
              {areaAtual !== null && <>Polígono: {areaHa(areaAtual)}</>}
              {areaCadastroHa !== null && <> · Cadastro: {areaHa(areaCadastroHa)}</>}
              {diferenca !== null && (
                <span className="text-muted-foreground">
                  {" "}
                  ({diferenca >= 0 ? "+" : ""}
                  {diferenca.toFixed(1).replace(".", ",")}%)
                </span>
              )}
            </p>
          )}
        </div>
      )}
      <div
        ref={caixa}
        style={{ height: altura }}
        className="w-full overflow-hidden rounded-lg border border-border bg-muted/30"
      />
      <p className="mt-2 text-xs font-medium text-muted-foreground">
        {pontos.length} imóveis com localização no filtro. Verde = contato disponível; cinza = sem
        contato; vermelho pulsante = imóvel selecionado.
      </p>
      {infoArea && <p className="mt-1 text-xs font-semibold text-foreground">{infoArea}</p>}
    </div>
  );
}
