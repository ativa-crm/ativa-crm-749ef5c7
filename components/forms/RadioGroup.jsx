import React from "react";

export function RadioGroup({ opcoes = [], valor, onChange, name = "grupo", style, ...rest }) {
  return (
    <div role="radiogroup" style={{ display: "flex", flexDirection: "column", gap: 10, ...style }} {...rest}>
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <label key={o.valor} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="radio" name={name} checked={ativo} onChange={() => onChange && onChange(o.valor)} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
            <span style={{ width: 18, height: 18, borderRadius: 999, flex: "none", border: `2px solid ${ativo ? "var(--primary)" : "var(--input)"}`, display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "border-color var(--dur-padrao) var(--ease-padrao)" }}>
              {ativo ? <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--primary)" }} /> : null}
            </span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--texto-md)", fontWeight: "var(--peso-medio)", color: "var(--foreground)" }}>{o.rotulo}</span>
          </label>
        );
      })}
    </div>
  );
}
