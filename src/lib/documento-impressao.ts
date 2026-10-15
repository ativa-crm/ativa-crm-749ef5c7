import { IDENTIDADE_DOCUMENTOS } from "@/lib/modelos-documento";
import { reais } from "@/lib/formato";

// Gera os documentos oficiais (proposta e contrato) preenchidos, prontos para imprimir ou salvar em PDF.

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function esc(v: string | null | undefined): string {
  return (v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function dataExtenso(d = new Date()): string {
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

function pagina(titulo: string, corpo: string, previa = false): string {
  const { logoUrl, cantoUrl } = IDENTIDADE_DOCUMENTOS;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(titulo)}</title>
<style>
@page{size:A4;margin:18mm 18mm 20mm}
html,body{background:#ffffff;color:#1f2937}
body{font-family:Arial,Helvetica,sans-serif;color:#1f2937;font-size:11.5pt;line-height:1.5;margin:0}
.canto{position:fixed;top:-18mm;right:-18mm;width:70mm}
header{display:flex;align-items:center;gap:12px;margin-bottom:18px}
header img{height:64px}
h1{font-size:15pt;text-align:center;margin:12px 0 18px;text-transform:uppercase}
h2{font-size:12pt;margin:18px 0 6px;text-transform:uppercase}
table{width:100%;border-collapse:collapse;margin-top:6px}
td,th{border:1px solid #9ca3af;padding:6px 8px;text-align:left}
td.v{text-align:right;white-space:nowrap}
tr.total td{font-weight:bold}
.ass{display:flex;gap:40px;margin-top:60px}
.ass div{flex:1;border-top:1px solid #111;padding-top:6px;text-align:center;font-size:10.5pt}
</style></head><body>
<img class="canto" src="${cantoUrl}" alt="">
<header><img src="${logoUrl}" alt="Ativa Consultoria"></header>
${corpo}
${previa ? "<style>body{padding:18mm;position:relative;overflow-x:hidden}.canto{position:absolute;top:0;right:0}</style>" : "<script>window.onload=function(){setTimeout(function(){window.print()},400)}</script>"}
</body></html>`;
}

/** Abre a janela já (antes de chamadas assíncronas) para o navegador não bloquear. */
export function abrirJanelaDocumento(): Window | null {
  const w = window.open("", "_blank");
  if (w) w.document.write("<p style='font-family:Arial;padding:24px'>Preparando documento…</p>");
  return w;
}

export function escreverDocumento(w: Window | null, html: string) {
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export type DadosProposta = {
  titulo: string;
  contratante: string;
  documento: string;
  finalidade: string;
  descricao: string;
  alqueires: string;
  itens: { descricao: string; valor: number }[];
  desconto: number;
  naoIncluso?: string[] | null;
};

export function htmlProposta(d: DadosProposta, previa = false): string {
  const total = Math.max(0, d.itens.reduce((s, i) => s + i.valor, 0) - d.desconto);
  const linhas = d.itens
    .map((i) => `<tr><td>${esc(i.descricao)}</td><td class="v">${reais(i.valor)}</td></tr>`)
    .join("");
  const desc = d.desconto > 0 ? `<tr><td>Desconto</td><td class="v">- ${reais(d.desconto)}</td></tr>` : "";
  return pagina(
    "Proposta comercial",
    `<h1>Proposta comercial<br>${esc(d.titulo)}</h1>
<p><b>Contratante:</b> ${esc(d.contratante)} — CPF/CNPJ: ${esc(d.documento)}</p>
<p><b>Contratada:</b> ATIVA CONSULTORIA AGRÍCOLA LTDA — Responsável Técnico: Eng. Agrônomo Renato Muzel Morimoto – CREA-SP</p>
<p><b>Local e data:</b> Itapeva/SP, ${dataExtenso()}</p>
<h2>Objeto</h2>
<p>${esc(d.descricao)} de imóvel rural para ${esc(d.finalidade)}, com área aproximada de ${esc(d.alqueires)} alqueires, incluindo levantamento georreferenciado, planta, memorial descritivo, certificação SIGEF/INCRA e regularização de CAR, CCIR e ITR de todas as áreas.</p>
<h2>Investimento</h2>
<table><tr><th>Serviço</th><th>Valor</th></tr>${linhas}${desc}
<tr class="total"><td>TOTAL</td><td class="v">${reais(total)}</td></tr></table>
<h2>Despesas não inclusas</h2>
${d.naoIncluso?.length ? `<ul>${d.naoIncluso.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "<p>Taxas dos órgãos competentes, prefeitura, honorários advocatícios, custas de cartório, Receita Federal e demais emolumentos.</p>"}
<div class="ass"><div>${esc(d.contratante)}<br>Contratante</div><div>ATIVA CONSULTORIA AGRÍCOLA LTDA<br>Renato Muzel Morimoto</div></div>`,
    previa,
  );
}

export type DadosContrato = {
  contratante: string;
  documento: string;
  endereco: string;
  objeto: string;
  valor: number;
  valorExtenso: string;
};

export function htmlContrato(d: DadosContrato, previa = false): string {
  return pagina(
    "Contrato de prestação de serviços técnicos",
    `<h1>Contrato de prestação de serviços técnicos</h1>
<p><b>CONTRATADA:</b> ATIVA CONSULTORIA AGRÍCOLA LTDA, CNPJ 47.909.266/0001-15, neste ato representada por Renato Muzel Lopes Morimoto, Eng. Agrônomo/Geomensor, CREA-SP nº 5070249606.</p>
<p><b>CONTRATANTE:</b> ${esc(d.contratante)}, CPF/CNPJ ${esc(d.documento)}, residente em ${esc(d.endereco)}.</p>
<h2>Cláusula 1ª — Do objeto</h2><p>${esc(d.objeto)}</p>
<h2>Cláusula 2ª — Dos honorários</h2><p>Pelos serviços, o CONTRATANTE pagará à CONTRATADA o valor de ${reais(d.valor)} (${esc(d.valorExtenso)}).</p>
<h2>Cláusula 3ª — Da forma de pagamento</h2><p>O pagamento será feito em três parcelas: 40% (quarenta por cento) de entrada, na assinatura deste contrato; 30% (trinta por cento) no protocolo do processo no Cartório de Registro de Imóveis; e 30% (trinta por cento) na retificação da matrícula no Cartório de Registro de Imóveis.</p>
<h2>Cláusula 4ª — Das obrigações da contratada</h2><p>Executar os serviços com qualidade técnica, emitir a ART correspondente e entregar os documentos nos prazos combinados.</p>
<h2>Cláusula 5ª — Das obrigações do contratante</h2><p>Fornecer os documentos e informações necessários, permitir o acesso ao imóvel e efetuar os pagamentos nas datas acordadas.</p>
<h2>Cláusula 6ª — Dos serviços não inclusos</h2><p>Não estão inclusos honorários advocatícios, custas judiciais, emolumentos cartorários e taxas de órgãos públicos.</p>
<h2>Cláusula 7ª — Do foro</h2><p>Fica eleito o foro da Comarca de Itapeva/SP para dirimir quaisquer dúvidas oriundas deste contrato.</p>
<p>Itapeva/SP, ${dataExtenso()}.</p>
<div class="ass"><div>${esc(d.contratante)}<br>Contratante</div><div>ATIVA CONSULTORIA AGRÍCOLA LTDA<br>Renato Muzel Lopes Morimoto</div></div>`,
    previa,
  );
}

/** Lê CPF/CNPJ e endereço de um cliente sem depender do nome exato da coluna. */
export function dadosCliente(c: Record<string, unknown> | null | undefined) {
  const pega = (...k: string[]) => {
    for (const x of k) if (c && typeof c[x] === "string" && c[x]) return c[x] as string;
    return "";
  };
  return {
    documento: pega("cpf_cnpj", "cpf", "cnpj", "documento"),
    endereco: [pega("endereco", "logradouro"), pega("cidade", "municipio"), pega("uf")]
      .filter(Boolean)
      .join(", "),
  };
}

export type DadosImovelAnuencia = {
  nome: string;
  municipio: string;
  uf: string;
  matricula: string;
  cartorio: string;
  ccir: string;
  car: string;
  areaHa: string;
  proprietario: string;
  documentoProprietario: string;
};

export type DadosConfrontanteAnuencia = {
  nome: string;
  documento: string;
  estadoCivil: string;
  conjugeNome: string;
  conjugeDocumento: string;
  endereco: string;
  imovelConfrontante: string;
  matricula: string;
  rumo: string;
};

const LACUNA = "______________________________";

function ou(v: string | null | undefined, lacuna = LACUNA): string {
  const t = (v ?? "").trim();
  return t ? esc(t) : lacuna;
}

function cartaAnuencia(im: DadosImovelAnuencia, c: DadosConfrontanteAnuencia, comCabecalho: boolean): string {
  const { logoUrl } = IDENTIDADE_DOCUMENTOS;
  const conjuge = c.conjugeNome.trim()
    ? `, e seu cônjuge ${esc(c.conjugeNome)}, CPF ${ou(c.conjugeDocumento)}`
    : "";
  const lado = c.rumo.trim() ? ` (divisa ao ${esc(c.rumo)})` : "";
  const ccirCar = [im.ccir ? `CCIR nº ${esc(im.ccir)}` : "", im.car ? `CAR nº ${esc(im.car)}` : ""]
    .filter(Boolean)
    .join(", ");
  return `<section class="carta">
${comCabecalho ? "" : `<header><img src="${logoUrl}" alt="Ativa Consultoria"></header>`}
<h1>Declaração de reconhecimento de limites<br>(Carta de anuência)</h1>
<p>Eu, <b>${ou(c.nome)}</b>, ${ou(c.estadoCivil, "estado civil __________")}, inscrito(a) no CPF/CNPJ sob o nº ${ou(c.documento)}${conjuge}, residente e domiciliado(a) em ${ou(c.endereco)}, na qualidade de proprietário(a)/possuidor(a) do imóvel confrontante denominado <b>${ou(c.imovelConfrontante)}</b>, matrícula nº ${ou(c.matricula, "__________")}${lado},</p>
<p><b>DECLARO</b>, para os fins do art. 213 da Lei nº 6.015/1973 e da Lei nº 10.267/2001, que <b>reconheço e concordo</b> com os limites e confrontações entre o meu imóvel e o imóvel rural denominado <b>${ou(im.nome)}</b>, situado no município de ${ou(im.municipio)}/${ou(im.uf, "SP")}, objeto da matrícula nº ${ou(im.matricula, "__________")} do ${ou(im.cartorio, "Cartório de Registro de Imóveis competente")}${ccirCar ? `, ${ccirCar}` : ""}, com área de ${ou(im.areaHa, "_______")} ha, de propriedade de <b>${ou(im.proprietario)}</b>, CPF/CNPJ ${ou(im.documentoProprietario)}.</p>
<p>Declaro ainda que me foram apresentados a planta e o memorial descritivo do levantamento georreferenciado executado pela ATIVA CONSULTORIA AGRÍCOLA LTDA, sob responsabilidade técnica do Eng. Renato Muzel Lopes Morimoto, CREA-SP nº 5070249606, para fins de certificação no SIGEF/INCRA, e que não existe litígio, disputa ou oposição quanto às divisas descritas.</p>
<p>Por ser expressão da verdade, firmo a presente declaração.</p>
<p>${ou(im.municipio, "Itapeva")}/${ou(im.uf, "SP")}, ${dataExtenso()}.</p>
<div class="ass"><div>${ou(c.nome)}<br>CPF/CNPJ ${ou(c.documento, "__________")}<br>Confrontante</div>${
    c.conjugeNome.trim()
      ? `<div>${esc(c.conjugeNome)}<br>CPF ${ou(c.conjugeDocumento, "__________")}<br>Cônjuge</div>`
      : ""
  }</div>
<p style="margin-top:28px;font-size:9.5pt;color:#4b5563">Assinatura(s) com firma reconhecida em cartório.</p>
</section>`;
}

/** Uma ou várias cartas de anuência (uma por página) para o mesmo imóvel. */
export function htmlCartasAnuencia(
  im: DadosImovelAnuencia,
  confrontantes: DadosConfrontanteAnuencia[],
  previa = false,
): string {
  const corpo = confrontantes.map((c, i) => cartaAnuencia(im, c, i === 0)).join("");
  return pagina(
    confrontantes.length === 1 ? "Carta de anuência" : "Cartas de anuência",
    `<style>.carta+.carta{page-break-before:always;break-before:page}${previa ? ".carta+.carta{margin-top:40px;border-top:2px dashed #cbd5e1;padding-top:24px}" : ""}</style>${corpo}`,
    previa,
  );
}
