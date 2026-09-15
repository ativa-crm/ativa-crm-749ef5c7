import React from "react";

export function Avatar({ src, nome = "", size = 40, style, ...rest }) {
  const iniciais = nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0] || "").join("").toUpperCase();
  return (
    <span
      style={{
        width: size, height: size, borderRadius: 999, overflow: "hidden", flex: "none",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: "var(--secondary)", color: "var(--foreground)",
        fontFamily: "var(--font-sans)", fontWeight: "var(--peso-bold)", fontSize: size * 0.36,
        border: "1px solid var(--border)", ...style,
      }}
      {...rest}
    >
      {src ? <img src={src} alt={nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : iniciais}
    </span>
  );
}
