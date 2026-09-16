function TelaContratos() {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  const c = window.CRM;
  const [busca, setBusca] = React.useState("");
  const lista = c.contratos.filter((x) => (x.numero + " " + x.cliente + " " + x.objeto).toLowerCase().includes(busca.trim().toLowerCase()));
  const aVencer = lista.filter((x) => x.vence !== null && x.vence <= 30);
  const semAssinatura = lista.filter((x) => x.assinatura !== "Assinado");

  const colunas = [
    { chave: "numero", rotulo: "Contrato", forte: true },
    { chave: "cliente", rotulo: "Cliente", forte: true, quebrar: true },
    { chave: "objeto", rotulo: "Objeto", quebrar: true },
    { chave: "valor", rotulo: "Valor", alinhar: "right", forte: true },
    { chave: "vigencia", rotulo: "Vigência" },
    { chave: "vence", rotulo: "Vence em", alinhar: "right", render: (l) => l.vence === null ? "—" : <DS.DeadlineBadge dias={l.vence} /> },
    { chave: "assinatura", rotulo: "Assinatura", render: (l) => (
      <DS.Badge variant={l.assinatura === "Assinado" ? "default" : "outline"} pill
        dot={l.assinatura === "Assinado" ? undefined : "var(--ambar)"}>{l.assinatura}</DS.Badge>) },
  ];

  return (
    <div>
      <window.BarraFerramentas busca={busca} aoBuscar={setBusca} placeholder="Buscar por número, cliente ou objeto"
        acao={<DS.Button style={{ height: 44, padding: "0 18px", fontSize: "var(--texto-md)", flex: "none" }}>
          <DS.Icon name="plus" size={20} color="#fff" base={window.ICO} />Novo contrato</DS.Button>} />

      <div className="grade-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12, marginBottom: 14 }}>
        <window.CartaoIndicador icone="file-pen-line" numero={lista.length} rotulo="Contratos" apoio="na carteira" />
        <window.CartaoIndicador icone="clock-3" numero={aVencer.length} rotulo="Vencem em 30 dias" apoio="renovar ou encerrar" tom="atencao" />
        <window.CartaoIndicador icone="triangle-alert" numero={semAssinatura.length} rotulo="Sem assinatura" apoio="serviço parado até assinar" tom="critico" />
      </div>

      {semAssinatura.length > 0 ? (
        <DS.Alert tom="atencao" titulo="Contrato sem assinatura" iconBase={window.ICO} style={{ marginBottom: 14 }}>
          {semAssinatura[0].numero} · {semAssinatura[0].cliente} está aguardando assinatura. A OS correspondente não avança.
        </DS.Alert>
      ) : null}

      <window.Painel titulo="Contratos" icone="file-pen-line">
        <window.Tabela colunas={colunas} linhas={lista} aoClicar={() => {}} />
      </window.Painel>
    </div>
  );
}
Object.assign(window, { TelaContratos });
