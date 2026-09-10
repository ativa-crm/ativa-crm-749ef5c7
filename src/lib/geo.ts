// Cálculos geográficos: distância, sequenciamento de rota, UTM e GMS.

export type Ponto = { lat: number; lon: number };

const R_TERRA_KM = 6371;

function rad(g: number): number {
  return (g * Math.PI) / 180;
}

/** Distância em km entre dois pontos (haversine). */
export function haversine(a: Ponto, b: Ponto): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_TERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Comprimento total de um caminho aberto que começa na origem. */
export function comprimentoCaminho<T extends Ponto>(origem: Ponto, caminho: T[]): number {
  let total = 0;
  let atual: Ponto = origem;
  for (const p of caminho) {
    total += haversine(atual, p);
    atual = p;
  }
  return total;
}

/**
 * Sequencia as paradas pendentes a partir de uma origem:
 * vizinho mais próximo e depois melhoria por 2-opt. Função pura.
 */
export function sequenciarPendentes<T extends Ponto>(origem: Ponto, pendentes: T[]): T[] {
  const restantes = [...pendentes];
  const rota: T[] = [];
  let atual: Ponto = origem;

  while (restantes.length > 0) {
    let melhor = 0;
    let melhorDist = Infinity;
    for (let i = 0; i < restantes.length; i++) {
      const d = haversine(atual, restantes[i]!);
      if (d < melhorDist) {
        melhorDist = d;
        melhor = i;
      }
    }
    const escolhido = restantes.splice(melhor, 1)[0]!;
    rota.push(escolhido);
    atual = escolhido;
  }

  // 2-opt: inverte trechos enquanto reduzir a distância total.
  let melhorou = true;
  let voltas = 0;
  while (melhorou && voltas < 60) {
    melhorou = false;
    voltas++;
    for (let i = 0; i < rota.length - 1; i++) {
      for (let j = i + 1; j < rota.length; j++) {
        const atualDist = comprimentoCaminho(origem, rota);
        const teste = [...rota];
        const trecho = teste.slice(i, j + 1).reverse();
        teste.splice(i, j - i + 1, ...trecho);
        if (comprimentoCaminho(origem, teste) < atualDist - 1e-9) {
          rota.splice(0, rota.length, ...teste);
          melhorou = true;
        }
      }
    }
  }

  return rota;
}

/** Centróide simples de uma lista de pontos. */
export function centroide(pontos: Ponto[]): Ponto | null {
  if (pontos.length === 0) return null;
  const lat = pontos.reduce((s, p) => s + p.lat, 0) / pontos.length;
  const lon = pontos.reduce((s, p) => s + p.lon, 0) / pontos.length;
  return { lat, lon };
}

/** Maior distância (km) entre os pontos e o centróide. */
export function dispersaoKm(pontos: Ponto[], centro: Ponto): number {
  return pontos.reduce((max, p) => Math.max(max, haversine(centro, p)), 0);
}

/** Zona UTM pela longitude (funciona em qualquer parte do país). */
export function zonaUtm(lat: number, lon: number): string {
  const zona = Math.floor((lon + 180) / 6) + 1;
  return `${zona}${lat < 0 ? "S" : "N"}`;
}

export type Utm = { e: number; n: number; zona: string };

/** Converte WGS84 (lat/lon) para UTM. */
export function paraUtm(lat: number, lon: number): Utm {
  const a = 6378137.0;
  const f = 1 / 298.257223563;
  const k0 = 0.9996;
  const e2 = 2 * f - f * f;
  const ep2 = e2 / (1 - e2);

  const zonaNum = Math.floor((lon + 180) / 6) + 1;
  const lon0 = rad((zonaNum - 1) * 6 - 180 + 3);
  const phi = rad(lat);
  const lam = rad(lon);

  const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
  const T = Math.tan(phi) ** 2;
  const C = ep2 * Math.cos(phi) ** 2;
  const A = Math.cos(phi) * (lam - lon0);

  const M =
    a *
    ((1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 ** 3) / 256) * phi -
      ((3 * e2) / 8 + (3 * e2 * e2) / 32 + (45 * e2 ** 3) / 1024) * Math.sin(2 * phi) +
      ((15 * e2 * e2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * phi) -
      ((35 * e2 ** 3) / 3072) * Math.sin(6 * phi));

  const e =
    k0 *
      N *
      (A + ((1 - T + C) * A ** 3) / 6 + ((5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5) / 120) +
    500000;

  let n =
    k0 *
    (M +
      N *
        Math.tan(phi) *
        ((A * A) / 2 +
          ((5 - T + 9 * C + 4 * C * C) * A ** 4) / 24 +
          ((61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6) / 720));

  if (lat < 0) n += 10000000;

  return { e: Math.round(e * 100) / 100, n: Math.round(n * 100) / 100, zona: zonaUtm(lat, lon) };
}

/** Graus, minutos e segundos: 23°45'12.34" S */
export function paraGms(valor: number, eixo: "lat" | "lon"): string {
  const positivo = valor >= 0;
  const abs = Math.abs(valor);
  const g = Math.floor(abs);
  const minFloat = (abs - g) * 60;
  const m = Math.floor(minFloat);
  const s = (minFloat - m) * 60;
  const sufixo = eixo === "lat" ? (positivo ? "N" : "S") : positivo ? "L" : "O";
  return `${g}°${String(m).padStart(2, "0")}'${s.toFixed(2).padStart(5, "0")}" ${sufixo}`;
}

/** Link do Google Maps para traçar rota entre dois pontos. */
export function linkRota(origem: Ponto, destino: Ponto): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${origem.lat},${origem.lon}&destination=${destino.lat},${destino.lon}&travelmode=driving`;
}
