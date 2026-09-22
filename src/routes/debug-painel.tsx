import { createFileRoute } from "@tanstack/react-router";
import { DetalheImovel, type LinhaImovel } from "./_app/prospeccao";

export const Route = createFileRoute("/debug-painel")({
  component: DebugPainel,
});

const imovelFalso: LinhaImovel = {
  id: "1",
  nome: "Fazenda Exemplo",
  municipio: "Itapeva",
  uf: "SP",
  area_ha: 123.45,
  servico_sugerido: "Certificação SIGEF",
  titular_ccir: "João da Silva",
  titular_tipo: "pf",
  observacoes: "Documentação em análise",
  tem_candidato_pendente: true,
  prospeccao_id: "1",
  cliente_id: null,
  prospeccao: {
    id: "1",
    nome: "Maria Souza",
    telefone: "14988887777",
    email: "maria@exemplo.com",
    estagio: "mensagem_enviada",
    documento: null,
    proxima_acao: "Ligar de volta",
    proxima_data: "2026-09-25",
    observacoes: null,
  },
};

function DebugPainel() {
  return (
    <div className="min-h-screen bg-background p-8">
      <p className="text-foreground">Página de teste — painel deve ficar fixo à direita.</p>
      <DetalheImovel
        imovel={imovelFalso}
        responsavel="Teste"
        onFechar={() => {}}
        onWhats={() => {}}
        onEmail={() => {}}
        onEstagio={() => {}}
      />
    </div>
  );
}
