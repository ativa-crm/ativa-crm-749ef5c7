const DSW = window.AtivaConsultoriaDesignSystem_f6c44d;

// `cor` pinta o ícone e a borda; `tinta` pinta o número — o âmbar puro não passa
// em contraste sobre cartão branco, então o tema claro usa --ambar-tinta.
const TONS = {
  critico: { cor: "var(--destructive)", tinta: "var(--destructive)", fundo: "color-mix(in srgb, var(--destructive) 8%, transparent)" },
  atencao: { cor: "var(--ambar)", tinta: "var(--ambar-tinta)", fundo: "color-mix(in srgb, var(--ambar) 14%, transparent)" },
  neutro: { cor: "var(--primary)", tinta: "var(--primary)", fundo: "color-mix(in srgb, var(--primary) 8%, transparent)" },
};

/** Cola as duas últimas palavras com espaço rígido — nenhuma linha termina em órfã. */
function semOrfao(texto) {
  if (typeof texto !== "string") return texto;
  const i = texto.lastIndexOf(" ");
  return i === -1 ? texto : texto.slice(0, i) + "\u00a0" + texto.slice(i + 1);
}

/** Cartão de indicador acionável do painel. O tom vira a cor da borda e do ícone. */
function CartaoIndicador({ icone, numero, rotulo, apoio, tom = "neutro", onClick }) {
  const [hover, setHover] = React.useState(false);
  const t = TONS[tom] || TONS.neutro;
  return (
    <button type="button" onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, minHeight: 116, width: "100%",
        borderRadius: 14, border: "1px solid " + (hover ? t.cor : "var(--border)"), background: "var(--card)",
        padding: "14px 16px", textAlign: "left", cursor: "pointer", boxShadow: "var(--card-shadow)",
        transform: hover ? "translateY(-2px)" : "none", transition: "all 180ms ease", fontFamily: "var(--font-sans)" }}>
      <span style={{ display: "flex", height: 30, width: 30, alignItems: "center", justifyContent: "center",
        borderRadius: 9, background: t.fundo }}>
        <DSW.Icon name={icone} size={18} color={t.cor} base={window.ICO} />
      </span>
      <span style={{ fontSize: "var(--texto-3xl)", fontWeight: 800, lineHeight: 1, color: t.tinta }}>{numero}</span>
      <span style={{ fontSize: "var(--texto-base)", fontWeight: 700, lineHeight: 1.2, color: "var(--foreground)" }}>{rotulo}</span>
      {apoio ? <span style={{ fontSize: "var(--texto-sm)", fontWeight: 600, lineHeight: 1.35, textWrap: "pretty", color: "var(--muted-foreground)" }}>{semOrfao(apoio)}</span> : null}
    </button>
  );
}

/** Anel de meta em conic-gradient — sem SVG, sem biblioteca. */
function AnelMeta({ percentual, tamanho = 132, children }) {
  const p = Math.max(0, Math.min(100, percentual));
  return (
    <div style={{ position: "relative", width: tamanho, height: tamanho, flex: "none", borderRadius: "50%",
      background: "conic-gradient(var(--primary) " + p * 3.6 + "deg, var(--secondary) 0deg)",
      transition: "background 400ms ease" }}>
      <div style={{ position: "absolute", inset: 11, borderRadius: "50%", background: "var(--card)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
        fontFamily: "var(--font-sans)" }}>{children}</div>
    </div>
  );
}

/** Barras verticais de histórico. A última barra é destacada. */
function Barras({ dados, alvo, altura = 96 }) {
  const max = Math.max(...dados.map((d) => d.valor), alvo || 0);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: altura }}>
      {dados.map((d, i) => {
        const ultimo = i === dados.length - 1;
        return (
          <div key={d.mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}
            title={d.mes + ": R$ " + d.valor.toLocaleString("pt-BR")}>
            <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
              <div style={{ width: "100%", height: (d.valor / max) * 100 + "%", borderRadius: "6px 6px 2px 2px",
                background: ultimo ? "var(--primary)" : "color-mix(in srgb, var(--primary) 28%, transparent)",
                transition: "height 400ms ease" }} />
            </div>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--texto-sm)", fontWeight: 700,
              color: ultimo ? "var(--foreground)" : "var(--muted-foreground)" }}>{d.mes}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Funil horizontal: uma barra por estágio, largura proporcional. */
function BarrasFunil({ dados }) {
  const max = Math.max(...dados.map((d) => d.total));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {dados.map((d) => (
        <div key={d.estagio} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-sans)" }}>
          <span style={{ width: 104, flex: "none", fontSize: "var(--texto-sm)", fontWeight: 700, textTransform: "uppercase",
            color: "var(--muted-foreground)" }}>{d.estagio}</span>
          <div style={{ flex: 1, height: 22, borderRadius: 6, background: "var(--secondary)", overflow: "hidden" }}>
            <div style={{ width: (d.total / max) * 100 + "%", height: "100%", borderRadius: 6,
              background: "var(--primary)", transition: "width 400ms ease" }} />
          </div>
          <span style={{ width: 28, flex: "none", textAlign: "right", fontSize: "var(--texto-base)", fontWeight: 800,
            color: "var(--foreground)" }}>{d.total}</span>
        </div>
      ))}
    </div>
  );
}

/** Painel padrão das telas: título em caixa alta, ação à direita, corpo livre. */
function Painel({ titulo, icone, acao, children, style }) {
  return (
    <section style={{ borderRadius: 14, border: "1px solid var(--border)", background: "var(--card)",
      boxShadow: "var(--card-shadow)", ...style }}>
      {titulo ? (
        <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10,
          padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ margin: 0, flex: "1 1 auto", minWidth: 0, display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)",
            fontSize: "var(--texto-lg)", fontWeight: 700, textTransform: "uppercase", lineHeight: 1.25, color: "var(--foreground)" }}>
            {icone ? <DSW.Icon name={icone} size={20} color="var(--primary)" base={window.ICO} /> : null}
            {titulo}
          </h2>
          {acao}
        </header>
      ) : null}
      <div style={{ padding: 16 }}>{children}</div>
    </section>
  );
}

/** Tabela densa com rolagem horizontal no celular. Nunca some coluna sem aviso. */
function Tabela({ colunas, linhas, aoClicar }) {
  const [hover, setHover] = React.useState(-1);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse", fontFamily: "var(--font-sans)" }}>
        <thead>
          <tr>
            {colunas.map((c) => (
              <th key={c.chave} style={{ padding: "0 12px 10px", textAlign: c.alinhar || "left",
                fontSize: "var(--texto-sm)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em",
                color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{c.rotulo}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={i} onClick={() => aoClicar && aoClicar(l)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(-1)}
              style={{ background: hover === i ? "var(--accent)" : "transparent", cursor: aoClicar ? "pointer" : "default",
                transition: "background-color 140ms ease" }}>
              {colunas.map((c) => (
                <td key={c.chave} style={{ padding: "12px", borderTop: "1px solid var(--border)",
                  textAlign: c.alinhar || "left", fontSize: "var(--texto-base)", fontWeight: c.forte ? 700 : 500,
                  color: c.forte ? "var(--foreground)" : "var(--muted-foreground)", whiteSpace: c.quebrar ? "normal" : "nowrap" }}>
                  {c.render ? c.render(l) : l[c.chave]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {linhas.length === 0 ? (
        <p style={{ margin: 0, padding: "28px 12px", textAlign: "center", fontFamily: "var(--font-sans)",
          fontSize: "var(--texto-md)", fontWeight: 600, color: "var(--muted-foreground)" }}>Nada aqui com esses filtros.</p>
      ) : null}
    </div>
  );
}

/** Barra de ações de topo de tela: busca + filtros + botão primário. */
function BarraFerramentas({ busca, aoBuscar, placeholder, filtros, acao }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ position: "relative", flex: "1 1 260px", minWidth: 0 }}>
        <DSW.Icon name="search" size={20} color="var(--muted-foreground)" base={window.ICO}
          style={{ position: "absolute", left: 16, top: 12, pointerEvents: "none" }} />
        <DSW.Input size="md" pill placeholder={placeholder} value={busca}
          onChange={(e) => aoBuscar(e.target.value)} style={{ paddingLeft: 44 }} />
      </div>
      {filtros}
      {acao}
    </div>
  );
}

Object.assign(window, { CartaoIndicador, semOrfao, AnelMeta, Barras, BarrasFunil, Painel, Tabela, BarraFerramentas });
