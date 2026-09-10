// Regras do painel de Medição de campo: parâmetros, sequência e previsões.

import { comprimentoCaminho, haversine, sequenciarPendentes, type Ponto } from "./geo";

export type Roteiro = {
  id: string;
  empresa_id: string;
  nome: string;
  data_prevista: string | null;
  status: string | null;
  base_endereco: string | null;
  base_lat: number | null;
  base_lon: number | null;
  fator_sinuosidade: number | null;
  velocidade_media_kmh: number | null;
  tempo_vistoria_h: number | null;
  jornada_h: number | null;
  custo_km: number | null;
  reotimizar_pendentes: boolean | null;
  clima_dados: unknown;
  clima_atualizado_em: string | null;
};

export type Parada = {
  id: string;
  roteiro_id: string;
  ordem_servico_id: string;
  ordem: number | null;
  lat: number;
  lon: number;
  n_pontos: number | null;
  dispersao_km: number | null;
  status: string | null;
  sequencia_baixa: number | null;
  km_previsto: number | null;
  horas_previsto: number | null;
  custo_previsto: number | null;
  km_real: number | null;
  horas_real: number | null;
  custo_real: number | null;
  data_execucao: string | null;
  observacoes_campo: string | null;
  ordens_servico: OrdemResumo | OrdemResumo[] | null;
};

export type OrdemResumo = {
  id: string;
  numero: string | null;
  servico: string | null;
  status: string | null;
  clientes: { nome: string | null } | { nome: string | null }[] | null;
  imoveis:
    | { nome: string | null; municipio: string | null; uf: string | null }
    | { nome: string | null; municipio: string | null; uf: string | null }[]
    | null;
};

export function um<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export type Parametros = {
  fator: number;
  velocidade: number;
  vistoria: number;
  jornada: number;
  custoKm: number;
};

export function parametros(r: Roteiro): Parametros {
  return {
    fator: Number(r.fator_sinuosidade ?? 1.35),
    velocidade: Number(r.velocidade_media_kmh ?? 55) || 55,
    vistoria: Number(r.tempo_vistoria_h ?? 2),
    jornada: Number(r.jornada_h ?? 9),
    custoKm: Number(r.custo_km ?? 2.2),
  };
}

export function baseDoRoteiro(r: Roteiro, paradas: Parada[]): Ponto | null {
  if (r.base_lat !== null && r.base_lon !== null)
    return { lat: Number(r.base_lat), lon: Number(r.base_lon) };
  const primeira = paradas[0];
  return primeira ? { lat: Number(primeira.lat), lon: Number(primeira.lon) } : null;
}

export function baixadas(paradas: Parada[]): Parada[] {
  return paradas
    .filter((p) => p.status === "baixado")
    .sort((a, b) => (a.sequencia_baixa ?? 0) - (b.sequencia_baixa ?? 0));
}

export function pendentes(paradas: Parada[]): Parada[] {
  return paradas
    .filter((p) => p.status !== "baixado")
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
}

/** Última posição confirmada: a última baixa ou a base. */
export function origemAtual(r: Roteiro, paradas: Parada[]): Ponto | null {
  const feitas = baixadas(paradas);
  const ultima = feitas[feitas.length - 1];
  if (ultima) return { lat: Number(ultima.lat), lon: Number(ultima.lon) };
  return baseDoRoteiro(r, paradas);
}

export type Previsto = { km: number; horas: number; custo: number };

export function previstoDoTrecho(de: Ponto, para: Ponto, p: Parametros): Previsto {
  const km = haversine(de, para) * p.fator;
  return {
    km,
    horas: km / p.velocidade + p.vistoria,
    custo: km * p.custoKm,
  };
}

export type ParadaCalculada = Parada & { previsto: Previsto; posicao: number };

/**
 * Recalcula a ordem das pendentes a partir da última posição confirmada
 * e os valores previstos de cada trecho.
 */
export function calcularCircuito(
  r: Roteiro,
  paradas: Parada[],
  reotimizar = true,
): { feitas: ParadaCalculada[]; abertas: ParadaCalculada[] } {
  const p = parametros(r);
  const base = baseDoRoteiro(r, paradas);
  const feitasBrutas = baixadas(paradas);
  const abertasBrutas = pendentes(paradas);

  const feitas: ParadaCalculada[] = [];
  let atual: Ponto | null = base;
  feitasBrutas.forEach((parada, i) => {
    const ponto = { lat: Number(parada.lat), lon: Number(parada.lon) };
    const previsto = atual ? previstoDoTrecho(atual, ponto, p) : { km: 0, horas: 0, custo: 0 };
    feitas.push({ ...parada, previsto, posicao: i + 1 });
    atual = ponto;
  });

  const origem = atual ?? base;
  const ordenadas =
    origem && reotimizar
      ? sequenciarPendentes(
          origem,
          abertasBrutas.map((parada) => ({
            ...parada,
            lat: Number(parada.lat),
            lon: Number(parada.lon),
          })),
        )
      : abertasBrutas;

  const abertas: ParadaCalculada[] = [];
  let anterior: Ponto | null = origem;
  ordenadas.forEach((parada, i) => {
    const ponto = { lat: Number(parada.lat), lon: Number(parada.lon) };
    const previsto = anterior
      ? previstoDoTrecho(anterior, ponto, p)
      : { km: 0, horas: 0, custo: 0 };
    abertas.push({ ...parada, previsto, posicao: feitas.length + i + 1 });
    anterior = ponto;
  });

  return { feitas, abertas };
}

export type Totais = {
  kmPrevisto: number;
  horasPrevisto: number;
  custoPrevisto: number;
  kmReal: number;
  horasReal: number;
  custoReal: number;
};

export function somar(paradas: ParadaCalculada[]): Totais {
  return paradas.reduce<Totais>(
    (t, p) => ({
      kmPrevisto: t.kmPrevisto + (p.km_previsto ?? p.previsto.km),
      horasPrevisto: t.horasPrevisto + (p.horas_previsto ?? p.previsto.horas),
      custoPrevisto: t.custoPrevisto + (p.custo_previsto ?? p.previsto.custo),
      kmReal: t.kmReal + Number(p.km_real ?? 0),
      horasReal: t.horasReal + Number(p.horas_real ?? 0),
      custoReal: t.custoReal + Number(p.custo_real ?? 0),
    }),
    {
      kmPrevisto: 0,
      horasPrevisto: 0,
      custoPrevisto: 0,
      kmReal: 0,
      horasReal: 0,
      custoReal: 0,
    },
  );
}

/** Quilometragem total do circuito planejado, útil para o cartão do roteiro. */
export function kmCircuito(r: Roteiro, paradas: Parada[]): number {
  const base = baseDoRoteiro(r, paradas);
  if (!base) return 0;
  const { feitas, abertas } = calcularCircuito(r, paradas);
  const caminho = [...feitas, ...abertas].map((p) => ({
    lat: Number(p.lat),
    lon: Number(p.lon),
  }));
  return comprimentoCaminho(base, caminho) * parametros(r).fator;
}

export const STATUS_ROTEIRO = [
  { valor: "planejamento", rotulo: "Planejamento" },
  { valor: "em_andamento", rotulo: "Em andamento" },
  { valor: "concluido", rotulo: "Concluído" },
];

export function rotuloStatusRoteiro(v: string | null | undefined): string {
  return STATUS_ROTEIRO.find((s) => s.valor === v)?.rotulo ?? "Planejamento";
}

export const AJUDA_PARAMETROS = {
  fator: "Multiplica a distância em linha reta para aproximar o caminho real de estrada.",
  velocidade: "Velocidade média considerada no trajeto entre paradas, em km/h.",
  vistoria: "Tempo médio gasto em cada imóvel, em horas.",
  jornada: "Horas de campo disponíveis por dia, para saber quantas paradas cabem no dia.",
  custoKm: "Custo por quilômetro rodado (combustível, desgaste, pedágio).",
};
