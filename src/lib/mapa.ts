import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/* Tipos das tabelas/RPCs do Supabase (backend da página Mapa)         */
/* ------------------------------------------------------------------ */

export type Camada = "car" | "sigef" | "ccir";
export type TipoResultado = Camada | "municipio";
export type Caixa = [number, number, number, number]; // lonMin, latMin, lonMax, latMax

export type FonteMapa = { camada: Camada; url: string | null; rotulo: string };

export type MunicipioMapa = {
  cod_municipio: number;
  nome: string;
  n_car: number;
  n_sigef: number;
  n_ccir: number;
  lon_min: number | null;
  lat_min: number | null;
  lon_max: number | null;
  lat_max: number | null;
};

export type ResultadoBusca = {
  tipo: TipoResultado;
  chave: string;
  car_fids: number[] | null;
  sigef_fids: number[] | null;
  titulo: string;
  subtitulo: string | null;
  cod_municipio: number | null;
  municipio: string | null;
  area_ha: number | null;
  lon_min: number | null;
  lat_min: number | null;
  lon_max: number | null;
  lat_max: number | null;
  imovel_id: string | null;
  imovel_nome: string | null;
  ccir_fids: number[] | null;
};

export type DetalheArea = {
  camada: Camada;
  fid: number;
  chave: string;
  titulo: string;
  subtitulo: string | null;
  cod_municipio: number | null;
  municipio: string | null;
  area_ha: number | null;
  ccir: string | null;
  ccir_denominacao: string | null;
  ccir_area_ha: number | null;
  lon_min: number;
  lat_min: number;
  lon_max: number;
  lat_max: number;
  imovel_id: string | null;
  imovel_nome: string | null;
  cliente_nome: string | null;
};

/** O que está selecionado no mapa. `seq` muda a cada nova seleção (dispara o voo). */
export type Selecao = {
  tipo: TipoResultado;
  camada: Camada | null;
  fids: number[];
  caixa: Caixa | null;
  chave: string;
  titulo: string;
  seq: number;
  subtitulo?: string | null;
  codMunicipio?: number | null;
  municipio?: string | null;
  areaHa?: number | null;
};

/** Feição encontrada num ponto do mapa (clique ou coordenada). */
export type FeicaoNoPonto = { camada: Camada; fid: number; rotulo: string };

/** Vizinho calculado (confrontante ou sobreposição). */
export type Vizinho = {
  camada: Camada;
  fid: number;
  numero: number;
  cor: string;
  rumo: string;
  angulo: number;
  lon: number;
  lat: number;
};

export type Vizinhanca = { confrontantes: Vizinho[]; sobreposicoes: Vizinho[] };

/* ------------------------------------------------------------------ */
/* Cores (o MapLibre exige cor literal no estilo; CAR usa o --primary) */
/* ------------------------------------------------------------------ */

export const COR_CAR_PADRAO = "#9ab137";
export const COR_SIGEF = "#3b82f6";
export const COR_CCIR = "#facc15";
export const COR_SELECIONADA = "#ef4444";
export const COR_SOBREPOSICAO = "#ffffff";
export const PALETA_CONFRONTANTES = [
  "#f97316",
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
  "#b45309",
  "#e2e8f0",
  "#111827",
] as const;

export function corToken(nome: string, alternativa: string): string {
  if (typeof window === "undefined") return alternativa;
  const v = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  return /^#[0-9a-f]{3,8}$/i.test(v) ? v : alternativa;
}

export const ROTULO_CAMADA: Record<TipoResultado, string> = {
  car: "CAR",
  sigef: "SIGEF",
  ccir: "CCIR",
  municipio: "Município",
};

/* ------------------------------------------------------------------ */
/* Hooks de dados                                                      */
/* ------------------------------------------------------------------ */

export function useFontesMapa() {
  return useQuery({
    queryKey: ["mapa", "fontes"],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("mapa_fontes").select("camada, url, rotulo");
      if (error) throw error;
      const linhas = (data ?? []) as FonteMapa[];
      return {
        car: linhas.find((l) => l.camada === "car")?.url ?? null,
        sigef: linhas.find((l) => l.camada === "sigef")?.url ?? null,
        ccir: linhas.find((l) => l.camada === "ccir")?.url ?? null,
      };
    },
  });
}

export function useMunicipiosMapa() {
  return useQuery({
    queryKey: ["mapa", "municipios"],
    staleTime: 60 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mapa_municipios")
        .select("cod_municipio, nome, n_car, n_sigef, n_ccir, lon_min, lat_min, lon_max, lat_max")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as MunicipioMapa[];
    },
  });
}

export function useDebounce<T>(valor: T, ms = 300): T {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setAtrasado(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return atrasado;
}

export async function buscarNoMapa(
  texto: string,
  codMunicipio: number | null,
): Promise<ResultadoBusca[]> {
  const { data, error } = await supabase.rpc("mapa_buscar_v2", {
    p_texto: texto,
    p_cod_municipio: codMunicipio,
    p_limite: 25,
  });
  if (error) throw error;
  return (data ?? []) as ResultadoBusca[];
}

export function useBuscaMapa(texto: string, codMunicipio: number | null) {
  const t = useDebounce(texto.trim(), 300);
  return useQuery({
    queryKey: ["mapa", "busca", t, codMunicipio],
    enabled: t.length >= 3,
    staleTime: 5 * 60_000,
    queryFn: () => buscarNoMapa(t, codMunicipio),
  });
}

export async function detalhesMapa(car: number[], sigef: number[], ccir: number[] = []): Promise<DetalheArea[]> {
  if (car.length === 0 && sigef.length === 0 && ccir.length === 0) return [];
  const { data, error } = await supabase.rpc("mapa_detalhes_v2", { p_car: car, p_sigef: sigef, p_ccir: ccir });
  if (error) throw error;
  return (data ?? []) as DetalheArea[];
}

export function useDetalhesMapa(car: number[], sigef: number[], ccir: number[] = []) {
  const ordenar = (v: number[]) => [...v].sort((a, b) => a - b).join(",");
  const chave = `${ordenar(car)}|${ordenar(sigef)}|${ordenar(ccir)}`;
  return useQuery({
    queryKey: ["mapa", "detalhes", chave],
    enabled: car.length + sigef.length + ccir.length > 0,
    staleTime: 5 * 60_000,
    queryFn: () => detalhesMapa(car, sigef, ccir),
  });
}

export type CandidatoCar = {
  fid: number;
  cod_car: string;
  area_ha: number;
  diferenca_pct: number;
  lon_min: number;
  lat_min: number;
  lon_max: number;
  lat_max: number;
  imovel_id: string | null;
  imovel_nome: string | null;
};

/** CAR do mesmo município com área parecida (±10%) — ajuda a achar imóvel CCIR sem polígono. */
export function useCandidatosCar(codMunicipio: number | null | undefined, areaHa: number | null | undefined) {
  return useQuery({
    queryKey: ["mapa", "candidatos-car", codMunicipio ?? 0, areaHa ?? 0],
    enabled: !!codMunicipio && !!areaHa && areaHa > 0,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("mapa_candidatos_car", {
        p_cod_municipio: codMunicipio,
        p_area_ha: areaHa,
        p_limite: 30,
      });
      if (error) throw error;
      return (data ?? []) as CandidatoCar[];
    },
  });
}

export function caixaDe(r: {
  lon_min: number | null;
  lat_min: number | null;
  lon_max: number | null;
  lat_max: number | null;
}): Caixa | null {
  const v = [r.lon_min, r.lat_min, r.lon_max, r.lat_max];
  if (v.some((x) => x === null || x === undefined || !Number.isFinite(Number(x)))) return null;
  return v.map(Number) as Caixa;
}

/* ------------------------------------------------------------------ */
/* Coordenadas: decimal, GMS e UTM (SIRGAS 2000 ≈ WGS84)               */
/* ------------------------------------------------------------------ */

export type CoordenadaLida = { lat: number; lon: number; formato: "decimal" | "gms" | "utm" };

function utmParaGeo(e: number, n: number, zona: number, sul: boolean): { lat: number; lon: number } {
  const a = 6378137;
  const f = 1 / 298.257223563;
  const k0 = 0.9996;
  const e2 = f * (2 - f);
  const ep2 = e2 / (1 - e2);
  const x = e - 500000;
  const y = sul ? n - 10000000 : n;
  const m = y / k0;
  const mu = m / (a * (1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 * e2 * e2) / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 * e1) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);
  const sin1 = Math.sin(phi1);
  const cos1 = Math.cos(phi1);
  const tan1 = Math.tan(phi1);
  const n1 = a / Math.sqrt(1 - e2 * sin1 * sin1);
  const t1 = tan1 * tan1;
  const c1 = ep2 * cos1 * cos1;
  const r1 = (a * (1 - e2)) / Math.pow(1 - e2 * sin1 * sin1, 1.5);
  const d = x / (n1 * k0);
  const lat =
    phi1 -
    ((n1 * tan1) / r1) *
      ((d * d) / 2 -
        ((5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * ep2) * d ** 4) / 24 +
        ((61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * ep2 - 3 * c1 * c1) * d ** 6) / 720);
  const lon0 = ((zona - 1) * 6 - 180 + 3) * (Math.PI / 180);
  const lon =
    lon0 +
    (d -
      ((1 + 2 * t1 + c1) * d ** 3) / 6 +
      ((5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * ep2 + 24 * t1 * t1) * d ** 5) / 120) /
      cos1;
  return { lat: (lat * 180) / Math.PI, lon: (lon * 180) / Math.PI };
}

function num(v: string): number {
  return Number(v.replace(",", "."));
}

function coordenadaValida(lat: number, lon: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

export function lerCoordenada(entrada: string): CoordenadaLida | null {
  const t = entrada.trim().toUpperCase();
  if (!t) return null;

  // GMS: 23°58'12"S 48°52'10"W  (aceita º ' " ’ ” ′ ″ e N/S/L/O/E/W)
  const reGms = /(\d{1,3})\s*[°º]\s*(\d{1,2})?\s*['’′]?\s*([\d.,]+)?\s*(?:["”″]|'')?\s*([NSLOEW])/g;
  const gms = [...t.matchAll(reGms)];
  if (gms.length === 2) {
    let lat: number | null = null;
    let lon: number | null = null;
    for (const g of gms) {
      const valor = Number(g[1]) + Number(g[2] ?? 0) / 60 + num(g[3] ?? "0") / 3600;
      const h = g[4];
      if (h === "N" || h === "S") lat = h === "S" ? -valor : valor;
      else lon = h === "O" || h === "W" ? -valor : valor;
    }
    if (lat !== null && lon !== null && coordenadaValida(lat, lon)) return { lat, lon, formato: "gms" };
  }

  // UTM: "22J 712345 7345678", "22 712345 7345678" ou "712345 7345678 22"
  const reUtm1 = /^(\d{1,2})\s*([C-X])?\s+(\d{6}(?:[.,]\d+)?)\s*[,;]?\s+(\d{7}(?:[.,]\d+)?)$/;
  const reUtm2 = /^(\d{6}(?:[.,]\d+)?)\s*[,;]?\s+(\d{7}(?:[.,]\d+)?)\s+(\d{1,2})\s*([C-X])?$/;
  const u1 = reUtm1.exec(t);
  const u2 = u1 ? null : reUtm2.exec(t);
  if (u1 || u2) {
    const zona = Number(u1 ? u1[1] : u2![3]);
    const banda = u1 ? u1[2] : u2![4];
    const e = num((u1 ? u1[3] : u2![1]) ?? "");
    const n = num((u1 ? u1[4] : u2![2]) ?? "");
    const sul = banda ? banda < "N" : true;
    if (zona >= 1 && zona <= 60) {
      const g = utmParaGeo(e, n, zona, sul);
      if (coordenadaValida(g.lat, g.lon)) return { ...g, formato: "utm" };
    }
  }

  // Decimal: "-23.98, -48.87" ou "-23,98 -48,87"
  const numeros = t.match(/-?\d+(?:[.,]\d+)?/g);
  if (numeros && numeros.length === 2) {
    let a = num(numeros[0]!);
    let b = num(numeros[1]!);
    if (Math.abs(a) > 35 && Math.abs(b) <= 35) [a, b] = [b, a];
    if (coordenadaValida(a, b)) return { lat: a, lon: b, formato: "decimal" };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Confrontantes: geometria sem bibliotecas externas                   */
/* ------------------------------------------------------------------ */

type Anel = [number, number][];
type Poligono = Anel[]; // [externo, ...furos]
type GeometriaTile = { type: string; coordinates: unknown };

export type FeicaoTile = { id: number; geometria: GeometriaTile };

export function poligonosDe(g: GeometriaTile | null | undefined): Poligono[] {
  if (!g) return [];
  if (g.type === "Polygon") return [g.coordinates as Poligono];
  if (g.type === "MultiPolygon") return g.coordinates as Poligono[];
  return [];
}

type Projecao = { x: (lon: number) => number; y: (lat: number) => number };

function projecaoLocal(lat0: number, lon0: number): Projecao {
  const ky = 110574;
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180);
  return { x: (lon) => (lon - lon0) * kx, y: (lat) => (lat - lat0) * ky };
}

function caixaPoligonos(ps: Poligono[]): Caixa {
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const p of ps)
    for (const [x, y] of p[0] ?? []) {
      if (x < x1) x1 = x;
      if (y < y1) y1 = y;
      if (x > x2) x2 = x;
      if (y > y2) y2 = y;
    }
  return [x1, y1, x2, y2];
}

function dentroAnel(x: number, y: number, anel: Anel): boolean {
  let dentro = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i]!;
    const [xj, yj] = anel[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-12) + xi) dentro = !dentro;
  }
  return dentro;
}

function dentroPoligonos(x: number, y: number, ps: Poligono[]): boolean {
  for (const p of ps) {
    if (!p[0] || !dentroAnel(x, y, p[0])) continue;
    let noFuro = false;
    for (let k = 1; k < p.length; k++) if (dentroAnel(x, y, p[k]!)) noFuro = true;
    if (!noFuro) return true;
  }
  return false;
}

type Segmento = [number, number, number, number];

function segmentosMetros(ps: Poligono[], pr: Projecao): Segmento[] {
  const s: Segmento[] = [];
  for (const p of ps)
    for (const anel of p)
      for (let i = 0; i + 1 < anel.length; i++) {
        const a = anel[i]!;
        const b = anel[i + 1]!;
        s.push([pr.x(a[0]), pr.y(a[1]), pr.x(b[0]), pr.y(b[1])]);
      }
  return s;
}

function verticesMetros(ps: Poligono[], pr: Projecao, max = 4000): [number, number][] {
  const todos: [number, number][] = [];
  for (const p of ps) for (const anel of p) for (const v of anel) todos.push([pr.x(v[0]), pr.y(v[1])]);
  if (todos.length <= max) return todos;
  const passo = Math.ceil(todos.length / max);
  return todos.filter((_, i) => i % passo === 0);
}

function dist2Segmento(px: number, py: number, s: Segmento): number {
  const [x1, y1, x2, y2] = s;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  let t = l2 > 0 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  const qx = x1 + t * dx - px;
  const qy = y1 + t * dy - py;
  return qx * qx + qy * qy;
}

function algumPertoDe(vs: [number, number][], segs: Segmento[], tol: number): boolean {
  const t2 = tol * tol;
  for (const [x, y] of vs)
    for (const s of segs) {
      if (Math.min(s[0], s[2]) - tol > x || Math.max(s[0], s[2]) + tol < x) continue;
      if (Math.min(s[1], s[3]) - tol > y || Math.max(s[1], s[3]) + tol < y) continue;
      if (dist2Segmento(x, y, s) <= t2) return true;
    }
  return false;
}

function fracaoDentro(vs: Anel, ps: Poligono[], amostra = 300): number {
  if (vs.length === 0) return 0;
  const passo = Math.max(1, Math.floor(vs.length / amostra));
  let total = 0;
  let dentro = 0;
  for (let i = 0; i < vs.length; i += passo) {
    total++;
    if (dentroPoligonos(vs[i]![0], vs[i]![1], ps)) dentro++;
  }
  return total ? dentro / total : 0;
}

function verticesGeo(ps: Poligono[]): Anel {
  const r: Anel = [];
  for (const p of ps) for (const v of p[0] ?? []) r.push(v);
  return r;
}

/** Ponto representativo: centroide do maior anel externo; se cair fora, o vértice mais próximo dele. */
export function pontoRepresentativo(ps: Poligono[]): [number, number] | null {
  let melhor: Anel | null = null;
  let maiorArea = -1;
  for (const p of ps) {
    const anel = p[0];
    if (!anel || anel.length < 3) continue;
    let a = 0;
    for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) a += anel[j]![0] * anel[i]![1] - anel[i]![0] * anel[j]![1];
    if (Math.abs(a) > maiorArea) {
      maiorArea = Math.abs(a);
      melhor = anel;
    }
  }
  if (!melhor) return null;
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = melhor.length - 1; i < melhor.length; j = i++) {
    const [x0, y0] = melhor[j]!;
    const [x1, y1] = melhor[i]!;
    const c = x0 * y1 - x1 * y0;
    a += c;
    cx += (x0 + x1) * c;
    cy += (y0 + y1) * c;
  }
  if (Math.abs(a) < 1e-14) return melhor[0]!;
  const c: [number, number] = [cx / (3 * a), cy / (3 * a)];
  if (dentroPoligonos(c[0], c[1], ps)) return c;
  let perto = melhor[0]!;
  let d = Infinity;
  for (const v of melhor) {
    const dd = (v[0] - c[0]) ** 2 + (v[1] - c[1]) ** 2;
    if (dd < d) {
      d = dd;
      perto = v;
    }
  }
  return perto;
}

const RUMOS = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"] as const;

export function rumoDe(angulo: number): string {
  return RUMOS[Math.round((((angulo % 360) + 360) % 360) / 45) % 8]!;
}

function agrupar(feicoes: FeicaoTile[]): Map<number, Poligono[]> {
  const m = new Map<number, Poligono[]>();
  for (const f of feicoes) {
    const ps = poligonosDe(f.geometria);
    if (ps.length === 0) continue;
    const atual = m.get(f.id);
    if (atual) atual.push(...ps);
    else m.set(f.id, [...ps]);
  }
  return m;
}

/**
 * Calcula confrontantes (mesma base, encostam na área com tolerância de `tolMetros`)
 * e sobreposições (outra base ou mesma base, ocupando a mesma terra).
 * As peças vêm de `querySourceFeatures` (polígonos cortados nas bordas dos tiles).
 */
export function calcularVizinhanca(params: {
  selecionados: number[];
  mesmaBase: FeicaoTile[];
  outraBase: FeicaoTile[];
  camada: Camada;
  outraCamada: Camada;
  tolMetros?: number;
}): Vizinhanca | null {
  const tol = params.tolMetros ?? 20;
  const sel = new Set(params.selecionados);
  const grupos = agrupar(params.mesmaBase);
  const area: Poligono[] = [];
  for (const id of sel) area.push(...(grupos.get(id) ?? []));
  if (area.length === 0) return null;

  const cx = caixaPoligonos(area);
  const lat0 = (cx[1] + cx[3]) / 2;
  const lon0 = (cx[0] + cx[2]) / 2;
  const pr = projecaoLocal(lat0, lon0);
  const margem = (tol * 3) / 111000;
  const caixaBusca: Caixa = [cx[0] - margem, cx[1] - margem, cx[2] + margem, cx[3] + margem];
  const segsArea = segmentosMetros(area, pr);
  const vertsArea = verticesMetros(area, pr);
  const vertsAreaGeo = verticesGeo(area);
  const centro = pontoRepresentativo(area) ?? [lon0, lat0];

  const tocaCaixa = (c: Caixa) =>
    !(c[0] > caixaBusca[2] || c[2] < caixaBusca[0] || c[1] > caixaBusca[3] || c[3] < caixaBusca[1]);

  const angulo = (p: [number, number]) => {
    const dx = pr.x(p[0]) - pr.x(centro[0]);
    const dy = pr.y(p[1]) - pr.y(centro[1]);
    return ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
  };

  const confrontantes: Omit<Vizinho, "numero" | "cor">[] = [];
  const sobreposicoes: Omit<Vizinho, "numero" | "cor">[] = [];

  const avaliar = (camada: Camada, id: number, ps: Poligono[], mesma: boolean) => {
    const c = caixaPoligonos(ps);
    if (!tocaCaixa(c)) return;
    const vertsGeo = verticesGeo(ps);
    const dentroDaArea = fracaoDentro(vertsGeo, area);
    const areaDentroDele = fracaoDentro(vertsAreaGeo, ps);
    const p = pontoRepresentativo(ps);
    if (!p) return;
    const base = { camada, fid: id, angulo: angulo(p), rumo: rumoDe(angulo(p)), lon: p[0], lat: p[1] };
    if (dentroDaArea > 0.5 || areaDentroDele > 0.5) {
      sobreposicoes.push(base);
      return;
    }
    if (!mesma) return;
    const segs = segmentosMetros(ps, pr);
    const verts = verticesMetros(ps, pr);
    if (algumPertoDe(verts, segsArea, tol) || algumPertoDe(vertsArea, segs, tol)) confrontantes.push(base);
  };

  for (const [id, ps] of grupos) if (!sel.has(id)) avaliar(params.camada, id, ps, true);
  for (const [id, ps] of agrupar(params.outraBase)) avaliar(params.outraCamada, id, ps, false);

  confrontantes.sort((a, b) => a.angulo - b.angulo);
  return {
    confrontantes: confrontantes.map((v, i) => ({
      ...v,
      numero: i + 1,
      cor: PALETA_CONFRONTANTES[i % PALETA_CONFRONTANTES.length]!,
    })),
    sobreposicoes: sobreposicoes.map((v, i) => ({ ...v, numero: i + 1, cor: COR_SOBREPOSICAO })),
  };
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

export function semAcento(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

export function baixarCsv(nome: string, linhas: (string | number | null | undefined)[][]) {
  const csv = linhas
    .map((l) =>
      l
        .map((c) => {
          const s = c === null || c === undefined ? "" : String(c);
          return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(";"),
    )
    .join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
