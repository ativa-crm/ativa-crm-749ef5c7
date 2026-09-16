const ESTADO_ROTEIRO = { "em deslocamento": "var(--ambar)", levantando: "var(--primary)", planejado: "var(--muted)" };

function TelaMedicao() {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  const c = window.CRM;
  const [equipe, setEquipe] = React.useState("todas");
  const lista = c.roteiro.filter((r) => equipe === "todas" || r.equipe === equipe);
  const km = lista.reduce((n, r) => n + r.km, 0);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <DS.SegmentedControl valor={equipe} onChange={setEquipe}
          itens={[{ valor: "todas", rotulo: "Todas" }, { valor: "Equipe A", rotulo: "Equipe A" }, { valor: "Equipe B", rotulo: "Equipe B" }]} />
        <span style={{ flex: "1 1 260px", minWidth: 0, fontFamily: "var(--font-sans)", fontSize: "var(--texto-base)", fontWeight: 600, color: "var(--muted-foreground)" }}>
          Roteiro de 15/09/2026 · {lista.length} paradas · {km} km previstos
        </span>
        <DS.Button variant="outline" size="sm" style={{ flex: "none" }}>
          <DS.Icon name="download" size={16} base={window.ICO} />Exportar roteiro</DS.Button>
        <DS.Button style={{ height: 44, padding: "0 18px", fontSize: "var(--texto-md)", flex: "none" }}>
          <DS.Icon name="plus" size={20} color="#fff" base={window.ICO} />Agendar campo</DS.Button>
      </div>

      <div className="grade-medicao" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
        <window.Painel titulo="Roteiro do dia" icone="route">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {lista.map((r) => (
              <div key={r.os} style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 14,
                border: "1px solid var(--border)", background: "var(--card)", padding: 12 }}>
                <span style={{ display: "flex", height: 40, width: 40, flex: "none", alignItems: "center", justifyContent: "center",
                  borderRadius: 12, background: "var(--secondary)", fontFamily: "var(--font-sans)",
                  fontSize: "var(--texto-lg)", fontWeight: 800, color: "var(--foreground)" }}>{r.ordem}</span>
                <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-sans)" }}>
                  <p style={{ margin: 0, fontSize: "var(--texto-lg)", fontWeight: 700, color: "var(--foreground)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.imovel}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "var(--texto-base)", fontWeight: 600, color: "var(--muted-foreground)" }}>
                    OS #{r.os} · {r.municipio} · {r.km} km · {r.janela}
                  </p>
                </div>
                <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flex: "none" }}>
                  <DS.Badge variant="outline" pill dot={ESTADO_ROTEIRO[r.estado]}>{r.estado}</DS.Badge>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--texto-sm)", fontWeight: 700, color: "var(--muted-foreground)" }}>{r.equipe}</span>
                </span>
              </div>
            ))}
          </div>
        </window.Painel>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <window.Painel titulo="Mapa do roteiro" icone="map-pin">
            <div style={{ height: 240, borderRadius: 12, border: "2px dashed var(--border)", background: "var(--background-light)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 20, textAlign: "center" }}>
              <DS.Icon name="map-pin" size={30} color="var(--muted-foreground)" base={window.ICO} />
              <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: "var(--texto-md)", fontWeight: 700, color: "var(--foreground)" }}>
                Mapa Leaflet do produto
              </p>
              <p style={{ margin: 0, maxWidth: 320, fontFamily: "var(--font-sans)", fontSize: "var(--texto-base)", fontWeight: 500, color: "var(--muted-foreground)" }}>
                Em produção este painel é o <code>mapa-roteiro.tsx</code> com Leaflet e os polígonos importados de KML.
                Não foi recriado aqui para não inventar um desenho que o produto não tem.
              </p>
            </div>
          </window.Painel>

          <window.Painel titulo="Importar dados de campo" icone="upload">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <DS.Alert tom="info" iconBase={window.ICO}>
                Arquivos aceitos: KML, KMZ, CSV de coordenadas e bruto do GNSS. O sistema valida o fechamento do
                polígono antes de anexar à OS.
              </DS.Alert>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <DS.Button variant="outline"><DS.Icon name="upload" size={18} base={window.ICO} />Enviar arquivo</DS.Button>
                <DS.Button variant="ghost"><DS.Icon name="file-check" size={18} base={window.ICO} />Ver validações</DS.Button>
              </div>
            </div>
          </window.Painel>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { TelaMedicao });
