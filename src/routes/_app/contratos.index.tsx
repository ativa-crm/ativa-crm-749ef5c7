import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileSignature, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { data as dataBR, rotulo } from "@/lib/formato";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/contratos/")({
  head: () => ({
    meta: [
      { title: "Contratos | CRM de Topografia" },
      {
        name: "description",
        content: "Contratos e documentos disponíveis para geração e download.",
      },
      { property: "og:title", content: "Contratos | CRM de Topografia" },
      { property: "og:description", content: "Consulte contratos e seus documentos em PDF." },
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
  pdf_url?: string | null;
};

function Pagina() {
  const query = useQuery({
    queryKey: ["contratos"],
    queryFn: async (): Promise<Contrato[]> => {
      const { data, error } = await supabase
        .from("contratos")
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Contrato[];
    },
  });
  return (
    <section>
      <header className="flex items-center gap-2">
        <FileSignature className="size-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
      </header>
      {query.isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-9 animate-spin text-primary" />
        </div>
      ) : query.error ? (
        <p className="mt-8 text-lg font-semibold text-destructive">
          Não foi possível carregar os contratos.
        </p>
      ) : !query.data?.length ? (
        <p className="mt-8 text-lg font-medium text-muted-foreground">
          Nenhum contrato encontrado.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {query.data.map((contrato) => (
            <li key={contrato.id}>
              <Link
                to="/contratos/$id"
                params={{ id: contrato.id }}
                className="block rounded-2xl border border-border bg-card p-4 shadow-sm hover:bg-accent"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg font-bold text-foreground">
                    {contrato.numero ? `Contrato nº ${contrato.numero}` : "Contrato"}
                  </span>
                  <Badge variant="outline">
                    {contrato.pdf_url ? "PDF pronto" : rotulo(contrato.status) || "Pendente"}
                  </Badge>
                </div>
                {contrato.criado_em ? (
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    Criado em {dataBR(contrato.criado_em)}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
