const CARACTERISTICAS = [
  { b: "⌖ GNSS RTK", s: "alta precisão" },
  { b: "♧ Coleta rápida", s: "e confiável" },
  { b: "◉ Dados seguros", s: "e rastreáveis" },
  { b: "◇ Softwares", s: "atualizados" },
];
const SPEC_DRONE = [
  { titulo: '20 MP · sensor 1"', detalhe: "captura em alta resolução" },
  { titulo: "Obturador mecânico", detalhe: "sem distorção em voo" },
  { titulo: "Até 30 min de voo", detalhe: "maior área por bateria" },
  { titulo: "GPS + GLONASS", detalhe: "navegação estável" },
  { titulo: "Voo autônomo", detalhe: "linhas e sobreposição planejadas" },
  { titulo: "Sensores de obstáculo", detalhe: "segurança na operação" },
];
const CHIPS = ["Resolução de 2 a 5 cm por pixel", "Curvas de nível e modelo do terreno", "Cálculo de área e volume", "Base para memorial e projeto", "Entrega em GeoTIFF, DWG ou PDF"];

function Equipamentos({ estreito }) {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  const wrap = { width: "min(var(--site-max), calc(100% - 42px))", margin: "auto" };
  return (
    <section id="equipamentos" style={{ padding: "50px 0", background: "var(--site-bg-alt)" }}>
      <div style={{ ...wrap, display: "grid", gridTemplateColumns: estreito ? "1fr" : "1fr 260px 1fr", gap: 32, alignItems: "center" }}>
        <div>
          <DS.SiteSectionHeading kicker="Tecnologia que garante resultados">Equipamentos modernos<br />para máxima precisão</DS.SiteSectionHeading>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "#aab0ab", margin: "0 0 16px" }}>
            Trabalhamos com equipamentos GNSS de alta performance, softwares atualizados e metodologias reconhecidas para entregar dados precisos e confiáveis.
          </p>
          <DS.SiteButton variant="ghost" href="#contato" style={{ width: "max-content" }}>Ver equipamentos</DS.SiteButton>
        </div>
        <div style={{ height: estreito ? 260 : 180, borderRadius: 4, overflow: "hidden" }}>
          <img src="../../assets/imagens/campo-04.webp" alt="Equipamento GNSS em campo" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {CARACTERISTICAS.map((c) => (
            <div key={c.b} style={{ borderTop: "1px solid var(--site-border)", paddingTop: 8 }}>
              <b style={{ display: "block", fontSize: 14, color: "#fff" }}>{c.b}</b>
              <span style={{ fontSize: 10, color: "#98a099" }}>{c.s}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...wrap, display: "grid", gridTemplateColumns: estreito ? "1fr" : "1fr 1fr", gap: 14, marginTop: 26 }}>
        <DS.SpecCard tag="Aeronave" titulo="DJI Phantom 4 Pro">
          <img src="../../assets/imagens/drone-phantom4.webp" alt="Drone DJI Phantom 4 Pro utilizado nos levantamentos" style={{ width: 120, marginBottom: 12 }} />
          <p style={{ fontSize: 9.5, lineHeight: 1.6, color: "#aab0ab", margin: 0 }}>
            Sensor de 1 polegada com 20 megapixels e obturador mecânico. É esse obturador que evita a distorção das imagens capturadas em movimento e mantém a geometria do voo confiável — condição para que o resultado sirva a trabalho técnico, e não apenas a uma foto bonita da área.
          </p>
          <DS.SpecGrid itens={SPEC_DRONE} />
        </DS.SpecCard>

        <DS.SpecCard tag="Produto final" titulo="Ortomosaico georreferenciado">
          <p style={{ fontSize: 9.5, lineHeight: 1.6, color: "#aab0ab", margin: "0 0 12px" }}>
            Centenas de fotos aéreas são corrigidas e costuradas em uma única imagem em escala, na qual cada ponto tem coordenada. Diferente de uma foto comum, sobre o ortomosaico é possível medir distâncias, calcular áreas e traçar limites com precisão centimétrica quando o voo é apoiado por pontos de controle levantados com GNSS RTK.
          </p>
          <div style={{ height: 210, borderRadius: 4, overflow: "hidden" }}>
            <img src="../../assets/imagens/ortomosaico-exemplo.webp" alt="Ortomosaico com curvas de nível e divisão de lotes" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
          <span style={{ display: "block", marginTop: 8, fontSize: 7.4, color: "#98a099" }}>Parcelamento de solo sobre ortomosaico, com curvas de nível e limites de lote</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {CHIPS.map((c) => <DS.Chip key={c}>{c}</DS.Chip>)}
          </div>
        </DS.SpecCard>
      </div>
    </section>
  );
}
Object.assign(window, { Equipamentos });
