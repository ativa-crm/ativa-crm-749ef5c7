import React from "react";
import { Icon } from "../core/Icon.jsx";

const TONS = {
  info: { borda: "var(--border)", fundo: "var(--card)", cor: "var(--foreground)", icone: "clipboard-list" },
  sucesso: { borda: "var(--primary)", fundo: "var(--card)", cor: "var(--foreground)", icone: "file-check" },
  atencao: { borda: "var(--ambar)", fundo: "var(--card)", cor: "var(--foreground)", icone: "triangle-alert" },
  erro: { borda: "color-mix(in srgb, var(--destructive) 40%, transparent)", fundo: "color-mix(in srgb, var(--destructive) 10%, transparent)", cor: "var(--destructive)", icone: "triangle-alert" },
};

export function Alert({ tom = "info", titulo, children, iconBase, style, ...rest }) {
  const t = TONS[tom] || TONS.info;
  return (
    <div
      role={tom === "erro" ? "alert" : undefined}
      style={{
        display: "flex", gap: 12, borderRadius: "var(--radius-2xl)",
        border: `2px solid ${t.borda}`, background: t.fundo, padding: "14px 16px",
        fontFamily: "var(--font-sans)", color: t.cor, ...style,
      }}
      {...rest}
    >
      <Icon name={t.icone} size={22} base={iconBase} style={{ marginTop: 2 }} />
      <div style={{ minWidth: 0 }}>
        {titulo ? <p style={{ margin: 0, fontSize: "var(--texto-md)", fontWeight: "var(--peso-extra)" }}>{titulo}</p> : null}
        <div style={{ fontSize: "var(--texto-md)", fontWeight: "var(--peso-semi)", lineHeight: 1.45 }}>{children}</div>
      </div>
    </div>
  );
}
