// Dados fictícios coerentes entre telas: os mesmos clientes, imóveis e OS se repetem.
window.CRM = {
  empresa: { nome: "Ativa Consultoria", logo: "../../assets/brand/logo-ativa.png" },
  usuario: { nome: "Renato Muzel", papel: "Dono", perfil: "admin" },
  perfis: [
    { valor: "admin", rotulo: "Dono" },
    { valor: "administrativo", rotulo: "Administrativo" },
    { valor: "engenheiro", rotulo: "Eng. responsável" },
  ],
  navegacao: [
    { valor: "inicio", rotulo: "Início", icone: "house", papeis: ["admin", "administrativo", "engenheiro"] },
    { valor: "imoveis", rotulo: "Imóveis", icone: "map-pinned", papeis: ["admin", "administrativo", "engenheiro"] },
    { valor: "clientes", rotulo: "Clientes", icone: "users", papeis: ["admin", "administrativo"] },
    { valor: "funil", rotulo: "Funil", icone: "funnel", papeis: ["admin", "administrativo"] },
    { valor: "servicos", rotulo: "Serviços", icone: "wrench", papeis: ["admin", "administrativo", "engenheiro"] },
    { valor: "orcamentos", rotulo: "Orçamentos", icone: "file-text", papeis: ["admin", "administrativo"] },
    { valor: "medicao", rotulo: "Medição", icone: "route", papeis: ["admin", "engenheiro"] },
    { valor: "contratos", rotulo: "Contratos", icone: "file-pen-line", papeis: ["admin", "administrativo"] },
    { valor: "administracao", rotulo: "Administração", icone: "shield-check", papeis: ["admin"] },
  ],

  // ---- Dashboard ----
  agora: [
    { valor: "leads", icone: "flame", numero: 4, rotulo: "Leads sem resposta", apoio: "o mais antigo há 3 d", tom: "critico", ir: "funil" },
    { valor: "prazos", icone: "triangle-alert", numero: 3, rotulo: "OS vencendo ou vencida", apoio: "1 já vencida", tom: "critico", ir: "servicos" },
    { valor: "decisao", icone: "file-text", numero: 5, rotulo: "Orçamentos em decisão", apoio: "R$ 96.400,00 em jogo", tom: "atencao", ir: "orcamentos" },
    { valor: "contratos", icone: "file-pen-line", numero: 2, rotulo: "Contratos a vencer", apoio: "nos próximos 30 d", tom: "atencao", ir: "contratos" },
  ],
  meta: { mes: "Setembro", realizado: 128400, alvo: 180000, fechados: 6, ticket: 21400 },
  historico: [
    { mes: "abr", valor: 96000 }, { mes: "mai", valor: 142000 }, { mes: "jun", valor: 118000 },
    { mes: "jul", valor: 164000 }, { mes: "ago", valor: 151000 }, { mes: "set", valor: 128400 },
  ],
  pontos: { total: 340, semana: 45, respondidos24h: 9, deTotal: 11, streak: 12 },
  conversao: [
    { estagio: "Novo", total: 18 }, { estagio: "Qualificando", total: 12 },
    { estagio: "Quente", total: 8 }, { estagio: "Orçamento", total: 6 },
    { estagio: "Negociação", total: 4 }, { estagio: "Fechado", total: 3 },
  ],
  execucao: { area: "1.284,3400", imoveis: 11, osAtivas: 14 },
  campoHoje: [
    { nome: "Equipe A · Marcos e Tiago", destino: "Fazenda Santa Rita · Itapeva", estado: "em deslocamento" },
    { nome: "Equipe B · Renatinho", destino: "Gleba São João · Ribeirão Branco", estado: "levantando" },
  ],
  urgentes: [
    { titulo: "Maria Aparecida Souza", apoio: "Georreferenciamento · Itapeva · 88,0000 ha", aviso: "sem resposta há 3 d", tipo: "lead", ir: "funil" },
    { titulo: "OS 0142 · José Ferreira dos Santos", apoio: "Georreferenciamento · Sítio Boa Vista · Itaberá", dias: -4, tipo: "os", ir: "servicos" },
    { titulo: "OS 0147 · Agropecuária Vale Verde", apoio: "Topografia · Fazenda Três Barras · Buri", dias: 1, tipo: "os", ir: "servicos" },
    { titulo: "Orçamento 0233 · Vale Verde", apoio: "R$ 28.400,00 · enviado há 4 d, sem retorno", tipo: "orcamento", ir: "orcamentos" },
  ],

  // ---- Entidades ----
  imoveis: [
    { nome: "Fazenda Santa Rita", municipio: "Itapeva", uf: "SP", tipo: "Rural", area: "142,5000", matricula: "12.884", cliente: "Maria Aparecida Souza", status: "Em campo" },
    { nome: "Fazenda Três Barras", municipio: "Buri", uf: "SP", tipo: "Rural", area: "318,9200", matricula: "31.207", cliente: "Agropecuária Vale Verde", status: "Aguardando documentos" },
    { nome: "Sítio Boa Vista", municipio: "Itaberá", uf: "SP", tipo: "Rural", area: "12,4000", matricula: "8.114", cliente: "José Ferreira dos Santos", status: "Pendência" },
    { nome: "Gleba São João", municipio: "Ribeirão Branco", uf: "SP", tipo: "Rural", area: "56,1000", matricula: "19.442", cliente: "FRI Agro", status: "Em campo" },
    { nome: "Lote 14 · Jardim Europa", municipio: "Itapeva", uf: "SP", tipo: "Urbano", area: "0,0450", matricula: "44.910", cliente: "Carlos Mendes", status: "Documentação" },
    { nome: "Chácara Recanto", municipio: "Buri", uf: "SP", tipo: "Rural", area: "3,8000", matricula: "7.320", cliente: "Carlos Mendes", status: null },
    { nome: "Fazenda Itararé", municipio: "Itararé", uf: "SP", tipo: "Rural", area: "740,0000", matricula: "51.008", cliente: "FRI Agro", status: "Processamento" },
  ],
  clientes: [
    { nome: "Maria Aparecida Souza", fantasia: null, doc: "123.456.789-00", tel: "(15) 99828-8637", tipo: "PF", imoveis: 1, aberto: "R$ 12.950,00", ultimo: "há 3 d" },
    { nome: "Agropecuária Vale Verde Ltda", fantasia: "Vale Verde", doc: "12.345.678/0001-90", tel: "(15) 3522-1180", tipo: "PJ", imoveis: 2, aberto: "R$ 28.400,00", ultimo: "há 4 d" },
    { nome: "José Ferreira dos Santos", fantasia: null, doc: "987.654.321-00", tel: "(15) 99711-2043", tipo: "PF", imoveis: 1, aberto: "R$ 6.300,00", ultimo: "há 1 d" },
    { nome: "Fazendas Reunidas Itararé S/A", fantasia: "FRI Agro", doc: "98.765.432/0001-10", tel: "(15) 3532-4400", tipo: "PJ", imoveis: 2, aberto: "R$ 44.700,00", ultimo: "há 6 h" },
    { nome: "Carlos Mendes", fantasia: null, doc: "456.789.123-00", tel: "(15) 99640-7712", tipo: "PF", imoveis: 2, aberto: "—", ultimo: "há 12 d" },
  ],
  funil: [
    { estagio: "Novo", cartoes: [
      { cliente: "Carlos Mendes", cidade: "Itapeva", area: "24,0000 ha", servico: "CAR", tempo: "há 4 h", nota: "morno", canal: "WhatsApp" },
      { cliente: "Sítio das Palmeiras", cidade: "Buri", area: "9,2000 ha", servico: "Topografia", tempo: "há 1 d", nota: "frio", canal: "Instagram" } ] },
    { estagio: "Qualificando", cartoes: [
      { cliente: "Maria Aparecida Souza", cidade: "Itapeva", area: "88,0000 ha", servico: "Georreferenciamento", tempo: "há 3 d", nota: "quente", canal: "WhatsApp" } ] },
    { estagio: "Quente", cartoes: [
      { cliente: "Agropecuária Vale Verde", cidade: "Taquarivaí", area: "318,9200 ha", servico: "Georreferenciamento", tempo: "há 2 d", nota: "quente", canal: "Indicação" },
      { cliente: "Gleba São João", cidade: "Ribeirão Branco", area: "56,1000 ha", servico: "Desmembramento", tempo: "há 5 d", nota: "morno", canal: "WhatsApp" } ] },
    { estagio: "Orçamento", cartoes: [
      { cliente: "José Ferreira dos Santos", cidade: "Itaberá", area: "12,4000 ha", servico: "Usucapião", tempo: "há 1 d", nota: "morno", canal: "WhatsApp" } ] },
    { estagio: "Negociação", cartoes: [
      { cliente: "FRI Agro", cidade: "Itararé", area: "740,0000 ha", servico: "Georreferenciamento", tempo: "há 6 h", nota: "quente", canal: "Indicação" } ] },
    { estagio: "Fechado", cartoes: [
      { cliente: "Chácara Recanto", cidade: "Buri", area: "3,8000 ha", servico: "Topografia", tempo: "há 12 d", nota: "frio", canal: "WhatsApp" } ] },
  ],
  ordens: [
    { numero: "0151", cliente: "Carlos Mendes", imovel: "Sítio das Palmeiras · Buri", servico: "CAR", status: "Aguardando documentos", dias: 21, prazo: "05/10/2026", etapas: 2, total: 8, responsavel: "Marcos" },
    { numero: "0150", cliente: "FRI Agro", imovel: "Fazenda Itararé · Itararé", servico: "Georreferenciamento", status: "Processamento", dias: 12, prazo: "26/09/2026", etapas: 5, total: 8, responsavel: "Renatinho" },
    { numero: "0148", cliente: "Maria Aparecida Souza", imovel: "Fazenda Santa Rita · Itapeva", servico: "Georreferenciamento", status: "Em campo", dias: 5, prazo: "19/09/2026", etapas: 4, total: 8, responsavel: "Equipe A" },
    { numero: "0147", cliente: "Agropecuária Vale Verde", imovel: "Fazenda Três Barras · Buri", servico: "Topografia", status: "Em campo", dias: 1, prazo: "15/09/2026", etapas: 6, total: 8, responsavel: "Equipe B" },
    { numero: "0146", cliente: "Carlos Mendes", imovel: "Lote 14 · Itapeva", servico: "Desmembramento", status: "Documentação", dias: 9, prazo: "23/09/2026", etapas: 7, total: 8, responsavel: "Tiago" },
    { numero: "0142", cliente: "José Ferreira dos Santos", imovel: "Sítio Boa Vista · Itaberá", servico: "Georreferenciamento", status: "Pendência", dias: -4, prazo: "10/09/2026", etapas: 3, total: 8, responsavel: "Renatinho" },
  ],
  orcamentos: [
    { numero: "0233", cliente: "Agropecuária Vale Verde", servico: "Georreferenciamento", valor: "R$ 28.400,00", status: "Enviado", data: "11/09/2026", espera: "4 d" },
    { numero: "0232", cliente: "Maria Aparecida Souza", servico: "Georreferenciamento", valor: "R$ 12.950,00", status: "Aprovado", data: "08/09/2026", espera: "—" },
    { numero: "0231", cliente: "José Ferreira dos Santos", servico: "Usucapião", valor: "R$ 6.300,00", status: "Recusado", data: "02/09/2026", espera: "—" },
    { numero: "0230", cliente: "Carlos Mendes", servico: "CAR", valor: "R$ 1.850,00", status: "Rascunho", data: "01/09/2026", espera: "—" },
    { numero: "0229", cliente: "FRI Agro", servico: "Topografia", valor: "R$ 44.700,00", status: "Enviado", data: "28/08/2026", espera: "18 d" },
    { numero: "0228", cliente: "Sítio das Palmeiras", servico: "Topografia", valor: "R$ 9.400,00", status: "Enviado", data: "05/09/2026", espera: "10 d" },
  ],
  roteiro: [
    { ordem: 1, os: "0148", imovel: "Fazenda Santa Rita", municipio: "Itapeva", km: 42, equipe: "Equipe A", janela: "07:00 – 11:30", estado: "em deslocamento" },
    { ordem: 2, os: "0147", imovel: "Fazenda Três Barras", municipio: "Buri", km: 68, equipe: "Equipe B", janela: "08:00 – 14:00", estado: "levantando" },
    { ordem: 3, os: "0150", imovel: "Fazenda Itararé", municipio: "Itararé", km: 96, equipe: "Equipe A", janela: "14:00 – 17:30", estado: "planejado" },
  ],
  contratos: [
    { numero: "C-0087", cliente: "Agropecuária Vale Verde", objeto: "Georreferenciamento · 318,9200 ha", valor: "R$ 28.400,00", assinatura: "Assinado", vigencia: "12/09/2026 a 12/12/2026", vence: 88 },
    { numero: "C-0086", cliente: "Maria Aparecida Souza", objeto: "Georreferenciamento · 88,0000 ha", valor: "R$ 12.950,00", assinatura: "Assinado", vigencia: "20/06/2026 a 30/09/2026", vence: 15 },
    { numero: "C-0085", cliente: "FRI Agro", objeto: "Topografia · 740,0000 ha", valor: "R$ 44.700,00", assinatura: "Aguardando assinatura", vigencia: "—", vence: null },
    { numero: "C-0081", cliente: "Carlos Mendes", objeto: "Desmembramento · Lote 14", valor: "R$ 4.200,00", assinatura: "Assinado", vigencia: "01/07/2026 a 28/09/2026", vence: 13 },
  ],
  usuarios: [
    { nome: "Renato Muzel", email: "renato@ativaconsultoria.com.br", papel: "Dono", estado: "Ativo" },
    { nome: "Juliana Prado", email: "juliana@ativaconsultoria.com.br", papel: "Administrativo", estado: "Ativo" },
    { nome: "Marcos Ribeiro", email: "marcos@ativaconsultoria.com.br", papel: "Eng. responsável", estado: "Ativo" },
    { nome: "Tiago Nunes", email: "tiago@ativaconsultoria.com.br", papel: "Técnico de campo", estado: "Convite pendente" },
  ],
  servicosCatalogo: [
    { nome: "Georreferenciamento", base: "R$ 8.500,00 + R$ 42,00/ha", prazo: "45 d", ativo: true },
    { nome: "Levantamento topográfico", base: "R$ 3.200,00 + R$ 28,00/ha", prazo: "20 d", ativo: true },
    { nome: "Desmembramento", base: "R$ 4.200,00", prazo: "30 d", ativo: true },
    { nome: "Usucapião", base: "R$ 6.300,00", prazo: "60 d", ativo: true },
    { nome: "CAR", base: "R$ 1.850,00", prazo: "10 d", ativo: false },
  ],
};
