// Estágios do funil e cores da nota do lead.

export type Estagio = { valor: string; rotulo: string };

export const ESTAGIOS: Estagio[] = [
  { valor: "novo", rotulo: "Novo" },
  { valor: "qualificando", rotulo: "Qualificando" },
  { valor: "quente", rotulo: "Quente" },
  { valor: "orcamento", rotulo: "Orçamento" },
  { valor: "negociacao", rotulo: "Negociação" },
  { valor: "fechado", rotulo: "Fechado" },
];

export const NOTAS: Estagio[] = [
  { valor: "quente", rotulo: "Quente" },
  { valor: "morno", rotulo: "Morno" },
  { valor: "frio", rotulo: "Frio" },
];

/** Classe de fundo do ponto colorido da nota. */
export function corDaNota(nota: string | null | undefined): string {
  if (nota === "quente") return "bg-red-500";
  if (nota === "frio") return "bg-muted-foreground";
  return "bg-amber-500";
}

export const MOTIVOS_PERDA: Estagio[] = [
  { valor: "sem_interesse", rotulo: "Sem interesse" },
  { valor: "fora_do_raio", rotulo: "Fora do raio" },
  { valor: "preco", rotulo: "Preço" },
  { valor: "sumiu", rotulo: "Sumiu" },
  { valor: "fechou_com_outro", rotulo: "Fechou com outro" },
];

export const SERVICOS: Estagio[] = [
  { valor: "georreferenciamento", rotulo: "Georreferenciamento" },
  { valor: "topografia", rotulo: "Topografia" },
  { valor: "usucapiao", rotulo: "Usucapião" },
  { valor: "car", rotulo: "CAR" },
  { valor: "desmembramento", rotulo: "Desmembramento" },
];
