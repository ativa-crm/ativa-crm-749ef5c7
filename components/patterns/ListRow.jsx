import React from "react";

export function ListRow({ titulo, linhas = [], direita, alerta = false, onClick, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12,
        borderRadius: "var(--radius-2xl)",
        border: alerta ? "2px solid color-mix(in srgb, var(--destructive) 40%, transparent)" : "1px solid var(--border)",
        background: hover && onClick ? "var(--accent)" : "var(--card)",
        padding: 14, cursor: onClick ? "pointer" : "default",
        transition: "background-color var(--dur-padrao) var(--ease-padrao)", ...style,
      }}
      {...rest}
    >
      <div style={{ flex: "1 1 190px", minWidth: 0, fontFamily: "var(--font-sans)" }}>
        <p style={{ margin: 0, fontSize: "var(--texto-lg)", fontWeight: "var(--peso-bold)", color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titulo}</p>
        {linhas.map((l, i) => (
          <p key={i} style={{ margin: "2px 0 0", fontSize: "var(--texto-base)", fontWeight: "var(--peso-medio)", color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l}</p>
        ))}
      </div>
      {direita ? <div style={{ flex: "0 1 auto", minWidth: 0 }}>{direita}</div> : null}
    </div>
  );
}
