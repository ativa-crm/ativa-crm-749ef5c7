function TelaInicio({ aoNavegar }) {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  const d = window.DADOS;
  const B = window.BASE_ICONES;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <h1 style={{ margin: 0, fontSize: "var(--texto-2xl)", fontWeight: 700, letterSpacing: "0.01em", color: "var(--foreground)" }}>Início</h1>

      <section>
        <DS.SectionHeading icone="triangle-alert" corIcone="var(--destructive)" iconBase={B} style={{ marginBottom: 12 }}>
          Precisam de você agora
        </DS.SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {d.urgentes.map((u, i) => (
            <DS.ListRow
              key={i}
              alerta
              titulo={u.cliente}
              linhas={[u.detalhe]}
              onClick={() => aoNavegar(u.tipo === "lead" ? "funil" : "servicos")}
              direita={u.tipo === "lead"
                ? <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--texto-base)", fontWeight: 700, color: "var(--destructive)" }}>
                    <DS.Icon name="flame" size={22} color="var(--destructive)" base={B} />{u.aviso}
                  </span>
                : <DS.DeadlineBadge dias={u.dias} />}
              style={{ minHeight: 80 }}
            />
          ))}
        </div>
      </section>

      <section>
        <DS.SectionHeading style={{ marginBottom: 12 }}>Em andamento</DS.SectionHeading>
        <div className="grade-kpi" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12 }}>
          {d.andamento.map((s) => (
            <DS.StatTile key={s.valor} icone={s.icone} valor={s.total} rotulo={s.rotulo} iconBase={B} onClick={() => aoNavegar("servicos")} />
          ))}
        </div>
      </section>

      <section>
        <DS.SectionHeading style={{ marginBottom: 12 }}>Este mês</DS.SectionHeading>
        <div className="grade-kpi" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12 }}>
          {d.mes.map((s) => (
            <DS.StatTile key={s.rotulo} icone={s.icone} valor={s.valor} rotulo={s.rotulo} iconBase={B} onClick={() => aoNavegar("orcamentos")} />
          ))}
        </div>
      </section>
    </div>
  );
}
Object.assign(window, { TelaInicio });
