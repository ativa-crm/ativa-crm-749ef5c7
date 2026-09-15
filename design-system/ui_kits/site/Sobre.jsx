const PONTOS = [
  { forte: "Experiência", resto: "e qualificação" },
  { forte: "Tecnologia", resto: "de ponta" },
  { forte: "Atendimento", resto: "personalizado" },
];

function Sobre({ estreito }) {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  return (
    <section id="sobre" style={{ padding: "50px 0" }}>
      <div style={{ width: "min(var(--site-max), calc(100% - 42px))", margin: "auto", display: "grid",
        gridTemplateColumns: estreito ? "1fr" : "280px minmax(0,1fr)", gap: 25, alignItems: "center" }}>
        <div style={{ height: estreito ? 300 : 260, overflow: "hidden", borderRadius: 4 }}>
          <img src="../../assets/imagens/renatinho-01.webp" alt="Profissional da Ativa Consultoria em reunião" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
        <div>
          <DS.SiteSectionHeading kicker="Sobre a Ativa" tamanho={28}>Compromisso com a precisão e com o seu resultado</DS.SiteSectionHeading>
          <p style={{ fontSize: 11, lineHeight: 1.62, color: "#aab0ab", maxWidth: 560, margin: "0 0 10px" }}>
            A Ativa Consultoria nasceu em Itapeva-SP com o propósito de entregar soluções técnicas confiáveis, unindo tecnologia de ponta, experiência de campo e atendimento personalizado.
          </p>
          <p style={{ fontSize: 11, lineHeight: 1.62, color: "#aab0ab", maxWidth: 560, margin: 0 }}>
            Cada projeto é tratado com responsabilidade, ética e foco em resultados que realmente fazem a diferença.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 22, marginTop: 18 }}>
            {PONTOS.map((p) => (
              <div key={p.forte} style={{ fontSize: 9, lineHeight: 1.35, color: "#c6cbc7" }}>
                <strong style={{ display: "block", color: "#fff", fontSize: 10, marginBottom: 3 }}>
                  <span style={{ color: "var(--site-accent)", marginRight: 5 }}>◉</span>{p.forte}
                </strong>
                {p.resto}
              </div>
            ))}
          </div>
          <DS.SiteButton variant="ghost" href="#contato" style={{ marginTop: 18, width: "max-content" }}>Conheça mais sobre nós</DS.SiteButton>
        </div>
      </div>
    </section>
  );
}
Object.assign(window, { Sobre });
