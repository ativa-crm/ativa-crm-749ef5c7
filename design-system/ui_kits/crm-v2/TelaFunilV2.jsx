function TelaFunilV2() {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  const [colunas, setColunas] = React.useState(window.CRM.funil);
  const [aviso, setAviso] = React.useState(null);
  const [nota, setNota] = React.useState("todas");
  const estagios = window.CRM.funil.map((e) => e.estagio);
  const total = colunas.reduce((n, c) => n + c.cartoes.length, 0);

  function mover(deIdx, cartao, para) {
    setColunas((cols) => cols.map((c, i) => {
      if (i === deIdx) return { ...c, cartoes: c.cartoes.filter((x) => x !== cartao) };
      if (c.estagio === para) return { ...c, cartoes: [cartao, ...c.cartoes] };
      return c;
    }));
    setAviso("Movido para " + para);
    setTimeout(() => setAviso(null), 2200);
  }

  return (
    <div style={{ position: "relative" }}>
      {aviso ? <div style={{ position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)", zIndex: 40 }}>
        <DS.Toast tom="sucesso" iconBase={window.ICO}>{aviso}</DS.Toast></div> : null}

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <DS.SegmentedControl valor={nota} onChange={setNota}
          itens={[{ valor: "todas", rotulo: "Todas" }, { valor: "quente", rotulo: "Quentes" }, { valor: "morno", rotulo: "Mornos" }, { valor: "frio", rotulo: "Frios" }]} />
        <span style={{ flex: "1 1 240px", minWidth: 0, fontFamily: "var(--font-sans)", fontSize: "var(--texto-base)", fontWeight: 600, color: "var(--muted-foreground)" }}>
          {total} oportunidades ativas · arraste o cartão ou use o botão mover
        </span>
        <DS.Button style={{ height: 44, padding: "0 18px", fontSize: "var(--texto-md)", flex: "none" }}>
          <DS.Icon name="plus" size={20} color="#fff" base={window.ICO} />Nova oportunidade</DS.Button>
      </div>

      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 14 }}>
        {colunas.map((col, idx) => {
          const cartoes = col.cartoes.filter((x) => nota === "todas" || x.nota === nota);
          return (
            <div key={col.estagio} style={{ width: 280, flex: "none", display: "flex", flexDirection: "column",
              borderRadius: 14, border: "1px solid var(--border)", background: "var(--background-light)", padding: 12 }}>
              <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12, padding: "0 2px" }}>
                <h2 style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: "var(--texto-base)", fontWeight: 800,
                  textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--foreground)" }}>{col.estagio}</h2>
                <span style={{ display: "flex", height: 26, minWidth: 26, padding: "0 8px", alignItems: "center", justifyContent: "center",
                  borderRadius: 999, background: "var(--primary)", color: "var(--primary-foreground)",
                  fontFamily: "var(--font-sans)", fontSize: "var(--texto-sm)", fontWeight: 800 }}>{cartoes.length}</span>
              </header>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {cartoes.map((x) => (
                  <DS.KanbanCard key={x.cliente} cliente={x.cliente} cidade={x.cidade} area={x.area} servico={x.servico}
                    tempo={x.tempo} nota={x.nota}
                    acao={<DS.DropdownMenu
                      gatilho={<span style={{ display: "flex", height: 40, width: 40, alignItems: "center", justifyContent: "center",
                        borderRadius: 12, border: "1px solid var(--border)", color: "var(--foreground)" }}>
                        <DS.Icon name="move-right" size={18} base={window.ICO} /></span>}
                      itens={estagios.filter((e) => e !== col.estagio).map((e) => ({ valor: e, rotulo: e }))}
                      onSelecionar={(v) => mover(idx, x, v)} />} />
                ))}
                {cartoes.length === 0 ? (
                  <p style={{ margin: 0, padding: "22px 4px", textAlign: "center", fontFamily: "var(--font-sans)",
                    fontSize: "var(--texto-base)", fontWeight: 600, color: "var(--muted-foreground)" }}>Nenhum cartão</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
Object.assign(window, { TelaFunilV2 });
