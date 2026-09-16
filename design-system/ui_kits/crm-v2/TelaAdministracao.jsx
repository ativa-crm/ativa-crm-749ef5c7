function TelaAdministracao() {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  const c = window.CRM;
  const [aba, setAba] = React.useState("usuarios");

  const colUsuarios = [
    { chave: "nome", rotulo: "Nome", forte: true, render: (l) => (
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}><DS.Avatar nome={l.nome} size={32} />{l.nome}</span>) },
    { chave: "email", rotulo: "E-mail" },
    { chave: "papel", rotulo: "Papel" },
    { chave: "estado", rotulo: "Situação", render: (l) => (
      <DS.Badge variant="outline" pill dot={l.estado === "Ativo" ? "var(--primary)" : "var(--ambar)"}>{l.estado}</DS.Badge>) },
  ];
  const colServicos = [
    { chave: "nome", rotulo: "Serviço", forte: true },
    { chave: "base", rotulo: "Preço base" },
    { chave: "prazo", rotulo: "Prazo padrão", alinhar: "center" },
    { chave: "ativo", rotulo: "Situação", render: (l) => (
      <DS.Badge variant="outline" pill dot={l.ativo ? "var(--primary)" : "var(--muted)"}>{l.ativo ? "Ativo" : "Desativado"}</DS.Badge>) },
  ];

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <DS.Tabs valor={aba} onChange={setAba}
          itens={[{ valor: "usuarios", rotulo: "Usuários" }, { valor: "servicos", rotulo: "Serviços" }, { valor: "empresa", rotulo: "Empresa" }]} />
        <span style={{ flex: 1 }} />
        {aba === "usuarios" ? (
          <DS.Button style={{ height: 44, padding: "0 18px", fontSize: "var(--texto-md)", flex: "none" }}>
            <DS.Icon name="plus" size={20} color="#fff" base={window.ICO} />Convidar usuário</DS.Button>
        ) : null}
      </div>

      {aba === "usuarios" ? (
        <window.Painel titulo="Usuários e permissões" icone="users">
          <window.Tabela colunas={colUsuarios} linhas={c.usuarios} aoClicar={() => {}} />
          <DS.Alert tom="info" iconBase={window.ICO} style={{ marginTop: 14 }}>
            O papel define quais itens aparecem no menu. Troque o perfil na barra de cima para ver o efeito.
          </DS.Alert>
        </window.Painel>
      ) : null}

      {aba === "servicos" ? (
        <window.Painel titulo="Catálogo de serviços" icone="wrench"
          acao={<DS.Button variant="outline" size="sm"><DS.Icon name="plus" size={16} base={window.ICO} />Novo serviço</DS.Button>}>
          <window.Tabela colunas={colServicos} linhas={c.servicosCatalogo} aoClicar={() => {}} />
        </window.Painel>
      ) : null}

      {aba === "empresa" ? (
        <div className="grade-medicao" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
          <window.Painel titulo="Dados da empresa" icone="shield-check">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><DS.Label forte>Razão social</DS.Label><DS.Input size="md" defaultValue="Ativa Consultoria Ltda" style={{ marginTop: 6 }} /></div>
              <div><DS.Label forte>CNPJ</DS.Label><DS.Input size="md" defaultValue="12.345.678/0001-90" style={{ marginTop: 6 }} /></div>
              <div><DS.Label forte>Cidade base</DS.Label><DS.Input size="md" defaultValue="Itapeva · SP" style={{ marginTop: 6 }} /></div>
              <div><DS.Label forte>WhatsApp de atendimento</DS.Label><DS.Input size="md" defaultValue="(15) 99828-8637" style={{ marginTop: 6 }} /></div>
              <DS.Button style={{ height: 44, alignSelf: "flex-start", padding: "0 20px" }}>Salvar</DS.Button>
            </div>
          </window.Painel>
          <window.Painel titulo="Metas e gamificação" icone="flame">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><DS.Label forte>Meta mensal de faturamento</DS.Label><DS.Input size="md" defaultValue="R$ 180.000,00" style={{ marginTop: 6 }} /></div>
              <div><DS.Label forte>Pontos por lead respondido em 24 h</DS.Label><DS.Input size="md" type="number" defaultValue="5" style={{ marginTop: 6 }} /></div>
              <DS.Switch checked label="Mostrar pontos na barra superior" onChange={() => {}} />
              <DS.Switch checked label="Avisar quando um lead passar de 12 h sem resposta" onChange={() => {}} />
              <DS.Alert tom="info" iconBase={window.ICO}>
                A gamificação é de time, não individual: o placar mede a resposta ao cliente, nunca o ranking entre pessoas.
              </DS.Alert>
            </div>
          </window.Painel>
        </div>
      ) : null}
    </div>
  );
}
Object.assign(window, { TelaAdministracao });
