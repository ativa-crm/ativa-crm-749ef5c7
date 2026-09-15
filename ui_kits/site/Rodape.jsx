const COLUNAS = [
  { titulo: "LINKS RÁPIDOS", itens: ["Início", "Serviços", "Sobre", "Portfólio", "Equipamentos", "Contato"] },
  { titulo: "SERVIÇOS", itens: ["Georreferenciamento", "Levantamentos Topográficos", "Desmembramento", "Usucapião", "Outros Serviços"] },
];

function Contato({ estreito }) {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  return (
    <section id="contato" style={{ minHeight: 145, padding: "28px 0", display: "flex", alignItems: "center", borderTop: "1px solid var(--site-border)",
      background: 'linear-gradient(90deg,rgba(8,11,8,.82),rgba(8,11,8,.28)), url("../../assets/imagens/campo-03.webp") center / cover' }}>
      <div style={{ width: "min(var(--site-max), calc(100% - 42px))", margin: "auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 25, lineHeight: 1.15, fontWeight: 800, letterSpacing: "-.03em" }}>Vamos conversar sobre o seu projeto?</h2>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#d3d7d3" }}>Fale agora mesmo pelo WhatsApp e receba um atendimento rápido e personalizado.</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <DS.SiteButton variant="whatsapp" tamanho="cta" icone="../../assets/brand/whatsapp-brand.png">Falar no WhatsApp</DS.SiteButton>
          <DS.SiteButton variant="outline" tamanho="cta" icone="../../assets/brand/instagram-brand.png">Ver no Instagram</DS.SiteButton>
        </div>
      </div>
    </section>
  );
}

function Rodape({ estreito }) {
  return (
    <footer style={{ background: "var(--site-rodape)", padding: "42px 0 16px", borderTop: "1px solid rgba(105,213,0,.14)" }}>
      <div style={{ width: "min(var(--site-max), calc(100% - 42px))", margin: "auto", display: "grid",
        gridTemplateColumns: estreito ? "1fr" : "190px 1fr 1fr 1fr", gap: 35 }}>
        <div><img src="../../assets/brand/logo-ativa-footer.png" alt="Ativa Consultoria" style={{ width: 140, display: "block" }} /></div>
        {COLUNAS.map((c) => (
          <div key={c.titulo}>
            <h4 style={{ margin: "0 0 10px", fontSize: 11, letterSpacing: ".06em" }}>{c.titulo}</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {c.itens.map((i) => <a key={i} href={"#" + i.toLowerCase()} style={{ fontSize: 10.5, color: "#a9afaa", textDecoration: "none" }}>{i}</a>)}
            </div>
          </div>
        ))}
        <div>
          <h4 style={{ margin: "0 0 10px", fontSize: 11, letterSpacing: ".06em" }}>CONTATO</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 10.5, color: "#a9afaa" }}>
            <p style={{ margin: 0 }}>◉ +55 15 99828-8637</p>
            <p style={{ margin: 0 }}>✉ contato@ativaconsultoria.com.br</p>
            <p style={{ margin: 0 }}>⌖ Itapeva-SP e Região</p>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <window.Redonda src="../../assets/brand/whatsapp-brand.png" rotulo="WhatsApp" tipo="wa" />
            <window.Redonda src="../../assets/brand/instagram-brand.png" rotulo="Instagram" tipo="ig" />
          </div>
        </div>
      </div>
      <div style={{ width: "min(var(--site-max), calc(100% - 42px))", margin: "24px auto 0", paddingTop: 12, borderTop: "1px solid var(--site-border)", fontSize: 9.5, color: "#7e857f" }}>
        © 2026 Ativa Consultoria. Todos os direitos reservados.
      </div>
    </footer>
  );
}
Object.assign(window, { Contato, Rodape });
