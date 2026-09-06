import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  CheckSquare,
  FileText,
  Loader2,
  User,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { data as dataBR, dataHora, rotulo } from "@/lib/formato";
import { STATUS_OS, semaforoPrazo } from "@/lib/prazo";
import { Bloco, CampoLongo } from "@/components/campos";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_app/servicos/$id")({
  head: () => ({
    meta: [
      { title: "Ordem de serviço | CRM de Topografia" },
      {
        name: "description",
        content: "Ficha da ordem de serviço com checklist técnico, prazo e documentos.",
      },
      { property: "og:title", content: "Ordem de serviço | CRM de Topografia" },
      {
        property: "og:description",
        content: "Checklist de etapas, progresso, prazo e documentos da ordem de serviço.",
      },
    ],
  }),
  component: Pagina,
});

type Ordem = {
  id: string;
  empresa_id: string;
  numero: string | null;
  servico: string | null;
  status: string | null;
  prazo: string | null;
  observacoes: string | null;
  responsavel_id: string | null;
  cliente_id: string | null;
  imovel_id: string | null;
  criado_em: string | null;
  clientes: { nome: string | null; telefone: string | null } | null;
  imoveis: { nome: string | null; municipio: string | null } | null;
};

type Etapa = {
  id: string;
  os_id: string;
  nome: string | null;
  ordem: number | null;
  concluida_em: string | null;
  responsavel_id: string | null;
};

function um<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

const CLASSE_SELECT =
  "mt-1.5 h-14 w-full rounded-xl border-2 border-border bg-card px-3 text-lg font-semibold text-foreground";

function Pagina() {
  const { id } = Route.useParams();
  const { perfil } = usePerfil();
  const queryClient = useQueryClient();

  const ordemQuery = useQuery({
    queryKey: ["ordens_servico", id],
    queryFn: async (): Promise<Ordem | null> => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select(
          "id, empresa_id, numero, servico, status, prazo, observacoes, responsavel_id, cliente_id, imovel_id, criado_em, clientes(nome, telefone), imoveis(nome, municipio)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const bruto = data as unknown as Ordem;
      return {
        ...bruto,
        clientes: um(bruto.clientes),
        imoveis: um(bruto.imoveis),
      };
    },
  });

  const etapasQuery = useQuery({
    queryKey: ["ordens_servico", id, "etapas"],
    queryFn: async (): Promise<Etapa[]> => {
      const { data, error } = await supabase
        .from("os_etapas")
        .select("id, os_id, nome, ordem, concluida_em, responsavel_id")
        .eq("os_id", id)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Etapa[];
    },
  });

  const documentosQuery = useQuery({
    queryKey: ["ordens_servico", id, "documentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, categoria, nome, url, criado_em")
        .eq("os_id", id)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        categoria: string | null;
        nome: string | null;
        url: string | null;
        criado_em: string | null;
      }[];
    },
  });

  const usuariosQuery = useQuery({
    queryKey: ["usuarios", "seletor"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome")
        .order("nome", { ascending: true });
      if (error) throw error;
      return (data ?? []) as { id: string; nome: string | null }[];
    },
  });

  const salvar = useMutation({
    mutationFn: async (campos: Record<string, unknown>) => {
      const { error } = await supabase.from("ordens_servico").update(campos).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ordens_servico"] });
      toast.success("Salvo.");
    },
    onError: () => toast.error("Não foi possível salvar."),
  });

  const marcarEtapa = useMutation({
    mutationFn: async ({ etapa, marcar }: { etapa: Etapa; marcar: boolean }) => {
      const { error } = await supabase
        .from("os_etapas")
        .update(
          marcar
            ? { concluida_em: new Date().toISOString(), responsavel_id: perfil?.id ?? null }
            : { concluida_em: null, responsavel_id: null },
        )
        .eq("id", etapa.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ordens_servico", id, "etapas"] });
    },
    onError: () => toast.error("Não foi possível atualizar a etapa."),
  });

  if (ordemQuery.isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const ordem = ordemQuery.data;
  if (ordemQuery.error || !ordem) {
    return (
      <section>
        <Link to="/servicos" className="text-lg font-extrabold text-primary">
          Voltar para serviços
        </Link>
        <p className="mt-4 text-lg font-semibold text-destructive">
          Ordem de serviço não encontrada.
        </p>
      </section>
    );
  }

  const etapas = etapasQuery.data ?? [];
  const concluidas = etapas.filter((e) => e.concluida_em).length;
  const progresso = etapas.length === 0 ? 0 : Math.round((concluidas / etapas.length) * 100);
  const sem = semaforoPrazo(ordem.prazo, ordem.status);
  const nomeUsuario = (uid: string | null) =>
    (usuariosQuery.data ?? []).find((u) => u.id === uid)?.nome ?? "";

  return (
    <section className="space-y-5">
      <Link
        to="/servicos"
        className="inline-flex items-center gap-2 text-lg font-extrabold text-primary"
      >
        <ArrowLeft className="size-6" strokeWidth={3} />
        Serviços
      </Link>

      <header className="rounded-3xl border-2 border-border bg-card p-4 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold text-foreground">
              {ordem.numero ? `OS ${ordem.numero}` : "OS sem número"}
            </h1>
            <p className="mt-1 text-lg font-bold text-primary">{rotulo(ordem.servico)}</p>
          </div>
          <span
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-base font-extrabold ${sem.cor}`}
          >
            <CalendarClock className="size-5" strokeWidth={2.5} />
            {ordem.prazo ? `${dataBR(ordem.prazo)} · ${sem.texto || rotulo(ordem.status)}` : "sem prazo"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <span className="text-base font-bold text-foreground">Cliente</span>
            <p className="text-lg font-semibold">
              {ordem.cliente_id ? (
                <Link
                  to="/clientes/$id"
                  params={{ id: ordem.cliente_id }}
                  className="text-primary"
                >
                  {ordem.clientes?.nome ?? "ver cliente"}
                </Link>
              ) : (
                <span className="text-muted-foreground">não vinculado</span>
              )}
            </p>
          </div>
          <div>
            <span className="text-base font-bold text-foreground">Imóvel</span>
            <p className="text-lg font-semibold">
              {ordem.imovel_id ? (
                <Link
                  to="/imoveis/$id"
                  params={{ id: ordem.imovel_id }}
                  className="text-primary"
                >
                  {ordem.imoveis?.nome ?? "ver imóvel"}
                  {ordem.imoveis?.municipio ? ` · ${ordem.imoveis.municipio}` : ""}
                </Link>
              ) : (
                <span className="text-muted-foreground">não vinculado</span>
              )}
            </p>
          </div>

          <div>
            <Label className="text-base font-bold text-foreground">Status</Label>
            <select
              value={ordem.status ?? ""}
              onChange={(e) => salvar.mutate({ status: e.target.value })}
              className={CLASSE_SELECT}
            >
              {STATUS_OS.map((s) => (
                <option key={s.valor} value={s.valor}>
                  {s.rotulo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-base font-bold text-foreground">Responsável</Label>
            <select
              value={ordem.responsavel_id ?? ""}
              onChange={(e) => salvar.mutate({ responsavel_id: e.target.value || null })}
              className={CLASSE_SELECT}
            >
              <option value="">sem responsável</option>
              {(usuariosQuery.data ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome ?? "sem nome"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="prazo" className="text-base font-bold text-foreground">
              Prazo
            </Label>
            <Input
              id="prazo"
              type="date"
              defaultValue={(ordem.prazo ?? "").slice(0, 10)}
              onBlur={(e) => {
                const novo = e.target.value || null;
                if (novo !== ((ordem.prazo ?? "").slice(0, 10) || null)) {
                  salvar.mutate({ prazo: novo });
                }
              }}
              className="mt-1.5 h-14 rounded-xl border-2 text-lg font-semibold"
            />
          </div>

          <div>
            <span className="text-base font-bold text-foreground">Aberta em</span>
            <p className="text-lg font-semibold text-muted-foreground">
              {dataBR(ordem.criado_em)}
            </p>
          </div>
        </div>
      </header>

      <Bloco titulo="Etapas técnicas" Icone={CheckSquare}>
        {etapasQuery.isPending ? (
          <Loader2 className="size-6 animate-spin text-primary" />
        ) : etapas.length === 0 ? (
          <p className="text-lg font-medium text-muted-foreground">
            Esta OS ainda não tem checklist de etapas.
          </p>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between text-base font-bold text-foreground">
                <span>
                  {concluidas} de {etapas.length} etapas
                </span>
                <span>{progresso}%</span>
              </div>
              <Progress value={progresso} className="mt-2 h-3" />
            </div>
            <ul className="space-y-2">
              {etapas.map((etapa) => {
                const feita = Boolean(etapa.concluida_em);
                return (
                  <li
                    key={etapa.id}
                    className="flex items-start gap-3 rounded-2xl border-2 border-border p-3"
                  >
                    <Checkbox
                      checked={feita}
                      onCheckedChange={(v) =>
                        marcarEtapa.mutate({ etapa, marcar: v === true })
                      }
                      className="mt-1 size-7 rounded-md border-2"
                      aria-label={etapa.nome ?? "etapa"}
                    />
                    <div className="min-w-0">
                      <p
                        className={`text-lg font-bold ${
                          feita ? "text-muted-foreground line-through" : "text-foreground"
                        }`}
                      >
                        {etapa.nome ?? "etapa"}
                      </p>
                      {feita ? (
                        <p className="text-sm font-semibold text-muted-foreground">
                          Concluída em {dataHora(etapa.concluida_em)}
                          {nomeUsuario(etapa.responsavel_id)
                            ? ` · ${nomeUsuario(etapa.responsavel_id)}`
                            : ""}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Bloco>

      <Bloco titulo="Documentos" Icone={FileText}>
        {(documentosQuery.data ?? []).length === 0 ? (
          <p className="text-lg font-medium text-muted-foreground">
            Nenhum documento vinculado a esta OS.
          </p>
        ) : (
          <ul className="space-y-2">
            {(documentosQuery.data ?? []).map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-foreground">
                    {d.nome ?? (rotulo(d.categoria) || "documento")}
                  </p>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {rotulo(d.categoria)} · {dataBR(d.criado_em)}
                  </p>
                </div>
                {d.url ? (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-base font-extrabold text-primary"
                  >
                    Abrir
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Bloco>

      <Bloco titulo="Observações" Icone={Wrench}>
        <CampoLongo
          rotulo="Observações da OS"
          valor={ordem.observacoes ?? ""}
          onSalvar={(v) => salvar.mutate({ observacoes: v || null })}
        />
      </Bloco>

      {ordem.clientes?.telefone ? (
        <p className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
          <User className="size-5" strokeWidth={2.5} />
          Contato do cliente: {ordem.clientes.telefone}
        </p>
      ) : null}
    </section>
  );
}
