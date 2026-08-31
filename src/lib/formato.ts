// Formatação e máscaras brasileiras.

export function soDigitos(v: string): string {
  return (v ?? "").replace(/\D+/g, "");
}

export function mascaraCPF(v: string): string {
  const d = soDigitos(v).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

export function mascaraCNPJ(v: string): string {
  const d = soDigitos(v).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
}

/** Máscara de documento conforme o tipo do cliente. */
export function mascaraDocumento(v: string, tipo: string): string {
  return tipo === "pj" ? mascaraCNPJ(v) : mascaraCPF(v);
}

export function mascaraTelefone(v: string): string {
  const d = soDigitos(v).slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/^\((\d{2})\) (\d{4})(\d)/, "($1) $2-$3");
  }
  return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/^\((\d{2})\) (\d{5})(\d)/, "($1) $2-$3");
}

export function mascaraUF(v: string): string {
  return (v ?? "").replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
}

/** Converte texto digitado com vírgula decimal em número. */
export function paraNumero(v: string): number | null {
  const limpo = (v ?? "").trim().replace(/\./g, "").replace(",", ".");
  if (limpo === "") return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

export function numero(v: number | string | null | undefined, casas = 2): string {
  if (v === null || v === undefined || v === "") return "";
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function areaHa(v: number | string | null | undefined): string {
  const t = numero(v, 4);
  return t === "" ? "" : `${t} ha`;
}

export function reais(v: number | string | null | undefined): string {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Data em dd/mm/aaaa (sem hora). */
export function data(v: string | null | undefined): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function dataHora(v: string | null | undefined): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ROTULOS: Record<string, string> = {
  // estágios de oportunidade
  novo: "Novo",
  qualificando: "Qualificando",
  quente: "Quente",
  orcamento: "Orçamento",
  negociacao: "Negociação",
  fechado: "Fechado",
  // status de orçamento
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  recusado: "Recusado",
  expirado: "Expirado",
  // status de OS
  aguardando_documentos: "Aguardando documentos",
  aguardando_campo: "Aguardando campo",
  em_campo: "Em campo",
  processamento: "Processamento",
  documentacao: "Documentação",
  concluida: "Concluída",
  pendencia: "Pendência",
  cancelada: "Cancelada",
  // serviços
  georreferenciamento: "Georreferenciamento",
  topografia: "Topografia",
  usucapiao: "Usucapião",
  car: "CAR",
  desmembramento: "Desmembramento",
  // categorias de documento
  matricula: "Matrícula",
  ccir: "CCIR",
  itr: "ITR",
  procuracao: "Procuração",
  art: "ART",
  planta: "Planta",
  memorial: "Memorial",
  // tipos
  rural: "Rural",
  urbano: "Urbano",
  pf: "Pessoa física",
  pj: "Pessoa jurídica",
};

export function rotulo(v: string | null | undefined): string {
  if (!v) return "";
  return ROTULOS[v] ?? v;
}
