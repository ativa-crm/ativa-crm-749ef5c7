import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { dataHora, rotulo } from "@/lib/formato";
import { Bloco } from "@/components/campos";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/contratos/$id")({
  head: () => ({
    meta: [
      { title: "Ficha do contrato | CRM de Topografia" },
      {
        name: "description",
        content: "Ficha do contrato com geração e download do documento em PDF.",
      },
      { property: "og:title", content: "Ficha do contrato | CRM de Topografia" },
      { property: "og:description", content: "Acompanhe a geração do documento do contrato." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pagina,
});

type Contrato = {
  id: string;
  numero?: string | null;
  status?: string | null;
  criado_em?: string | null;
  documento_solicitado_em?: string | null;
  pdf_url?: string | null;
};

function Pagina() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [aguardando, setAguardando] = useState(false);
  const [tempoEsgotado, setTempoEsgotado] = useState(false);
  const inicioEspera = useRef<number | null>(null);
  const query = useQuery({
    queryKey: ["contrato", id],
    queryFn: async (): Promise<Contrato | null> => {
      const { data, error } = await supabase
        .from("contratos")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as Contrato | null) ?? null;
    },
    refetchInterval: aguardando ? 3000 : false,
  });
  const contrato = query.data ?? null;

  useEffect(() => {
    if (!aguardando) return;
    if (contrato?.pdf_url) {
      setAguardando(false);
      setTempoEsgotado(false);
      toast.success("Documento pronto para baixar.");
      return;
    }
    if (inicioEspera.current !== null && Date.now() - inicioEspera.current >= 40_000) {
      setAguardando(false);
      setTempoEsgotado(true);
    }
  }, [aguardando, contrato?.pdf_url, query.dataUpdatedAt]);

  const gerar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("contratos")
        .update({ documento_solicitado_em: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      inicioEspera.current = Date.now();
      setTempoEsgotado(false);
      setAguardando(true);
      void queryClient.invalidateQueries({ queryKey: ["contrato", id] });
      void queryClient.invalidateQueries({ queryKey: ["contratos"] });
    },
    onError: () => toast.error("Não foi possível solicitar o documento."),
  });

  if (query.isPending)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-9 animate-spin text-primary" />
      </div>
    );
  if (query.error || !contrato)
    return (
      <section>
        <Link to="/contratos" className="font-bold text-primary">
          Voltar para contratos
        </Link>
        <p className="mt-4 text-lg font-semibold text-destructive">Contrato não encontrado.</p>
      </section>
    );

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/contratos"
          aria-label="Voltar"
          className="flex size-12 items-center justify-center rounded-xl border-2 border-border bg-card"
        >
          <ArrowLeft className="size-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {contrato.numero ? `Contrato nº ${contrato.numero}` : "Contrato"}
          </h1>
          <p className="text-base font-semibold text-muted-foreground">
            {rotulo(contrato.status) || "Sem status"}
          </p>
        </div>
      </div>
      <Bloco titulo="Documento">
        {contrato.criado_em ? (
          <p className="text-base font-medium text-muted-foreground">
            Criado em {dataHora(contrato.criado_em)}
          </p>
        ) : null}
        {contrato.documento_solicitado_em ? (
          <p className="mt-1 text-base font-medium text-muted-foreground">
            Solicitado em {dataHora(contrato.documento_solicitado_em)}
          </p>
        ) : null}
        <div className="mt-4">
          {contrato.pdf_url ? (
            <Button asChild className="h-14 px-6 text-base">
              <a href={contrato.pdf_url} target="_blank" rel="noreferrer">
                <Download className="size-5" /> Baixar PDF
              </a>
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => gerar.mutate()}
              disabled={gerar.isPending || aguardando}
              className="h-14 px-6 text-base"
            >
              {gerar.isPending || aguardando ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <FileDown className="size-5" />
              )}
              {aguardando ? "Gerando documento..." : "Gerar documento"}
            </Button>
          )}
          {tempoEsgotado ? (
            <p className="mt-3 text-base font-semibold text-muted-foreground">
              Ainda processando, atualize a página em instantes.
            </p>
          ) : null}
        </div>
      </Bloco>
    </section>
  );
}
