function TelaServicos() {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  const [busca, setBusca] = React.useState("");
  const [nova, setNova] = React.useState(false);
  const grupos = window.DADOS.ordens.map((g) => ({
    ...g,
    itens: g.itens.filter((o) => (o.numero + " " + o.cliente + " " + o.imovel + " " + o.servico).toLowerCase().includes(busca.trim().toLowerCase())),
  })).filter((g) => g.itens.length > 0);

  return (
    <section style={{ position: "relative", display: "flex", flexDirection: "column", gap: 16 }}>
      <window.CabecalhoTela icone="wrench" titulo="Serviços" acao={
        <DS.Button style={{ height: 44, padding: "0 18px", fontSize: "var(--texto-md)" }} onClick={() => setNova(true)}>
          <DS.Icon name="plus" size={20} color="#fff" base={window.BASE_ICONES} />Nova OS
        </DS.Button>} />
      <window.CampoBusca placeholder="Buscar por número, cliente, imóvel ou serviço" valor={busca} aoMudar={setBusca} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {grupos.map((g) => (
          <div key={g.status}>
            <h2 style={{ margin: "0 0 8px", display: "flex", alignItems: "center", gap: 8, fontSize: "var(--texto-xl)", fontWeight: 800, color: "var(--foreground)" }}>
              {g.status}
              <span style={{ borderRadius: 10, background: "var(--secondary)", padding: "2px 8px", fontSize: "var(--texto-md)", fontWeight: 800, color: "var(--muted-foreground)" }}>{g.itens.length}</span>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {g.itens.map((o) => (
                <DS.ListRow key={o.numero}
                  titulo={"OS " + o.numero + " · " + o.cliente}
                  linhas={[o.imovel]}
                  onClick={() => {}}
                  direita={<div style={{ textAlign: "right" }}>
                    <DS.DeadlineBadge dias={o.dias} />
                    <p style={{ margin: "4px 0 0", fontSize: "var(--texto-base)", fontWeight: 700, color: "var(--muted-foreground)" }}>{o.prazo}</p>
                  </div>}
                  style={{ border: "2px solid var(--border)" }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <DS.Dialog aberto={nova} titulo="Nova ordem de serviço" onFechar={() => setNova(false)} iconBase={window.BASE_ICONES}
        rodape={<DS.Button fullWidth style={{ height: 56, fontSize: "var(--texto-lg)", fontWeight: 800 }} onClick={() => setNova(false)}>Criar OS</DS.Button>}>
        <div><DS.Label forte>Cliente</DS.Label>
          <DS.NativeSelect size="lg" style={{ marginTop: 6, borderWidth: 2 }}>
            <option>Escolha o cliente</option>
            {window.DADOS.clientes.map((c) => <option key={c.nome}>{c.nome}</option>)}
          </DS.NativeSelect></div>
        <div><DS.Label forte>Imóvel</DS.Label>
          <DS.NativeSelect size="lg" style={{ marginTop: 6, borderWidth: 2 }}>
            <option>Escolha o cliente primeiro</option>
          </DS.NativeSelect></div>
        <div><DS.Label forte>Serviço</DS.Label>
          <DS.NativeSelect size="lg" style={{ marginTop: 6, borderWidth: 2 }}>
            <option>Georreferenciamento</option><option>Topografia</option><option>Usucapião</option><option>CAR</option><option>Desmembramento</option>
          </DS.NativeSelect></div>
        <div><DS.Label forte>Prazo</DS.Label>
          <DS.Input size="lg" type="date" defaultValue="2026-10-05" style={{ marginTop: 6, borderWidth: 2 }} /></div>
      </DS.Dialog>
    </section>
  );
}
Object.assign(window, { TelaServicos });
