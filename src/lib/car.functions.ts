import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

type Resultado =
  | { ok: true; geojson: { type: "Polygon" | "MultiPolygon"; coordinates: unknown }; areaCar: number | null }
  | { ok: false; erro: "nao_encontrado" | "indisponivel" | "invalido" };

/** Busca o contorno do imóvel no serviço público do CAR (WFS do SICAR), em WGS84. */
export const buscarPoligonoCar = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ car: z.string().min(5).max(80) }).parse(d))
  .handler(async ({ data }): Promise<Resultado> => {
    const car = data.car.toUpperCase().replace(/[\s.]/g, "");
    const m = /^([A-Z]{2})-\d{7}-[0-9A-F]{32}$/.exec(car);
    if (!m) return { ok: false, erro: "invalido" };
    const uf = m[1]!.toLowerCase();
    const url =
      `https://geoserver.car.gov.br/geoserver/sicar/wfs?service=WFS&version=1.0.0&request=GetFeature` +
      `&typeName=sicar:sicar_imoveis_${uf}&outputFormat=application/json&srsName=EPSG:4326` +
      `&CQL_FILTER=${encodeURIComponent(`cod_imovel='${car}'`)}`;
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(45_000) });
      if (!r.ok) return { ok: false, erro: "indisponivel" };
      const j = (await r.json()) as {
        features?: { geometry?: { type: string; coordinates: unknown } | null; properties?: { area?: number } }[];
      };
      const f = j.features?.find((x) => x.geometry);
      const g = f?.geometry;
      if (!g || (g.type !== "Polygon" && g.type !== "MultiPolygon")) return { ok: false, erro: "nao_encontrado" };
      return {
        ok: true,
        geojson: { type: g.type, coordinates: g.coordinates },
        areaCar: typeof f?.properties?.area === "number" ? f.properties.area : null,
      };
    } catch (e) {
      console.error("CAR WFS", e);
      return { ok: false, erro: "indisponivel" };
    }
  });
