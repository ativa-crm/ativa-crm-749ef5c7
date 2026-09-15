import React from "react";

function ItemSeg({ item, ativo, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      type="button"
      data-ativo={ativo}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: 32, padding: "0 12px", borderRadius: 999, border: "none",
        background: ativo ? "var(--primary)" : hover ? "var(--accent)" : "transparent",
        color: ativo ? "var(--primary-foreground)" : "var(--foreground)",
        fontFamily: "var(--font-sans)", fontSize: "var(--texto-seg)", fontWeight: "var(--peso-semi)",
        letterSpacing: "0.01em", textTransform: "uppercase", cursor: "pointer",
        transition: "background-color var(--dur-rapida) var(--ease-padrao), color var(--dur-rapida) var(--ease-padrao)",
      }}
    >
      {item.rotulo}
    </button>
  );
}

export function SegmentedControl({ itens = [], valor, onChange, style, ...rest }) {
  return (
    <div
      style={{
        display: "inline-flex", flexWrap: "wrap", gap: 4, padding: "0.2rem",
        border: "1px solid var(--border)", borderRadius: 999, background: "var(--secondary)", ...style,
      }}
      {...rest}
    >
      {itens.map((i) => (
        <ItemSeg key={i.valor} item={i} ativo={i.valor === valor} onClick={() => onChange && onChange(i.valor)} />
      ))}
    </div>
  );
}
