// Previsão do tempo (Open-Meteo) e radar de chuva (RainViewer) para janela de voo.

export type LocalClima = { id: string; lat: number; lon: number };

export type DiaClima = {
  dia: string;
  chuvaProb: number | null;
  chuvaMm: number | null;
  rajada: number | null;
  tmax: number | null;
  tmin: number | null;
  nuvens: number | null;
};

export type PrevisaoParada = { paradaId: string; dias: DiaClima[] };

export type Janela = {
  nivel: "bom" | "aceitavel" | "ruim" | "nao_voar";
  rotulo: string;
  classe: string;
  nota: number;
};

/** Mesmos limites operacionais de drone usados no painel de campo. */
export function classificarJanela(dia: DiaClima): Janela {
  const rajada = dia.rajada ?? 0;
  const prob = dia.chuvaProb ?? 0;
  const mm = dia.chuvaMm ?? 0;

  if (rajada >= 45)
    return {
      nivel: "nao_voar",
      rotulo: "Não voar",
      classe: "bg-destructive text-destructive-foreground",
      nota: 0,
    };
  if (prob >= 70 || mm >= 10)
    return {
      nivel: "ruim",
      rotulo: "Ruim",
      classe: "bg-destructive/85 text-destructive-foreground",
      nota: 1,
    };
  if (rajada >= 35 || prob >= 40 || mm >= 3)
    return { nivel: "aceitavel", rotulo: "Aceitável", classe: "bg-amber-500 text-white", nota: 2 };
  return { nivel: "bom", rotulo: "Bom", classe: "bg-primary text-primary-foreground", nota: 3 };
}

const CAMPOS_DIARIOS = [
  "precipitation_probability_max",
  "precipitation_sum",
  "wind_gusts_10m_max",
  "temperature_2m_max",
  "temperature_2m_min",
  "cloud_cover_mean",
].join(",");

/** URL da API pública, também usada no caminho manual de contingência. */
export function urlPrevisao(locais: LocalClima[]): string {
  const lat = locais.map((l) => l.lat.toFixed(5)).join(",");
  const lon = locais.map((l) => l.lon.toFixed(5)).join(",");
  const p = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: CAMPOS_DIARIOS,
    timezone: "America/Sao_Paulo",
    forecast_days: "14",
  });
  return `https://api.open-meteo.com/v1/forecast?${p.toString()}`;
}

type RespostaOpenMeteo = {
  daily?: {
    time?: string[];
    precipitation_probability_max?: (number | null)[];
    precipitation_sum?: (number | null)[];
    wind_gusts_10m_max?: (number | null)[];
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    cloud_cover_mean?: (number | null)[];
  };
};

function paraDias(bloco: RespostaOpenMeteo): DiaClima[] {
  const d = bloco.daily;
  if (!d?.time) return [];
  return d.time.map((dia, i) => ({
    dia,
    chuvaProb: d.precipitation_probability_max?.[i] ?? null,
    chuvaMm: d.precipitation_sum?.[i] ?? null,
    rajada: d.wind_gusts_10m_max?.[i] ?? null,
    tmax: d.temperature_2m_max?.[i] ?? null,
    tmin: d.temperature_2m_min?.[i] ?? null,
    nuvens: d.cloud_cover_mean?.[i] ?? null,
  }));
}

/** Converte a resposta (única ou em lote) nas previsões por parada. */
export function interpretarPrevisao(bruto: unknown, locais: LocalClima[]): PrevisaoParada[] {
  const blocos = Array.isArray(bruto)
    ? (bruto as RespostaOpenMeteo[])
    : [bruto as RespostaOpenMeteo];
  return locais.map((l, i) => ({
    paradaId: l.id,
    dias: paraDias(blocos[i] ?? blocos[0] ?? {}),
  }));
}

/** Busca a previsão dos próximos 14 dias para todas as paradas de uma vez. */
export async function buscarPrevisao(locais: LocalClima[]): Promise<PrevisaoParada[]> {
  if (locais.length === 0) return [];
  const resposta = await fetch(urlPrevisao(locais));
  if (!resposta.ok) throw new Error("A previsão não respondeu.");
  return interpretarPrevisao(await resposta.json(), locais);
}

/** Aceita o JSON colado à mão quando o navegador bloqueia a chamada. */
export function previsaoDeTextoColado(texto: string, locais: LocalClima[]): PrevisaoParada[] {
  const bruto: unknown = JSON.parse(texto);
  const previsoes = interpretarPrevisao(bruto, locais);
  if (previsoes.every((p) => p.dias.length === 0))
    throw new Error("O conteúdo colado não tem os dados diários da previsão.");
  return previsoes;
}

/** Camada de radar de chuva mais recente. Falha em silêncio: é um extra. */
export async function buscarRadar(): Promise<string | null> {
  try {
    const r = await fetch("https://api.rainviewer.com/public/weather-maps.json");
    if (!r.ok) return null;
    const j = (await r.json()) as {
      host?: string;
      radar?: { past?: { path: string }[]; nowcast?: { path: string }[] };
    };
    const quadros = [...(j.radar?.past ?? []), ...(j.radar?.nowcast ?? [])];
    const ultimo = quadros[quadros.length - 1];
    if (!j.host || !ultimo) return null;
    return `${j.host}${ultimo.path}/256/{z}/{x}/{y}/2/1_1.png`;
  } catch {
    return null;
  }
}
