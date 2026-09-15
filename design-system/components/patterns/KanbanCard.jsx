import React from "react";
import { StatusDot, CORES_NOTA } from "./StatusDot.jsx";

export function KanbanCard({ cliente, cidade, area, servico, tempo, nota = "morno", acao, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  return (
    <article
      draggable
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", background: "var(--card)",
        padding: 12, boxShadow: "var(--card-shadow)", cursor: "grab",
        transform: hover ? "translateY(-2px)" : "none",
        transition: "all var(--dur-rapida) var(--ease-padrao)", fontFamily: "var(--font-sans)", ...style,
      }}
      {...rest}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StatusDot cor={CORES_NOTA[nota] || CORES_NOTA.morno} />
            <h3 style={{ margin: 0, fontSize: "var(--texto-lg)", fontWeight: "var(--peso-extra)", color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cliente}</h3>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "var(--texto-md)", fontWeight: "var(--peso-semi)", color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {[cidade, area].filter(Boolean).join(" · ")}
          </p>
        </div>
        {acao}
      </div>
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        {servico ? (
          <span style={{ minWidth: 0, borderRadius: 999, background: "var(--secondary)", padding: "4px 10px", fontSize: "var(--texto-base)", fontWeight: "var(--peso-extra)", color: "var(--secondary-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{servico}</span>
        ) : <span style={{ whiteSpace: "nowrap", fontSize: "var(--texto-base)", fontWeight: "var(--peso-bold)", color: "var(--muted-foreground)" }}>sem serviço</span>}
        <span style={{ flex: "none", whiteSpace: "nowrap", fontSize: "var(--texto-base)", fontWeight: "var(--peso-bold)", color: "var(--muted-foreground)" }}>{tempo}</span>
      </div>
    </article>
  );
}
