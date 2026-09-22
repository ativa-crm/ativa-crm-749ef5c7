import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CircleDollarSign, Loader2, Plus, Search, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import {
  data as dataBR,
  mascaraDocumento,
  mascaraTelefone,
  reais,
  rotulo,
  soDigitos,
} from "@/lib/formato";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BarraFerramentas, CartaoIndicador, Painel, Tabela } from "@/components/painel";

export const Route = createFileRoute("/_app/clientes/")({
  head: () => ({
    meta: [
      { title: "Clientes | CRM de Topografia" },
      {
        name: "description",
        content:
          "Lista de clientes pessoa física e jurídica com documentos, contatos, imóveis e valores em aberto.",
      },
      { property: "og:title", content: "Clientes | CRM de Topografia" },
      {
        property: "og:description",
        content: "Clientes PF e PJ com documentos, contatos e carteira vinculada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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

type Resumo = {
  imoveis: Record<string, number>;
  aberto: Record<string, number>;
  ultimo: Record<string, string>;
};

function inicial(nome: string): string {
  return nome.trim().slice(0, 1).toUpperCase() || "C";
}

function Pagina() {
  const { perfil } = usePerfil();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<"todos" | "pf" | "pj">("todos");

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

  const resumoQuery = useQuery({
    queryKey: ["clientes", "resumo-carteira"],
    queryFn: async (): Promise<Resumo> => {
      const [imoveis, orcamentos, oportunidades, mensagens] = await Promise.all([
        supabase.from("imoveis").select("cliente_id"),
        supabase.from("orcamentos").select("cliente_id, total, status"),
        supabase.from("oportunidades").select("id, cliente_id, criado_em"),
        supabase
          .from("mensagens")
          .select("oportunidade_id, criado_em")
          .order("criado_em", { ascending: false })
          .limit(3000),
      ]);
      if (imoveis.error) throw imoveis.error;
      if (orcamentos.error) throw orcamentos.error;
      if (oportunidades.error) throw oportunidades.error;
      if (mensagens.error) throw mensagens.error;

      const resumo: Resumo = { imoveis: {}, aberto: {}, ultimo: {} };
      for (const item of (imoveis.data ?? []) as { cliente_id: string | null }[]) {
        if (item.cliente_id)
          resumo.imoveis[item.cliente_id] = (resumo.imoveis[item.cliente_id] ?? 0) + 1;
      }
      for (const item of (orcamentos.data ?? []) as {
        cliente_id: string | null;
        total: number | null;
        status: string | null;
      }[]) {
        if (!item.cliente_id) continue;
        if (["aprovado", "recusado", "expirado"].includes(item.status ?? "")) continue;
        resumo.aberto[item.cliente_id] =
          (resumo.aberto[item.cliente_id] ?? 0) + Number(item.total ?? 0);
      }
      const oportunidadeCliente = new Map<string, string>();
      for (const item of (oportunidades.data ?? []) as {
        id: string;
        cliente_id: string | null;
        criado_em: string | null;
      }[]) {
        if (item.cliente_id) {
          oportunidadeCliente.set(item.id, item.cliente_id);
          if (item.criado_em && !resumo.ultimo[item.cliente_id])
            resumo.ultimo[item.cliente_id] = item.criado_em;
        }
      }
      for (const item of (mensagens.data ?? []) as {
        oportunidade_id: string | null;
        criado_em: string | null;
      }[]) {
        if (!item.oportunidade_id || !item.criado_em) continue;
        const clienteId = oportunidadeCliente.get(item.oportunidade_id);
        if (clienteId && !resumo.ultimo[clienteId]) resumo.ultimo[clienteId] = item.criado_em;
      }
      return resumo;
    },
  });

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const digitos = soDigitos(busca);
    return (clientes ?? []).filter((c) => {
      if (tipo !== "todos" && (c.tipo ?? "pf") !== tipo) return false;
      if (!termo) return true;
      const alvo =
        `${c.nome} ${c.nome_fantasia ?? ""} ${c.cidade ?? ""} ${c.uf ?? ""}`.toLowerCase();
      if (alvo.includes(termo)) return true;
      if (digitos.length === 0) return false;
      return (
        soDigitos(c.documento ?? "").includes(digitos) ||
        soDigitos(c.telefone ?? "").includes(digitos)
      );
    });
  }, [clientes, busca, tipo]);

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
      void queryClient.invalidateQueries({ queryKey: ["clientes"] });
      void navigate({ to: "/clientes/$id", params: { id } });
    },
  });

  const resumo = resumoQuery.data;
  const valorAberto = filtrados.reduce((soma, c) => soma + (resumo?.aberto[c.id] ?? 0), 0);
  const totalImoveis = filtrados.reduce((soma, c) => soma + (resumo?.imoveis[c.id] ?? 0), 0);

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Users className="size-6 text-primary" strokeWidth={2.5} />
          Clientes
        </h1>
        <Button
          onClick={() => criar.mutate()}
          disabled={criar.isPending}
          className="h-11 px-4 text-base"
        >
          {criar.isPending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Plus className="size-5" strokeWidth={3} />
          )}
          Novo cliente
        </Button>
      </header>

      <BarraFerramentas>
        <div className="relative min-w-64 flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            strokeWidth={2.5}
          />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, documento ou telefone"
            className="h-11 rounded-full border pl-11"
          />
        </div>
        <div className="seg">
          {(["todos", "pf", "pj"] as const).map((item) => (
            <button
              key={item}
              type="button"
              data-ativo={tipo === item}
              onClick={() => setTipo(item)}
              className="seg-item"
            >
              {item === "todos" ? "Todos" : item.toUpperCase()}
            </button>
          ))}
        </div>
      </BarraFerramentas>

      <div className="grade-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CartaoIndicador
          icone={Users}
          valor={filtrados.length}
          rotulo="Clientes no filtro"
          apoio={`de ${(clientes ?? []).length} cadastrados`}
          destino="/imoveis"
        />
        <CartaoIndicador
          icone={Building2}
          valor={totalImoveis}
          rotulo="Imóveis vinculados"
          apoio="na carteira filtrada"
          destino="/imoveis"
        />
        <CartaoIndicador
          icone={CircleDollarSign}
          valor={reais(valorAberto)}
          rotulo="Em aberto"
          apoio="orçamentos em decisão"
          tom="atencao"
          destino="/orcamentos"
        />
      </div>

      <Painel
        titulo="Carteira de clientes"
        icone={Users}
        acao={
          <span className="text-sm font-bold text-muted-foreground">{filtrados.length} itens</span>
        }
      >
        {error ? (
          <p className="text-base font-bold text-destructive">
            Não foi possível carregar os clientes.
          </p>
        ) : isPending ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : filtrados.length === 0 ? (
          <p className="text-base font-medium text-muted-foreground">Nenhum cliente encontrado.</p>
        ) : (
          <Tabela>
            <table className="w-full min-w-[1040px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border text-xs font-bold uppercase text-muted-foreground">
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Documento</th>
                  <th className="px-3 py-2">Telefone</th>
                  <th className="px-3 py-2 text-center">Imóveis</th>
                  <th className="px-3 py-2 text-right">Em aberto</th>
                  <th className="px-3 py-2">Último contato</th>
                  <th className="px-3 py-2">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-3">
                      <Link
                        to="/clientes/$id"
                        params={{ id: c.id }}
                        className="flex items-center gap-3 text-foreground hover:text-primary"
                      >
                        <Avatar className="size-9 border border-border">
                          <AvatarFallback>{inicial(c.nome)}</AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block truncate font-extrabold">{c.nome}</span>
                          {c.nome_fantasia ? (
                            <span className="block truncate text-sm font-semibold text-muted-foreground">
                              {c.nome_fantasia}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold text-muted-foreground">
                      {c.documento ? mascaraDocumento(c.documento, c.tipo ?? "pf") : "—"}
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold text-foreground">
                      {c.telefone ? mascaraTelefone(c.telefone) : "—"}
                    </td>
                    <td className="px-3 py-3 text-center text-sm font-extrabold text-foreground">
                      {resumo?.imoveis[c.id] ?? 0}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-extrabold text-foreground">
                      {reais(resumo?.aberto[c.id] ?? 0)}
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold text-muted-foreground">
                      {resumo?.ultimo[c.id] ? dataBR(resumo.ultimo[c.id]) : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <Badge
                        variant="outline"
                        className="gap-1.5 rounded-full border-border bg-card px-2.5 py-1 text-xs text-foreground"
                      >
                        <span
                          className={`size-2 rounded-full ${(c.tipo ?? "pf") === "pj" ? "bg-primary" : "bg-muted-foreground"}`}
                          aria-hidden
                        />
                        {rotulo(c.tipo ?? "pf")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tabela>
        )}
      </Painel>
    </section>
  );
}
