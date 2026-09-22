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

export function MapaProspeccao({
  pontos,
  selecionado,
  onSelecionar,
  altura = 420,
}: {
  pontos: PontoImovel[];
  selecionado?: string | null;
  onSelecionar: (imovelId: string) => void;
  altura?: number;
}) {
  const caixa = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<L.Map | null>(null);
  const camada = useRef<L.LayerGroup | null>(null);
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

  function desenhar(leaflet: typeof L) {
    const m = mapa.current;
    const grupo = camada.current;
    if (!m || !grupo) return;
    grupo.clearLayers();

    const cor = token("--primary", "#9ab137");
    const coords: [number, number][] = [];

    for (const p of pontos) {
      coords.push([p.lat, p.lon]);
      const destaque = selecionado === p.id;
      const fundo = p.comContato ? cor : token("--muted-foreground", "#6b7280");
      leaflet
        .marker([p.lat, p.lon], {
          icon: leaflet.divIcon({
            className: "",
            html:
              `<span style="display:block;width:${destaque ? 18 : 12}px;height:${destaque ? 18 : 12}px;` +
              `border-radius:9999px;background:${fundo};border:2px solid #fff;box-shadow:0 0 0 ${destaque ? 4 : 0}px ${cor}66"></span>`,
            iconSize: [destaque ? 18 : 12, destaque ? 18 : 12],
            iconAnchor: [destaque ? 9 : 6, destaque ? 9 : 6],
          }),
        })
        .bindTooltip(`${p.nome} · ${p.municipio}<br/>${p.servico}`)
        .on("click", () => onSelecionar(p.id))
        .addTo(grupo);
    }

    if (coords.length > 0) m.fitBounds(leaflet.latLngBounds(coords).pad(0.2));
  }

  useEffect(() => {
    if (!mapa.current) return;
    void import("leaflet").then((leaflet) => desenhar(leaflet));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pontos, selecionado]);

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
        contato.
      </p>
    </div>
  );
}
