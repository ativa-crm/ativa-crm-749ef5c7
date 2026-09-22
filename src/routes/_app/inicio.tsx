import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileCheck2,
  FileText,
  Flame,
  Loader2,
  MapPinned,
  Settings2,
  TrendingUp,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { areaHa, numero, reais, rotulo } from "@/lib/formato";
import { desdeAgora } from "@/lib/tempo";
import { STATUS_OS, STATUS_ENCERRADOS, semaforoPrazo, diasAtePrazo } from "@/lib/prazo";
import { AnelMeta, CartaoIndicador, Painel } from "@/components/painel";
import { usePerfil } from "@/lib/perfil";

export const Route = createFileRoute("/_app/inicio")({
  head: () => ({
    meta: [
      { title: "Início | CRM de Topografia" },
      {
        name: "description",
        content:
          "Painel diário: leads quentes sem contato, prazos de ordens de serviço, faturamento e resposta rápida.",
      },
      { property: "og:title", content: "Início | CRM de Topografia" },
      {
        property: "og:description",
        content: "O que precisa da sua atenção agora, o que está em andamento e os números do mês.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pagina,
});

type Lead = {
  id: string;
  servico: string | null;
  cidade: string | null;
  area_ha: number | null;
  nota: string | null;
  estagio: string | null;
  criado_em: string | null;
  clientes: { nome: string | null } | { nome: string | null }[] | null;
};

type OS = {
  id: string;
  numero: string | null;
  servico: string | null;
  status: string | null;
  prazo: string | null;
  clientes: { nome: string | null } | { nome: string | null }[] | null;
  imoveis:
    | { nome: string | null; municipio: string | null }
    | { nome: string | null; municipio: string | null }[]
    | null;
};

type EmpresaMetricas = {
  meta_mensal_receita: number | null;
  pontos_por_resposta_rapida: number | null;
};

type RespostaRapida = {
  leads_periodo: number | null;
  leads_respondidos_24h: number | null;
  pontos_semana: number | null;
  pontos_total: number | null;
  sequencia_dias: number | null;
};

function um<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function inicioDoMes(): string {
  const h = new Date();
  return new Date(Date.UTC(h.getFullYear(), h.getMonth(), 1)).toISOString();
}

const ICONES_STATUS = {
  aguardando_documentos: FileText,
  aguardando_campo: Clock3,
  em_campo: MapPinned,
  processamento: Settings2,
  documentacao: ClipboardList,
  pendencia: TriangleAlert,
} as const;

function Pagina() {
  const { perfil } = usePerfil();

  const leadsQuery = useQuery({
    queryKey: ["inicio", "leads-quentes"],
    queryFn: async (): Promise<{ leads: Lead[]; ultima: Record<string, string> }> => {
      const { data, error } = await supabase
        .from("oportunidades")
        .select("id, servico, cidade, area_ha, nota, estagio, criado_em, clientes(nome)")
        .eq("arquivada", false)
        .or("nota.eq.quente,estagio.eq.quente")
        .order("criado_em", { ascending: false })
        .limit(50);
      if (error) throw error;
      const leads = (data ?? []) as Lead[];

      const { data: msgs, error: erroMsgs } = await supabase
        .from("mensagens")
        .select("oportunidade_id, criado_em")
        .order("criado_em", { ascending: false })
        .limit(2000);
      if (erroMsgs) throw erroMsgs;

      const ultima: Record<string, string> = {};
      for (const m of (msgs ?? []) as { oportunidade_id: string | null; criado_em: string }[]) {
        if (m.oportunidade_id && !ultima[m.oportunidade_id])
          ultima[m.oportunidade_id] = m.criado_em;
      }
      return { leads, ultima };
    },
  });

  const osQuery = useQuery({
    queryKey: ["inicio", "ordens-servico"],
    queryFn: async (): Promise<OS[]> => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select("id, numero, servico, status, prazo, clientes(nome), imoveis(nome, municipio)")
        .order("prazo", { ascending: true, nullsFirst: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as OS[];
    },
  });

  const mesQuery = useQuery({
    queryKey: ["inicio", "mes", perfil?.empresa_id],
    enabled: !!perfil?.empresa_id,
    queryFn: async () => {
      const desde = inicioDoMes();
      const [leads, enviados, aprovados, empresa, contratos, resposta] = await Promise.all([
        supabase
          .from("oportunidades")
          .select("id", { count: "exact", head: true })
          .gte("criado_em", desde),
        supabase
          .from("orcamentos")
          .select("id", { count: "exact", head: true })
          .gte("enviado_em", desde),
        supabase
          .from("orcamentos")
          .select("id", { count: "exact", head: true })
          .eq("status", "aprovado")
          .gte("criado_em", desde),
        supabase
          .from("empresas")
          .select("meta_mensal_receita, pontos_por_resposta_rapida")
          .eq("id", perfil?.empresa_id as string)
          .maybeSingle(),
        supabase.from("contratos").select("valor").eq("status", "fechado").gte("criado_em", desde),
        supabase.rpc("metricas_resposta_rapida", { p_empresa: perfil?.empresa_id as string }),
      ]);
      if (leads.error) throw leads.error;
      if (enviados.error) throw enviados.error;
      if (aprovados.error) throw aprovados.error;
      if (empresa.error) throw empresa.error;
      if (contratos.error) throw contratos.error;
      if (resposta.error) throw resposta.error;

      const empresaDados = (empresa.data ?? {}) as EmpresaMetricas;
      const respostaDados = Array.isArray(resposta.data)
        ? ((resposta.data[0] ?? {}) as RespostaRapida)
        : ((resposta.data ?? {}) as RespostaRapida);
      const faturamento = ((contratos.data ?? []) as { valor: number | null }[]).reduce(
        (soma, item) => soma + Number(item.valor ?? 0),
        0,
      );
      const meta = Number(empresaDados.meta_mensal_receita ?? 0);
      const leadsPeriodo = Number(respostaDados.leads_periodo ?? 0);
      const respondidos = Number(respostaDados.leads_respondidos_24h ?? 0);

      return {
        leads: leads.count ?? 0,
        enviados: enviados.count ?? 0,
        aprovados: aprovados.count ?? 0,
        faturamento,
        meta,
        progressoMeta: meta > 0 ? Math.round((faturamento / meta) * 100) : 0,
        resposta: {
          leadsPeriodo,
          respondidos,
          progresso: leadsPeriodo > 0 ? Math.round((respondidos / leadsPeriodo) * 100) : 0,
          pontosSemana: Number(respostaDados.pontos_semana ?? 0),
          pontosTotal: Number(respostaDados.pontos_total ?? 0),
          sequenciaDias: Number(respostaDados.sequencia_dias ?? 0),
          pontosPorResposta: Number(empresaDados.pontos_por_resposta_rapida ?? 0),
        },
      };
    },
  });

  const carregando = leadsQuery.isPending || osQuery.isPending;
  const agora = Date.now();
  const semContato = (leadsQuery.data?.leads ?? []).filter((l) => {
    const ultima = leadsQuery.data?.ultima[l.id] ?? l.criado_em;
    if (!ultima) return true;
    const t = new Date(ultima).getTime();
    if (Number.isNaN(t)) return true;
    return agora - t > 24 * 60 * 60 * 1000;
  });

  const osUrgentes = (osQuery.data ?? []).filter((o) => {
    if (o.status && STATUS_ENCERRADOS.includes(o.status)) return false;
    const dias = diasAtePrazo(o.prazo);
    return dias !== null && dias <= 3;
  });

  const porStatus = STATUS_OS.filter((s) => !STATUS_ENCERRADOS.includes(s.valor)).map((s) => ({
    ...s,
    total: (osQuery.data ?? []).filter((o) => o.status === s.valor).length,
  }));
  const resposta = mesQuery.data?.resposta;

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Início</h1>

      <div className="grade-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CartaoIndicador
          icone={Flame}
          valor={semContato.length}
          rotulo="Oportunidades sem contato"
          apoio="há mais de 24 horas"
          tom={semContato.length > 0 ? "critico" : "neutro"}
          destino="/funil"
        />
        <CartaoIndicador
          icone={TriangleAlert}
          valor={osUrgentes.length}
          rotulo="Prazos urgentes"
          apoio="vencidos ou em até 3 dias"
          tom={osUrgentes.length > 0 ? "atencao" : "neutro"}
          destino="/servicos"
        />
        <CartaoIndicador
          icone={FileCheck2}
          valor={mesQuery.data?.aprovados ?? 0}
          rotulo="Orçamentos aprovados"
          apoio="neste mês"
          destino="/orcamentos"
        />
      </div>

      <Painel titulo="Precisam de você agora" icone={AlertTriangle}>
        {carregando ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : semContato.length === 0 && osUrgentes.length === 0 ? (
          <p className="border-l-2 border-l-primary py-4 pl-4 text-base font-semibold text-foreground">
            Nada urgente por aqui. Bom trabalho.
          </p>
        ) : (
          <ul className="space-y-3">
            {semContato.map((l) => {
              const ultima = leadsQuery.data?.ultima[l.id] ?? l.criado_em;
              return (
                <li key={l.id}>
                  <Link
                    to="/oportunidades/$id"
                    params={{ id: l.id }}
                    className="flex min-h-20 items-center gap-3 rounded-lg border-2 border-destructive/40 bg-card px-4 py-3 transition-all duration-200 hover:-translate-y-px hover:bg-accent"
                  >
                    <Flame className="size-7 shrink-0 text-destructive" strokeWidth={2.5} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-lg font-extrabold text-foreground">
                        {um(l.clientes)?.nome?.trim() || "Sem cliente"}
                      </span>
                      <span className="block truncate text-base font-semibold text-muted-foreground">
                        {[rotulo(l.servico), l.cidade, areaHa(l.area_ha)]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <span className="block text-base font-bold text-destructive">
                        sem contato {desdeAgora(ultima)}
                      </span>
                    </span>
                    <ChevronRight className="size-6 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}

            {osUrgentes.map((o) => {
              const s = semaforoPrazo(o.prazo, o.status);
              return (
                <li key={o.id}>
                  <Link
                    to="/servicos/$id"
                    params={{ id: o.id }}
                    className="flex min-h-20 items-center gap-3 rounded-lg border-2 border-destructive/40 bg-card px-4 py-3 transition-all duration-200 hover:-translate-y-px hover:bg-accent"
                  >
                    <span className={`size-4 shrink-0 rounded-full ${s.ponto}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-lg font-extrabold text-foreground">
                        OS {o.numero || "—"} · {um(o.clientes)?.nome?.trim() || "Sem cliente"}
                      </span>
                      <span className="block truncate text-base font-semibold text-muted-foreground">
                        {[rotulo(o.servico), um(o.imoveis)?.municipio].filter(Boolean).join(" · ")}
                      </span>
                      <span className="block text-base font-bold text-destructive">{s.texto}</span>
                    </span>
                    <ChevronRight className="size-6 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Painel>

      <Painel titulo="Em andamento" icone={Settings2}>
        <div className="grade-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {porStatus.map((s) => {
            const Icone = ICONES_STATUS[s.valor as keyof typeof ICONES_STATUS] ?? Clock3;
            return (
              <Link
                key={s.valor}
                to="/servicos"
                className="flex min-h-24 flex-col justify-between rounded-lg border border-border bg-card px-4 py-3 shadow-card transition-all duration-200 hover:-translate-y-px hover:bg-accent"
              >
                <span className="flex items-center gap-2 text-3xl font-extrabold text-primary">
                  <Icone className="size-4" aria-hidden />
                  {s.total}
                </span>
                <span className="text-sm font-bold uppercase leading-tight text-foreground">
                  {s.rotulo}
                </span>
              </Link>
            );
          })}
        </div>
      </Painel>

      <Painel titulo="Este mês" icone={Clock3}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="rounded-lg border border-border bg-background-light p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase text-muted-foreground">
                  Faturamento do mês
                </p>
                <p className="mt-1 text-3xl font-extrabold text-foreground">
                  {reais(mesQuery.data?.faturamento ?? 0)}
                </p>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">
                  meta {reais(mesQuery.data?.meta ?? 0)}
                </p>
              </div>
              <AnelMeta valor={mesQuery.data?.progressoMeta ?? 0} rotulo="meta" />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background-light p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase text-muted-foreground">Resposta rápida</p>
                <p className="mt-1 text-3xl font-extrabold text-foreground">
                  {resposta?.respondidos ?? 0}/{resposta?.leadsPeriodo ?? 0}
                </p>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">
                  {resposta?.pontosSemana ?? 0} pontos na semana · sequência de{" "}
                  {resposta?.sequenciaDias ?? 0} dias
                </p>
              </div>
              <span className="flex size-12 shrink-0 items-center justify-center rounded-sm bg-secondary text-primary">
                <Zap className="size-6" aria-hidden />
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, resposta?.progresso ?? 0)}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-bold uppercase text-muted-foreground">
              {resposta?.progresso ?? 0}% respondidos em até 24h ·{" "}
              {resposta?.pontosPorResposta ?? 0} pontos por resposta
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2">
            <ResumoMes
              to="/funil"
              icone={Flame}
              valor={mesQuery.data?.leads ?? 0}
              rotulo="Oportunidades recebidas"
            />
            <ResumoMes
              to="/orcamentos"
              icone={FileText}
              valor={mesQuery.data?.enviados ?? 0}
              rotulo="Orçamentos enviados"
            />
            <ResumoMes
              to="/orcamentos"
              icone={TrendingUp}
              valor={mesQuery.data?.aprovados ?? 0}
              rotulo="Orçamentos aprovados"
            />
          </div>
        </div>
      </Painel>
    </div>
  );
}

function ResumoMes({
  to,
  icone: Icone,
  valor,
  rotulo: texto,
}: {
  to: "/funil" | "/orcamentos";
  icone: typeof Flame;
  valor: number;
  rotulo: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-24 flex-col justify-between rounded-lg border border-border bg-card px-4 py-3 shadow-card transition-all duration-200 hover:-translate-y-px hover:bg-accent"
    >
      <span className="flex items-center gap-2 text-3xl font-extrabold text-primary">
        <Icone className="size-4" aria-hidden />
        {numero(valor, 0)}
      </span>
      <span className="text-sm font-bold uppercase text-foreground">{texto}</span>
    </Link>
  );
}
