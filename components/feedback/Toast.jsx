import React from "react";
import { Icon } from "../core/Icon.jsx";

const TONS = {
  sucesso: { cor: "var(--primary)", icone: "file-check" },
  erro: { cor: "var(--destructive)", icone: "triangle-alert" },
  info: { cor: "var(--muted-foreground)", icone: "clipboard-list" },
};

export function Toast({ tom = "sucesso", children, iconBase, style, ...rest }) {
  const t = TONS[tom] || TONS.sucesso;
  return (
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        borderRadius: "var(--radius-md)", border: "1px solid var(--border)",
        background: "var(--popover)", color: "var(--popover-foreground)",
        padding: "12px 16px", boxShadow: "var(--sombra-lg)",
        fontFamily: "var(--font-sans)", fontSize: "var(--texto-base)", fontWeight: "var(--peso-semi)",
        ...style,
      }}
      {...rest}
    >
      <Icon name={t.icone} size={18} color={t.cor} base={iconBase} />
      {children}
    </div>
  );
}
