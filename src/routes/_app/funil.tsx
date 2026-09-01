import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, MoveRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { areaHa, rotulo } from "@/lib/formato";
import { desdeAgora } from "@/lib/tempo";
import { ESTAGIOS, corDaNota } from "@/lib/funil";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_app/funil")({
  head: () => ({
    meta: [
      { title: "Funil de oportunidades | CRM de Topografia" },
      {
        name: "description",
        content:
          "Kanban de oportunidades de georreferenciamento e topografia, do primeiro contato ao fechamento.",
      },
      { property: "og:title", content: "Funil de oportunidades | CRM de Topografia" },
      {
        property: "og:description",
        content: "Acompanhe cada lead por estágio, com nota, serviço e tempo sem contato.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pagina;
});

type Oportunidade = {
  id: string;
  cliente_id: string | null;
  imovel_id: string | null;
  servico: string | null;
  cidade: string | null;
  area_ha: number | null;
  estagio: string | null;
  nota: string | null;
  criado_em: string | null;
  clientes: { nome: string | null } | { nome: string | null }[] | null;
};

function nomeCliente(o: Oportunidade): string {
  const c = Array.isArray(o.clientes) ? o.clientes[0] : o.clientes;
  return c?.nome?.trim() || "Sem cliente";
}

function Pagina() {
  const queryClient = useQueryClient();
  const { perfil } = usePerfil();
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<string | null>(null);

  const oportunidadesQuery = useQuery({
    queryKey: ["oportunidades", "funil"],
    queryFn: async (): Promise<Oportunidade[]> => {
      const { data, error } = await supabase
        .from("oportunidades")
        .select(
          "id, cliente_id, imovel_id, servico, cidade, area_ha, estagio, nota, criado_em, clientes(nome)",
        )
        .eq("arquivada", false)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Oportunidade[];
    },
  });

  const interacoesQuery = useQuery({
    queryKey: ["oportunidades", "ultima-interacao"],
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase
        .from("mensagens")
        .select("oportunidade_id, criado_em")
        .order("criado_em", { ascending: false })
        .limit(2000);
      if (error) throw error;
      const mapa: Record<string, string> = {};
      for (const m of (data ?? []) as { oportunidade_id: string | null; criado_em: string }[]) {
        if (m.oportunidade_id && !mapa[m.oportunidade_id]) mapa[m.oportunidade_id] = m.criado_em;
      }
      return mapa;
    },
  });

  // Realtime: leads criados pelo agente de WhatsApp aparecem sem recarregar.
  useEffect(() => {
    const canal = supabase
      .channel("funil-oportunidades")
      .on("postgres_changes", { event: "*", schema: "public", table: "oportunidades" }, () => {
        queryClient.invalidateQueries({ queryKey: ["oportunidades"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagens" }, () => {
        queryClient.invalidateQueries({ queryKey: ["oportunidades", "ultima-interacao"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [queryClient]);

  const mover = useMutation({
    mutationFn: async ({
      id,
      de,
      para,
      cliente,
    }: {
      id: string;
      de: string | null;
      para: string;
      cliente: string;
    }) => {
      const { error } = await supabase.from("oportunidades").update({ estagio: para }).eq("id", id);
      if (error) throw error;

      const { error: erroEvento } = await supabase.from("eventos").insert({
        empresa_id: perfil?.empresa_id ?? null,
        usuario_id: perfil?.id ?? null,
        tipo: "mudanca_estagio",
        entidade: "oportunidades",
        entidade_id: id,
        descricao: `${cliente}: ${rotulo(de) || "sem estágio"} → ${rotulo(para)}`,
      });
      if (erroEvento) throw erroEvento;
    },
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["oportunidades"] });
      toast.success(`Movido para ${rotulo(v.para)}`);
    },
    onError: () => toast.error("Não foi possível mover o cartão."),
  });

  if (oportunidadesQuery.isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  if (oportunidadesQuery.error) {
    return (
      <p className="py-10 text-center text-lg font-semibold text-muted-foreground">
        Não foi possível carregar o funil. Tente de novo.
      </p>
    );
  }

  const lista = oportunidadesQuery.data ?? [];
  const interacoes = interacoesQuery.data ?? {};

  return (
    <section className="pb-4">
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">Funil</h1>
        <p className="text-base font-semibold text-muted-foreground">
          {lista.length} {lista.length === 1 ? "oportunidade ativa" : "oportunidades ativas"} · arraste
          ou use “mover para”
        </p>
      </header>

      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 md:mx-0 md:px-0">
        {ESTAGIOS.map((estagio) => {
          const cartoes = lista.filter((o) => (o.estagio ?? "novo") === estagio.valor);
          const alvo = colunaAlvo === estagio.valor;
          return (
            <div
              key={estagio.valor}
              onDragOver={(e) => {
                e.preventDefault();
                setColunaAlvo(estagio.valor);
              }}
              onDragLeave={() => setColunaAlvo((c) => (c === estagio.valor ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                setColunaAlvo(null);
                const id = arrastando ?? e.dataTransfer.getData("text/plain");
                setArrastando(null);
                const cartao = lista.find((o) => o.id === id);
                if (!cartao || (cartao.estagio ?? "novo") === estagio.valor) return;
                mover.mutate({
                  id,
                  de: cartao.estagio,
                  para: estagio.valor,
                  cliente: nomeCliente(cartao),
                });
              }}
              className={`w-[85vw] shrink-0 snap-start rounded-3xl border-2 p-3 transition-colors sm:w-72 ${
                alvo ? "border-primary bg-primary/10" : "border-border bg-muted/40"
              }`}
            >
              <header className="mb-3 flex items-center justify-between gap-2 px-1">
                <h2 className="text-lg font-extrabold text-foreground">{estagio.rotulo}</h2>
                <span className="rounded-full bg-card px-2.5 py-1 text-base font-extrabold text-foreground">
                  {cartoes.length}
                </span>
              </header>

              <div className="space-y-3">
                {cartoes.map((o) => (
                  <article
                    key={o.id}
                    draggable
                    onDragStart={(e) => {
                      setArrastando(o.id);
                      e.dataTransfer.setData("text/plain", o.id);
                    }}
                    onDragEnd={() => setArrastando(null)}
                    className={`rounded-2xl border-2 border-border bg-card p-3 shadow-sm ${
                      arrastando === o.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to="/oportunidades/$id"
                        params={{ id: o.id }}
                        className="min-w-0 flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-3 shrink-0 rounded-full ${corDaNota(o.nota)}`}
                            aria-label={`Nota: ${rotulo(o.nota) || "não informada"}`}
                          />
                          <h3 className="truncate text-lg font-extrabold text-foreground">
                            {nomeCliente(o)}
                          </h3>
                        </div>
                        <p className="mt-1 truncate text-base font-semibold text-muted-foreground">
                          {o.cidade?.trim() || "cidade não informada"}
                          {o.area_ha !== null ? ` · ${areaHa(o.area_ha)}` : ""}
                        </p>
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label="Mover para outro estágio"
                          className="flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-border text-foreground"
                        >
                          <MoveRight className="size-5" strokeWidth={2.5} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl">
                          {ESTAGIOS.filter((e) => e.valor !== (o.estagio ?? "novo")).map((e) => (
                            <DropdownMenuItem
                              key={e.valor}
                              className="py-3 text-base font-bold"
                              onClick={() =>
                                mover.mutate({
                                  id: o.id,
                                  de: o.estagio,
                                  para: e.valor,
                                  cliente: nomeCliente(o),
                                })
                              }
                            >
                              {e.rotulo}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      {o.servico ? (
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-sm font-extrabold text-secondary-foreground">
                          {rotulo(o.servico)}
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">sem serviço</span>
                      )}
                      <span className="text-sm font-bold text-muted-foreground">
                        {desdeAgora(interacoes[o.id] ?? o.criado_em)}
                      </span>
                    </div>
                  </article>
                ))}

                {cartoes.length === 0 ? (
                  <p className="px-1 py-6 text-center text-base font-semibold text-muted-foreground">
                    Nenhum cartão aqui
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
