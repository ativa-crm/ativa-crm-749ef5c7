import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  Mail,
  MailCheck,
  MailX,
  Pause,
  Pencil,
  Play,
  Send,
  UserMinus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { dataHora } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BarraFerramentas, CartaoIndicador, Painel, Tabela } from "@/components/painel";

export const Route = createFileRoute("/_app/email")({
  head: () => ({
    meta: [
      { title: "E-mail | CRM de Topografia" },
      {
        name: "description",
        content: "Campanha de e-mail da prospecção: plano de envio gradual, modelos, fila e respostas.",
      },
    ],
  }),
  component: Pagina,
});

type Config = {
  empresa_id: string;
  ativo: boolean;
  inicio: string | null;
  remetente: string;
  nome_remetente: string;
  plano: { semana: number; por_dia: number }[];
  hora_inicio: number;
  hora_fim: number;
};

type Cota = { ativo: boolean; semana: number; por_dia: number; enviados_hoje: number; restante: number };

type Modelo = { codigo: string; nome: string; publico: string; assunto: string; corpo: string };

type Resumo = { grupo: string; status: string; qtd: number; produtores: number };

type Envio = {
  id: string;
  email: string;
  email_original: string | null;
  grupo: string;
  modelo: string;
  prioridade: number;
  nome: string | null;
  imovel_nome: string | null;
  municipio: string | null;
  n_produtores: number;
  status: string;
  enviado_em: string | null;
  respondido_em: string | null;
  resposta: string | null;
  erro: string | null;
};

const POR_PAGINA = 50;

const GRUPOS: Record<string, { rotulo: string; modelo: string }> = {
  produtor_so_email: { rotulo: "1 · Produtor sem WhatsApp", modelo: "A" },
  escritorio: { rotulo: "2 · Escritório / sindicato", modelo: "C" },
  produtor_complementar: { rotulo: "3 · Produtor também no WhatsApp", modelo: "B" },
};

const STATUS: Record<string, { rotulo: string; variante: "default" | "secondary" | "outline" | "destructive" }> = {
  pendente: { rotulo: "Na fila", variante: "outline" },
  enviado: { rotulo: "Enviado", variante: "secondary" },
  respondido: { rotulo: "Respondeu", variante: "default" },
  descadastrado: { rotulo: "Pediu para sair", variante: "outline" },
  erro: { rotulo: "Erro / devolvido", variante: "destructive" },
  cancelado: { rotulo: "Cancelado", variante: "outline" },
};

const VARIAVEIS = [
  ["{nome_virgula}", "“, João” (ou vazio se não houver nome)"],
  ["{imovel}", "“o Sítio São José” (ou “o seu imóvel”)"],
  ["{Imovel_titulo}", "“Sítio São José” (assunto)"],
  ["{municipio}", "município do imóvel"],
  ["{municipios}", "até 3 municípios (escritórios)"],
  ["{assinatura}", "assinatura e rodapé de descadastro"],
] as const;

/** Previsão de término: dias úteis (seg-sex) a partir de hoje seguindo o plano semanal. */
function previsaoTermino(pendentes: number, plano: Config["plano"], inicio: string | null): Date | null {
  if (pendentes <= 0 || plano.length === 0) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const base = inicio ? new Date(`${inicio}T00:00:00`) : hoje;
  let restante = pendentes;
  const dia = new Date(hoje);
  for (let i = 0; i < 400 && restante > 0; i++) {
    const semana = Math.max(1, Math.floor((dia.getTime() - base.getTime()) / (7 * 86400000)) + 1);
    const etapa = [...plano].sort((a, b) => b.semana - a.semana).find((p) => p.semana <= semana);
    const dow = dia.getDay();
    if (dow !== 0 && dow !== 6) restante -= etapa?.por_dia ?? 0;
    if (restante > 0) dia.setDate(dia.getDate() + 1);
  }
  return dia;
}

function Pagina() {
  const { perfil } = usePerfil();
  const queryClient = useQueryClient();
  const empresa = perfil?.empresa_id ?? null;

  const [status, setStatus] = useState("todos");
  const [grupo, setGrupo] = useState("todos");
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [pagina, setPagina] = useState(0);
  const [editando, setEditando] = useState<Modelo | null>(null);
  const [aberto, setAberto] = useState<Envio | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setBuscaAplicada(busca), 350);
    return () => clearTimeout(t);
  }, [busca]);
  useEffect(() => setPagina(0), [status, grupo, buscaAplicada]);

  const configQuery = useQuery({
    queryKey: ["email", "config"],
    queryFn: async (): Promise<Config | null> => {
      const { data, error } = await supabase.from("email_config").select("*").maybeSingle();
      if (error) throw error;
      return (data as Config | null) ?? null;
    },
  });

  const cotaQuery = useQuery({
    queryKey: ["email", "cota", empresa],
    enabled: Boolean(empresa),
    queryFn: async (): Promise<Cota | null> => {
      const { data, error } = await supabase.rpc("cota_email_hoje", { p_empresa: empresa });
      if (error) throw error;
      const linhas = (data ?? []) as Cota[];
      return linhas[0] ?? null;
    },
    refetchInterval: 60_000,
  });

  const resumoQuery = useQuery({
    queryKey: ["email", "resumo"],
    queryFn: async (): Promise<Resumo[]> => {
      const { data, error } = await supabase.rpc("resumo_email");
      if (error) throw error;
      return (data ?? []) as Resumo[];
    },
    refetchInterval: 60_000,
  });

  const modelosQuery = useQuery({
    queryKey: ["email", "modelos"],
    queryFn: async (): Promise<Modelo[]> => {
      const { data, error } = await supabase
        .from("email_modelos")
        .select("codigo, nome, publico, assunto, corpo")
        .order("codigo");
      if (error) throw error;
      return (data ?? []) as Modelo[];
    },
  });

  const filaQuery = useQuery({
    queryKey: ["email", "fila", status, grupo, buscaAplicada, pagina],
    queryFn: async (): Promise<{ linhas: Envio[]; total: number }> => {
      let c = supabase
        .from("email_envios")
        .select(
          "id, email, email_original, grupo, modelo, prioridade, nome, imovel_nome, municipio, n_produtores, status, enviado_em, respondido_em, resposta, erro",
          { count: "exact" },
        );
      if (status !== "todos") c = c.eq("status", status);
      if (grupo !== "todos") c = c.eq("grupo", grupo);
      const termo = buscaAplicada.replace(/[,%()]/g, " ").trim();
      if (termo) c = c.or(`email.ilike.%${termo}%,nome.ilike.%${termo}%,municipio.ilike.%${termo}%`);
      const inicio = pagina * POR_PAGINA;
      const { data, error, count } = await c
        .order("enviado_em", { ascending: false, nullsFirst: false })
        .order("prioridade")
        .order("criado_em")
        .range(inicio, inicio + POR_PAGINA - 1);
      if (error) throw error;
      return { linhas: (data ?? []) as Envio[], total: count ?? 0 };
    },
  });

  const totais = useMemo(() => {
    const t = { pendente: 0, enviado: 0, respondido: 0, descadastrado: 0, erro: 0, total: 0, produtores: 0 };
    for (const r of resumoQuery.data ?? []) {
      if (r.status in t) t[r.status as keyof typeof t] += r.qtd;
      if (r.status !== "cancelado") {
        t.total += r.qtd;
        t.produtores += r.produtores;
      }
    }
    return t;
  }, [resumoQuery.data]);

  const porGrupo = useMemo(() => {
    const m: Record<string, { total: number; pendente: number; produtores: number }> = {};
    for (const r of resumoQuery.data ?? []) {
      if (r.status === "cancelado") continue;
      m[r.grupo] ??= { total: 0, pendente: 0, produtores: 0 };
      m[r.grupo].total += r.qtd;
      m[r.grupo].produtores += r.produtores;
      if (r.status === "pendente") m[r.grupo].pendente += r.qtd;
    }
    return m;
  }, [resumoQuery.data]);

  const config = configQuery.data;
  const termino = config ? previsaoTermino(totais.pendente, config.plano, config.inicio) : null;

  const alternar = useMutation({
    mutationFn: async (ativo: boolean) => {
      if (!config) return;
      const { error } = await supabase
        .from("email_config")
        .update({
          ativo,
          inicio: ativo && !config.inicio ? new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }) : config.inicio,
          atualizado_em: new Date().toISOString(),
        })
        .eq("empresa_id", config.empresa_id);
      if (error) throw error;
    },
    onSuccess: (_d, ativo) => {
      toast.success(ativo ? "Campanha de e-mail ativada." : "Campanha de e-mail pausada.");
      void queryClient.invalidateQueries({ queryKey: ["email"] });
    },
    onError: () => toast.error("Não foi possível alterar a campanha."),
  });

  const salvarModelo = useMutation({
    mutationFn: async (m: Modelo) => {
      const { error } = await supabase
        .from("email_modelos")
        .update({ assunto: m.assunto, corpo: m.corpo, atualizado_em: new Date().toISOString() })
        .eq("codigo", m.codigo);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Modelo salvo. Os próximos envios já usam o texto novo.");
      setEditando(null);
      void queryClient.invalidateQueries({ queryKey: ["email", "modelos"] });
    },
    onError: () => toast.error("Não foi possível salvar o modelo."),
  });

  const total = filaQuery.data?.total ?? 0;
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const ativo = Boolean(config?.ativo);

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Mail className="size-6 text-primary" strokeWidth={2.5} />
            E-mail
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Remetente: {config?.nome_remetente ?? "…"} &lt;{config?.remetente ?? "…"}&gt;
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={ativo ? "default" : "outline"} className="h-9 rounded-full px-3 text-sm">
            {ativo ? "Campanha ativa" : "Campanha pausada"}
          </Badge>
          <Button
            variant={ativo ? "outline" : "default"}
            onClick={() => alternar.mutate(!ativo)}
            disabled={!config || alternar.isPending}
            className="h-11 px-4 text-base"
          >
            {alternar.isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : ativo ? (
              <Pause className="size-5" strokeWidth={2.5} />
            ) : (
              <Play className="size-5" strokeWidth={2.5} />
            )}
            {ativo ? "Pausar envio" : "Ativar envio"}
          </Button>
        </div>
      </header>

      {!ativo && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm font-medium text-foreground">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-ink dark:text-warning" />
          <p>
            O envio só começa depois que a conta do Gmail do CRM estiver conectada no robô (n8n) e a
            campanha for ativada aqui. A semana 1 do plano conta a partir do dia da ativação.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <CartaoIndicador
          icone={Inbox}
          valor={resumoQuery.isPending ? "…" : totais.pendente}
          rotulo="Na fila"
          apoio={termino ? `término previsto ${termino.toLocaleDateString("pt-BR")}` : "aguardando ativação"}
          destino="/email"
        />
        <CartaoIndicador
          icone={Send}
          valor={resumoQuery.isPending ? "…" : totais.enviado + totais.respondido + totais.descadastrado}
          rotulo="Enviados"
          apoio={cotaQuery.data ? `hoje ${cotaQuery.data.enviados_hoje} de ${cotaQuery.data.por_dia}` : "—"}
          destino="/email"
        />
        <CartaoIndicador
          icone={MailCheck}
          valor={resumoQuery.isPending ? "…" : totais.respondido}
          rotulo="Responderam"
          apoio="o Renato é avisado no WhatsApp"
          destino="/email"
        />
        <CartaoIndicador
          icone={UserMinus}
          valor={resumoQuery.isPending ? "…" : totais.descadastrado}
          rotulo="Pediram para sair"
          apoio="não recebem mais e-mails"
          destino="/email"
        />
        <CartaoIndicador
          icone={MailX}
          valor={resumoQuery.isPending ? "…" : totais.erro}
          rotulo="Erro / devolvido"
          apoio="e-mail inexistente ou falha"
          tom={totais.erro > 0 ? "atencao" : "neutro"}
          destino="/email"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Painel titulo="Plano de envio gradual" icone={CalendarClock}>
          <Tabela>
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-bold uppercase text-muted-foreground">
                  <th className="px-3 py-2">Semana</th>
                  <th className="px-3 py-2 text-right">Por dia</th>
                  <th className="px-3 py-2 text-right">Por semana</th>
                </tr>
              </thead>
              <tbody>
                {(config?.plano ?? []).map((p, i, todos) => {
                  const atual = cotaQuery.data?.ativo && cotaQuery.data.semana >= p.semana &&
                    (i === todos.length - 1 || cotaQuery.data.semana < todos[i + 1].semana);
                  return (
                    <tr
                      key={p.semana}
                      data-ativo={atual ? "1" : "0"}
                      className="border-b border-border last:border-0 data-[ativo=1]:bg-secondary"
                    >
                      <td className="px-3 py-2 font-bold text-foreground">
                        {i === todos.length - 1 ? `${p.semana}ª em diante` : `${p.semana}ª`}
                        {atual ? " · atual" : ""}
                      </td>
                      <td className="px-3 py-2 text-right font-extrabold tabular-nums text-foreground">{p.por_dia}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{p.por_dia * 5}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Tabela>
          <ul className="mt-3 space-y-1 text-sm font-medium text-muted-foreground">
            <li>Segunda a sexta, das {config?.hora_inicio ?? 8}h às {config?.hora_fim ?? 17}h. Sábado e domingo não envia.</li>
            <li>Um e-mail por vez, a cada 10 minutos, até completar a cota do dia.</li>
            <li>Ordem: produtores sem WhatsApp → escritórios e sindicatos → produtores que também estão no WhatsApp.</li>
            <li>Quem responder, pedir para sair ou já estiver em conversa no WhatsApp sai da fila sozinho.</li>
          </ul>
        </Painel>

        <Painel titulo="Grupos da campanha" icone={Mail}>
          <div className="space-y-3">
            {Object.entries(GRUPOS).map(([chave, g]) => {
              const d = porGrupo[chave] ?? { total: 0, pendente: 0, produtores: 0 };
              return (
                <div key={chave} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-extrabold text-foreground">{g.rotulo}</span>
                    <Badge variant="outline" className="rounded-full">Modelo {g.modelo}</Badge>
                  </div>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    {d.total} e-mails · {d.pendente} na fila
                    {chave === "escritorio" ? ` · alcançam ${d.produtores} produtores` : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </Painel>
      </div>

      <Painel titulo="Modelos de mensagem" icone={Pencil}>
        {modelosQuery.isPending ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {(modelosQuery.data ?? []).map((m) => (
              <article key={m.codigo} className="flex flex-col rounded-lg border border-border p-3">
                <header className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-foreground">
                      {m.codigo === "ASSINATURA" ? m.nome : `Modelo ${m.codigo} · ${m.nome}`}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">{m.publico}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEditando({ ...m })}>
                    <Pencil className="size-4" /> Editar
                  </Button>
                </header>
                {m.codigo !== "ASSINATURA" && (
                  <p className="mt-2 text-sm font-bold text-foreground">Assunto: {m.assunto}</p>
                )}
                <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted/40 p-3 font-sans text-sm text-foreground">
                  {m.corpo}
                </pre>
              </article>
            ))}
          </div>
        )}
        <div className="mt-3 rounded-lg bg-muted/30 p-3 text-xs font-medium text-muted-foreground">
          <p className="font-bold uppercase text-foreground">Campos preenchidos automaticamente</p>
          <ul className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2">
            {VARIAVEIS.map(([v, d]) => (
              <li key={v}>
                <code className="font-bold text-primary">{v}</code> {d}
              </li>
            ))}
          </ul>
        </div>
      </Painel>

      <Painel
        titulo="Fila e histórico"
        icone={Inbox}
        acao={
          <span className="text-sm font-bold text-muted-foreground">
            {total} itens · página {pagina + 1} de {paginas}
          </span>
        }
      >
        <BarraFerramentas>
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por e-mail, nome ou município"
            className="h-11 min-w-64 flex-1 rounded-full"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Situação"
            className="h-11 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground"
          >
            <option value="todos">Todas as situações</option>
            {Object.entries(STATUS).map(([v, s]) => (
              <option key={v} value={v}>
                {s.rotulo}
              </option>
            ))}
          </select>
          <select
            value={grupo}
            onChange={(e) => setGrupo(e.target.value)}
            aria-label="Grupo"
            className="h-11 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground"
          >
            <option value="todos">Todos os grupos</option>
            {Object.entries(GRUPOS).map(([v, g]) => (
              <option key={v} value={v}>
                {g.rotulo}
              </option>
            ))}
          </select>
        </BarraFerramentas>

        <div className="mt-3">
          {filaQuery.error ? (
            <p className="text-base font-bold text-destructive">Não foi possível carregar a fila.</p>
          ) : filaQuery.isPending ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (filaQuery.data?.linhas.length ?? 0) === 0 ? (
            <p className="text-base font-medium text-muted-foreground">Nenhum e-mail com esses filtros.</p>
          ) : (
            <Tabela>
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border text-xs font-bold uppercase text-muted-foreground">
                    <th className="px-3 py-2">E-mail</th>
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">Grupo</th>
                    <th className="px-3 py-2">Município</th>
                    <th className="px-3 py-2">Situação</th>
                    <th className="px-3 py-2">Enviado em</th>
                    <th className="px-3 py-2">Resposta</th>
                  </tr>
                </thead>
                <tbody>
                  {(filaQuery.data?.linhas ?? []).map((e) => (
                    <tr
                      key={e.id}
                      onClick={() => setAberto(e)}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-3 py-3 text-sm font-bold text-foreground">{e.email}</td>
                      <td className="px-3 py-3 text-sm font-semibold text-muted-foreground">
                        {e.grupo === "escritorio" ? `${e.n_produtores} produtores` : e.nome || "—"}
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-muted-foreground">
                        {GRUPOS[e.grupo]?.rotulo ?? e.grupo}
                      </td>
                      <td className="max-w-56 px-3 py-3 text-sm font-semibold text-muted-foreground">
                        <span className="line-clamp-1">{e.municipio || "—"}</span>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={STATUS[e.status]?.variante ?? "outline"} className="rounded-full">
                          {STATUS[e.status]?.rotulo ?? e.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-muted-foreground">
                        {e.enviado_em ? dataHora(e.enviado_em) : "—"}
                      </td>
                      <td className="max-w-64 px-3 py-3 text-sm font-medium text-muted-foreground">
                        <span className="line-clamp-1">{e.resposta || e.erro || "—"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Tabela>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setPagina((p) => Math.max(0, p - 1))}
            disabled={pagina === 0}
            className="h-11 px-4 text-base"
          >
            <ChevronLeft className="size-5" strokeWidth={2.5} /> Anterior
          </Button>
          <Button
            variant="outline"
            onClick={() => setPagina((p) => Math.min(paginas - 1, p + 1))}
            disabled={pagina + 1 >= paginas}
            className="h-11 px-4 text-base"
          >
            Próxima <ChevronRight className="size-5" strokeWidth={2.5} />
          </Button>
        </div>
      </Painel>

      <Dialog open={Boolean(editando)} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editando?.codigo === "ASSINATURA" ? "Assinatura e rodapé" : `Modelo ${editando?.codigo} · ${editando?.nome}`}
            </DialogTitle>
            <DialogDescription>
              Mantenha os campos entre chaves, como {"{imovel}"} e {"{assinatura}"}: eles são trocados pelos dados de cada lead.
            </DialogDescription>
          </DialogHeader>
          {editando && (
            <div className="space-y-3">
              {editando.codigo !== "ASSINATURA" && (
                <div className="space-y-1.5">
                  <Label htmlFor="assunto-email">Assunto</Label>
                  <Input
                    id="assunto-email"
                    value={editando.assunto}
                    onChange={(e) => setEditando({ ...editando, assunto: e.target.value })}
                    className="h-11"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="corpo-email">Texto</Label>
                <Textarea
                  id="corpo-email"
                  value={editando.corpo}
                  onChange={(e) => setEditando({ ...editando, corpo: e.target.value })}
                  rows={16}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => editando && salvarModelo.mutate(editando)}
              disabled={salvarModelo.isPending}
              className="h-11 px-5 text-base"
            >
              {salvarModelo.isPending && <Loader2 className="size-5 animate-spin" />}
              Salvar modelo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(aberto)} onOpenChange={(v) => !v && setAberto(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{aberto?.email}</DialogTitle>
            <DialogDescription>
              {aberto ? `${GRUPOS[aberto.grupo]?.rotulo ?? aberto.grupo} · ${STATUS[aberto.status]?.rotulo ?? aberto.status}` : ""}
            </DialogDescription>
          </DialogHeader>
          {aberto && <DetalheEnvio id={aberto.id} />}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function DetalheEnvio({ id }: { id: string }) {
  const q = useQuery({
    queryKey: ["email", "envio", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_envios")
        .select("nome, imovel_nome, municipio, email_original, assunto_enviado, corpo_enviado, enviado_em, resposta, respondido_em, erro")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Record<string, string | null> | null;
    },
  });
  if (q.isPending) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }
  const d: Record<string, string | null> = q.data ?? {};
  return (
    <div className="max-h-[70vh] space-y-3 overflow-y-auto text-sm">
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {[
          ["Nome", d.nome],
          ["Imóvel", d.imovel_nome],
          ["Município", d.municipio],
          ["E-mail corrigido de", d.email_original],
          ["Enviado em", d.enviado_em ? dataHora(d.enviado_em) : null],
          ["Respondeu em", d.respondido_em ? dataHora(d.respondido_em) : null],
        ].map(([r, v]) => (
          <div key={r}>
            <dt className="text-xs font-bold uppercase text-muted-foreground">{r}</dt>
            <dd className="font-semibold text-foreground">{v || "—"}</dd>
          </div>
        ))}
      </dl>
      {d.resposta && (
        <div>
          <p className="text-xs font-bold uppercase text-muted-foreground">Resposta</p>
          <pre className="whitespace-pre-wrap rounded-md bg-secondary p-3 font-sans text-foreground">{d.resposta}</pre>
        </div>
      )}
      {d.erro && <p className="font-semibold text-destructive">{d.erro}</p>}
      <div>
        <p className="text-xs font-bold uppercase text-muted-foreground">
          {d.corpo_enviado ? `E-mail enviado · ${d.assunto_enviado ?? ""}` : "Ainda não enviado"}
        </p>
        {d.corpo_enviado && (
          <pre className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 font-sans text-foreground">{d.corpo_enviado}</pre>
        )}
      </div>
    </div>
  );
}
