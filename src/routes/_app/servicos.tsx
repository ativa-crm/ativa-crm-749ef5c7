import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Search, Wrench } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { data as dataBR, rotulo } from "@/lib/formato";
import { SERVICOS } from "@/lib/funil";
import { STATUS_OS, semaforoPrazo } from "@/lib/prazo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços | CRM de Topografia" },
      {
        name: "description",
        content:
          "Ordens de serviço agrupadas por status, com semáforo de prazo e checklist técnico.",
      },
      { property: "og:title", content: "Serviços | CRM de Topografia" },
      {
        property: "og:description",
        content: "Ordens de serviço por status, com prazos em verde, âmbar e vermelho.",
      },
    ],
  }),
  component: Pagina,
});

type Ordem = {
  id: string;
  numero: string | null;
  servico: string | null;
  status: string | null;
  prazo: string | null;
  criado_em: string | null;
  clientes: { nome: string | null } | { nome: string | null }[] | null;
  imoveis: { nome: string | null; municipio: string | null } | { nome: string | null; municipio: string | null }[] | null;
};

function um<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

const CLASSE_SELECT =
  "mt-1.5 h-14 w-full rounded-xl border-2 border-border bg-card px-3 text-lg font-semibold text-foreground";

function Pagina() {
  const [busca, setBusca] = useState("");
  const [novaAberta, setNovaAberta] = useState(false);

  const ordensQuery = useQuery({
    queryKey: ["ordens_servico"],
    queryFn: async (): Promise<Ordem[]> => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select(
          "id, numero, servico, status, prazo, criado_em, clientes(nome), imoveis(nome, municipio)",
        )
        .order("prazo", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as unknown as Ordem[];
    },
  });

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return ordensQuery.data ?? [];
    return (ordensQuery.data ?? []).filter((o) =>
      `${o.numero ?? ""} ${um(o.clientes)?.nome ?? ""} ${um(o.imoveis)?.nome ?? ""} ${
        um(o.imoveis)?.municipio ?? ""
      } ${rotulo(o.servico)}`
        .toLowerCase()
        .includes(termo),
    );
  }, [ordensQuery.data, busca]);

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-3xl font-extrabold text-foreground">
          <Wrench className="size-8 text-primary" strokeWidth={2.5} />
          Serviços
        </h1>
        <Button
          onClick={() => setNovaAberta(true)}
          className="h-14 rounded-xl px-5 text-lg font-extrabold"
        >
          <Plus className="size-6" strokeWidth={3} />
          Nova OS
        </Button>
      </header>

      <div className="relative mt-4">
        <Search className="absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por número, cliente, imóvel ou serviço"
          className="h-14 rounded-xl border-2 pl-12 text-lg font-semibold"
        />
      </div>

      {ordensQuery.isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : ordensQuery.error ? (
        <p className="mt-6 text-lg font-semibold text-destructive">
          Não foi possível carregar as ordens de serviço.
        </p>
      ) : filtradas.length === 0 ? (
        <p className="mt-6 text-lg font-medium text-muted-foreground">
          Nenhuma ordem de serviço encontrada.
        </p>
      ) : (
        <div className="mt-5 space-y-6">
          {STATUS_OS.map((s) => {
            const grupo = filtradas.filter((o) => (o.status ?? "") === s.valor);
            if (grupo.length === 0) return null;
            return (
              <div key={s.valor}>
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-foreground">
                  {s.rotulo}
                  <span className="rounded-lg bg-muted px-2 py-0.5 text-base font-extrabold text-muted-foreground">
                    {grupo.length}
                  </span>
                </h2>
                <div className="mt-2 space-y-2">
                  {grupo.map((o) => (
                    <Cartao key={o.id} ordem={o} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NovaOs aberta={novaAberta} onFechar={() => setNovaAberta(false)} />
    </section>
  );
}

function Cartao({ ordem }: { ordem: Ordem }) {
  const sem = semaforoPrazo(ordem.prazo, ordem.status);
  const cliente = um(ordem.clientes)?.nome ?? "sem cliente";
  const imovel = um(ordem.imoveis);
  return (
    <Link
      to="/servicos/$id"
      params={{ id: ordem.id }}
      className="block rounded-2xl border-2 border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold text-foreground">
            {ordem.numero ? `OS ${ordem.numero}` : "OS sem número"} · {cliente}
          </p>
          <p className="truncate text-base font-semibold text-muted-foreground">
            {imovel?.nome ?? "sem imóvel"}
            {imovel?.municipio ? ` · ${imovel.municipio}` : ""}
          </p>
          <p className="mt-1 text-base font-bold text-primary">{rotulo(ordem.servico)}</p>
        </div>
        <div className="shrink-0 text-right">
          <span className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-sm font-extrabold ${sem.cor}`}>
            <span className="size-2.5 rounded-full bg-current" />
            {sem.texto || "—"}
          </span>
          <p className="mt-1 text-sm font-bold text-muted-foreground">
            {ordem.prazo ? dataBR(ordem.prazo) : ""}
          </p>
        </div>
      </div>
    </Link>
  );
}

function NovaOs({ aberta, onFechar }: { aberta: boolean; onFechar: () => void }) {
  const { perfil } = usePerfil();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [clienteId, setClienteId] = useState("");
  const [imovelId, setImovelId] = useState("");
  const [servico, setServico] = useState("georreferenciamento");
  const [prazo, setPrazo] = useState("");

  useEffect(() => {
    if (!aberta) {
      setClienteId("");
      setImovelId("");
      setServico("georreferenciamento");
      setPrazo("");
    }
  }, [aberta]);

  const clientesQuery = useQuery({
    queryKey: ["clientes", "seletor"],
    enabled: aberta,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome")
        .order("nome", { ascending: true });
      if (error) throw error;
      return (data ?? []) as { id: string; nome: string | null }[];
    },
  });

  const imoveisQuery = useQuery({
    queryKey: ["imoveis", "seletor", clienteId],
    enabled: aberta && clienteId !== "",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imoveis")
        .select("id, nome, municipio")
        .eq("cliente_id", clienteId)
        .order("nome", { ascending: true });
      if (error) throw error;
      return (data ?? []) as { id: string; nome: string | null; municipio: string | null }[];
    },
  });

  const criar = useMutation({
    mutationFn: async () => {
      if (!perfil) throw new Error("Perfil não carregado.");
      if (!clienteId) throw new Error("Escolha o cliente.");

      let numero: string | null = null;
      const { data: gerado, error: erroNumero } = await supabase.rpc("proximo_numero", {
        p_empresa: perfil.empresa_id,
        p_tipo: "os",
      });
      if (!erroNumero) numero = gerado as string;

      const { data: nova, error } = await supabase
        .from("ordens_servico")
        .insert({
          empresa_id: perfil.empresa_id,
          cliente_id: clienteId,
          imovel_id: imovelId || null,
          numero,
          servico,
          status: "aguardando_documentos",
          prazo: prazo || null,
          responsavel_id: perfil.id,
        })
        .select("id")
        .single();
      if (error) throw error;

      const osId = nova.id as string;
      const { error: erroEtapas } = await supabase.rpc("criar_etapas_padrao", {
        p_os: osId,
        p_servico: servico,
      });
      if (erroEtapas) toast.error("OS criada, mas o checklist padrão não foi gerado.");
      return osId;
    },
    onSuccess: (osId) => {
      void queryClient.invalidateQueries({ queryKey: ["ordens_servico"] });
      onFechar();
      toast.success("Ordem de serviço criada.");
      void navigate({ to: "/servicos/$id", params: { id: osId } });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível criar a OS."),
  });

  return (
    <Dialog open={aberta} onOpenChange={(v) => (v ? null : onFechar())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-2">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">Nova ordem de serviço</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-base font-bold text-foreground">Cliente</Label>
            <select
              value={clienteId}
              onChange={(e) => {
                setClienteId(e.target.value);
                setImovelId("");
              }}
              className={CLASSE_SELECT}
            >
              <option value="">Escolha o cliente</option>
              {(clientesQuery.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome ?? "sem nome"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-base font-bold text-foreground">Imóvel</Label>
            <select
              value={imovelId}
              onChange={(e) => setImovelId(e.target.value)}
              disabled={!clienteId}
              className={CLASSE_SELECT}
            >
              <option value="">
                {clienteId ? "Escolha o imóvel" : "Escolha o cliente primeiro"}
              </option>
              {(imoveisQuery.data ?? []).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome ?? "sem nome"}
                  {i.municipio ? ` — ${i.municipio}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-base font-bold text-foreground">Serviço</Label>
            <select
              value={servico}
              onChange={(e) => setServico(e.target.value)}
              className={CLASSE_SELECT}
            >
              {SERVICOS.map((s) => (
                <option key={s.valor} value={s.valor}>
                  {s.rotulo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="prazo-os" className="text-base font-bold text-foreground">
              Prazo
            </Label>
            <Input
              id="prazo-os"
              type="date"
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              className="mt-1.5 h-14 rounded-xl border-2 text-lg font-semibold"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => criar.mutate()}
            disabled={!clienteId || criar.isPending}
            className="h-14 w-full rounded-xl text-lg font-extrabold"
          >
            {criar.isPending ? <Loader2 className="size-6 animate-spin" /> : "Criar OS"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
