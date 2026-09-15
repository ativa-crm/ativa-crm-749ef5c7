function CabecalhoTela({ icone, titulo, acao }) {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  return (
    <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <h1 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontSize: "var(--texto-2xl)", fontWeight: 700, color: "var(--foreground)" }}>
        <DS.Icon name={icone} size={24} color="var(--primary)" base={window.BASE_ICONES} />
        {titulo}
      </h1>
      {acao}
    </header>
  );
}

function CampoBusca({ placeholder, valor, aoMudar }) {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  return (
    <div style={{ position: "relative" }}>
      <DS.Icon name="search" size={20} color="var(--muted-foreground)" base={window.BASE_ICONES} style={{ position: "absolute", left: 16, top: 12, pointerEvents: "none" }} />
      <DS.Input size="md" pill placeholder={placeholder} value={valor} onChange={(e) => aoMudar(e.target.value)} style={{ paddingLeft: 44 }} />
    </div>
  );
}

function TelaImoveis() {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  const [busca, setBusca] = React.useState("");
  const [tipo, setTipo] = React.useState("todos");
  const [cidade, setCidade] = React.useState("todas");
  const lista = window.DADOS.imoveis.filter((i) => {
    if (tipo !== "todos" && i.tipo.toLowerCase() !== tipo) return false;
    if (cidade !== "todas" && i.municipio !== cidade) return false;
    const alvo = (i.nome + " " + i.municipio).toLowerCase();
    return alvo.includes(busca.trim().toLowerCase());
  });
  const cidades = [...new Set(window.DADOS.imoveis.map((i) => i.municipio))].sort();
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <CabecalhoTela icone="map-pinned" titulo="Imóveis" acao={
        <DS.Button style={{ height: 44, padding: "0 18px", fontSize: "var(--texto-md)" }}>
          <DS.Icon name="plus" size={20} color="#fff" base={window.BASE_ICONES} />Novo imóvel
        </DS.Button>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <CampoBusca placeholder="Buscar por nome, município ou matrícula" valor={busca} aoMudar={setBusca} />
        <DS.SegmentedControl valor={tipo} onChange={setTipo} itens={[{ valor: "todos", rotulo: "Todos" }, { valor: "rural", rotulo: "Rural" }, { valor: "urbano", rotulo: "Urbano" }]} />
        <DS.NativeSelect pill value={cidade} onChange={(e) => setCidade(e.target.value)}>
          <option value="todas">Todas as cidades</option>
          {cidades.map((c) => <option key={c} value={c}>{c}</option>)}
        </DS.NativeSelect>
      </div>
      {lista.length === 0 ? (
        <p style={{ fontSize: "var(--texto-lg)", fontWeight: 500, color: "var(--muted-foreground)" }}>Nenhum imóvel encontrado com esses filtros.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {lista.map((i) => (
            <DS.ListRow
              key={i.nome}
              titulo={i.nome}
              linhas={[i.municipio + " · " + i.uf + " · " + i.tipo, i.area]}
              onClick={() => {}}
              direita={<DS.Badge variant="outline" pill dot={i.status ? "var(--primary)" : "var(--muted)"}>{i.status || "Sem serviço"}</DS.Badge>}
            />
          ))}
        </div>
      )}
    </section>
  );
}
Object.assign(window, { TelaImoveis, CabecalhoTela, CampoBusca });
