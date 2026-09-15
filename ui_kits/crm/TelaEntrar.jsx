function TelaEntrar({ aoEntrar, celular }) {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  const [erro, setErro] = React.useState(false);
  const d = window.DADOS;
  return (
    <main style={{ display: "grid", gridTemplateColumns: celular ? "minmax(0,1fr)" : "1fr 1fr", minHeight: "100%", overflowY: "auto", background: "var(--background-light)" }}>
      <section style={{ display: celular ? "none" : "flex", alignItems: "center", justifyContent: "center", background: "var(--background)", padding: 48 }}>
        <img src="../../assets/brand/logo-ativa-footer.png" alt="Ativa Consultoria — Georreferenciamento e Topografia" style={{ width: "100%", maxWidth: 380, objectFit: "contain" }} />
      </section>
      <section style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: celular ? "24px 16px" : "40px 40px" }}>
        <div style={{ width: "100%", maxWidth: 420, borderRadius: 22, border: "1px solid var(--border)", background: "var(--card)", padding: celular ? 22 : 36, boxShadow: "var(--card-shadow)" }}>
          <div style={{ marginBottom: 28, textAlign: "center" }}>
            <span style={{ margin: "0 auto 20px", display: "flex", height: 80, width: 160, alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 8, background: "#ffffff", padding: 8, boxShadow: "inset 0 0 0 1px var(--border)" }}>
              <img src={d.empresa.logo} alt="Logo da Ativa Consultoria" style={{ height: "100%", width: "100%", objectFit: "contain" }} />
            </span>
            <h1 style={{ margin: 0, fontSize: "var(--texto-2xl)", fontWeight: 800, lineHeight: 1.2, color: "var(--foreground)" }}>ATIVA CONSULTORIA</h1>
            <p style={{ margin: "4px 0 0", fontSize: "var(--texto-md)", color: "var(--muted-foreground)" }}>Topografia e georreferenciamento</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <DS.Label forte htmlFor="email">E-mail</DS.Label>
              <DS.Input id="email" size="lg" defaultValue="renato@ativaconsultoria.com.br" style={{ marginTop: 8 }} />
            </div>
            <div>
              <DS.Label forte htmlFor="senha">Senha</DS.Label>
              <DS.Input id="senha" size="lg" type="password" defaultValue="123456" style={{ marginTop: 8 }} />
            </div>
            {erro ? <DS.Alert tom="erro" iconBase={window.BASE_ICONES}>E-mail ou senha incorretos. Tente novamente.</DS.Alert> : null}
            <DS.Button fullWidth style={{ height: 56, fontSize: "var(--texto-lg)", fontWeight: 800 }} onClick={aoEntrar}>Entrar</DS.Button>
          </div>
          <p style={{ margin: "24px 0 0", textAlign: "center", fontSize: "var(--texto-base)", fontWeight: 500, color: "var(--muted-foreground)" }}>
            O acesso é criado pelo administrador da sua empresa.
          </p>
        </div>
      </section>
    </main>
  );
}
Object.assign(window, { TelaEntrar });
