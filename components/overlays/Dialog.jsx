import React from "react";
import { Icon } from "../core/Icon.jsx";

export function Dialog({ aberto = true, titulo, onFechar, rodape, children, iconBase, largura = 512, style, ...rest }) {
  if (!aberto) return null;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.8)", padding: 16 }}>
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "relative", width: "100%", maxWidth: largura, maxHeight: "90%", overflowY: "auto",
          borderRadius: "var(--radius-3xl)", border: "2px solid var(--border)", background: "var(--card)",
          color: "var(--card-foreground)", padding: 24, boxShadow: "var(--sombra-lg)",
          fontFamily: "var(--font-sans)", display: "flex", flexDirection: "column", gap: 16, ...style,
        }}
        {...rest}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          {titulo ? <h2 style={{ margin: 0, fontSize: "var(--texto-2xl)", fontWeight: "var(--peso-extra)", letterSpacing: "-0.01em" }}>{titulo}</h2> : <span />}
          <button type="button" onClick={onFechar} aria-label="Fechar" style={{ border: "none", background: "transparent", cursor: "pointer", opacity: 0.7, padding: 0, lineHeight: 0 }}>
            <Icon name="x" size={18} base={iconBase} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
        {rodape ? <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>{rodape}</div> : null}
      </div>
    </div>
  );
}
