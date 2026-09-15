import React from "react";

export function SpecCard({ tag, titulo, children, style, ...rest }) {
  return (
    <div
      style={{
        border: "1px solid var(--site-border)", borderRadius: 6, padding: 20,
        background: "rgba(255,255,255,.022)", display: "flex", flexDirection: "column",
        fontFamily: "var(--font-site)", ...style,
      }}
      {...rest}
    >
      <div style={{ marginBottom: 12 }}>
        {tag ? <span style={{ display: "block", color: "var(--site-accent)", fontSize: 7.5, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 5 }}>{tag}</span> : null}
        <h3 style={{ margin: 0, fontSize: 13, color: "#fff", letterSpacing: "-0.02em" }}>{titulo}</h3>
      </div>
      {children}
    </div>
  );
}

export function SpecGrid({ itens = [], style, ...rest }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px 14px", marginTop: 16, ...style }} {...rest}>
      {itens.map((i, k) => (
        <div key={k} style={{ borderTop: "1px solid var(--site-border)", paddingTop: 8 }}>
          <b style={{ display: "block", color: "#fff", fontSize: 9, marginBottom: 2 }}>{i.titulo}</b>
          <span style={{ fontSize: 7.4, color: "#98a099", lineHeight: 1.5 }}>{i.detalhe}</span>
        </div>
      ))}
    </div>
  );
}

export function Chip({ children, style, ...rest }) {
  return (
    <span style={{ border: "1px solid var(--site-border)", borderRadius: 999, padding: "5px 11px", fontSize: 7.4, color: "#c0c7c1", fontFamily: "var(--font-site)", ...style }} {...rest}>
      {children}
    </span>
  );
}
