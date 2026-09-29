// Localização colada (link do Maps / coordenadas) e rota por estrada (OSRM público).
import type { Ponto } from "./geo";

/** Escritório da Ativa — R. Átila Martins Bonilha, 123 - Jardim Maringá, Itapeva/SP. */
export const BASE_ESCRITORIO = {
  endereco: "R. Átila Martins Bonilha, 123 - Jardim Maringá, Itapeva - SP, 18407-050",
  lat: -23.99044,
  lon: -48.8913,
};

export function extrairLatLon(link: string): Ponto | null {
  const texto = decodeURIComponent(link.trim());
  const padroes = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /\/place\/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query|destination|ll)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /^\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*$/,
  ];
  for (const p of padroes) {
    const m = texto.match(p);
    if (!m) continue;
    const lat = Number(m[1]);
    const lon = Number(m[2]);
    if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180)
      return { lat, lon };
  }
  return null;
}

export type RotaEstrada = { km: number; horas: number; trajeto: [number, number][] };

/** Rota de carro pela estrada. Devolve null se o serviço não responder. */
export async function rotaPorEstrada(de: Ponto, para: Ponto): Promise<RotaEstrada | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${de.lon},${de.lat};${para.lon},${para.lat}?overview=full&geometries=geojson`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = (await r.json()) as {
      routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
    };
    const rota = j.routes?.[0];
    if (!rota) return null;
    return {
      km: rota.distance / 1000,
      horas: rota.duration / 3600,
      trajeto: rota.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
    };
  } catch {
    return null;
  }
}
