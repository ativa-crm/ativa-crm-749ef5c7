function TelaClientes() {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  const [busca, setBusca] = React.useState("");
  const lista = window.DADOS.clientes.filter((c) => (c.nome + " " + (c.fantasia || "")).toLowerCase().includes(busca.trim().toLowerCase()));
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <window.CabecalhoTela icone="users" titulo="Clientes" acao={
        <DS.Button style={{ height: 44, padding: "0 18px", fontSize: "var(--texto-md)" }}>
          <DS.Icon name="plus" size={20} color="#fff" base={window.BASE_ICONES} />Novo cliente
        </DS.Button>} />
      <window.CampoBusca placeholder="Buscar por nome, documento ou telefone" valor={busca} aoMudar={setBusca} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lista.map((c) => (
          <DS.ListRow key={c.nome} titulo={c.nome}
            linhas={[c.fantasia, c.doc, c.tel].filter(Boolean)}
            onClick={() => {}}
            direita={<DS.Badge variant="outline" pill dot={c.tipo === "Pessoa jurídica" ? "var(--primary)" : "var(--muted)"}>{c.tipo}</DS.Badge>} />
        ))}
      </div>
    </section>
  );
}
Object.assign(window, { TelaClientes });
