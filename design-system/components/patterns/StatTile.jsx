import React from "react";
import { Icon } from "../core/Icon.jsx";

export function StatTile({ icone, valor, rotulo, iconBase, onClick, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 96,
        borderRadius: 14, border: "1px solid var(--border)", background: "var(--card)",
        padding: "12px 16px", boxShadow: "var(--card-shadow)", cursor: onClick ? "pointer" : "default",
        transform: hover && onClick ? "translateY(-2px)" : "none",
        transition: "all var(--dur-padrao) var(--ease-padrao)", ...style,
      }}
      {...rest}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", fontSize: "var(--texto-3xl)", fontWeight: "var(--peso-extra)", color: "var(--primary)", lineHeight: 1 }}>
        {icone ? <Icon name={icone} size={16} base={iconBase} /> : null}
        {valor}
      </span>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--texto-base)", fontWeight: "var(--peso-bold)", textTransform: "uppercase", lineHeight: 1.15, color: "var(--foreground)" }}>
        {rotulo}
      </span>
    </div>
  );
}
