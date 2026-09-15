import React from "react";
import { Badge } from "../core/Badge.jsx";
import { StatusDot, CORES_PRAZO } from "./StatusDot.jsx";

/** Mesma regra de src/lib/prazo.ts: >7 dias verde, 7 a 3 âmbar, <3 ou vencido vermelho. */
export function semaforo(dias) {
  if (dias === null || dias === undefined) return { nivel: "nenhum", texto: "sem prazo" };
  if (dias < 0) return { nivel: "vermelho", texto: `vencido há ${Math.abs(dias)} d` };
  if (dias < 3) return { nivel: "vermelho", texto: dias === 0 ? "vence hoje" : `faltam ${dias} d` };
  if (dias <= 7) return { nivel: "ambar", texto: `faltam ${dias} d` };
  return { nivel: "verde", texto: `faltam ${dias} d` };
}

export function DeadlineBadge({ dias, style, ...rest }) {
  const s = semaforo(dias);
  return (
    <Badge variant="outline" pill style={{ fontSize: "var(--texto-sm)", ...style }} {...rest}>
      <StatusDot cor={CORES_PRAZO[s.nivel]} size={8} />
      {s.texto}
    </Badge>
  );
}
