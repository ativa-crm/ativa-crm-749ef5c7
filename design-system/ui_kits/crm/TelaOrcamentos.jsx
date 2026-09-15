function TelaOrcamentos() {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  const [filtro, setFiltro] = React.useState("todos");
  const lista = window.DADOS.orcamentos.filter((o) => filtro === "todos" || o.status.toLowerCase() === filtro);
  const total = lista.filter((o) => o.status === "Aprovado").length;
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <window.CabecalhoTela icone="file-text" titulo="Orçamentos" acao={
        <DS.Button style={{ height: 44, padding: "0 18px", fontSize: "var(--texto-md)" }}>
          <DS.Icon name="plus" size={20} color="#fff" base={window.BASE_ICONES} />Novo orçamento
        </DS.Button>} />
      <DS.SegmentedControl valor={filtro} onChange={setFiltro}
        itens={[{ valor: "todos", rotulo: "Todos" }, { valor: "rascunho", rotulo: "Rascunho" }, { valor: "enviado", rotulo: "Enviado" }, { valor: "aprovado", rotulo: "Aprovado" }, { valor: "recusado", rotulo: "Recusado" }]} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
        <DS.StatTile icone="file-text" valor={lista.length} rotulo="Orçamentos no filtro" iconBase={window.BASE_ICONES} />
        <DS.StatTile icone="file-check" valor={total} rotulo="Aprovados" iconBase={window.BASE_ICONES} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lista.map((o) => (
          <DS.ListRow key={o.numero}
            titulo={"Orçamento " + o.numero + " · " + o.cliente}
            linhas={[o.servico + " · enviado em " + o.data]}
            onClick={() => {}}
            direita={<div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <span style={{ fontSize: "var(--texto-lg)", fontWeight: 800, color: "var(--foreground)" }}>{o.valor}</span>
              <DS.Badge variant={o.tom} pill>{o.status}</DS.Badge>
            </div>} />
        ))}
      </div>
    </section>
  );
}
Object.assign(window, { TelaOrcamentos });
