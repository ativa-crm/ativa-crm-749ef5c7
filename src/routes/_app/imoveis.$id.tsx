import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  ClipboardList,
  FileText,
  Fence,
  Loader2,
  MapPinned,
  ScrollText,
  Trash2,
  User,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Bloco, Campo, CampoLongo, CampoOpcoes, Grade } from "@/components/campos";
import { areaHa, data, mascaraUF, numero, paraNumero, reais, rotulo } from "@/lib/formato";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/imoveis/$id")({
  head: () => ({
    meta: [
      { title: "Ficha do imóvel | CRM de Topografia" },
      {
        name: "description",
        content:
          "Ficha completa do imóvel: identificação, documentação, confrontantes, histórico de serviços e documentos.",
      },
      { property: "og:title", content: "Ficha do imóvel | CRM de Topografia" },
      {
        property: "og:description",
        content: "Identificação, documentação e histórico do imóvel.",
      },
    ],
  }),
  component: Pagina,
});

type Imovel = {
  id: string;
  empresa_id: string;
  cliente_id: string | null;
  nome: string;
  tipo: string | null;
  area_ha: number | null;
  municipio: string | null;
  uf: string | null;
  matricula: string | null;
  cartorio: string | null;
  ccir: string | null;
  codigo_incra: string | null;
  car: string | null;
  sigef: string | null;
  inscricao_municipal: string | null;
  confrontantes: string | null;
  observacoes: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

function Pagina() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [excluindo, setExcluindo] = useState(false);

  const imovelQuery = useQuery({
    queryKey: ["imovel", id],
    queryFn: async (): Promise<Imovel | null> => {
      const { data: linha, error } = await supabase
        .from("imoveis")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (linha as Imovel | null) ?? null;
    },
  });

  const clientesQuery = useQuery({
    queryKey: ["clientes", "resumo"],
    queryFn: async () => {
      const { data: linhas, error } = await supabase
        .from("clientes")
        .select("id, nome")
        .order("nome");
      if (error) throw error;
      return (linhas ?? []) as { id: string; nome: string }[];
    },
  });

  const oportunidadesQuery = useQuery({
    queryKey: ["imovel", id, "oportunidades"],
    queryFn: async () => {
      const { data: linhas, error } = await supabase
        .from("oportunidades")
        .select("id, servico, estagio, valor_estimado, criado_em")
        .eq("imovel_id", id)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return linhas ?? [];
    },
  });

  const orcamentosQuery = useQuery({
    queryKey: ["imovel", id, "orcamentos"],
    queryFn: async () => {
      const { data: linhas, error } = await supabase
        .from("orcamentos")
        .select("id, numero, status, total, criado_em")
        .eq("imovel_id", id)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return linhas ?? [];
    },
  });

  const ordensQuery = useQuery({
    queryKey: ["imovel", id, "ordens"],
    queryFn: async () => {
      const { data: linhas, error } = await supabase
        .from("ordens_servico")
        .select("id, numero, servico, status, prazo, criado_em")
        .eq("imovel_id", id)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return linhas ?? [];
    },
  });

  const documentosQuery = useQuery({
    queryKey: ["imovel", id, "documentos"],
    queryFn: async () => {
      const { data: linhas, error } = await supabase
        .from("documentos")
        .select("id, categoria, nome, url, criado_em")
        .eq("imovel_id", id)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return linhas ?? [];
    },
  });

  const salvar = useMutation({
    mutationFn: async (campos: Record<string, unknown>) => {
      const { error } = await supabase.from("imoveis").update(campos).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["imovel", id] });
      queryClient.invalidateQueries({ queryKey: ["imoveis"] });
      toast.success("Alteração salva");
    },
    onError: () => toast.error("Não foi possível salvar. Tente de novo."),
  });

  const excluir = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("imoveis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["imoveis"] });
      toast.success("Imóvel excluído");
      navigate({ to: "/imoveis" });
    },
    onError: () => toast.error("Não foi possível excluir este imóvel."),
  });

  if (imovelQuery.isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  const imovel = imovelQuery.data;

  if (imovelQuery.error || !imovel) {
    return (
      <section className="py-10 text-center">
        <h1 className="text-2xl font-extrabold text-foreground">Imóvel não encontrado</h1>
        <p className="mt-2 text-lg font-medium text-muted-foreground">
          Ele pode ter sido excluído ou pertence a outra empresa.
        </p>
        <Button asChild className="mt-6 h-14 rounded-xl px-6 text-lg font-extrabold">
          <Link to="/imoveis">Voltar para imóveis</Link>
        </Button>
      </section>
    );
  }

  const troca = (campo: string) => (v: string) =>
    salvar.mutate({ [campo]: v === "" ? null : v });

  return (
    <section className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <Link
          to="/imoveis"
          className="flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-card text-foreground"
          aria-label="Voltar para a lista de imóveis"
        >
          <ArrowLeft className="size-6" strokeWidth={2.5} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold text-foreground md:text-3xl">
            {imovel.nome}
          </h1>
          <p className="truncate text-base font-semibold text-muted-foreground">
            {imovel.municipio || "Município não informado"}
            {imovel.uf ? ` · ${imovel.uf}` : ""} ·{" "}
            {imovel.area_ha !== null ? areaHa(imovel.area_ha) : "área não informada"}
          </p>
        </div>
      </div>

      <Bloco titulo="Identificação" Icone={MapPinned}>
        <Grade>
          <Campo
            rotulo="Nome do imóvel"
            valor={imovel.nome ?? ""}
            onSalvar={(v) => salvar.mutate({ nome: v === "" ? "Sem nome" : v })}
            larguraTotal
          />
          <CampoOpcoes
            rotulo="Tipo"
            valor={imovel.tipo ?? "rural"}
            opcoes={[
              { valor: "rural", rotulo: "Rural" },
              { valor: "urbano", rotulo: "Urbano" },
            ]}
            onSalvar={(v) => salvar.mutate({ tipo: v })}
          />
          <Campo
            rotulo="Área (ha)"
            valor={imovel.area_ha !== null ? numero(imovel.area_ha, 4) : ""}
            inputMode="decimal"
            onSalvar={(v) => salvar.mutate({ area_ha: paraNumero(v) })}
          />
          <Campo rotulo="Município" valor={imovel.municipio ?? ""} onSalvar={troca("municipio")} />
          <Campo
            rotulo="UF"
            valor={imovel.uf ?? ""}
            mascara={mascaraUF}
            onSalvar={troca("uf")}
          />
        </Grade>

        <div className="mt-4">
          <span className="text-base font-bold text-foreground">Cliente vinculado</span>
          <select
            value={imovel.cliente_id ?? ""}
            onChange={(e) =>
              salvar.mutate({ cliente_id: e.target.value === "" ? null : e.target.value })
            }
            className="mt-1.5 h-14 w-full rounded-xl border-2 border-border bg-card px-3 text-lg font-bold text-foreground"
          >
            <option value="">Sem cliente vinculado</option>
            {(clientesQuery.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          {imovel.cliente_id ? (
            <Link
              to="/clientes/$id"
              params={{ id: imovel.cliente_id }}
              className="mt-2 inline-flex items-center gap-2 text-base font-extrabold text-primary underline"
            >
              <User className="size-5" strokeWidth={2.5} />
              Abrir ficha do cliente
            </Link>
          ) : null}
        </div>
      </Bloco>

      <Bloco titulo="Documentação" Icone={FileText}>
        <Grade>
          <Campo rotulo="Matrícula" valor={imovel.matricula ?? ""} onSalvar={troca("matricula")} />
          <Campo rotulo="Cartório" valor={imovel.cartorio ?? ""} onSalvar={troca("cartorio")} />
          <Campo rotulo="CCIR" valor={imovel.ccir ?? ""} onSalvar={troca("ccir")} />
          <Campo
            rotulo="Código INCRA"
            valor={imovel.codigo_incra ?? ""}
            onSalvar={troca("codigo_incra")}
          />
          <Campo rotulo="CAR" valor={imovel.car ?? ""} onSalvar={troca("car")} />
          <Campo rotulo="SIGEF" valor={imovel.sigef ?? ""} onSalvar={troca("sigef")} />
          <Campo
            rotulo="Inscrição municipal"
            valor={imovel.inscricao_municipal ?? ""}
            onSalvar={troca("inscricao_municipal")}
            larguraTotal
          />
        </Grade>
      </Bloco>

      <Bloco titulo="Confrontantes" Icone={Fence}>
        <CampoLongo
          rotulo="Confrontantes"
          valor={imovel.confrontantes ?? ""}
          onSalvar={troca("confrontantes")}
          placeholder="Ex.: Norte — Sítio São José; Sul — Estrada municipal"
        />
        <div className="mt-4">
          <CampoLongo
            rotulo="Observações"
            valor={imovel.observacoes ?? ""}
            onSalvar={troca("observacoes")}
          />
        </div>
      </Bloco>

      <Bloco titulo="Histórico" Icone={ScrollText}>
        <div className="space-y-5">
          <Historico
            titulo="Oportunidades"
            vazio="Nenhuma oportunidade para este imóvel."
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
          <Historico
            titulo="Orçamentos"
            vazio="Nenhum orçamento para este imóvel."
            itens={(orcamentosQuery.data ?? []).map((o) => ({
              chave: o.id as string,
              principal: `Orçamento ${o.numero as string}`,
              secundario: `${rotulo((o.status as string | null) ?? "")} · ${data(o.criado_em as string)}`,
              extra: reais(o.total as number),
            }))}
          />
          <Historico
            titulo="Ordens de serviço"
            vazio="Nenhuma ordem de serviço para este imóvel."
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

      <Bloco titulo="Documentos" Icone={ClipboardList}>
        {(documentosQuery.data ?? []).length === 0 ? (
          <p className="text-lg font-medium text-muted-foreground">
            Nenhum documento vinculado a este imóvel.
          </p>
        ) : (
          <ul className="space-y-3">
            {(documentosQuery.data ?? []).map((d) => (
              <li key={d.id as string}>
                <a
                  href={d.url as string}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border bg-card p-4 transition-colors hover:bg-accent"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-lg font-extrabold text-foreground">
                      {d.nome as string}
                    </span>
                    <span className="block text-base font-semibold text-muted-foreground">
                      {rotulo((d.categoria as string | null) ?? "") || "Sem categoria"} ·{" "}
                      {data(d.criado_em as string)}
                    </span>
                  </span>
                  <ExternalLink className="size-6 shrink-0 text-primary" strokeWidth={2.5} />
                </a>
              </li>
            ))}
          </ul>
        )}
      </Bloco>

      <div className="rounded-3xl border-2 border-border bg-card p-4">
        {excluindo ? (
          <div className="space-y-3">
            <p className="text-lg font-bold text-foreground">
              Excluir este imóvel? Essa ação não pode ser desfeita.
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
            Excluir imóvel
          </Button>
        )}
      </div>
    </section>
  );
}

function Historico({
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
