import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileDown, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { Bloco, Campo, CampoLongo, Grade } from "@/components/campos";
import { data as dataBR, paraNumero, reais, rotulo } from "@/lib/formato";
import { SERVICOS } from "@/lib/funil";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/orcamentos/$id")({
  head: () => ({
    meta: [
      { title: "Orçamento | CRM de Topografia" },
      {
        name: "description",
        content: "Itens, desconto, validade e status do orçamento, com criação da ordem de serviço.",
      },
      { property: "og:title", content: "Orçamento | CRM de Topografia" },
      {
        property: "og:description",
        content: "Detalhes do orçamento com itens e totais calculados.",
      },
    ],
  }),
  component: Pagina,
});

type Orcamento = {
  id: string;
  empresa_id: string;
  cliente_id: string | null;
  imovel_id: string | null;
  oportunidade_id: string | null;
  numero: string | null;
  status: string | null;
  total: number | null;
  desconto: number | null;
  validade_dias: number | null;
  prazo_execucao: string | null;
  condicoes: string | null;
  criado_em: string | null;
  enviado_em: string | null;
};

type Item = {
  id: string;
  descricao: string | null;
  quantidade: number | null;
  valor_unitario: number | null;
  ordem: number | null;
};

function Pagina() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { perfil } = usePerfil();
  const [osAberta, setOsAberta] = useState(false);
  const [servicoOs, setServicoOs] = useState(SERVICOS[0]?.valor ?? "georreferenciamento");

  const orcamentoQuery = useQuery({
    queryKey: ["orcamento", id],
    queryFn: async (): Promise<Orcamento | null> => {
      const { data: linha, error } = await supabase
        .from("orcamentos")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (linha as Orcamento | null) ?? null;
    },
  });

  const itensQuery = useQuery({
    queryKey: ["orcamento", id, "itens"],
    queryFn: async (): Promise<Item[]> => {
      const { data: linhas, error } = await supabase
        .from("orcamento_itens")
        .select("id, descricao, quantidade, valor_unitario, ordem")
        .eq("orcamento_id", id)
        .order("ordem");
      if (error) throw error;
      return (linhas ?? []) as Item[];
    },
  });

  const orcamento = orcamentoQuery.data ?? null;

  const clienteQuery = useQuery({
    queryKey: ["cliente", orcamento?.cliente_id],
    enabled: !!orcamento?.cliente_id,
    queryFn: async () => {
      const { data: linha, error } = await supabase
        .from("clientes")
        .select("id, nome, telefone")
        .eq("id", orcamento?.cliente_id as string)
        .maybeSingle();
      if (error) throw error;
      return linha as { id: string; nome: string; telefone: string | null } | null;
    },
  });

  const imovelQuery = useQuery({
    queryKey: ["imovel", orcamento?.imovel_id, "resumo"],
    enabled: !!orcamento?.imovel_id,
    queryFn: async () => {
      const { data: linha, error } = await supabase
        .from("imoveis")
        .select("id, nome, municipio, uf")
        .eq("id", orcamento?.imovel_id as string)
        .maybeSingle();
      if (error) throw error;
      return linha as {
        id: string;
        nome: string;
        municipio: string | null;
        uf: string | null;
      } | null;
    },
  });

  function recarregar() {
    void queryClient.invalidateQueries({ queryKey: ["orcamento", id] });
    void queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
  }

  const salvarCampo = useMutation({
    mutationFn: async (mudanca: Record<string, unknown>) => {
      const { error } = await supabase.from("orcamentos").update(mudanca).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      recarregar();
      toast.success("Salvo.");
    },
    onError: () => toast.error("Não foi possível salvar."),
  });

  const salvarItem = useMutation({
    mutationFn: async ({ itemId, mudanca }: { itemId: string; mudanca: Record<string, unknown> }) => {
      const { error } = await supabase.from("orcamento_itens").update(mudanca).eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: recarregar,
    onError: () => toast.error("Não foi possível salvar o item."),
  });

  const adicionarItem = useMutation({
    mutationFn: async () => {
      const proxima = (itensQuery.data ?? []).length + 1;
      const { error } = await supabase.from("orcamento_itens").insert({
        orcamento_id: id,
        descricao: "Novo item",
        quantidade: 1,
        valor_unitario: 0,
        ordem: proxima,
      });
      if (error) throw error;
    },
    onSuccess: recarregar,
    onError: () => toast.error("Não foi possível adicionar o item."),
  });

  const removerItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("orcamento_itens").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: recarregar,
    onError: () => toast.error("Não foi possível remover o item."),
  });

  // Ao sair de rascunho, o número vem da função do banco.
  const mudarStatus = useMutation({
    mutationFn: async (novo: string) => {
      if (!orcamento) throw new Error("Orçamento não carregado.");
      const mudanca: Record<string, unknown> = { status: novo };

      if (novo !== "rascunho" && !orcamento.numero) {
        const { data: numeroNovo, error: erroRpc } = await supabase.rpc("proximo_numero", {
          p_empresa: orcamento.empresa_id,
          p_tipo: "orcamento",
        });
        if (erroRpc) throw erroRpc;
        mudanca['numero'] = numeroNovo;
      }
      if (novo === "enviado" && !orcamento.enviado_em) {
        mudanca['enviado_em'] = new Date().toISOString();
      }

      const { error } = await supabase.from("orcamentos").update(mudanca).eq("id", id);
      if (error) throw error;
      return novo;
    },
    onSuccess: (novo) => {
      recarregar();
      toast.success(`Orçamento ${rotulo(novo).toLowerCase()}.`);
      if (novo === "aprovado") setOsAberta(true);
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível mudar o status."),
  });

  const criarOs = useMutation({
    mutationFn: async () => {
      if (!orcamento || !perfil) throw new Error("Dados não carregados.");
      let numeroOs: string | null = null;
      const { data: gerado, error: erroRpc } = await supabase.rpc("proximo_numero", {
        p_empresa: orcamento.empresa_id,
        p_tipo: "os",
      });
      if (!erroRpc) numeroOs = gerado as string;

      const { data: nova, error } = await supabase
        .from("ordens_servico")
        .insert({
          empresa_id: orcamento.empresa_id,
          cliente_id: orcamento.cliente_id,
          imovel_id: orcamento.imovel_id,
          numero: numeroOs,
          servico: servicoOs,
          status: "aguardando_documentos",
          observacoes: orcamento.numero ? `Gerada do orçamento nº ${orcamento.numero}` : null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return nova.id as string;
    },
    onSuccess: () => {
      setOsAberta(false);
      void queryClient.invalidateQueries({ queryKey: ["ordens_servico"] });
      toast.success("Ordem de serviço criada.");
      void navigate({ to: "/servicos" });
    },
    onError: () => toast.error("Não foi possível criar a ordem de serviço."),
  });

  if (orcamentoQuery.isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orcamentoQuery.error || !orcamento) {
    return (
      <section>
        <Link to="/orcamentos" className="text-lg font-extrabold text-primary">
          Voltar para orçamentos
        </Link>
        <p className="mt-4 text-lg font-semibold text-destructive">
          Orçamento não encontrado.
        </p>
      </section>
    );
  }

  const itens = itensQuery.data ?? [];
  const totalItens = itens.reduce(
    (soma, i) => soma + (i.quantidade ?? 0) * (i.valor_unitario ?? 0),
    0,
  );
  const totalTela = Math.max(0, totalItens - (orcamento.desconto ?? 0));

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/orcamentos"
          className="flex size-12 items-center justify-center rounded-xl border-2 border-border bg-card"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-6" strokeWidth={2.5} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">
            {orcamento.numero ? `Orçamento nº ${orcamento.numero}` : "Orçamento (rascunho)"}
          </h1>
          <p className="text-base font-semibold text-muted-foreground">
            Criado em {dataBR(orcamento.criado_em)} · {rotulo(orcamento.status)}
          </p>
        </div>
      </div>

      <Bloco titulo="Cliente e imóvel">
        <div className="space-y-2 text-lg font-bold text-foreground">
          {clienteQuery.data ? (
            <Link
              to="/clientes/$id"
              params={{ id: clienteQuery.data.id }}
              className="block text-primary"
            >
              {clienteQuery.data.nome}
            </Link>
          ) : (
            <p className="text-muted-foreground">Cliente não vinculado</p>
          )}
          {imovelQuery.data ? (
            <Link
              to="/imoveis/$id"
              params={{ id: imovelQuery.data.id }}
              className="block text-primary"
            >
              {imovelQuery.data.nome}
              <span className="ml-2 text-base font-medium text-muted-foreground">
                {[imovelQuery.data.municipio, imovelQuery.data.uf].filter(Boolean).join(" / ")}
              </span>
            </Link>
          ) : (
            <p className="text-muted-foreground">Imóvel não vinculado</p>
          )}
        </div>
      </Bloco>

      <Bloco
        titulo="Itens"
        acao={
          <Button
            type="button"
            variant="outline"
            onClick={() => adicionarItem.mutate()}
            className="h-12 rounded-xl border-2 text-base font-extrabold"
          >
            <Plus className="size-5" strokeWidth={3} />
            Item
          </Button>
        }
      >
        {itensQuery.isPending ? (
          <Loader2 className="size-7 animate-spin text-primary" />
        ) : itens.length === 0 ? (
          <p className="text-lg font-medium text-muted-foreground">Nenhum item ainda.</p>
        ) : (
          <ul className="space-y-3">
            {itens.map((item) => (
              <li key={item.id} className="rounded-2xl border-2 border-border p-3">
                <Input
                  defaultValue={item.descricao ?? ""}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v !== (item.descricao ?? "").trim())
                      salvarItem.mutate({ itemId: item.id, mudanca: { descricao: v } });
                  }}
                  placeholder="Descrição"
                  className="h-14 rounded-xl border-2 text-lg font-semibold"
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Input
                    defaultValue={item.quantidade ?? 1}
                    inputMode="decimal"
                    onBlur={(e) =>
                      salvarItem.mutate({
                        itemId: item.id,
                        mudanca: { quantidade: paraNumero(e.target.value) ?? 0 },
                      })
                    }
                    placeholder="Quantidade"
                    className="h-14 rounded-xl border-2 text-lg font-semibold"
                  />
                  <Input
                    defaultValue={item.valor_unitario ?? 0}
                    inputMode="decimal"
                    onBlur={(e) =>
                      salvarItem.mutate({
                        itemId: item.id,
                        mudanca: { valor_unitario: paraNumero(e.target.value) ?? 0 },
                      })
                    }
                    placeholder="Valor unitário"
                    className="h-14 rounded-xl border-2 text-lg font-semibold"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-extrabold text-foreground">
                    {reais((item.quantidade ?? 0) * (item.valor_unitario ?? 0))}
                  </span>
                  <button
                    type="button"
                    onClick={() => removerItem.mutate(item.id)}
                    className="flex items-center gap-1 text-base font-extrabold text-destructive"
                  >
                    <Trash2 className="size-5" strokeWidth={2.5} />
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 rounded-2xl bg-accent p-4">
          <p className="text-base font-bold text-accent-foreground">
            Itens: {reais(totalItens)} · Desconto: {reais(orcamento.desconto ?? 0)}
          </p>
          <p className="text-2xl font-extrabold text-foreground">Total {reais(totalTela)}</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            Total gravado no banco: {reais(orcamento.total)}
          </p>
        </div>
      </Bloco>

      <Bloco titulo="Condições">
        <Grade>
          <Campo
            rotulo="Desconto (R$)"
            valor={orcamento.desconto === null ? "" : String(orcamento.desconto).replace(".", ",")}
            inputMode="decimal"
            onSalvar={(v) => salvarCampo.mutate({ desconto: paraNumero(v) ?? 0 })}
          />
          <Campo
            rotulo="Validade (dias)"
            valor={orcamento.validade_dias === null ? "" : String(orcamento.validade_dias)}
            inputMode="numeric"
            onSalvar={(v) => salvarCampo.mutate({ validade_dias: paraNumero(v) })}
          />
          <Campo
            rotulo="Prazo de execução"
            valor={orcamento.prazo_execucao ?? ""}
            onSalvar={(v) => salvarCampo.mutate({ prazo_execucao: v || null })}
            larguraTotal
          />
        </Grade>
        <div className="mt-4">
          <CampoLongo
            rotulo="Condições de pagamento"
            valor={orcamento.condicoes ?? ""}
            onSalvar={(v) => salvarCampo.mutate({ condicoes: v || null })}
          />
        </div>
      </Bloco>

      <Bloco titulo="Status">
        <div className="flex flex-wrap gap-2">
          {["rascunho", "enviado", "aprovado", "recusado", "expirado"].map((s) => {
            const ativo = orcamento.status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  if (!ativo) mudarStatus.mutate(s);
                  else if (s === "aprovado") setOsAberta(true);
                }}
                className={`h-14 rounded-xl border-2 px-4 text-lg font-extrabold transition-colors ${
                  ativo
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-accent"
                }`}
              >
                {rotulo(s)}
              </button>
            );
          })}
        </div>
        <div className="mt-4">
          <Button
            type="button"
            disabled
            className="h-14 rounded-xl text-lg font-extrabold"
            title="Em breve"
          >
            <FileDown className="size-6" strokeWidth={2.5} />
            Gerar documento
          </Button>
          <p className="mt-1 text-base font-semibold text-muted-foreground">em breve</p>
        </div>
      </Bloco>

      <Dialog open={osAberta} onOpenChange={setOsAberta}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold">Criar ordem de serviço?</DialogTitle>
          </DialogHeader>
          <p className="text-lg font-semibold text-foreground">
            Cliente e imóvel deste orçamento já vêm preenchidos. Escolha o serviço:
          </p>
          <div className="flex flex-wrap gap-2">
            {SERVICOS.map((s) => {
              const ativo = servicoOs === s.valor;
              return (
                <button
                  key={s.valor}
                  type="button"
                  onClick={() => setServicoOs(s.valor)}
                  className={`h-14 rounded-xl border-2 px-4 text-lg font-extrabold transition-colors ${
                    ativo
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-accent"
                  }`}
                >
                  {s.rotulo}
                </button>
              );
            })}
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOsAberta(false)}
              className="h-14 rounded-xl border-2 text-lg font-extrabold"
            >
              Agora não
            </Button>
            <Button
              type="button"
              onClick={() => criarOs.mutate()}
              disabled={criarOs.isPending}
              className="h-14 rounded-xl text-lg font-extrabold"
            >
              {criarOs.isPending ? <Loader2 className="size-6 animate-spin" /> : null}
              Criar ordem de serviço
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
