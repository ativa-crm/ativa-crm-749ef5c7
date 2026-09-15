const LINKS = ["Início", "Serviços", "Sobre", "Portfólio", "Equipamentos", "Contato"];

function Redonda({ src, rotulo, tipo }) {
  const [h, setH] = React.useState(false);
  return (
    <a href="#contato" aria-label={rotulo} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width: 43, height: 43, borderRadius: "50%", display: "grid", placeItems: "center", flex: "none",
        background: tipo === "wa" ? "#25D366" : "linear-gradient(135deg,#f9ce34 0%,#ee2a7b 48%,#6228d7 100%)",
        transform: h ? "translateY(-3px) scale(1.04)" : "none", boxShadow: h ? "0 10px 24px rgba(0,0,0,.28)" : "none",
        transition: "transform 280ms ease, box-shadow 280ms ease" }}>
      <img src={src} alt="" aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "contain" }} />
    </a>
  );
}

function Cabecalho({ atual, aoNavegar, estreito }) {
  return (
    <header style={{ position: "sticky", zIndex: 50, top: 0, height: estreito ? 68 : 78, background: "rgba(5,8,6,.62)", backdropFilter: "blur(13px)", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
      <div style={{ width: "min(var(--site-max), calc(100% - 42px))", margin: "auto", height: "100%", display: "flex", alignItems: "center", gap: 30 }}>
        <a href="#inicio" onClick={() => aoNavegar("Início")} style={{ width: estreito ? 145 : 172, flex: "none" }}>
          <img src="../../assets/brand/logo-ativa-footer.png" alt="Ativa Consultoria" style={{ width: "100%", display: "block" }} />
        </a>
        {estreito ? (
          <button aria-label="Abrir menu" style={{ marginLeft: "auto", border: 0, background: "none", color: "#fff", fontSize: 23, cursor: "pointer" }}>☰</button>
        ) : (
          <nav style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 28, fontSize: 12, fontWeight: 600 }}>
            {LINKS.map((l) => (
              <a key={l} href={"#" + l.toLowerCase()} onClick={() => aoNavegar(l)}
                style={{ color: atual === l ? "var(--site-accent)" : "#dfe3df", textDecoration: "none", transition: "color 280ms ease" }}>{l}</a>
            ))}
            <div style={{ display: "flex", gap: 10, marginLeft: 12 }}>
              <Redonda src="../../assets/brand/whatsapp-brand.png" rotulo="WhatsApp" tipo="wa" />
              <Redonda src="../../assets/brand/instagram-brand.png" rotulo="Instagram" tipo="ig" />
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
Object.assign(window, { Cabecalho, Redonda });
