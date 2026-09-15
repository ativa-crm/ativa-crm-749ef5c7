const SERVICOS = [
  { glifo: "⌖", titulo: <>Georreferenciamento<br />de Imóveis Rurais</>, descricao: "Regularize seu imóvel rural com segurança e dentro das exigências do INCRA." },
  { glifo: "◈", titulo: <>Levantamentos<br />Topográficos</>, descricao: "Levantamentos planialtimétricos e altimétricos com alta precisão e agilidade." },
  { glifo: "⌘", titulo: <>Desmembramento<br />e Remembramento</>, descricao: "Projetos técnicos para dividir e unificar áreas com total conformidade." },
  { glifo: "▣", titulo: <>Usucapião<br />Administrativo e Judicial</>, descricao: "Plantas e memoriais técnicos para processos de usucapião." },
  { glifo: "▧", titulo: "Outros Serviços", descricao: "CAR, retificações, locações, assistência técnica e muito mais." },
];

function Servicos({ estreito }) {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  return (
    <section id="serviços" style={{ padding: "50px 0", background: "var(--site-bg-alt)" }}>
      <div style={{ width: "min(var(--site-max), calc(100% - 42px))", margin: "auto", display: "grid",
        gridTemplateColumns: estreito ? "minmax(0,1fr)" : "minmax(0,1fr) 390px", gap: 24, alignItems: "center" }}>
        <div style={{ minWidth: 0 }}>
          <DS.SiteSectionHeading kicker="O que fazemos">Soluções técnicas para<br />todas as etapas do seu projeto</DS.SiteSectionHeading>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 6, marginTop: 23, overflowX: estreito ? "auto" : "visible" }}>
            {SERVICOS.map((s, i) => <DS.ServiceCard key={i} glifo={s.glifo} titulo={s.titulo} descricao={s.descricao} style={{ minWidth: estreito ? 120 : 0 }} />)}
          </div>
          <DS.SiteButton variant="ghost" href="#contato" style={{ display: "flex", width: "max-content", margin: "18px auto 0" }}>Ver todos os serviços</DS.SiteButton>
        </div>
        <div style={{ height: 320, borderRadius: 4, overflow: "hidden" }}>
          <img src="../../assets/imagens/equipe-topografia-servicos.png" alt="Equipe da Ativa Consultoria realizando levantamento topográfico em campo"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      </div>
    </section>
  );
}
Object.assign(window, { Servicos });
