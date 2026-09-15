import React from "react";

export const CORES_NOTA = { quente: "var(--vermelho)", morno: "var(--ambar)", frio: "var(--muted-foreground)" };
export const CORES_PRAZO = { verde: "var(--primary)", ambar: "var(--ambar)", vermelho: "var(--destructive)", nenhum: "var(--muted-foreground)" };

export function StatusDot({ cor = "var(--primary)", size = 12, style, ...rest }) {
  return <span style={{ width: size, height: size, borderRadius: 999, background: cor, flex: "none", display: "inline-block", ...style }} {...rest} />;
}
