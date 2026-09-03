// Tempo relativo em português do Brasil ("há 2 h", "há 3 d").

export function desdeAgora(v: string | null | undefined): string {
  if (!v) return "sem contato";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "sem contato";

  const seg = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seg < 60) return "agora";
  const min = Math.floor(seg / 60);
  if (min < 60) return `há ${min} min`;
  const hor = Math.floor(min / 60);
  if (hor < 24) return `há ${hor} h`;
  const dia = Math.floor(hor / 24);
  if (dia < 30) return `há ${dia} d`;
  const mes = Math.floor(dia / 30);
  if (mes < 12) return `há ${mes} ${mes === 1 ? "mês" : "meses"}`;
  const ano = Math.floor(mes / 12);
  return `há ${ano} ${ano === 1 ? "ano" : "anos"}`;
}

/** Hora curta (hh:mm) no fuso de São Paulo. */
export function hora(v: string | null | undefined): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });
}
