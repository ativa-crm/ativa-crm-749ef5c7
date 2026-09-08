import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronRight, Flame, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { areaHa, rotulo } from "@/lib/formato";
import { desdeAgora } from "@/lib/tempo";
import { STATUS_OS, STATUS_ENCERRADOS, semaforoPrazo, diasAtePrazo } from "@/lib/prazo";

export const Route = createFileRoute("/_app/inicio")({
  head: () => ({
    meta: [
      { title: "Início | CRM de Topografia" },
      {
        name: "description",
        content:
          "Painel diário: leads quentes sem contato, prazos de ordens de serviço e números do mês.",
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
  imoveis: { nome: string | null; municipio: string | null } | { nome: string | null; municipio: string | null }[] | null;
};

function um<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function inicioDoMes(): string {
  const h = new Date();
  return new Date(Date.UTC(h.getFullYear(), h.getMonth(), 1)).toISOString();
}

function Pagina() {
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
        if (m.oportunidade_id && !ultima[m.oportunidade_id]) ultima[m.oportunidade_id] = m.criado_em;
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
    queryKey: ["inicio", "mes"],
    queryFn: async () => {
      const desde = inicioDoMes();
      const [leads, enviados, aprovados] = await Promise.all([
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
      ]);
      if (leads.error) throw leads.error;
      if (enviados.error) throw enviados.error;
      if (aprovados.error) throw aprovados.error;
      return {
        leads: leads.count ?? 0,
        enviados: enviados.count ?? 0,
        aprovados: aprovados.count ?? 0,
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

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold text-foreground">Início</h1>

      {/* 1. Precisam de você agora */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xl font-extrabold text-foreground">
          <AlertTriangle className="size-6 text-destructive" strokeWidth={2.5} />
          Precisam de você agora
        </h2>

        {carregando ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : semContato.length === 0 && osUrgentes.length === 0 ? (
          <p className="rounded-2xl border-2 border-border bg-card px-4 py-5 text-lg font-semibold text-muted-foreground">
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
                    className="flex min-h-20 items-center gap-3 rounded-2xl border-2 border-destructive/40 bg-card px-4 py-3 shadow-sm active:bg-accent"
                  >
                    <Flame className="size-7 shrink-0 text-destructive" strokeWidth={2.5} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-lg font-extrabold text-foreground">
                        {um(l.clientes)?.nome?.trim() || "Sem cliente"}
                      </span>
                      <span className="block truncate text-base font-semibold text-muted-foreground">
                        {[rotulo(l.servico), l.cidade, areaHa(l.area_ha)].filter(Boolean).join(" · ")}
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
                    className="flex min-h-20 items-center gap-3 rounded-2xl border-2 border-destructive/40 bg-card px-4 py-3 shadow-sm active:bg-accent"
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
      </section>

      {/* 2. Em andamento */}
      <section>
        <h2 className="mb-3 text-xl font-extrabold text-foreground">Em andamento</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {porStatus.map((s) => (
            <Link
              key={s.valor}
              to="/servicos"
              search={{ status: s.valor }}
              className="flex min-h-24 flex-col justify-between rounded-2xl border-2 border-border bg-card px-4 py-3 shadow-sm active:bg-accent"
            >
              <span className="text-3xl font-extrabold text-primary">{s.total}</span>
              <span className="text-base font-bold leading-tight text-foreground">{s.rotulo}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Este mês */}
      <section>
        <h2 className="mb-3 text-xl font-extrabold text-foreground">Este mês</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            to="/funil"
            className="flex min-h-24 flex-col justify-between rounded-2xl border-2 border-border bg-card px-4 py-3 shadow-sm active:bg-accent"
          >
            <span className="text-3xl font-extrabold text-primary">{mesQuery.data?.leads ?? 0}</span>
            <span className="text-base font-bold text-foreground">Leads recebidos</span>
          </Link>
          <Link
            to="/orcamentos"
            search={{ status: "enviado" }}
            className="flex min-h-24 flex-col justify-between rounded-2xl border-2 border-border bg-card px-4 py-3 shadow-sm active:bg-accent"
          >
            <span className="text-3xl font-extrabold text-primary">
              {mesQuery.data?.enviados ?? 0}
            </span>
            <span className="text-base font-bold text-foreground">Orçamentos enviados</span>
          </Link>
          <Link
            to="/orcamentos"
            search={{ status: "aprovado" }}
            className="flex min-h-24 flex-col justify-between rounded-2xl border-2 border-border bg-card px-4 py-3 shadow-sm active:bg-accent"
          >
            <span className="text-3xl font-extrabold text-primary">
              {mesQuery.data?.aprovados ?? 0}
            </span>
            <span className="text-base font-bold text-foreground">Orçamentos aprovados</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
