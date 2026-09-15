import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { designSystemCatalog, designSystemComponentCount } from "../../design-system/catalog";

export const Route = createFileRoute("/design-system")({
  ssr: false,
  component: DesignSystemShowcase,
});

const sectionStyle = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  background: "var(--card)",
  padding: 24,
};

const chipStyle = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 32,
  borderRadius: 999,
  border: "1px solid var(--border)",
  padding: "4px 10px",
  fontSize: 12,
};

function DesignSystemShowcase() {
  const [dark, setDark] = useState(false);
  const [selected, setSelected] = useState("Todos");
  const groups = ["Todos", ...Object.keys(designSystemCatalog)];

  return (
    <main className={dark ? "dark" : ""} style={{ minHeight: "100vh", background: "var(--background-light)", color: "var(--foreground)", padding: "40px 20px", transition: "background 180ms ease" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", display: "grid", gap: 24 }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <p style={{ color: "var(--primary)", fontWeight: 700, margin: 0 }}>ATIVA / BIBLIOTECA</p>
            <h1 style={{ margin: "8px 0", fontSize: 32 }}>Design system</h1>
            <p style={{ maxWidth: 660, color: "var(--muted-foreground)", margin: 0 }}>
              {designSystemComponentCount} componentes canônicos, tokens e padrões de composição em um único catálogo vivo.
            </p>
          </div>
          <button type="button" onClick={() => setDark((value) => !value)} style={{ ...chipStyle, minHeight: 44, background: "var(--card)", color: "var(--foreground)", cursor: "pointer" }}>
            {dark ? "Tema claro" : "Tema escuro"}
          </button>
        </header>

        <section style={sectionStyle} aria-label="Filtros da biblioteca">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {groups.map((group) => (
              <button key={group} type="button" onClick={() => setSelected(group)} style={{ ...chipStyle, background: selected === group ? "var(--primary)" : "var(--card)", color: selected === group ? "var(--primary-foreground)" : "var(--foreground)", cursor: "pointer" }}>
                {group}
              </button>
            ))}
          </div>
        </section>

        <ShowcaseStates />

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
          {Object.entries(designSystemCatalog)
            .filter(([group]) => selected === "Todos" || selected === group)
            .map(([group, components]) => (
              <article key={group} style={sectionStyle}>
                <h2 style={{ marginTop: 0, textTransform: "capitalize" }}>{group}</h2>
                <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
                  {components.map((component) => <li key={component}>{component}</li>)}
                </ul>
              </article>
            ))}
        </section>
      </div>
    </main>
  );
}

function ShowcaseStates() {
  return (
    <section style={{ ...sectionStyle, display: "grid", gap: 24 }} aria-label="Estados fundamentais">
      <div>
        <h2 style={{ margin: "0 0 16px" }}>Estados fundamentais</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" style={{ ...chipStyle, background: "var(--primary)", color: "var(--primary-foreground)", borderColor: "var(--primary)", cursor: "pointer" }}>Primário</button>
          <button type="button" disabled style={{ ...chipStyle, background: "var(--primary)", color: "var(--primary-foreground)", opacity: 0.5 }}>Desativado</button>
          <span style={{ ...chipStyle, color: "var(--vermelho)" }}>Erro</span>
          <span style={{ ...chipStyle, color: "var(--muted-foreground)" }}>Vazio</span>
          <span style={{ ...chipStyle, color: "var(--primary)", borderColor: "var(--primary)" }}>Selecionado</span>
          <span style={{ ...chipStyle, color: "var(--primary)" }}>Carregando...</span>
        </div>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <label htmlFor="showcase-input">Campo com foco e erro</label>
        <input id="showcase-input" aria-invalid="true" placeholder="Digite um valor" style={{ minHeight: 44, border: "2px solid var(--vermelho)", borderRadius: 18, padding: "0 14px", background: "var(--card)", color: "var(--foreground)", outlineColor: "var(--ring)" }} />
        <small style={{ color: "var(--vermelho)" }}>Informe um valor para continuar.</small>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--primary)" }} aria-hidden="true" />
        <strong>Prazo em dia</strong>
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--ambar)" }} aria-hidden="true" />
        <strong>Atenção</strong>
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--vermelho)" }} aria-hidden="true" />
        <strong>Vencido</strong>
      </div>
    </section>
  );
}