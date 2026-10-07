import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type GeoPoligono =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

export type PoligonoImovel = { geojson: GeoPoligono; area_ha_calculada: number };

export const chavePoligono = (id: string) => ["poligono-imovel", id] as const;
export const chavePoligonosTodos = ["poligonos-imoveis"] as const;

function normalizar(v: unknown): unknown {
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  }
  return v;
}

export function usePoligonoImovel(imovelId: string | null) {
  return useQuery({
    queryKey: chavePoligono(imovelId ?? "nenhum"),
    enabled: !!imovelId,
    queryFn: async (): Promise<PoligonoImovel | null> => {
      const { data, error } = await supabase.rpc("obter_poligono_imovel", { p_imovel: imovelId });
      if (error) throw error;
      const d = normalizar(data) as { geojson?: unknown; area_ha_calculada?: number } | null;
      if (!d || !d.geojson) return null;
      return {
        geojson: normalizar(d.geojson) as GeoPoligono,
        area_ha_calculada: Number(d.area_ha_calculada ?? 0),
      };
    },
  });
}

export function usePoligonosTodos() {
  return useQuery({
    queryKey: chavePoligonosTodos,
    queryFn: async (): Promise<{ imovel_id: string; geojson: GeoPoligono }[]> => {
      const { data, error } = await supabase.rpc("imoveis_com_poligono", { p_ids: null });
      if (error) throw error;
      return ((data as { imovel_id: string; geojson: unknown }[] | null) ?? [])
        .map((r) => ({ imovel_id: r.imovel_id, geojson: normalizar(r.geojson) as GeoPoligono }))
        .filter((r) => !!r.geojson);
    },
  });
}

/** Área geodésica (ha) de um anel [lat, lon] — mesmo método do @turf/area. */
export function areaHaVertices(vertices: [number, number][]): number {
  if (vertices.length < 3) return 0;
  const R = 6378137;
  const rad = (g: number) => (g * Math.PI) / 180;
  const n = vertices.length;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const p1 = vertices[i]!;
    const p2 = vertices[(i + 1) % n]!;
    const p3 = vertices[(i + 2) % n]!;
    total += (rad(p3[1]) - rad(p1[1])) * Math.sin(rad(p2[0]));
  }
  return Math.abs((total * R * R) / 2) / 10000;
}

/** Vértices [lat, lon] → GeoJSON Polygon [lon, lat] com anel fechado. */
export function paraGeoJson(vertices: [number, number][]): GeoPoligono {
  const anel = vertices.map(([lat, lon]) => [lon, lat]);
  anel.push([...anel[0]!]);
  return { type: "Polygon", coordinates: [anel] };
}

/** Primeiro anel externo em [lat, lon], sem o ponto de fechamento. */
export function verticesDe(geo: GeoPoligono): [number, number][] {
  const anel = geo.type === "Polygon" ? geo.coordinates[0] : geo.coordinates[0]?.[0];
  const v = (anel ?? []).map((c) => [Number(c[1]), Number(c[0])] as [number, number]);
  if (v.length > 1) {
    const a = v[0]!;
    const b = v[v.length - 1]!;
    if (a[0] === b[0] && a[1] === b[1]) v.pop();
  }
  return v;
}

function escaparXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function baixarKml(nome: string, geo: GeoPoligono) {
  const poligonos = geo.type === "Polygon" ? [geo.coordinates] : geo.coordinates;
  const corpo = poligonos
    .map(
      (p) =>
        `<Polygon><outerBoundaryIs><LinearRing><coordinates>${(p[0] ?? [])
          .map((c) => `${c[0]},${c[1]},0`)
          .join(" ")}</coordinates></LinearRing></outerBoundaryIs></Polygon>`,
    )
    .join("");
  const geom = poligonos.length > 1 ? `<MultiGeometry>${corpo}</MultiGeometry>` : corpo;
  const kml = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${escaparXml(nome)}</name><Placemark><name>${escaparXml(nome)}</name>${geom}</Placemark></Document></kml>`;
  const url = URL.createObjectURL(new Blob([kml], { type: "application/vnd.google-earth.kml+xml" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nome.replace(/[^\p{L}\p{N}\- ]/gu, "").trim() || "imovel"}.kml`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
