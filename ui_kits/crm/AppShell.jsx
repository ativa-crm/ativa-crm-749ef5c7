const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
const BASE_ICONES = "../../assets/icons/";

function Marca({ compacto }) {
  const d = window.DADOS;
  return (
    <div style={{ display: "flex", minWidth: 0, alignItems: "center", gap: 12 }}>
      <span style={{ display: "flex", height: 48, width: 80, flex: "none", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 6, background: "#ffffff", padding: 4, boxShadow: "inset 0 0 0 1px var(--sidebar-border)" }}>
        <img src={d.empresa.logo} alt={"Logo " + d.empresa.nome} style={{ height: "100%", width: "100%", objectFit: "contain" }} />
      </span>
      {compacto ? null : (
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "var(--texto-md)", fontWeight: 800, textTransform: "uppercase", color: "var(--sidebar-foreground)" }}>
          {d.empresa.nome}
        </span>
      )}
    </div>
  );
}

function RodapeLateral({ escuro, alternarTema }) {
  const d = window.DADOS;
  const item = { display: "flex", width: "100%", alignItems: "center", gap: 10, borderRadius: 10, border: "none", background: "transparent", padding: "8px 16px", color: "var(--muted)", fontFamily: "var(--font-sans)", fontSize: "var(--texto-sm)", fontWeight: 600, cursor: "pointer" };
  return (
    <div>
      <p style={{ margin: "0 0 8px", padding: "0 8px", fontSize: "var(--texto-base)", fontWeight: 600, color: "var(--muted)" }}>
        {d.usuario.nome} · {d.usuario.papel}
      </p>
      <button style={item} onClick={alternarTema}>
        <DS.Icon name={escuro ? "sun" : "moon"} size={18} base={BASE_ICONES} />
        {escuro ? "Tema claro" : "Tema escuro"}
      </button>
      <button style={item}>
        <DS.Icon name="log-out" size={18} base={BASE_ICONES} />
        Sair
      </button>
    </div>
  );
}

function AppShell({ tela, aoNavegar, celular, escuro, alternarTema, children }) {
  const d = window.DADOS;
  if (celular) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--background-light)" }}>
        <header style={{ display: "flex", flex: "none", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottom: "1px solid var(--sidebar-border)", background: "var(--sidebar)", padding: "10px 14px", color: "var(--sidebar-foreground)" }}>
          <Marca />
          <button onClick={alternarTema} aria-label="Alternar tema" style={{ display: "flex", height: 44, width: 44, alignItems: "center", justifyContent: "center", borderRadius: 999, border: "1px solid var(--sidebar-border)", background: "transparent", color: "var(--sidebar-foreground)", cursor: "pointer" }}>
            <DS.Icon name={escuro ? "sun" : "moon"} size={22} base={BASE_ICONES} />
          </button>
        </header>
        <main className="app-content" style={{ flex: 1, overflowY: "auto", padding: "18px 16px 20px" }}>{children}</main>
        <DS.BottomNav itens={d.navegacao} atual={tela} onNavegar={aoNavegar} iconBase={BASE_ICONES} style={{ flex: "none" }} />
      </div>
    );
  }
  return (
    <div style={{ display: "flex", height: "100%", background: "var(--background-light)" }}>
      <DS.SidebarNav
        itens={d.navegacao}
        atual={tela}
        onNavegar={aoNavegar}
        iconBase={BASE_ICONES}
        marca={<Marca />}
        rodape={<RodapeLateral escuro={escuro} alternarTema={alternarTema} />}
        style={{ flex: "none", overflowY: "auto" }}
      />
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div className="app-content" style={{ margin: "0 auto", width: "100%", maxWidth: "var(--conteudo-max)", padding: "32px 24px 40px" }}>{children}</div>
      </div>
    </div>
  );
}

Object.assign(window, { AppShell, Marca, BASE_ICONES });
