import { useEffect, useRef, useState } from "react";
import { MapPinOff, Satellite, Map as MapaIcone } from "lucide-react";
import "leaflet/dist/leaflet.css";
import type * as L from "leaflet";
import { Button } from "@/components/ui/button";

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
}: {
  pontos: PontoImovel[];
  selecionado?: string | null;
  onSelecionar: (imovelId: string) => void;
  /** Nome do município selecionado; null = todos (sem contorno). */
  municipio?: string | null;
  uf?: string;
  altura?: number;
}) {
  const caixa = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<L.Map | null>(null);
  const camada = useRef<L.LayerGroup | null>(null);
  const contorno = useRef<L.GeoJSON | null>(null);
  const ruas = useRef<L.TileLayer | null>(null);
  const satelite = useRef<L.TileLayer | null>(null);
  const [vista, setVista] = useState<"ruas" | "satelite">("ruas");
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function montar() {
      if (!caixa.current || mapa.current) return;
      try {
        const leaflet = await import("leaflet");
        if (cancelado || !caixa.current) return;
        const m = leaflet.map(caixa.current, { scrollWheelZoom: true });
        ruas.current = leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 19,
        });
        satelite.current = leaflet.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          { attribution: "Esri World Imagery", maxZoom: 19 },
        );
        ruas.current.addTo(m);
        m.setView([-23.98, -48.87], 8);
        camada.current = leaflet.layerGroup().addTo(m);
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

  function enquadrar(leaflet: typeof L) {
    const m = mapa.current;
    if (!m) return;
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
      <div
        ref={caixa}
        style={{ height: altura }}
        className="w-full overflow-hidden rounded-lg border border-border bg-muted/30"
      />
      <p className="mt-2 text-xs font-medium text-muted-foreground">
        {pontos.length} imóveis com localização no filtro. Verde = contato disponível; cinza = sem
        contato; vermelho pulsante = imóvel selecionado.
      </p>
    </div>
  );
}
