function Hero({ estreito }) {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  return (
    <section id="inicio" style={{ position: "relative", overflow: "hidden", height: 550, minHeight: 550,
      background: 'linear-gradient(90deg,rgba(4,8,5,.84) 0%,rgba(4,8,5,.55) 40%,rgba(4,8,5,.08) 76%), url("../../assets/imagens/campo-02.webp") center 46% / cover' }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg,var(--site-bg) 0%,transparent 17%,transparent 85%,rgba(0,0,0,.18))" }} />
      <div style={{ width: "min(var(--site-max), calc(100% - 42px))", margin: "auto", height: "100%" }}>
        <div style={{ position: "relative", zIndex: 2, paddingTop: estreito ? 120 : 137, width: estreito ? "100%" : 570 }}>
          <div style={{ fontSize: 10, color: "var(--site-accent)", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".14em" }}>
            Ativa Consultoria • Georreferenciamento e Topografia
          </div>
          <h1 style={{ fontSize: estreito ? 36 : 42, lineHeight: 1.06, letterSpacing: "-.045em", margin: "12px 0 17px", maxWidth: 560, fontWeight: 700 }}>
            Precisão que gera<br /><b style={{ color: "var(--site-accent)", fontWeight: 700 }}>segurança e valor</b><br />para o seu projeto.
          </h1>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: "#e1e4e1", maxWidth: 445, margin: 0 }}>
            Soluções completas em Georreferenciamento e Topografia com tecnologia de ponta e equipe especializada.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 23 }}>
            <DS.SiteButton variant="primary" href="#contato">◉ &nbsp;Fale no WhatsApp</DS.SiteButton>
            <DS.SiteButton variant="outline" href="#serviços">Ver Serviços</DS.SiteButton>
          </div>
          <div style={{ marginTop: 21, fontSize: 10, color: "#d3d7d3" }}>
            <span style={{ color: "var(--site-accent)", marginRight: 8 }}>◉</span>Atendimento em Itapeva-SP e região
          </div>
        </div>
      </div>
    </section>
  );
}
Object.assign(window, { Hero });
