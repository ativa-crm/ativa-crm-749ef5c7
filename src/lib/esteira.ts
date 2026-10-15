// Modelos da Esteira técnica (pós-venda). Ficam no código para não depender de cadastro prévio;
// depois de criado, cada processo tem suas próprias etapas e pode ser ajustado livremente na tela.

export type EtapaModelo = { nome: string; dias: number; codigo: string };

export type ModeloEsteira = { chave: string; rotulo: string; etapas: EtapaModelo[] };

export const MODELOS_ESTEIRA: ModeloEsteira[] = [
  {
    chave: "georreferenciamento",
    rotulo: "Georreferenciamento / Regularização Fundiária (SIGEF)",
    etapas: [
      { nome: "Documentação recebida (matrícula, CCIR, ITR, CAR)", dias: 7, codigo: "documentos" },
      { nome: "Planejamento do levantamento", dias: 5, codigo: "planejamento" },
      { nome: "Levantamento de campo (GNSS)", dias: 10, codigo: "campo" },
      { nome: "Processamento (RINEX/PPP)", dias: 7, codigo: "processamento" },
      { nome: "Peças técnicas (planta, memorial e ART)", dias: 7, codigo: "pecas" },
      { nome: "Anuências dos confrontantes", dias: 30, codigo: "anuencias" },
      { nome: "Envio ao SIGEF/INCRA", dias: 3, codigo: "sigef_envio" },
      { nome: "Certificação SIGEF", dias: 15, codigo: "certificacao" },
      { nome: "Registro no Cartório de Imóveis", dias: 30, codigo: "cartorio" },
    ],
  },
  {
    chave: "retificacao",
    rotulo: "Retificação de área",
    etapas: [
      { nome: "Documentação recebida (matrícula, CCIR, ITR)", dias: 7, codigo: "documentos" },
      { nome: "Levantamento de campo", dias: 10, codigo: "campo" },
      { nome: "Processamento", dias: 7, codigo: "processamento" },
      { nome: "Planta, memorial e ART", dias: 7, codigo: "pecas" },
      { nome: "Anuências dos confrontantes", dias: 30, codigo: "anuencias" },
      { nome: "Protocolo no Cartório de Imóveis", dias: 3, codigo: "protocolo" },
      { nome: "Averbação da retificação", dias: 30, codigo: "cartorio" },
    ],
  },
  {
    chave: "car",
    rotulo: "Cadastro do CAR",
    etapas: [
      { nome: "Documentação recebida", dias: 5, codigo: "documentos" },
      { nome: "Delimitação das áreas (APP, RL, uso do solo)", dias: 10, codigo: "pecas" },
      { nome: "Inscrição/retificação no SICAR", dias: 3, codigo: "protocolo" },
      { nome: "Acompanhamento da análise", dias: 30, codigo: "acompanhamento" },
    ],
  },
  {
    chave: "outorga",
    rotulo: "Outorga de água",
    etapas: [
      { nome: "Documentação recebida", dias: 7, codigo: "documentos" },
      { nome: "Vistoria de campo", dias: 10, codigo: "campo" },
      { nome: "Estudos e peças técnicas", dias: 15, codigo: "pecas" },
      { nome: "Protocolo no órgão", dias: 3, codigo: "protocolo" },
      { nome: "Acompanhamento até a outorga", dias: 60, codigo: "acompanhamento" },
    ],
  },
  {
    chave: "generico",
    rotulo: "Outro serviço (etapas básicas)",
    etapas: [
      { nome: "Documentação recebida", dias: 7, codigo: "documentos" },
      { nome: "Levantamento de campo", dias: 10, codigo: "campo" },
      { nome: "Processamento", dias: 7, codigo: "processamento" },
      { nome: "Elaboração das peças", dias: 7, codigo: "pecas" },
      { nome: "Entrega ao cliente", dias: 3, codigo: "entrega" },
    ],
  },
];

export const ORGAOS = [
  { valor: "sigef", rotulo: "SIGEF/INCRA" },
  { valor: "cartorio", rotulo: "Cartório de Imóveis" },
  { valor: "prefeitura", rotulo: "Prefeitura" },
  { valor: "car", rotulo: "SICAR / órgão ambiental" },
  { valor: "agua", rotulo: "Órgão de recursos hídricos" },
  { valor: "outro", rotulo: "Outro" },
] as const;

export function rotuloOrgao(v: string | null | undefined): string {
  return ORGAOS.find((o) => o.valor === v)?.rotulo ?? (v || "—");
}

/** Sugere o modelo pelo nome do serviço (ex.: "Regularização Fundiária" → georreferenciamento). */
export function modeloPorServico(servico: string | null | undefined): string {
  const t = (servico ?? "").toLowerCase();
  if (/retifica/.test(t)) return "retificacao";
  if (/(geo|regulariza|sigef|incra|certifica)/.test(t)) return "georreferenciamento";
  if (/\bcar\b|cadastro do car/.test(t)) return "car";
  if (/outorga|água|agua/.test(t)) return "outorga";
  return "georreferenciamento";
}

/** Data ISO (aaaa-mm-dd) somando dias a partir de outra data ISO. */
export function somarDias(inicioIso: string, dias: number): string {
  const [a, m, d] = inicioIso.slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(a!, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + dias);
  return dt.toISOString().slice(0, 10);
}

/** Etapas do modelo com prazo acumulado a partir do início do processo. */
export function etapasComPrazo(chave: string, inicioIso: string) {
  const modelo = MODELOS_ESTEIRA.find((m) => m.chave === chave) ?? MODELOS_ESTEIRA[0]!;
  let acum = 0;
  return modelo.etapas.map((e, i) => {
    acum += e.dias;
    return { nome: e.nome, codigo: e.codigo, ordem: i + 1, prazo: somarDias(inicioIso, acum) };
  });
}
