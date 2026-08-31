import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Loader2,
  MapPinned,
  Phone,
  ScrollText,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Bloco, Campo, CampoLongo, CampoOpcoes, Grade } from "@/components/campos";
import {
  areaHa,
  data,
  mascaraDocumento,
  mascaraTelefone,
  mascaraUF,
  reais,
  rotulo,
} from "@/lib/formato";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/clientes/$id")({
  head: () => ({
    meta: [
      { title: "Ficha do cliente | CRM de Topografia" },
      {
        name: "description",
        content:
          "Ficha do cliente com dados de pessoa física ou jurídica, contato, imóveis vinculados e histórico.",
      },
      { property: "og:title", content: "Ficha do cliente | CRM de Topografia" },
      {
        property: "og:description",
        content: "Dados, contato, imóveis e histórico do cliente.",
      },
    ],
  }),
  component: Pagina,
});

type Cliente = {
  id: string;
  empresa_id: string;
  tipo: string | null;
  nome: string;
  nome_fantasia: string | null;
  documento: string | null;
  telefone: string | null;
  email: string | null;
  cidade: string | null;
  uf: string | null;
  endereco: string | null;
  observacoes: string | null;
  origem: string | null;
  criado_em: string | null;
};

function Pagina() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [excluindo, setExcluindo] = useState(false);

  const clienteQuery = useQuery({
    queryKey: ["cliente", id],
    queryFn: async (): Promise<Cliente | null> => {
      const { data: linha, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (linha as Cliente | null) ?? null;
    },
  });

  const imoveisQuery = useQuery({
    queryKey: ["cliente", id, "imoveis"],
    queryFn: async () => {
      const { data: linhas, error } = await supabase
        .from("imoveis")
        .select("id, nome, municipio, uf, area_ha, tipo")
        .eq("cliente_id", id)
        .order("nome");
      if (error) throw error;
      return linhas ?? [];
    },
  });

  const oportunidadesQuery = useQuery({
    queryKey: ["cliente", id, "oportunidades"],
    queryFn: async () => {
      const { data: linhas, error } = await supabase
        .from("oportunidades")
        .select("id, servico, estagio, valor_estimado, criado_em")
        .eq("cliente_id", id)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return linhas ?? [];
    },
  });

  const orcamentosQuery = useQuery({
    queryKey: ["cliente", id, "orcamentos"],
    queryFn: async () => {
      const { data: linhas, error } = await supabase
        .from("orcamentos")
        .select("id, numero, status, total, criado_em")
        .eq("cliente_id", id)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return linhas ?? [];
    },
  });

  const ordensQuery = useQuery({
    queryKey: ["cliente", id, "ordens"],
    queryFn: async () => {
      const { data: linhas, error } = await supabase
        .from("ordens_servico")
        .select("id, numero, servico, status, prazo, criado_em")
        .eq("cliente_id", id)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return linhas ?? [];
    },
  });

  const salvar = useMutation({
    mutationFn: async (campos: Record<string, unknown>) => {
      const { error } = await supabase.from("clientes").update(campos).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cliente", id] });
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Alteração salva");
    },
    onError: () => toast.error("Não foi possível salvar. Tente de novo."),
  });

  const excluir = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente excluído");
      navigate({ to: "/clientes" });
    },
    onError: () =>
      toast.error("Não foi possível excluir. Verifique se há imóveis ou serviços vinculados."),
  });

  if (clienteQuery.isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  const cliente = clienteQuery.data;

  if (clienteQuery.error || !cliente) {
    return (
      <section className="py-10 text-center">
        <h1 className="text-2xl font-extrabold text-foreground">Cliente não encontrado</h1>
        <p className="mt-2 text-lg font-medium text-muted-foreground">
          Ele pode ter sido excluído ou pertence a outra empresa.
        </p>
        <Button asChild className="mt-6 h-14 rounded-xl px-6 text-lg font-extrabold">
          <Link to="/clientes">Voltar para clientes</Link>
        </Button>
      </section>
    );
  }

  const pj = (cliente.tipo ?? "pf") === "pj";
  const troca = (campo: string) => (v: string) =>
    salvar.mutate({ [campo]: v === "" ? null : v });

  return (
    <section className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <Link
          to="/clientes"
          className="flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-card text-foreground"
          aria-label="Voltar para a lista de clientes"
        >
          <ArrowLeft className="size-6" strokeWidth={2.5} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold text-foreground md:text-3xl">
            {cliente.nome}
          </h1>
          <p className="truncate text-base font-semibold text-muted-foreground">
            {rotulo(cliente.tipo ?? "pf")}
            {cliente.cidade ? ` · ${cliente.cidade}` : ""}
            {cliente.uf ? ` · ${cliente.uf}` : ""}
          </p>
        </div>
      </div>

      <Bloco titulo="Dados do cliente" Icone={UserRound}>
        <Grade>
          <CampoOpcoes
            rotulo="Tipo de cliente"
            valor={cliente.tipo ?? "pf"}
            opcoes={[
              { valor: "pf", rotulo: "Pessoa física" },
              { valor: "pj", rotulo: "Pessoa jurídica" },
            ]}
            onSalvar={(v) => salvar.mutate({ tipo: v })}
            larguraTotal
          />
          <Campo
            rotulo={pj ? "Razão social" : "Nome completo"}
            valor={cliente.nome ?? ""}
            onSalvar={(v) => salvar.mutate({ nome: v === "" ? "Sem nome" : v })}
            larguraTotal
          />
          {pj ? (
            <Campo
              rotulo="Nome fantasia"
              valor={cliente.nome_fantasia ?? ""}
              onSalvar={troca("nome_fantasia")}
              larguraTotal
            />
          ) : null}
          <Campo
            rotulo={pj ? "CNPJ" : "CPF"}
            valor={mascaraDocumento(cliente.documento ?? "", cliente.tipo ?? "pf")}
            mascara={(v) => mascaraDocumento(v, cliente.tipo ?? "pf")}
            inputMode="numeric"
            onSalvar={troca("documento")}
          />
          <Campo rotulo="Origem" valor={cliente.origem ?? ""} onSalvar={troca("origem")} />
        </Grade>
      </Bloco>

      <Bloco titulo="Contato e endereço" Icone={Phone}>
        <Grade>
          <Campo
            rotulo="Telefone"
            valor={mascaraTelefone(cliente.telefone ?? "")}
            mascara={mascaraTelefone}
            inputMode="tel"
            onSalvar={troca("telefone")}
          />
          <Campo
            rotulo="E-mail"
            valor={cliente.email ?? ""}
            inputMode="email"
            onSalvar={troca("email")}
          />
          <Campo rotulo="Cidade" valor={cliente.cidade ?? ""} onSalvar={troca("cidade")} />
          <Campo
            rotulo="UF"
            valor={cliente.uf ?? ""}
            mascara={mascaraUF}
            onSalvar={troca("uf")}
          />
          <Campo
            rotulo="Endereço"
            valor={cliente.endereco ?? ""}
            onSalvar={troca("endereco")}
            larguraTotal
          />
        </Grade>
        <div className="mt-4">
          <CampoLongo
            rotulo="Observações"
            valor={cliente.observacoes ?? ""}
            onSalvar={troca("observacoes")}
          />
        </div>
        {cliente.telefone ? (
          <a
            href={`https://wa.me/55${(cliente.telefone ?? "").replace(/\D+/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex h-14 items-center justify-center rounded-xl bg-primary px-5 text-lg font-extrabold text-primary-foreground"
          >
            Falar no WhatsApp
          </a>
        ) : null}
      </Bloco>

      <Bloco titulo="Imóveis do cliente" Icone={MapPinned}>
        {(imoveisQuery.data ?? []).length === 0 ? (
          <p className="text-lg font-medium text-muted-foreground">
            Nenhum imóvel vinculado a este cliente.
          </p>
        ) : (
          <ul className="space-y-3">
            {(imoveisQuery.data ?? []).map((i) => (
              <li key={i.id as string}>
                <Link
                  to="/imoveis/$id"
                  params={{ id: i.id as string }}
                  className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border p-4 transition-colors hover:bg-accent"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-lg font-extrabold text-foreground">
                      {i.nome as string}
                    </span>
                    <span className="block truncate text-base font-semibold text-muted-foreground">
                      {(i.municipio as string | null) || "Município não informado"}
                      {i.uf ? ` · ${i.uf as string}` : ""} ·{" "}
                      {rotulo((i.tipo as string | null) ?? "rural")}
                    </span>
                  </span>
                  <span className="shrink-0 text-base font-extrabold text-foreground">
                    {i.area_ha !== null && i.area_ha !== undefined ? areaHa(i.area_ha as number) : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Bloco>

      <Bloco titulo="Histórico" Icone={ScrollText}>
        <div className="space-y-5">
          <Lista
            titulo="Oportunidades"
            vazio="Nenhuma oportunidade."
            itens={(oportunidadesQuery.data ?? []).map((o) => ({
              chave: o.id as string,
              principal: rotulo((o.servico as string | null) ?? "") || "Serviço não informado",
              secundario: `${rotulo((o.estagio as string | null) ?? "")} · ${data(o.criado_em as string)}`,
              extra:
                o.valor_estimado !== null && o.valor_estimado !== undefined
                  ? reais(o.valor_estimado as number)
                  : "",
            }))}
          />
          <Lista
            titulo="Orçamentos"
            vazio="Nenhum orçamento."
            itens={(orcamentosQuery.data ?? []).map((o) => ({
              chave: o.id as string,
              principal: `Orçamento ${o.numero as string}`,
              secundario: `${rotulo((o.status as string | null) ?? "")} · ${data(o.criado_em as string)}`,
              extra: reais(o.total as number),
            }))}
          />
          <Lista
            titulo="Ordens de serviço"
            vazio="Nenhuma ordem de serviço."
            itens={(ordensQuery.data ?? []).map((o) => ({
              chave: o.id as string,
              principal: `OS ${o.numero as string} · ${rotulo((o.servico as string | null) ?? "")}`,
              secundario: `${rotulo((o.status as string | null) ?? "")}${
                o.prazo ? ` · prazo ${data(o.prazo as string)}` : ""
              }`,
              extra: "",
            }))}
          />
        </div>
      </Bloco>

      <div className="rounded-3xl border-2 border-border bg-card p-4">
        {excluindo ? (
          <div className="space-y-3">
            <p className="text-lg font-bold text-foreground">
              Excluir este cliente? Essa ação não pode ser desfeita.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="destructive"
                onClick={() => excluir.mutate()}
                disabled={excluir.isPending}
                className="h-14 rounded-xl px-5 text-lg font-extrabold"
              >
                {excluir.isPending ? <Loader2 className="size-6 animate-spin" /> : null}
                Sim, excluir
              </Button>
              <Button
                variant="outline"
                onClick={() => setExcluindo(false)}
                className="h-14 rounded-xl border-2 px-5 text-lg font-extrabold"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setExcluindo(true)}
            className="h-14 rounded-xl border-2 px-5 text-lg font-extrabold text-destructive"
          >
            <Trash2 className="size-6" strokeWidth={2.5} />
            Excluir cliente
          </Button>
        )}
      </div>
    </section>
  );
}

function Lista({
  titulo,
  itens,
  vazio,
}: {
  titulo: string;
  itens: { chave: string; principal: string; secundario: string; extra: string }[];
  vazio: string;
}) {
  return (
    <div>
      <h3 className="text-lg font-extrabold text-foreground">{titulo}</h3>
      {itens.length === 0 ? (
        <p className="mt-1 text-base font-medium text-muted-foreground">{vazio}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {itens.map((i) => (
            <li
              key={i.chave}
              className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border p-3"
            >
              <span className="min-w-0">
                <span className="block truncate text-lg font-bold text-foreground">
                  {i.principal}
                </span>
                <span className="block text-base font-semibold text-muted-foreground">
                  {i.secundario}
                </span>
              </span>
              {i.extra ? (
                <span className="shrink-0 text-lg font-extrabold text-foreground">{i.extra}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
