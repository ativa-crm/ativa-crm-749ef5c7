function TelaFunil() {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  const [colunas, setColunas] = React.useState(window.DADOS.funil);
  const [aviso, setAviso] = React.useState(null);
  const total = colunas.reduce((n, c) => n + c.cartoes.length, 0);

  function mover(deIdx, cartao, paraRotulo) {
    setColunas((cols) => cols.map((c, i) => {
      if (i === deIdx) return { ...c, cartoes: c.cartoes.filter((x) => x !== cartao) };
      if (c.estagio === paraRotulo) return { ...c, cartoes: [cartao, ...c.cartoes] };
      return c;
    }));
    setAviso("Movido para " + paraRotulo);
    setTimeout(() => setAviso(null), 2200);
  }

  return (
    <section style={{ position: "relative", display: "flex", flexDirection: "column", gap: 16 }}>
      <header>
        <h1 style={{ margin: 0, fontSize: "var(--texto-2xl)", fontWeight: 800, textTransform: "uppercase", color: "var(--foreground)" }}>Funil</h1>
        <p style={{ margin: "2px 0 0", fontSize: "var(--texto-md)", fontWeight: 600, color: "var(--muted-foreground)" }}>
          {total} oportunidades ativas · arraste ou use “mover para”
        </p>
      </header>
      {aviso ? <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", zIndex: 30 }}><DS.Toast tom="sucesso" iconBase={window.BASE_ICONES}>{aviso}</DS.Toast></div> : null}
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12 }}>
        {colunas.map((col, idx) => (
          <div key={col.estagio} style={{ width: 272, flex: "none", borderRadius: 18, border: "1px solid var(--border)", background: "var(--background-light)", padding: 12 }}>
            <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "0 4px", marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: "var(--texto-lg)", fontWeight: 700, textTransform: "uppercase", color: "var(--foreground)" }}>{col.estagio}</h2>
              <span style={{ display: "flex", height: 32, width: 32, alignItems: "center", justifyContent: "center", borderRadius: 999, background: "var(--primary)", color: "var(--primary-foreground)", fontSize: "var(--texto-base)", fontWeight: 800 }}>{col.cartoes.length}</span>
            </header>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {col.cartoes.map((c) => (
                <DS.KanbanCard key={c.cliente} cliente={c.cliente} cidade={c.cidade} area={c.area} servico={c.servico} tempo={c.tempo} nota={c.nota}
                  acao={<DS.DropdownMenu
                    gatilho={<span style={{ display: "flex", height: 44, width: 44, alignItems: "center", justifyContent: "center", borderRadius: 12, border: "2px solid var(--border)", color: "var(--foreground)" }}><DS.Icon name="move-right" size={20} base={window.BASE_ICONES} /></span>}
                    itens={window.DADOS.funil.filter((e) => e.estagio !== col.estagio).map((e) => ({ valor: e.estagio, rotulo: e.estagio }))}
                    onSelecionar={(v) => mover(idx, c, v)} />} />
              ))}
              {col.cartoes.length === 0 ? (
                <p style={{ margin: 0, padding: "24px 4px", textAlign: "center", fontSize: "var(--texto-md)", fontWeight: 600, color: "var(--muted-foreground)" }}>Nenhum cartão aqui</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
Object.assign(window, { TelaFunil });
