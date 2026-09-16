const TOM_ORC = { Rascunho: "outline", Enviado: "secondary", Aprovado: "default", Recusado: "destructive" };

function TelaOrcamentosV2() {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  const c = window.CRM;
  const [busca, setBusca] = React.useState("");
  const [filtro, setFiltro] = React.useState("todos");

  const lista = c.orcamentos.filter((o) => {
    if (filtro !== "todos" && o.status.toLowerCase() !== filtro) return false;
    return (o.numero + " " + o.cliente + " " + o.servico).toLowerCase().includes(busca.trim().toLowerCase());
  });
  const soma = (arr) => arr.reduce((n, o) => n + Number(o.valor.replace(/[^\d,]/g, "").replace(",", ".")), 0);
  const emDecisao = lista.filter((o) => o.status === "Enviado");

  const colunas = [
    { chave: "numero", rotulo: "Nº", forte: true, render: (l) => "#" + l.numero },
    { chave: "cliente", rotulo: "Cliente", forte: true, quebrar: true },
    { chave: "servico", rotulo: "Serviço" },
    { chave: "data", rotulo: "Enviado em" },
    { chave: "espera", rotulo: "Esperando", render: (l) => l.espera === "—" ? "—" : (
      <DS.Badge variant="outline" pill dot={parseInt(l.espera) > 7 ? "var(--destructive)" : "var(--ambar)"}>{l.espera}</DS.Badge>) },
    { chave: "valor", rotulo: "Valor", alinhar: "right", forte: true },
    { chave: "status", rotulo: "Situação", render: (l) => <DS.Badge variant={TOM_ORC[l.status]} pill>{l.status}</DS.Badge> },
  ];

  return (
    <div>
      <window.BarraFerramentas busca={busca} aoBuscar={setBusca} placeholder="Buscar por número, cliente ou serviço"
        filtros={<DS.SegmentedControl valor={filtro} onChange={setFiltro}
          itens={[{ valor: "todos", rotulo: "Todos" }, { valor: "rascunho", rotulo: "Rascunho" }, { valor: "enviado", rotulo: "Enviado" }, { valor: "aprovado", rotulo: "Aprovado" }, { valor: "recusado", rotulo: "Recusado" }]} />}
        acao={<DS.Button style={{ height: 44, padding: "0 18px", fontSize: "var(--texto-md)", flex: "none" }}>
          <DS.Icon name="plus" size={20} color="#fff" base={window.ICO} />Novo orçamento</DS.Button>} />

      <div className="grade-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12, marginBottom: 14 }}>
        <window.CartaoIndicador icone="file-text" numero={emDecisao.length} rotulo="Aguardando decisão" apoio={window.moeda(soma(emDecisao)) + " em jogo"} tom="atencao" />
        <window.CartaoIndicador icone="file-check" numero={lista.filter((o) => o.status === "Aprovado").length} rotulo="Aprovados" apoio="viram contrato e OS" />
        <window.CartaoIndicador icone="clock-3" numero={Math.max(...c.orcamentos.map((o) => parseInt(o.espera) || 0))} rotulo="Dias de espera do mais antigo" apoio="orçamento #0229 · FRI Agro" tom="critico" />
      </div>

      <window.Painel titulo="Orçamentos" icone="file-text"
        acao={<span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--texto-base)", fontWeight: 700, color: "var(--foreground)" }}>
          {window.moeda(soma(lista))}<span style={{ fontWeight: 600, color: "var(--muted-foreground)" }}> no filtro</span></span>}>
        <window.Tabela colunas={colunas} linhas={lista} aoClicar={() => {}} />
      </window.Painel>
    </div>
  );
}
Object.assign(window, { TelaOrcamentosV2 });
