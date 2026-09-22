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
    <div className="jarvis relative flex min-h-screen overflow-hidden bg-background-light">
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="app-content mx-auto w-full max-w-7xl px-4 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6">
            <section className="space-y-4">
              <p className="text-foreground">Conteúdo da página atrás do painel.</p>
              <div className="h-96 rounded-2xl bg-card" />
              <DetalheImovel
                imovel={imovelFalso}
                responsavel="Teste"
                onFechar={() => {}}
                onWhats={() => {}}
                onEmail={() => {}}
                onEstagio={() => {}}
              />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
