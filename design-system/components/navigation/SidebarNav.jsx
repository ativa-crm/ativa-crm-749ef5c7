import React from "react";
import { Icon } from "../core/Icon.jsx";

function ItemLateral({ item, ativo, onClick, iconBase }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        borderRadius: 10, padding: "10px 14px", border: "none", textAlign: "left",
        background: ativo ? "var(--sidebar-primary)" : hover ? "var(--sidebar-accent)" : "transparent",
        color: ativo ? "var(--sidebar-primary-foreground)" : hover ? "var(--sidebar-accent-foreground)" : "var(--sidebar-foreground)",
        fontFamily: "var(--font-sans)", fontSize: "var(--texto-md)", fontWeight: "var(--peso-bold)",
        textTransform: "uppercase", cursor: "pointer",
        transition: "background-color var(--dur-padrao) var(--ease-padrao), color var(--dur-padrao) var(--ease-padrao)",
      }}
    >
      <Icon name={item.icone} size={18} base={iconBase} />
      {item.rotulo}
    </button>
  );
}

export function SidebarNav({ itens = [], atual, onNavegar, marca, rodape, iconBase, style, ...rest }) {
  return (
    <aside
      style={{
        width: "var(--sidebar-largura)", background: "var(--sidebar)", color: "var(--sidebar-foreground)",
        borderRight: "1px solid var(--sidebar-border)", padding: 16,
        display: "flex", flexDirection: "column", ...style,
      }}
      {...rest}
    >
      {marca}
      <nav style={{ marginTop: 24, display: "flex", flex: 1, flexDirection: "column", gap: 4 }}>
        {itens.map((i) => (
          <ItemLateral key={i.valor} item={i} ativo={i.valor === atual} onClick={() => onNavegar && onNavegar(i.valor)} iconBase={iconBase} />
        ))}
      </nav>
      {rodape ? <div style={{ borderTop: "1px solid var(--sidebar-border)", paddingTop: 12 }}>{rodape}</div> : null}
    </aside>
  );
}

export function BottomNav({ itens = [], atual, onNavegar, iconBase, style, ...rest }) {
  return (
    <nav
      style={{
        display: "flex", overflowX: "auto", background: "var(--sidebar)",
        borderTop: "1px solid var(--sidebar-border)", ...style,
      }}
      {...rest}
    >
      {itens.map((i) => {
        const ativo = i.valor === atual;
        return (
          <button
            key={i.valor}
            type="button"
            onClick={() => onNavegar && onNavegar(i.valor)}
            style={{
              minHeight: 64, minWidth: 80, flex: 1, border: "none", background: "transparent",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
              padding: "0 4px", cursor: "pointer",
              color: ativo ? "var(--primary)" : "var(--muted)",
              transition: "color var(--dur-padrao) var(--ease-padrao)",
            }}
          >
            <Icon name={i.icone} size={20} base={iconBase} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--texto-xs)", fontWeight: "var(--peso-bold)", lineHeight: 1 }}>{i.rotulo}</span>
          </button>
        );
      })}
    </nav>
  );
}
