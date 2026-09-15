import React from "react";

export function Progress({ valor = 0, altura = 8, style, ...rest }) {
  const v = Math.max(0, Math.min(100, valor));
  return (
    <div
      role="progressbar"
      aria-valuenow={v}
      style={{ width: "100%", height: altura, borderRadius: 999, background: "var(--secondary)", overflow: "hidden", ...style }}
      {...rest}
    >
      <div style={{ width: v + "%", height: "100%", borderRadius: 999, background: "var(--primary)", transition: "width var(--dur-padrao) var(--ease-padrao)" }} />
    </div>
  );
}
