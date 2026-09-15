import React from "react";

export function SiteButton({ variant = "primary", tamanho = "default", icone, children, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
    fontFamily: "var(--font-site)", fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
    transition: "transform var(--dur-site) var(--ease-padrao), box-shadow var(--dur-site) var(--ease-padrao), filter var(--dur-site) var(--ease-padrao), border-color var(--dur-site) var(--ease-padrao)",
    transform: hover ? "translateY(-2px)" : "none",
  };
  const tamanhos = {
    default: { height: 38, padding: "0 18px", borderRadius: "var(--site-radius-btn)", fontSize: 11 },
    cta: { height: 54, minWidth: 225, padding: "0 20px", borderRadius: "var(--site-radius-cta)", fontSize: 13, fontWeight: 700 },
  };
  const variantes = {
    primary: { background: "var(--site-accent)", color: "#071005", border: "1px solid var(--site-accent)", filter: hover ? "brightness(1.08)" : "none", boxShadow: hover ? "var(--site-sombra-primary)" : "none" },
    whatsapp: { background: hover ? "#20c961" : "#25d366", color: "#071108", border: "1px solid rgba(255,255,255,.16)" },
    outline: { background: "rgba(255,255,255,.025)", color: "#fff", border: "1px solid " + (hover ? "var(--site-accent)" : "rgba(255,255,255,.75)"), boxShadow: hover ? "var(--site-sombra-btn)" : "none" },
    ghost: { background: "transparent", color: "var(--site-accent)", border: "1px solid #4e8f2b", padding: "10px 18px", borderRadius: 3, fontSize: 11 },
  };
  return (
    <a
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...tamanhos[tamanho], ...variantes[variant], ...style }}
      {...rest}
    >
      {icone ? <img src={icone} alt="" aria-hidden="true" style={{ width: 30, height: 30, borderRadius: 9, objectFit: "contain", flex: "none" }} /> : null}
      {children}
    </a>
  );
}
