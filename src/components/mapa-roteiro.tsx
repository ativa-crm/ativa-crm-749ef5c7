import { useEffect, useRef } from "react";
import { MapPinOff } from "lucide-react";
import "leaflet/dist/leaflet.css";
import type * as L from "leaflet";
import { linkRota, type Ponto } from "@/lib/geo";
import { numero } from "@/lib/formato";

export type ParadaMapa = {
  id: string;
  lat: number;
  lon: number;
  posicao: number;
  baixado: boolean;
  proxima: boolean;
  cliente: string;
  processo: string;
  chuvaMm?: number | null;
  nivelClima?: "bom" | "aceitavel" | "ruim" | "nao_voar" | null;
  chuvaProb?: number | null;
};

function token(nome: string, alternativa: string): string {
  if (typeof window === "undefined") return alternativa;
  const v = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  return v || alternativa;
}

function corDoNivel(nivel: ParadaMapa["nivelClima"]): string {
  if (nivel === "nao_voar" || nivel === "ruim") return token("--destructive", "#b3261e");
  if (nivel === "aceitavel") return "#f59e0b";
  return token("--primary", "#9ab137");
}

export function MapaRoteiro({
  base,
  paradas,
  radarUrl,
  altura = 380,
}: {
  base: Ponto | null;
  paradas: ParadaMapa[];
  radarUrl?: string | null;
  altura?: number;
}) {
  const caixa = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<L.Map | null>(null);
  const camada = useRef<L.LayerGroup | null>(null);
  const falhou = useRef(false);

  useEffect(() => {
    let cancelado = false;

    async function montar() {
      if (!caixa.current || mapa.current) return;
      try {
        const leaflet = await import("leaflet");
        if (cancelado || !caixa.current) return;

        const m = leaflet.map(caixa.current, { scrollWheelZoom: false });
        const ruas = leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 19,
        });
        const satelite = leaflet.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          { attribution: "Esri World Imagery", maxZoom: 19 },
        );
        const relevo = leaflet.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenTopoMap",
          maxZoom: 17,
        });
        ruas.addTo(m);
        const bases: Record<string, L.TileLayer> = {
          Ruas: ruas,
          Satélite: satelite,
          Relevo: relevo,
        };
        const extras: Record<string, L.TileLayer> = {};
        if (radarUrl) {
          extras["Radar de chuva"] = leaflet.tileLayer(radarUrl, { opacity: 0.6 });
        }
        leaflet.control.layers(bases, extras).addTo(m);
        m.setView([-23.98, -48.87], 8);
        camada.current = leaflet.layerGroup().addTo(m);
        mapa.current = m;
        desenhar(leaflet);
      } catch {
        falhou.current = true;
      }
    }

    void montar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radarUrl]);

  function desenhar(leaflet: typeof L) {
    const m = mapa.current;
    const grupo = camada.current;
    if (!m || !grupo) return;
    grupo.clearLayers();

    const pontos: [number, number][] = [];

    if (base) {
      pontos.push([base.lat, base.lon]);
      leaflet
        .marker([base.lat, base.lon], {
          icon: leaflet.divIcon({
            className: "",
            html: `<span class="flex size-8 items-center justify-center rounded-full border-2 border-card bg-foreground text-xs font-extrabold text-background shadow">B</span>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          }),
        })
        .bindPopup("Base de saída")
        .addTo(grupo);
    }

    const feitas = paradas.filter((p) => p.baixado).sort((a, b) => a.posicao - b.posicao);
    const abertas = paradas.filter((p) => !p.baixado).sort((a, b) => a.posicao - b.posicao);

    for (const p of paradas) {
      pontos.push([p.lat, p.lon]);
      const classe = p.baixado
        ? "bg-primary text-primary-foreground"
        : p.proxima
          ? "bg-foreground text-background ring-4 ring-primary"
          : "bg-card text-foreground";
      leaflet
        .marker([p.lat, p.lon], {
          icon: leaflet.divIcon({
            className: "",
            html: `<span class="flex size-9 items-center justify-center rounded-full border-2 border-border ${classe} text-sm font-extrabold shadow">${p.posicao}</span>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          }),
        })
        .bindPopup(
          `<div style="min-width:180px"><strong>${p.cliente}</strong><br/>${p.processo}<br/>` +
            (base
              ? `<a href="${linkRota(base, { lat: p.lat, lon: p.lon })}" target="_blank" rel="noreferrer">Traçar rota</a>`
              : "") +
            `</div>`,
        )
        .addTo(grupo);

      if (p.chuvaMm !== null && p.chuvaMm !== undefined) {
        leaflet
          .circle([p.lat, p.lon], {
            radius: 1500 + Number(p.chuvaMm) * 900,
            color: corDoNivel(p.nivelClima ?? null),
            weight: 2,
            fillOpacity: 0.12,
          })
          .bindTooltip(`${numero(p.chuvaProb ?? 0, 0)}% de chuva · ${numero(p.chuvaMm, 1)} mm`)
          .addTo(grupo);
      }
    }

    const cor = token("--primary", "#9ab137");
    if (base && feitas.length > 0) {
      leaflet
        .polyline(
          [[base.lat, base.lon], ...feitas.map((p) => [p.lat, p.lon] as [number, number])],
          { color: cor, weight: 4 },
        )
        .addTo(grupo);
    }
    const inicioPendentes = feitas[feitas.length - 1] ?? base;
    if (inicioPendentes && abertas.length > 0) {
      leaflet
        .polyline(
          [
            [inicioPendentes.lat, inicioPendentes.lon],
            ...abertas.map((p) => [p.lat, p.lon] as [number, number]),
          ],
          { color: cor, weight: 3, dashArray: "8 8", opacity: 0.8 },
        )
        .addTo(grupo);
    }

    if (pontos.length > 0) {
      m.fitBounds(leaflet.latLngBounds(pontos).pad(0.25));
    }
  }

  useEffect(() => {
    if (!mapa.current) return;
    void import("leaflet").then((leaflet) => desenhar(leaflet));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paradas, base]);

  if (falhou.current) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-border bg-muted/30 p-8 text-center">
        <MapPinOff className="size-10 text-primary" strokeWidth={2.5} />
        <p className="text-lg font-bold text-foreground">Mapa indisponível agora</p>
        <p className="text-base font-medium text-muted-foreground">
          Sem conexão com o mapa. O restante da tela continua funcionando normalmente.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={caixa}
      style={{ height: altura }}
      className="w-full overflow-hidden rounded-2xl border-2 border-border bg-muted/30"
    />
  );
}
