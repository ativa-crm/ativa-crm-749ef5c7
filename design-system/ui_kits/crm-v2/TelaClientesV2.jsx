function TelaClientesV2({ aoNavegar }) {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  const c = window.CRM;
  const [busca, setBusca] = React.useState("");
  const [tipo, setTipo] = React.useState("todos");

  const lista = c.clientes.filter((x) => {
    if (tipo !== "todos" && x.tipo.toLowerCase() !== tipo) return false;
    return (x.nome + " " + (x.fantasia || "") + " " + x.doc + " " + x.tel).toLowerCase().includes(busca.trim().toLowerCase());
  });

  const colunas = [
    { chave: "nome", rotulo: "Cliente", forte: true, quebrar: true, render: (l) => (
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <DS.Avatar nome={l.nome} size={32} />
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block" }}>{l.nome}</span>
          {l.fantasia ? <span style={{ display: "block", fontSize: "var(--texto-sm)", fontWeight: 600, color: "var(--muted-foreground)" }}>{l.fantasia}</span> : null}
        </span>
      </span>) },
    { chave: "doc", rotulo: "CPF / CNPJ" },
    { chave: "tel", rotulo: "Telefone" },
    { chave: "imoveis", rotulo: "Imóveis", alinhar: "center", forte: true },
    { chave: "aberto", rotulo: "Em aberto", alinhar: "right", forte: true },
    { chave: "ultimo", rotulo: "Último contato" },
    { chave: "tipo", rotulo: "Tipo", render: (l) => (
      <DS.Badge variant="outline" pill dot={l.tipo === "PJ" ? "var(--primary)" : "var(--muted)"}>
        {l.tipo === "PJ" ? "Pessoa jurídica" : "Pessoa física"}</DS.Badge>) },
  ];

  return (
    <div>
      <window.BarraFerramentas busca={busca} aoBuscar={setBusca} placeholder="Buscar por nome, documento ou telefone"
        filtros={<DS.SegmentedControl valor={tipo} onChange={setTipo}
          itens={[{ valor: "todos", rotulo: "Todos" }, { valor: "pf", rotulo: "Física" }, { valor: "pj", rotulo: "Jurídica" }]} />}
        acao={<DS.Button style={{ height: 44, padding: "0 18px", fontSize: "var(--texto-md)", flex: "none" }}>
          <DS.Icon name="plus" size={20} color="#fff" base={window.ICO} />Novo cliente</DS.Button>} />

      <window.Painel titulo="Carteira de clientes" icone="users"
        acao={<span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--texto-base)", fontWeight: 600, color: "var(--muted-foreground)" }}>
          {lista.length} de {c.clientes.length}</span>}>
        <window.Tabela colunas={colunas} linhas={lista} aoClicar={() => {}} />
      </window.Painel>
    </div>
  );
}
Object.assign(window, { TelaClientesV2 });
