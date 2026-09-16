const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
const ICO = "../../assets/icons/";
const CHAVE_LATERAL = "ativa-crm-v2-lateral";

function ItemLateral({ item, ativo, aberto, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button type="button" data-ativo={ativo ? "1" : "0"} onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      title={aberto ? undefined : item.rotulo}
      style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, width: "100%", height: 44,
        padding: aberto ? "0 12px" : 0, justifyContent: aberto ? "flex-start" : "center",
        borderRadius: 10, border: "none", textAlign: "left", cursor: "pointer", overflow: "hidden",
        background: ativo ? "var(--sidebar-primary)" : hover ? "var(--sidebar-accent)" : "transparent",
        color: ativo ? "var(--sidebar-primary-foreground)" : "var(--sidebar-foreground)",
        fontFamily: "var(--font-sans)", fontSize: "var(--texto-base)", fontWeight: 700, textTransform: "uppercase",
        transition: "background-color 180ms ease, color 180ms ease, padding 200ms ease" }}>
      <DS.Icon name={item.icone} size={20} base={ICO} />
      <span style={{ whiteSpace: "nowrap", opacity: aberto ? 1 : 0, transition: "opacity 140ms ease" }}>{item.rotulo}</span>
    </button>
  );
}

function Lateral({ itens, atual, aoNavegar, aberto, alternar }) {
  const c = window.CRM;
  return (
    <aside style={{ position: "relative", flex: "none", width: aberto ? 248 : 76, display: "flex", flexDirection: "column",
      background: "var(--sidebar)", borderRight: "1px solid var(--sidebar-border)", padding: 14,
      transition: "width 200ms ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 48 }}>
        <span style={{ display: "flex", height: 44, width: 44, flex: "none", alignItems: "center", justifyContent: "center",
          overflow: "hidden", borderRadius: 8, background: "#ffffff", padding: 4, boxShadow: "inset 0 0 0 1px var(--sidebar-border)" }}>
          <img src={c.empresa.logo} alt={"Logo " + c.empresa.nome} style={{ height: "100%", width: "100%", objectFit: "contain" }} />
        </span>
        <span style={{ minWidth: 0, overflow: "hidden", whiteSpace: "nowrap", opacity: aberto ? 1 : 0,
          fontFamily: "var(--font-sans)", fontSize: "var(--texto-sm)", fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.04em", color: "var(--sidebar-foreground)", transition: "opacity 140ms ease" }}>
          {c.empresa.nome}
        </span>
      </div>

      <nav style={{ marginTop: 22, display: "flex", flex: 1, flexDirection: "column", gap: 4 }}>
        {itens.map((i) => <ItemLateral key={i.valor} item={i} ativo={i.valor === atual} aberto={aberto} onClick={() => aoNavegar(i.valor)} />)}
      </nav>

      <button type="button" onClick={alternar} aria-label={aberto ? "Recolher menu" : "Expandir menu"}
        style={{ display: "flex", alignItems: "center", justifyContent: aberto ? "flex-start" : "center", gap: 12, height: 44,
          padding: aberto ? "0 12px" : 0, borderRadius: 10, border: "1px solid var(--sidebar-border)", background: "transparent",
          color: "var(--muted)", fontFamily: "var(--font-sans)", fontSize: "var(--texto-sm)", fontWeight: 700,
          textTransform: "uppercase", cursor: "pointer" }}>
        <DS.Icon name="panel-left" size={18} base={ICO} />
        <span style={{ whiteSpace: "nowrap", opacity: aberto ? 1 : 0, transition: "opacity 140ms ease" }}>Recolher</span>
      </button>
    </aside>
  );
}

function BarraTopo({ titulo, escuro, alternarTema, perfil, aoTrocarPerfil, celular, aoAbrirMenu }) {
  const c = window.CRM;
  return (
    <header style={{ display: "flex", flex: "none", alignItems: "center", gap: 12, height: celular ? 60 : 68,
      padding: celular ? "0 14px" : "0 24px", borderBottom: "1px solid var(--border)", background: "var(--card)" }}>
      {celular ? (
        <button onClick={aoAbrirMenu} aria-label="Abrir menu" style={{ display: "flex", height: 44, width: 44, flex: "none",
          alignItems: "center", justifyContent: "center", borderRadius: 999, border: "1px solid var(--border)",
          background: "transparent", color: "var(--foreground)", cursor: "pointer" }}>
          <DS.Icon name="panel-left" size={20} base={ICO} />
        </button>
      ) : null}
      <h1 style={{ margin: 0, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        fontFamily: "var(--font-sans)", fontSize: celular ? "var(--texto-lg)" : "var(--texto-xl)", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.01em", color: "var(--foreground)" }}>{titulo}</h1>

      {celular ? null : (
        <div style={{ position: "relative", width: 300, flex: "none" }}>
          <DS.Icon name="search" size={18} color="var(--muted-foreground)" base={ICO} style={{ position: "absolute", left: 14, top: 9, pointerEvents: "none" }} />
          <DS.Input pill placeholder="Buscar cliente, imóvel, OS…" style={{ height: 36, paddingLeft: 40, fontSize: "var(--texto-base)" }} />
        </div>
      )}

      <span style={{ display: "flex", flex: "none", alignItems: "center", gap: 8, height: 36, padding: "0 12px",
        borderRadius: 999, border: "1px solid var(--border)", background: "var(--secondary)",
        fontFamily: "var(--font-sans)", fontSize: "var(--texto-sm)", fontWeight: 800, color: "var(--foreground)" }}
        title={"Pontos por resposta rápida · sequência de " + c.pontos.streak + " dias"}>
        <DS.Icon name="flame" size={16} color="var(--primary)" base={ICO} />
        {c.pontos.total}
        {celular ? null : <span style={{ color: "var(--muted-foreground)", fontWeight: 600 }}>pts</span>}
      </span>

      {celular ? null : (
        <DS.NativeSelect value={perfil} onChange={(e) => aoTrocarPerfil(e.target.value)} size="default" pill
          style={{ width: 176, flex: "none", fontSize: "var(--texto-sm)" }}>
          {c.perfis.map((p) => <option key={p.valor} value={p.valor}>{p.rotulo}</option>)}
        </DS.NativeSelect>
      )}

      <button onClick={alternarTema} aria-label="Alternar tema" style={{ display: "flex", height: 36, width: 36, flex: "none",
        alignItems: "center", justifyContent: "center", borderRadius: 999, border: "1px solid var(--border)",
        background: "transparent", color: "var(--foreground)", cursor: "pointer" }}>
        <DS.Icon name={escuro ? "sun" : "moon"} size={18} base={ICO} />
      </button>
      <DS.Avatar nome={c.usuario.nome} size={36} />
    </header>
  );
}

function Shell({ tela, aoNavegar, celular, escuro, alternarTema, perfil, aoTrocarPerfil, children }) {
  const c = window.CRM;
  const [aberto, setAberto] = React.useState(() => localStorage.getItem(CHAVE_LATERAL) !== "0");
  const [gaveta, setGaveta] = React.useState(false);
  const itens = c.navegacao.filter((n) => n.papeis.includes(perfil));
  const atual = itens.some((i) => i.valor === tela) ? tela : itens[0].valor;
  const titulo = (c.navegacao.find((n) => n.valor === atual) || {}).rotulo || "Início";

  function alternar() {
    setAberto((v) => { localStorage.setItem(CHAVE_LATERAL, v ? "0" : "1"); return !v; });
  }

  return (
    <div style={{ position: "relative", display: "flex", height: "100%", overflow: "hidden", background: "var(--background-light)" }}>
      {celular ? null : <Lateral itens={itens} atual={atual} aoNavegar={aoNavegar} aberto={aberto} alternar={alternar} />}

      {celular && gaveta ? (
        <div onClick={() => setGaveta(false)} style={{ position: "absolute", inset: 0, zIndex: 60, background: "rgba(0,0,0,.6)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ height: "100%", width: 262 }}>
            <Lateral itens={itens} atual={atual} aoNavegar={(v) => { aoNavegar(v); setGaveta(false); }} aberto alternar={() => setGaveta(false)} />
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", flex: 1, minWidth: 0, flexDirection: "column" }}>
        <BarraTopo titulo={titulo} escuro={escuro} alternarTema={alternarTema} perfil={perfil}
          aoTrocarPerfil={aoTrocarPerfil} celular={celular} aoAbrirMenu={() => setGaveta(true)} />
        <main style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: celular ? "16px 14px 20px" : "22px 24px 32px" }}>
          <div style={{ margin: "0 auto", width: "100%", maxWidth: 1180 }}>{children}</div>
        </main>
        {/* Quatro destinos, rótulo inteiro. O resto do menu vem do botão de gaveta na barra de cima. */}
        {celular ? <DS.BottomNav itens={itens.slice(0, 4)} atual={atual} onNavegar={aoNavegar} iconBase={ICO} style={{ flex: "none" }} /> : null}
      </div>
    </div>
  );
}

Object.assign(window, { Shell, Lateral, BarraTopo, ICO });
