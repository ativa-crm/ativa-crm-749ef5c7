import React from "react";

const V = {
  default: { background: "var(--primary)", color: "var(--primary-foreground)", borderColor: "transparent", boxShadow: "var(--sombra-sm)" },
  secondary: { background: "var(--secondary)", color: "var(--secondary-foreground)", borderColor: "transparent" },
  destructive: { background: "var(--destructive)", color: "var(--destructive-foreground)", borderColor: "transparent", boxShadow: "var(--sombra-sm)" },
  outline: { background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" },
};

export function Badge({ variant = "default", pill = false, dot, children, style, ...rest }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
        borderRadius: pill ? "var(--radius-pill)" : "var(--radius-sm)",
        borderWidth: 1, borderStyle: "solid", padding: pill ? "4px 10px" : "2px 10px",
        fontFamily: "var(--font-sans)", fontSize: "var(--texto-sm)", fontWeight: "var(--peso-semi)",
        transition: "background-color var(--dur-padrao) var(--ease-padrao)",
        ...V[variant], ...style,
      }}
      {...rest}
    >
      {dot ? <span style={{ width: 8, height: 8, borderRadius: 999, background: dot, flex: "none" }} aria-hidden /> : null}
      {children}
    </span>
  );
}
