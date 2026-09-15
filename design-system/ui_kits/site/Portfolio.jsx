function Portfolio({ estreito }) {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  return (
    <section id="portfólio" style={{ padding: "50px 0" }}>
      <div style={{ width: "min(var(--site-max), calc(100% - 42px))", margin: "auto", display: "grid",
        gridTemplateColumns: estreito ? "1fr" : "minmax(0,1fr) 340px", gap: 38, alignItems: "center" }}>
        <div>
          <DS.SiteSectionHeading kicker="Nossos trabalhos" tamanho={estreito ? 36 : 48} sublinhado>
            Precisão que você pode ver em <span style={{ color: "var(--site-accent)" }}>cada detalhe</span>
          </DS.SiteSectionHeading>
          <p style={{ fontSize: 12, lineHeight: 1.6, color: "#aab0ab", maxWidth: 390, margin: "0 0 24px" }}>
            Atuamos em diversos tipos de terrenos e desafios, sempre com o mesmo compromisso: entregar qualidade.
          </p>
          <DS.SiteButton variant="ghost" href="#contato" style={{ width: "max-content" }}>Ver mais projetos</DS.SiteButton>
        </div>
        <div style={{ height: 270, borderRadius: 4, overflow: "hidden", background: "#050505", position: "relative" }}>
          <img src="../../assets/imagens/campo-03.webp" alt="Levantamento em campo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <span style={{ position: "absolute", left: 10, bottom: 10, borderRadius: 999, background: "rgba(0,0,0,.66)", border: "1px solid var(--site-border)", padding: "6px 11px", fontSize: 8, color: "#c0c7c1" }}>
            No site original este bloco é um vídeo em moldura de iPhone (assets/video-ativa.mp4, não incluído aqui)
          </span>
        </div>
      </div>
    </section>
  );
}
Object.assign(window, { Portfolio });
