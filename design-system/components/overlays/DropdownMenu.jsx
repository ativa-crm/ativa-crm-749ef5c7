import React from "react";

function ItemMenu({ item, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "block", width: "100%", textAlign: "left", border: "none",
        borderRadius: "var(--radius-sm)", padding: "12px 12px",
        background: hover ? "var(--accent)" : "transparent", color: "var(--popover-foreground)",
        fontFamily: "var(--font-sans)", fontSize: "var(--texto-md)", fontWeight: "var(--peso-bold)",
        cursor: "pointer", transition: "background-color var(--dur-padrao) var(--ease-padrao)",
      }}
    >
      {item.rotulo}
    </button>
  );
}

export function DropdownMenu({ gatilho, itens = [], onSelecionar, alinhamento = "right", style, ...rest }) {
  const [aberto, setAberto] = React.useState(false);
  return (
    <div style={{ position: "relative", display: "inline-block", ...style }} {...rest}>
      <span onClick={() => setAberto((v) => !v)} style={{ display: "inline-flex", cursor: "pointer" }}>{gatilho}</span>
      {aberto ? (
        <div
          role="menu"
          style={{
            position: "absolute", top: "calc(100% + 6px)", zIndex: 40,
            [alinhamento]: 0, minWidth: 180, padding: 4,
            borderRadius: "var(--radius-2xl)", border: "1px solid var(--border)",
            background: "var(--popover)", boxShadow: "var(--sombra-lg)",
          }}
        >
          {itens.map((i) => (
            <ItemMenu key={i.valor} item={i} onClick={() => { setAberto(false); onSelecionar && onSelecionar(i.valor); }} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
