import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPinned, Plus, Search, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { areaHa, rotulo, soDigitos } from "@/lib/formato";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/imoveis/")({
  head: () => ({
    meta: [
      { title: "Imóveis | CRM de Topografia" },
      {
        name: "description",
        content:
          "Lista de imóveis rurais e urbanos com busca por nome, município ou matrícula e status do serviço.",
      },
      { property: "og:title", content: "Imóveis | CRM de Topografia" },
      {
        property: "og:description",
        content: "Imóveis, matrículas e status de serviço em um só lugar.",
      },
    ],
  }),
  component: Pagina,
});

type Linha = {
  id: string;
  nome: string;
  tipo: string | null;
  municipio: string | null;
  uf: string | null;
  matricula: string | null;
  area_ha: number | null;
  cliente_id: string | null;
};

function useImoveis() {
  return useQuery({
    queryKey: ["imoveis"],
    queryFn: async (): Promise<Linha[]> => {
      const { data, error } = await supabase
        .from("imoveis")
        .select("id, nome, tipo, municipio, uf, matricula, area_ha, cliente_id")
        .order("nome", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Linha[];
    },
  });
}

/** Status da ordem de serviço mais recente por imóvel. */
function useStatusServico() {
  return useQuery({
    queryKey: ["imoveis", "status-servico"],
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select("imovel_id, status, criado_em")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      const mapa: Record<string, string> = {};
      for (const os of data ?? []) {
        const id = (os as { imovel_id: string | null }).imovel_id;
        const status = (os as { status: string | null }).status;
        if (id && status && !mapa[id]) mapa[id] = status;
      }
      return mapa;
    },
  });
}

function Pagina() {
  const { perfil } = usePerfil();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: imoveis, isPending, error } = useImoveis();
  const { data: statusPorImovel } = useStatusServico();

  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<"todos" | "rural" | "urbano">("todos");
  const [cidade, setCidade] = useState("todas");

  const cidades = useMemo(() => {
    const set = new Set<string>();
    for (const i of imoveis ?? []) if (i.municipio) set.add(i.municipio);
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [imoveis]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const digitos = soDigitos(busca);
    return (imoveis ?? []).filter((i) => {
      if (tipo !== "todos" && (i.tipo ?? "rural") !== tipo) return false;
      if (cidade !== "todas" && i.municipio !== cidade) return false;
      if (!termo) return true;
      const alvo = `${i.nome} ${i.municipio ?? ""} ${i.matricula ?? ""}`.toLowerCase();
      if (alvo.includes(termo)) return true;
      return digitos.length > 0 && soDigitos(i.matricula ?? "").includes(digitos);
    });
  }, [imoveis, busca, tipo, cidade]);

  const criar = useMutation({
    mutationFn: async () => {
      if (!perfil) throw new Error("Perfil não carregado.");
      const { data, error: erro } = await supabase
        .from("imoveis")
        .insert({ empresa_id: perfil.empresa_id, nome: "Novo imóvel", tipo: "rural" })
        .select("id")
        .single();
      if (erro) throw erro;
      return data.id as string;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["imoveis"] });
      navigate({ to: "/imoveis/$id", params: { id } });
    },
  });

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <MapPinned className="size-6 text-primary" strokeWidth={2.5} />
          Imóveis
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
          Novo imóvel
        </Button>
      </header>

      <div className="mt-4 space-y-2.5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            strokeWidth={2.5}
          />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, município ou matrícula"
            className="h-11 rounded-full border pl-11 text-base font-medium"
          />
        </div>

        <div className="seg">
          {(["todos", "rural", "urbano"] as const).map((t) => (
            <button
              key={t}
              type="button"
              data-ativo={tipo === t}
              onClick={() => setTipo(t)}
              className="seg-item"
            >
              {t === "todos" ? "Todos" : rotulo(t)}
            </button>
          ))}
        </div>

        <select
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          className="h-11 w-full rounded-full border border-border bg-card px-4 text-base font-semibold text-foreground"
        >
          <option value="todas">Todas as cidades</option>
          {cidades.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="mt-6 rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4 text-lg font-bold text-destructive">
          Não foi possível carregar os imóveis.
        </p>
      ) : isPending ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="size-10 animate-spin text-primary" />
        </div>
      ) : filtrados.length === 0 ? (
        <p className="mt-8 text-lg font-medium text-muted-foreground">
          Nenhum imóvel encontrado com esses filtros.
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {filtrados.map((i) => {
            const status = statusPorImovel?.[i.id];
            return (
              <li key={i.id}>
                <Link
                  to="/imoveis/$id"
                  params={{ id: i.id }}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 transition-colors hover:bg-accent"
                >
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-foreground">{i.nome}</p>
                    <p className="mt-0.5 truncate text-sm font-medium text-muted-foreground">
                      {i.municipio || "Município não informado"}
                      {i.uf ? ` · ${i.uf}` : ""} · {rotulo(i.tipo ?? "rural")}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-foreground">
                      {i.area_ha !== null ? areaHa(i.area_ha) : "Área não informada"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 gap-1.5 rounded-full border-border bg-card px-2.5 py-1 text-xs"
                  >
                    <span
                      className={`size-2 rounded-full ${status ? "bg-primary" : "bg-muted"}`}
                      aria-hidden
                    />
                    {status ? rotulo(status) : "Sem serviço"}
                  </Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
