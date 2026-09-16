function TelaImoveisV2({ aoNavegar }) {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  const c = window.CRM;
  const [busca, setBusca] = React.useState("");
  const [tipo, setTipo] = React.useState("todos");
  const [cidade, setCidade] = React.useState("todas");
  const cidades = [...new Set(c.imoveis.map((i) => i.municipio))].sort();

  const lista = c.imoveis.filter((i) => {
    if (tipo !== "todos" && i.tipo.toLowerCase() !== tipo) return false;
    if (cidade !== "todas" && i.municipio !== cidade) return false;
    return (i.nome + " " + i.municipio + " " + i.matricula + " " + i.cliente).toLowerCase().includes(busca.trim().toLowerCase());
  });

  const colunas = [
    { chave: "nome", rotulo: "Imóvel", forte: true, quebrar: true },
    { chave: "local", rotulo: "Município", render: (l) => l.municipio + " · " + l.uf },
    { chave: "tipo", rotulo: "Tipo" },
    { chave: "area", rotulo: "Área (ha)", alinhar: "right", forte: true },
    { chave: "matricula", rotulo: "Matrícula" },
    { chave: "cliente", rotulo: "Cliente", quebrar: true },
    { chave: "status", rotulo: "Situação", render: (l) => (
      <DS.Badge variant="outline" pill dot={l.status ? "var(--primary)" : "var(--muted)"}>{l.status || "Sem serviço"}</DS.Badge>) },
  ];

  return (
    <div>
      <window.BarraFerramentas busca={busca} aoBuscar={setBusca} placeholder="Buscar por imóvel, município, matrícula ou cliente"
        filtros={<React.Fragment>
          <DS.SegmentedControl valor={tipo} onChange={setTipo}
            itens={[{ valor: "todos", rotulo: "Todos" }, { valor: "rural", rotulo: "Rural" }, { valor: "urbano", rotulo: "Urbano" }]} />
          <DS.NativeSelect pill value={cidade} onChange={(e) => setCidade(e.target.value)} style={{ width: 190, flex: "none" }}>
            <option value="todas">Todas as cidades</option>
            {cidades.map((x) => <option key={x} value={x}>{x}</option>)}
          </DS.NativeSelect>
        </React.Fragment>}
        acao={<DS.Button style={{ height: 44, padding: "0 18px", fontSize: "var(--texto-md)", flex: "none" }}>
          <DS.Icon name="plus" size={20} color="#fff" base={window.ICO} />Novo imóvel</DS.Button>} />

      <div className="grade-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12, marginBottom: 14 }}>
        <window.CartaoIndicador icone="map-pinned" numero={lista.length} rotulo="Imóveis no filtro" apoio={"de " + c.imoveis.length + " cadastrados"} />
        <window.CartaoIndicador icone="route" numero={lista.reduce((n, i) => n + parseFloat(i.area.replace(/\./g, "").replace(",", ".")), 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} rotulo="Hectares somados" apoio="área do filtro atual" />
        <window.CartaoIndicador icone="wrench" numero={lista.filter((i) => i.status).length} rotulo="Com serviço ativo" apoio="clique para ver as OS" tom="atencao" onClick={() => aoNavegar("servicos")} />
      </div>

      <window.Painel titulo="Imóveis" icone="map-pinned"
        acao={<DS.Button variant="outline" size="sm"><DS.Icon name="download" size={16} base={window.ICO} />Exportar KML</DS.Button>}>
        <window.Tabela colunas={colunas} linhas={lista} aoClicar={() => {}} />
      </window.Painel>
    </div>
  );
}
Object.assign(window, { TelaImoveisV2 });
