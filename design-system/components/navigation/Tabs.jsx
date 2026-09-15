import React from "react";

export function Tabs({ itens = [], valor, onChange, style, ...rest }) {
  return (
    <div
      role="tablist"
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
        height: 36, padding: 4, borderRadius: "var(--radius-pill)",
        border: "1px solid var(--border)", background: "var(--secondary)", ...style,
      }}
      {...rest}
    >
      {itens.map((i) => {
        const ativo = i.valor === valor;
        return (
          <button
            key={i.valor}
            role="tab"
            aria-selected={ativo}
            onClick={() => onChange && onChange(i.valor)}
            style={{
              height: 28, padding: "0 12px", borderRadius: "var(--radius-pill)",
              border: `1px solid ${ativo ? "var(--primary)" : "transparent"}`,
              background: ativo ? "var(--primary)" : "transparent",
              color: ativo ? "var(--primary-foreground)" : "var(--muted-foreground)",
              fontFamily: "var(--font-sans)", fontSize: "var(--texto-seg)", fontWeight: "var(--peso-semi)",
              textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap",
              transition: "all var(--dur-padrao) var(--ease-padrao)",
            }}
          >
            {i.rotulo}
          </button>
        );
      })}
    </div>
  );
}
