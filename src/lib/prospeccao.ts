// Regras e utilitários da tela de Prospecção (sem novas tabelas).

export const ESTAGIOS = [
  "novo",
  "mensagem_enviada",
  "respondeu",
  "qualificado",
  "sem_resposta",
  "descartado",
  "convertido_cliente",
] as const;

export type Estagio = (typeof ESTAGIOS)[number];

export const ROTULO_ESTAGIO: Record<Estagio, string> = {
  novo: "Novo",
  mensagem_enviada: "Mensagem enviada",
  respondeu: "Respondeu",
  qualificado: "Qualificado",
  sem_resposta: "Sem resposta",
  descartado: "Descartado",
  convertido_cliente: "Virou cliente",
};

export const SERVICOS_SUGERIDOS = [
  "Georreferenciamento + CAR",
  "Georreferenciamento",
  "Cadastro do CAR",
  "Outorga de agua",
  "Regularizacao no INCRA",
] as const;

export function rotuloEstagio(valor: string | null | undefined): string {
  if (!valor) return "Sem etapa";
  return ROTULO_ESTAGIO[valor as Estagio] ?? valor;
}

const CHAVE_MODELO = "ativa-crm-modelo-prospeccao";

export const MODELO_PADRAO =
  "Olá {nome}, tudo bem? Sou da equipe de topografia e georreferenciamento da Ativa. " +
  "Vi que você tem o imóvel {imovel} em {municipio} e podemos ajudar com {servico}. " +
  "Podemos conversar?";

export const ASSUNTO_PADRAO = "Regularização do imóvel {imovel} em {municipio}";

export type ModeloMensagem = { assunto: string; corpo: string };

export function lerModelo(): ModeloMensagem {
  try {
    const salvo = localStorage.getItem(CHAVE_MODELO);
    if (salvo) {
      const bruto = JSON.parse(salvo) as Partial<ModeloMensagem>;
      return {
        assunto: bruto.assunto?.trim() ? bruto.assunto : ASSUNTO_PADRAO,
        corpo: bruto.corpo?.trim() ? bruto.corpo : MODELO_PADRAO,
      };
    }
  } catch {
    /* armazenamento indisponível */
  }
  return { assunto: ASSUNTO_PADRAO, corpo: MODELO_PADRAO };
}

export function gravarModelo(modelo: ModeloMensagem): void {
  try {
    localStorage.setItem(CHAVE_MODELO, JSON.stringify(modelo));
  } catch {
    /* armazenamento indisponível */
  }
}

export type DadosMensagem = {
  nome: string;
  imovel: string;
  municipio: string;
  servico: string;
  area: string;
};

export function aplicarModelo(texto: string, dados: DadosMensagem): string {
  return texto
    .replaceAll("{nome}", dados.nome || "tudo bem")
    .replaceAll("{imovel}", dados.imovel || "seu imóvel")
    .replaceAll("{municipio}", dados.municipio || "sua região")
    .replaceAll("{servico}", dados.servico || "regularização")
    .replaceAll("{area}", dados.area || "");
}

/** Telefone em E.164 sem símbolos, pronto para o link do WhatsApp. */
export function telefoneWhats(valor: string | null | undefined): string {
  const digitos = (valor ?? "").replace(/\D+/g, "");
  if (!digitos) return "";
  return digitos.length <= 11 ? `55${digitos}` : digitos;
}

export function telefoneVisivel(valor: string | null | undefined): string {
  const d = telefoneWhats(valor);
  if (d.length < 12) return valor ?? "—";
  const ddd = d.slice(2, 4);
  const resto = d.slice(4);
  const meio = resto.length > 8 ? resto.slice(0, 5) : resto.slice(0, 4);
  const fim = resto.slice(meio.length);
  return `(${ddd}) ${meio}-${fim}`;
}

export function linkWhats(telefone: string | null | undefined, mensagem: string): string {
  return `https://wa.me/${telefoneWhats(telefone)}?text=${encodeURIComponent(mensagem)}`;
}

export function linkEmail(
  email: string | null | undefined,
  assunto: string,
  corpo: string,
): string {
  return `mailto:${email ?? ""}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
}

/** Baixa um CSV com separador ponto e vírgula e BOM UTF-8. */
export function baixarCsv(nomeArquivo: string, cabecalho: string[], linhas: string[][]): void {
  const escapar = (v: string) => `"${(v ?? "").replaceAll('"', '""')}"`;
  const texto = [cabecalho, ...linhas].map((l) => l.map(escapar).join(";")).join("\r\n");
  const url = URL.createObjectURL(
    new Blob([`\uFEFF${texto}`], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}
