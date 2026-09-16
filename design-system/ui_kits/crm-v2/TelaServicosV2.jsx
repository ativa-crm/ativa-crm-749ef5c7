function TelaServicosV2() {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  const c = window.CRM;
  const [busca, setBusca] = React.useState("");
  const [vista, setVista] = React.useState("lista");
  const [nova, setNova] = React.useState(false);

  const lista = c.ordens.filter((o) => (o.numero + " " + o.cliente + " " + o.imovel + " " + o.servico + " " + o.status)
    .toLowerCase().includes(busca.trim().toLowerCase()));
  const statuses = [...new Set(c.ordens.map((o) => o.status))];

  const colunas = [
    { chave: "numero", rotulo: "OS", forte: true, render: (l) => "#" + l.numero },
    { chave: "cliente", rotulo: "Cliente", forte: true, quebrar: true },
    { chave: "imovel", rotulo: "Imóvel", quebrar: true },
    { chave: "servico", rotulo: "Serviço" },
    { chave: "status", rotulo: "Etapa", render: (l) => <DS.Badge variant="outline" pill dot="var(--primary)">{l.status}</DS.Badge> },
    { chave: "etapas", rotulo: "Progresso", render: (l) => (
      <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 130 }}>
        <DS.Progress valor={Math.round((l.etapas / l.total) * 100)} altura={8} style={{ width: 80 }} />
        <span style={{ fontSize: "var(--texto-sm)", fontWeight: 700, color: "var(--muted-foreground)" }}>{l.etapas}/{l.total}</span>
      </span>) },
    { chave: "responsavel", rotulo: "Responsável" },
    { chave: "prazo", rotulo: "Prazo", alinhar: "right", render: (l) => (
      <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <DS.DeadlineBadge dias={l.dias} />
        <span style={{ fontSize: "var(--texto-sm)", fontWeight: 700, color: "var(--muted-foreground)" }}>{l.prazo}</span>
      </span>) },
  ];

  return (
    <div style={{ position: "relative" }}>
      <window.BarraFerramentas busca={busca} aoBuscar={setBusca} placeholder="Buscar por número, cliente, imóvel ou serviço"
        filtros={<DS.SegmentedControl valor={vista} onChange={setVista}
          itens={[{ valor: "lista", rotulo: "Lista" }, { valor: "etapa", rotulo: "Por etapa" }]} />}
        acao={<DS.Button style={{ height: 44, padding: "0 18px", fontSize: "var(--texto-md)", flex: "none" }} onClick={() => setNova(true)}>
          <DS.Icon name="plus" size={20} color="#fff" base={window.ICO} />Nova OS</DS.Button>} />

      <div className="grade-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: 14 }}>
        <window.CartaoIndicador icone="wrench" numero={lista.length} rotulo="OS no filtro" apoio={"de " + c.ordens.length + " abertas"} />
        <window.CartaoIndicador icone="triangle-alert" numero={lista.filter((o) => o.dias < 0).length} rotulo="Vencidas" apoio="precisam de ação hoje" tom="critico" />
        <window.CartaoIndicador icone="clock-3" numero={lista.filter((o) => o.dias >= 0 && o.dias <= 7).length} rotulo="Vencem em 7 dias" apoio="atenção ao prazo" tom="atencao" />
        <window.CartaoIndicador icone="map-pinned" numero={lista.filter((o) => o.status === "Em campo").length} rotulo="Em campo" apoio="equipes trabalhando" />
      </div>

      {vista === "lista" ? (
        <window.Painel titulo="Ordens de serviço" icone="wrench">
          <window.Tabela colunas={colunas} linhas={lista} aoClicar={() => {}} />
        </window.Painel>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {statuses.map((s) => {
            const itens = lista.filter((o) => o.status === s);
            if (itens.length === 0) return null;
            return (
              <window.Painel key={s} titulo={s} icone="clipboard-list"
                acao={<DS.Badge variant="secondary" pill>{itens.length}</DS.Badge>}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {itens.map((o) => (
                    <DS.ListRow key={o.numero} alerta={o.dias < 0} titulo={"OS #" + o.numero + " · " + o.cliente}
                      linhas={[o.imovel, o.servico + " · " + o.responsavel]} onClick={() => {}}
                      direita={<span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                        <DS.DeadlineBadge dias={o.dias} />
                        <DS.Progress valor={Math.round((o.etapas / o.total) * 100)} altura={6} style={{ width: 90 }} />
                      </span>} />
                  ))}
                </div>
              </window.Painel>
            );
          })}
        </div>
      )}

      <DS.Dialog aberto={nova} titulo="Nova ordem de serviço" onFechar={() => setNova(false)} iconBase={window.ICO}
        rodape={<DS.Button fullWidth style={{ height: 56, fontSize: "var(--texto-lg)", fontWeight: 800 }} onClick={() => setNova(false)}>Criar OS</DS.Button>}>
        <div><DS.Label forte>Cliente</DS.Label>
          <DS.NativeSelect size="lg" style={{ marginTop: 6 }}>
            <option>Escolha o cliente</option>{c.clientes.map((x) => <option key={x.nome}>{x.nome}</option>)}
          </DS.NativeSelect></div>
        <div><DS.Label forte>Imóvel</DS.Label>
          <DS.NativeSelect size="lg" style={{ marginTop: 6 }}>
            <option>Escolha o cliente primeiro</option>
          </DS.NativeSelect></div>
        <div><DS.Label forte>Serviço</DS.Label>
          <DS.NativeSelect size="lg" style={{ marginTop: 6 }}>
            {c.servicosCatalogo.map((s) => <option key={s.nome}>{s.nome}</option>)}
          </DS.NativeSelect></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><DS.Label forte>Prazo</DS.Label><DS.Input size="lg" type="date" defaultValue="2026-10-05" style={{ marginTop: 6 }} /></div>
          <div><DS.Label forte>Responsável</DS.Label>
            <DS.NativeSelect size="lg" style={{ marginTop: 6 }}>
              <option>Equipe A</option><option>Equipe B</option><option>Renatinho</option>
            </DS.NativeSelect></div>
        </div>
      </DS.Dialog>
    </div>
  );
}
Object.assign(window, { TelaServicosV2 });
