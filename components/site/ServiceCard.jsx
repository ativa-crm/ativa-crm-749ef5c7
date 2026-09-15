import React from "react";

export function ServiceCard({ glifo, titulo, descricao, style, ...rest }) {
  return (
    <div
      style={{
        height: 148, border: "1px solid var(--site-border)", borderRadius: "var(--site-radius)",
        padding: "13px 8px", textAlign: "center",
        background: "linear-gradient(180deg, rgba(255,255,255,.015), rgba(0,0,0,.08))",
        fontFamily: "var(--font-site)", ...style,
      }}
      {...rest}
    >
      <div style={{ color: "var(--site-accent)", fontSize: 25, height: 29, lineHeight: 1, fontWeight: 800, textShadow: "0 0 12px rgba(125,255,0,.16)" }}>{glifo}</div>
      <h3 style={{ margin: "8px 0 6px", fontSize: 11.5, lineHeight: 1.28, fontWeight: 800, color: "var(--site-text)" }}>{titulo}</h3>
      <p style={{ margin: 0, fontSize: 9, lineHeight: 1.42, color: "#b9c0ba" }}>{descricao}</p>
    </div>
  );
}
