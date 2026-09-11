import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Search, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { mascaraDocumento, mascaraTelefone, rotulo, soDigitos } from "@/lib/formato";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/clientes/")({
  head: () => ({
    meta: [
      { title: "Clientes | CRM de Topografia" },
      {
        name: "description",
        content:
          "Lista de clientes pessoa física e jurídica com busca por nome, documento ou telefone.",
      },
      { property: "og:title", content: "Clientes | CRM de Topografia" },
      {
        property: "og:description",
        content: "Clientes PF e PJ com documentos e contatos organizados.",
      },
    ],
  }),
  component: Pagina,
});

type Linha = {
  id: string;
  nome: string;
  nome_fantasia: string | null;
  tipo: string | null;
  documento: string | null;
  telefone: string | null;
  cidade: string | null;
  uf: string | null;
};

function Pagina() {
  const { perfil } = usePerfil();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");

  const {
    data: clientes,
    isPending,
    error,
  } = useQuery({
    queryKey: ["clientes"],
    queryFn: async (): Promise<Linha[]> => {
      const { data, error: erro } = await supabase
        .from("clientes")
        .select("id, nome, nome_fantasia, tipo, documento, telefone, cidade, uf")
        .order("nome");
      if (erro) throw erro;
      return (data ?? []) as Linha[];
    },
  });

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const digitos = soDigitos(busca);
    return (clientes ?? []).filter((c) => {
      if (!termo) return true;
      const alvo = `${c.nome} ${c.nome_fantasia ?? ""} ${c.cidade ?? ""}`.toLowerCase();
      if (alvo.includes(termo)) return true;
      if (digitos.length === 0) return false;
      return (
        soDigitos(c.documento ?? "").includes(digitos) ||
        soDigitos(c.telefone ?? "").includes(digitos)
      );
    });
  }, [clientes, busca]);

  const criar = useMutation({
    mutationFn: async () => {
      if (!perfil) throw new Error("Perfil não carregado.");
      const { data, error: erro } = await supabase
        .from("clientes")
        .insert({ empresa_id: perfil.empresa_id, nome: "Novo cliente", tipo: "pf" })
        .select("id")
        .single();
      if (erro) throw erro;
      return data.id as string;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      navigate({ to: "/clientes/$id", params: { id } });
    },
  });

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Users className="size-6 text-primary" strokeWidth={2.5} />
          Clientes
        </h1>
        <Button
          onClick={() => criar.mutate()}
          disabled={criar.isPending}
          className="h-11 rounded-full px-4 text-base font-semibold"
        >
          {criar.isPending ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <Plus className="size-6" strokeWidth={3} />
          )}
          Novo cliente
        </Button>
      </header>

      <div className="relative mt-4">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
          strokeWidth={2.5}
        />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, documento ou telefone"
          className="h-11 rounded-full border pl-11 text-base font-medium"
        />
      </div>

      {error ? (
        <p className="mt-6 rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4 text-lg font-bold text-destructive">
          Não foi possível carregar os clientes.
        </p>
      ) : isPending ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="size-10 animate-spin text-primary" />
        </div>
      ) : filtrados.length === 0 ? (
        <p className="mt-8 text-lg font-medium text-muted-foreground">Nenhum cliente encontrado.</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {filtrados.map((c) => (
            <li key={c.id}>
              <Link
                to="/clientes/$id"
                params={{ id: c.id }}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 transition-colors hover:bg-accent"
              >
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-foreground">{c.nome}</p>
                  {c.nome_fantasia ? (
                    <p className="truncate text-sm font-medium text-muted-foreground">
                      {c.nome_fantasia}
                    </p>
                  ) : null}
                  <p className="mt-0.5 truncate text-sm font-medium text-muted-foreground">
                    {c.documento
                      ? mascaraDocumento(c.documento, c.tipo ?? "pf")
                      : "Documento não informado"}
                  </p>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {c.telefone ? mascaraTelefone(c.telefone) : "Telefone não informado"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 gap-1.5 rounded-full border-border bg-card px-2.5 py-1 text-xs"
                >
                  <span
                    className={`size-2 rounded-full ${
                      (c.tipo ?? "pf") === "pj" ? "bg-primary" : "bg-muted"
                    }`}
                    aria-hidden
                  />
                  {rotulo(c.tipo ?? "pf")}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
