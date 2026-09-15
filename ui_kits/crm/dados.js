// Dados fictícios em português do Brasil, no formato que o CRM usa de verdade.
window.DADOS = {
  empresa: { nome: "Ativa Consultoria", logo: "../../assets/brand/logo-ativa.png" },
  usuario: { nome: "Renato Muzel", papel: "admin" },
  navegacao: [
    { valor: "inicio", rotulo: "Início", icone: "house" },
    { valor: "imoveis", rotulo: "Imóveis", icone: "map-pinned" },
    { valor: "clientes", rotulo: "Clientes", icone: "users" },
    { valor: "funil", rotulo: "Funil", icone: "funnel" },
    { valor: "servicos", rotulo: "Serviços", icone: "wrench" },
    { valor: "orcamentos", rotulo: "Orçamentos", icone: "file-text" },
    { valor: "medicao", rotulo: "Medição", icone: "route" },
    { valor: "contratos", rotulo: "Contratos", icone: "file-pen-line" },
    { valor: "administracao", rotulo: "Administração", icone: "shield-check" },
  ],
  urgentes: [
    { tipo: "lead", cliente: "Maria Aparecida Souza", detalhe: "Georreferenciamento · Itapeva · 88,0000 ha", aviso: "sem contato há 3 d" },
    { tipo: "lead", cliente: "Sítio Boa Vista", detalhe: "Usucapião · Itaberá · 12,4000 ha", aviso: "sem contato há 2 d" },
    { tipo: "os", cliente: "OS 0142 · José Ferreira", detalhe: "Georreferenciamento · Itaberá", dias: -4 },
    { tipo: "os", cliente: "OS 0147 · Agropecuária Vale Verde", detalhe: "Topografia · Buri", dias: 1 },
  ],
  andamento: [
    { valor: "aguardando_documentos", rotulo: "Aguardando documentos", icone: "file-text", total: 6 },
    { valor: "aguardando_campo", rotulo: "Aguardando campo", icone: "clock-3", total: 4 },
    { valor: "em_campo", rotulo: "Em campo", icone: "map-pinned", total: 3 },
    { valor: "processamento", rotulo: "Processamento", icone: "settings-2", total: 5 },
    { valor: "documentacao", rotulo: "Documentação", icone: "clipboard-list", total: 2 },
    { valor: "pendencia", rotulo: "Pendência", icone: "triangle-alert", total: 1 },
  ],
  mes: [
    { icone: "flame", valor: 18, rotulo: "Leads recebidos" },
    { icone: "file-text", valor: 11, rotulo: "Orçamentos enviados" },
    { icone: "file-check", valor: 6, rotulo: "Orçamentos aprovados" },
  ],
  imoveis: [
    { nome: "Fazenda Santa Rita", municipio: "Itapeva", uf: "SP", tipo: "Rural", area: "142,5000 ha", status: "Em campo" },
    { nome: "Sítio Boa Vista", municipio: "Itaberá", uf: "SP", tipo: "Rural", area: "12,4000 ha", status: "Processamento" },
    { nome: "Chácara Recanto", municipio: "Buri", uf: "SP", tipo: "Rural", area: "3,8000 ha", status: null },
    { nome: "Lote 14 · Jardim Europa", municipio: "Itapeva", uf: "SP", tipo: "Urbano", area: "0,0450 ha", status: "Documentação" },
    { nome: "Fazenda Três Barras", municipio: "Taquarivaí", uf: "SP", tipo: "Rural", area: "318,9200 ha", status: "Aguardando documentos" },
    { nome: "Gleba São João", municipio: "Ribeirão Branco", uf: "SP", tipo: "Rural", area: "56,1000 ha", status: null },
  ],
  clientes: [
    { nome: "Maria Aparecida Souza", fantasia: null, doc: "123.456.789-00", tel: "(15) 99828-8637", tipo: "Pessoa física" },
    { nome: "Agropecuária Vale Verde Ltda", fantasia: "Vale Verde", doc: "12.345.678/0001-90", tel: "(15) 3522-1180", tipo: "Pessoa jurídica" },
    { nome: "José Ferreira dos Santos", fantasia: null, doc: "987.654.321-00", tel: "(15) 99711-2043", tipo: "Pessoa física" },
    { nome: "Fazendas Reunidas Itararé S/A", fantasia: "FRI Agro", doc: "98.765.432/0001-10", tel: "(15) 3532-4400", tipo: "Pessoa jurídica" },
  ],
  funil: [
    { estagio: "Novo", cartoes: [
      { cliente: "Carlos Mendes", cidade: "Itapeva", area: "24,0000 ha", servico: "CAR", tempo: "há 4 h", nota: "morno" },
      { cliente: "Sítio das Palmeiras", cidade: "Buri", area: "9,2000 ha", servico: "Topografia", tempo: "há 1 d", nota: "frio" } ] },
    { estagio: "Qualificando", cartoes: [
      { cliente: "Maria Aparecida Souza", cidade: "Itapeva", area: "88,0000 ha", servico: "Georreferenciamento", tempo: "há 3 d", nota: "quente" } ] },
    { estagio: "Quente", cartoes: [
      { cliente: "Agropecuária Vale Verde", cidade: "Taquarivaí", area: "318,9200 ha", servico: "Georreferenciamento", tempo: "há 2 d", nota: "quente" },
      { cliente: "Gleba São João", cidade: "Ribeirão Branco", area: "56,1000 ha", servico: "Desmembramento", tempo: "há 5 d", nota: "morno" } ] },
    { estagio: "Orçamento", cartoes: [
      { cliente: "José Ferreira dos Santos", cidade: "Itaberá", area: "12,4000 ha", servico: "Usucapião", tempo: "há 1 d", nota: "morno" } ] },
    { estagio: "Negociação", cartoes: [
      { cliente: "FRI Agro", cidade: "Itararé", area: "740,0000 ha", servico: "Georreferenciamento", tempo: "há 6 h", nota: "quente" } ] },
    { estagio: "Fechado", cartoes: [
      { cliente: "Chácara Recanto", cidade: "Buri", area: "3,8000 ha", servico: "Topografia", tempo: "há 12 d", nota: "frio" } ] },
  ],
  ordens: [
    { status: "Aguardando documentos", itens: [
      { numero: "0151", cliente: "Carlos Mendes", imovel: "Sítio das Palmeiras · Buri", servico: "CAR", dias: 21, prazo: "05/10/2026" },
      { numero: "0150", cliente: "FRI Agro", imovel: "Fazenda Itararé · Itararé", servico: "Georreferenciamento", dias: 12, prazo: "26/09/2026" } ] },
    { status: "Em campo", itens: [
      { numero: "0148", cliente: "Maria Aparecida Souza", imovel: "Fazenda Santa Rita · Itapeva", servico: "Georreferenciamento", dias: 5, prazo: "19/09/2026" },
      { numero: "0147", cliente: "Agropecuária Vale Verde", imovel: "Fazenda Três Barras · Buri", servico: "Topografia", dias: 1, prazo: "15/09/2026" } ] },
    { status: "Pendência", itens: [
      { numero: "0142", cliente: "José Ferreira dos Santos", imovel: "Sítio Boa Vista · Itaberá", servico: "Georreferenciamento", dias: -4, prazo: "10/09/2026" } ] },
  ],
  orcamentos: [
    { numero: "0233", cliente: "Agropecuária Vale Verde", servico: "Georreferenciamento", valor: "R$ 28.400,00", status: "Enviado", tom: "secondary", data: "11/09/2026" },
    { numero: "0232", cliente: "Maria Aparecida Souza", servico: "Georreferenciamento", valor: "R$ 12.950,00", status: "Aprovado", tom: "default", data: "08/09/2026" },
    { numero: "0231", cliente: "José Ferreira dos Santos", servico: "Usucapião", valor: "R$ 6.300,00", status: "Recusado", tom: "destructive", data: "02/09/2026" },
    { numero: "0230", cliente: "Carlos Mendes", servico: "CAR", valor: "R$ 1.850,00", status: "Rascunho", tom: "outline", data: "01/09/2026" },
    { numero: "0229", cliente: "FRI Agro", servico: "Topografia", valor: "R$ 44.700,00", status: "Aprovado", tom: "default", data: "28/08/2026" },
  ],
};
