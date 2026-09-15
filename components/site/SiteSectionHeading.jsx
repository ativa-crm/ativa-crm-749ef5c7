import React from "react";

export function SiteSectionHeading({ kicker, children, sublinhado = false, tamanho = 36, style, ...rest }) {
  return (
    <div style={{ fontFamily: "var(--font-site)", ...style }} {...rest}>
      {kicker ? <div style={{ fontSize: 14, letterSpacing: "1.6px", color: "var(--site-accent)", fontWeight: 900, textTransform: "uppercase", marginBottom: 9 }}>{kicker}</div> : null}
      <h2 style={{ margin: "0 0 14px", fontSize: tamanho, lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.035em", color: "var(--site-text)", textWrap: "balance" }}>
        {children}
        {sublinhado ? <span style={{ display: "block", width: 72, height: 4, marginTop: 18, borderRadius: 3, background: "var(--site-accent)" }} /> : null}
      </h2>
    </div>
  );
}
