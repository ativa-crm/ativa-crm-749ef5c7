function moeda(v) { return "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2 }); }

function TelaInicioV2({ aoNavegar }) {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  const c = window.CRM;
  const pct = Math.round((c.meta.realizado / c.meta.alvo) * 100);
  const falta = c.meta.alvo - c.meta.realizado;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="grade-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }}>
        {c.agora.map((a) => (
          <window.CartaoIndicador key={a.valor} icone={a.icone} numero={a.numero} rotulo={a.rotulo}
            apoio={a.apoio} tom={a.tom} onClick={() => aoNavegar(a.ir)} />
        ))}
      </div>

      <div className="grade-meta" style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 12, alignItems: "stretch" }}>
        <window.Painel titulo={"Faturamento · " + c.meta.mes} icone="file-check"
          acao={<DS.Badge variant="outline" pill dot={pct >= 100 ? "var(--primary)" : "var(--ambar)"}>{pct + "% da meta"}</DS.Badge>}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20 }}>
            <window.AnelMeta percentual={pct}>
              <span style={{ fontSize: "var(--texto-2xl)", fontWeight: 800, color: "var(--primary)", lineHeight: 1 }}>{pct}%</span>
              <span style={{ fontSize: "var(--texto-sm)", fontWeight: 700, textTransform: "uppercase", color: "var(--muted-foreground)" }}>da meta</span>
            </window.AnelMeta>
            <div style={{ flex: "1 1 190px", minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: "var(--texto-2xl)", fontWeight: 800, color: "var(--foreground)" }}>{moeda(c.meta.realizado)}</p>
                <p style={{ margin: "2px 0 0", fontFamily: "var(--font-sans)", fontSize: "var(--texto-base)", fontWeight: 600, color: "var(--muted-foreground)" }}>
                  de {moeda(c.meta.alvo)} · faltam {moeda(falta)}
                </p>
              </div>
              <DS.Progress valor={pct} altura={10} />
              <div style={{ display: "flex", gap: 18, fontFamily: "var(--font-sans)" }}>
                <span style={{ fontSize: "var(--texto-base)", fontWeight: 700, color: "var(--foreground)" }}>
                  {c.meta.fechados}<span style={{ fontWeight: 600, color: "var(--muted-foreground)" }}> contratos fechados</span>
                </span>
                <span style={{ fontSize: "var(--texto-base)", fontWeight: 700, color: "var(--foreground)" }}>
                  {moeda(c.meta.ticket)}<span style={{ fontWeight: 600, color: "var(--muted-foreground)" }}> ticket médio</span>
                </span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <window.Barras dados={c.historico} alvo={c.meta.alvo} />
          </div>
        </window.Painel>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <window.Painel titulo="Resposta rápida" icone="flame"
            acao={<DS.Badge pill>{c.pontos.streak + " dias seguidos"}</DS.Badge>}>
            <p style={{ margin: "0 0 10px", fontFamily: "var(--font-sans)", fontSize: "var(--texto-base)", fontWeight: 600, color: "var(--muted-foreground)" }}>
              {c.pontos.respondidos24h} de {c.pontos.deTotal} leads da semana respondidos em menos de 24 h.
            </p>
            <DS.Progress valor={Math.round((c.pontos.respondidos24h / c.pontos.deTotal) * 100)} altura={10} />
            <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", gap: 8, fontFamily: "var(--font-sans)" }}>
              <span style={{ fontSize: "var(--texto-3xl)", fontWeight: 800, color: "var(--primary)", lineHeight: 1 }}>+{c.pontos.semana}</span>
              <span style={{ fontSize: "var(--texto-base)", fontWeight: 700, color: "var(--muted-foreground)" }}>pontos esta semana · {c.pontos.total} no total</span>
            </div>
          </window.Painel>

          <window.Painel titulo="Em execução" icone="map-pinned" style={{ flex: 1 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 18, fontFamily: "var(--font-sans)" }}>
              <div>
                <p style={{ margin: 0, fontSize: "var(--texto-2xl)", fontWeight: 800, color: "var(--foreground)" }}>{c.execucao.area}<span style={{ fontSize: "var(--texto-md)", color: "var(--muted-foreground)" }}> ha</span></p>
                <p style={{ margin: 0, fontSize: "var(--texto-sm)", fontWeight: 700, textTransform: "uppercase", color: "var(--muted-foreground)" }}>área total</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "var(--texto-2xl)", fontWeight: 800, color: "var(--foreground)" }}>{c.execucao.osAtivas}</p>
                <p style={{ margin: 0, fontSize: "var(--texto-sm)", fontWeight: 700, textTransform: "uppercase", color: "var(--muted-foreground)" }}>OS ativas</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "var(--texto-2xl)", fontWeight: 800, color: "var(--foreground)" }}>{c.execucao.imoveis}</p>
                <p style={{ margin: 0, fontSize: "var(--texto-sm)", fontWeight: 700, textTransform: "uppercase", color: "var(--muted-foreground)" }}>imóveis</p>
              </div>
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: "var(--texto-sm)", fontWeight: 700, textTransform: "uppercase", color: "var(--muted-foreground)" }}>Equipe em campo hoje</p>
              {c.campoHoje.map((e) => (
                <div key={e.nome} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontFamily: "var(--font-sans)" }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "var(--texto-base)", fontWeight: 700, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.nome}</p>
                    <p style={{ margin: 0, fontSize: "var(--texto-sm)", fontWeight: 600, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.destino}</p>
                  </div>
                  <DS.Badge variant="outline" pill dot="var(--primary)" style={{ flex: "none" }}>{e.estado}</DS.Badge>
                </div>
              ))}
            </div>
          </window.Painel>
        </div>
      </div>

      <div className="grade-meta" style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 12, alignItems: "start" }}>
        <window.Painel titulo="Precisam de você agora" icone="triangle-alert">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {c.urgentes.map((u, i) => (
              <DS.ListRow key={i} alerta={u.tipo !== "orcamento"} titulo={u.titulo} linhas={[u.apoio]}
                onClick={() => aoNavegar(u.ir)}
                direita={u.tipo === "os"
                  ? <DS.DeadlineBadge dias={u.dias} />
                  : <DS.Badge variant="outline" pill dot="var(--destructive)">{u.aviso || "aguardando retorno"}</DS.Badge>} />
            ))}
          </div>
        </window.Painel>

        <window.Painel titulo="Conversão do funil" icone="funnel"
          acao={<DS.Button variant="ghost" size="sm" onClick={() => aoNavegar("funil")}>Abrir funil</DS.Button>}>
          <window.BarrasFunil dados={c.conversao} />
          <p style={{ margin: "14px 0 0", paddingTop: 12, borderTop: "1px solid var(--border)", fontFamily: "var(--font-sans)",
            fontSize: "var(--texto-base)", fontWeight: 600, color: "var(--muted-foreground)" }}>
            De 18 leads novos, <strong style={{ color: "var(--foreground)" }}>3 fecharam</strong> — 17% de conversão no mês.
          </p>
        </window.Painel>
      </div>
    </div>
  );
}
Object.assign(window, { TelaInicioV2, moeda });
