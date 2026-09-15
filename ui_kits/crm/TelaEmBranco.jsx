function TelaEmBranco({ titulo }) {
  const DS = window.AtivaConsultoriaDesignSystem_f6c44d;
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ margin: 0, fontSize: "var(--texto-2xl)", fontWeight: 700, color: "var(--foreground)" }}>{titulo}</h1>
      <DS.Alert tom="info" iconBase={window.BASE_ICONES} titulo="Tela não recriada neste kit">
        Esta rota existe no CRM (medição, contratos e administração), mas não foi recriada aqui — o kit cobre os fluxos
        de captação e execução. Consulte o repositório para o desenho original.
      </DS.Alert>
    </section>
  );
}
Object.assign(window, { TelaEmBranco });
