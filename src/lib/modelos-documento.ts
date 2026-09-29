import propostaAsset from "@/assets/modelos/proposta-comercial.docx.asset.json";
import contratoAsset from "@/assets/modelos/contrato-prestacao-servicos.docx.asset.json";
import logoAsset from "@/assets/modelos/logo-ativa-consultoria.png.asset.json";
import cantoAsset from "@/assets/modelos/canto-azul-cabecalho.png.asset.json";

export const IDENTIDADE_DOCUMENTOS = {
  logoUrl: logoAsset.url,
  cantoUrl: cantoAsset.url,
} as const;

export const MODELOS_DOCUMENTO = {
  proposta: {
    titulo: "Proposta comercial",
    descricao:
      "Modelo oficial em duas páginas, com objeto, escopo, investimento, despesas não inclusas e assinaturas.",
    arquivo: "Modelo_Proposta_Comercial_Ativa_Consultoria.docx",
    url: propostaAsset.url,
  },
  contrato: {
    titulo: "Contrato de prestação de serviços técnicos",
    descricao:
      "Modelo oficial em três páginas, com objeto, honorários, pagamento, obrigações, serviços não inclusos, foro e assinaturas.",
    arquivo: "Modelo_Contrato_Prestacao_Servicos_Ativa_Consultoria.docx",
    url: contratoAsset.url,
  },
} as const;