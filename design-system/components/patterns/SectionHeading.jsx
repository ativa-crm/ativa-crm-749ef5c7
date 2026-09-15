import React from "react";
import { Icon } from "../core/Icon.jsx";

export function SectionHeading({ children, icone, corIcone = "var(--primary)", sublinhado = false, iconBase, style, ...rest }) {
  return (
    <h2
      style={{
        display: sublinhado ? "table" : "flex", alignItems: "center", gap: 8, margin: 0,
        paddingBottom: sublinhado ? "0.35rem" : 0,
        borderBottom: sublinhado ? "2px solid var(--primary)" : "none",
        fontFamily: "var(--font-sans)", fontSize: "var(--texto-xl)", fontWeight: "var(--peso-bold)",
        textTransform: "uppercase", letterSpacing: 0, color: "var(--foreground)", ...style,
      }}
      {...rest}
    >
      {icone ? <Icon name={icone} size={22} color={corIcone} base={iconBase} /> : null}
      {children}
    </h2>
  );
}
