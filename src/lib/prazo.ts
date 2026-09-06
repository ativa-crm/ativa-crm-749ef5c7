// Semáforo de prazo das ordens de serviço.

export const STATUS_OS = [
  { valor: "aguardando_documentos", rotulo: "Aguardando documentos" },
  { valor: "aguardando_campo", rotulo: "Aguardando campo" },
  { valor: "em_campo", rotulo: "Em campo" },
  { valor: "processamento", rotulo: "Processamento" },
  { valor: "documentacao", rotulo: "Documentação" },
  { valor: "pendencia", rotulo: "Pendência" },
  { valor: "concluida", rotulo: "Concluída" },
  { valor: "cancelada", rotulo: "Cancelada" },
];

/** Status que não contam mais para o semáforo de prazo. */
export const STATUS_ENCERRADOS = ["concluida", "cancelada"];

/** Dias inteiros até o prazo (negativo = vencido). */
export function diasAtePrazo(prazo: string | null | undefined): number | null {
  if (!prazo) return null;
  const d = new Date(prazo);
  if (Number.isNaN(d.getTime())) return null;
  const hoje = new Date();
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((a - b) / 86400000);
}

export type Semaforo = {
  cor: string;
  ponto: string;
  texto: string;
  nivel: "verde" | "ambar" | "vermelho" | "nenhum";
};

/** Cor e texto do prazo: >7 dias verde, 7 a 3 âmbar, <3 ou vencido vermelho. */
export function semaforoPrazo(
  prazo: string | null | undefined,
  status?: string | null,
): Semaforo {
  const dias = diasAtePrazo(prazo);
  if (dias === null || (status && STATUS_ENCERRADOS.includes(status))) {
    return {
      cor: "bg-muted text-muted-foreground",
      ponto: "bg-muted-foreground",
      texto: dias === null ? "sem prazo" : "",
      nivel: "nenhum",
    };
  }
  if (dias < 0) {
    return {
      cor: "bg-destructive text-destructive-foreground",
      ponto: "bg-destructive",
      texto: `vencido há ${Math.abs(dias)} d`,
      nivel: "vermelho",
    };
  }
  if (dias < 3) {
    return {
      cor: "bg-destructive text-destructive-foreground",
      ponto: "bg-destructive",
      texto: dias === 0 ? "vence hoje" : `faltam ${dias} d`,
      nivel: "vermelho",
    };
  }
  if (dias <= 7) {
    return {
      cor: "bg-amber-500 text-white",
      ponto: "bg-amber-500",
      texto: `faltam ${dias} d`,
      nivel: "ambar",
    };
  }
  return {
    cor: "bg-primary text-primary-foreground",
    ponto: "bg-primary",
    texto: `faltam ${dias} d`,
    nivel: "verde",
  };
}
