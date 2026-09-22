import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, FileCheck2, FileSignature, Loader2, Search, TriangleAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { data as dataBR, reais, rotulo } from "@/lib/formato";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BarraFerramentas, CartaoIndicador, Painel, Tabela } from "@/components/painel";

export const Route = createFileRoute("/_app/contratos/")({
  head: () => ({
    meta: [
      { title: "Contratos | CRM de Topografia" },
      { name: "description", content: "Contratos com busca, vigência, assinatura, alerta e documentos em PDF." },
      { property: "og:title", content: "Contratos | CRM de Topografia" },
      { property: "og:description", content: "Controle de contratos, vencimentos, assinatura e PDFs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pagina,
});

type Contrato = {
  id: string;
  numero: string | null;
  status: string | null;
  valor: number | null;
  criado_em: string | null;
  vigencia_ate: string | null;
  assinatura_status: string | null;
  pdf_url: string | null;
  clientes: { nome: string | null } | { nome: string | null }[] | null;
  imoveis: { nome: string | null } | { nome: string | null }[] | null;
};

function um<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function diasAte(v: string | null): number | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const hoje = new Date();
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((a - b) / 86400000);
}

function statusAssinatura(c: Contrato): string {
  return c.assinatura_status || (c.pdf_url ? "assinado" : "pendente");
}

function BadgeContrato({ contrato }: { contrato: Contrato }) {
  const assinatura = statusAssinatura(contrato);
  const ponto = assinatura === "assinado" ? "bg-primary" : assinatura === "pendente" ? "bg-warning" : "bg-destructive";
  return <Badge variant="outline" className="gap-1.5 rounded-full border-border bg-card px-2.5 py-1 text-xs text-foreground"><span className={`size-2 rounded-full ${ponto}`} aria-hidden />{rotulo(assinatura) || assinatura}</Badge>;
}

function Pagina() {
  const [busca, setBusca] = useState("");
  const query = useQuery({
    queryKey: ["contratos"],
    queryFn: async (): Promise<Contrato[]> => {
      const { data, error } = await supabase
        .from("contratos")
        .select("id, numero, status, valor, criado_em, vigencia_ate, assinatura_status, pdf_url, clientes(nome), imoveis(nome)")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Contrato[];
    },
  });

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return query.data ?? [];
    return (query.data ?? []).filter((c) => `${c.numero ?? ""} ${um(c.clientes)?.nome ?? ""} ${um(c.imoveis)?.nome ?? ""} ${rotulo(c.status)}`.toLowerCase().includes(termo));
  }, [query.data, busca]);

  const aVencer = filtrados.filter((c) => {
    const dias = diasAte(c.vigencia_ate);
    return dias !== null && dias >= 0 && dias <= 30;
  });
  const vencidos = filtrados.filter((c) => {
    const dias = diasAte(c.vigencia_ate);
    return dias !== null && dias < 0;
  });
  const semAssinatura = filtrados.filter((c) => statusAssinatura(c) !== "assinado");
  const valorAtivo = filtrados.filter((c) => c.status === "ativo" || c.status === "fechado").reduce((soma, c) => soma + Number(c.valor ?? 0), 0);
  const alerta = semAssinatura[0] ?? aVencer[0] ?? vencidos[0] ?? null;

  return (
    <section className="space-y-4">
      <header className="flex items-center gap-2"><FileSignature className="size-7 text-primary" /><h1 className="text-2xl font-bold text-foreground">Contratos</h1></header>

      <BarraFerramentas>
        <div className="relative min-w-64 flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por contrato, cliente, imóvel ou status" className="h-11 rounded-full border pl-11" /></div>
      </BarraFerramentas>

      <div className="grade-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CartaoIndicador icone={FileSignature} valor={filtrados.length} rotulo="Contratos" apoio="na carteira" destino="/contratos" />
        <CartaoIndicador icone={CalendarClock} valor={aVencer.length} rotulo="Vencem em 30 dias" apoio="renovar ou encerrar" tom={aVencer.length ? "atencao" : "neutro"} destino="/contratos" />
        <CartaoIndicador icone={FileCheck2} valor={semAssinatura.length} rotulo="Sem assinatura" apoio={reais(valorAtivo)} tom={semAssinatura.length ? "critico" : "neutro"} destino="/contratos" />
      </div>

      {alerta ? <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-card p-4"><AlertTriangle className="mt-1 size-5 shrink-0 text-destructive" /><p className="text-base font-bold text-foreground">{alerta.numero ? `Contrato ${alerta.numero}` : "Contrato"} · {um(alerta.clientes)?.nome ?? "cliente não informado"} {statusAssinatura(alerta) !== "assinado" ? "está aguardando assinatura." : "está perto do vencimento."}</p></div> : null}

      <Painel titulo="Contratos" icone={FileSignature} acao={<span className="text-sm font-bold text-muted-foreground">{filtrados.length} itens</span>}>
        {query.isPending ? <div className="flex justify-center py-10"><Loader2 className="size-8 animate-spin text-primary" /></div> : query.error ? <p className="text-base font-bold text-destructive">Não foi possível carregar os contratos.</p> : filtrados.length === 0 ? <p className="text-base font-medium text-muted-foreground">Nenhum contrato encontrado.</p> : (
          <Tabela>
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead><tr className="border-b border-border text-xs font-bold uppercase text-muted-foreground"><th className="px-3 py-2">Contrato</th><th className="px-3 py-2">Cliente</th><th className="px-3 py-2">Imóvel</th><th className="px-3 py-2 text-right">Valor</th><th className="px-3 py-2">Vigência</th><th className="px-3 py-2">Assinatura</th><th className="px-3 py-2">PDF</th></tr></thead>
              <tbody>{filtrados.map((c) => { const dias = diasAte(c.vigencia_ate); return <tr key={c.id} className="border-b border-border last:border-0"><td className="px-3 py-3"><Link to="/contratos/$id" params={{ id: c.id }} className="font-extrabold text-foreground hover:text-primary">{c.numero ? `Contrato nº ${c.numero}` : "Contrato"}</Link><span className="block text-xs font-bold uppercase text-muted-foreground">{rotulo(c.status) || "sem status"}</span></td><td className="px-3 py-3 text-sm font-bold text-foreground">{um(c.clientes)?.nome ?? "—"}</td><td className="px-3 py-3 text-sm font-semibold text-muted-foreground">{um(c.imoveis)?.nome ?? "—"}</td><td className="px-3 py-3 text-right text-sm font-extrabold text-foreground">{reais(c.valor)}</td><td className="px-3 py-3 text-sm font-semibold text-muted-foreground">{c.vigencia_ate ? `${dataBR(c.vigencia_ate)}${dias !== null ? ` · ${dias < 0 ? "vencido" : `${dias} d`}` : ""}` : "—"}</td><td className="px-3 py-3"><BadgeContrato contrato={c} /></td><td className="px-3 py-3">{c.pdf_url ? <Badge className="rounded-full">PDF pronto</Badge> : <Badge variant="outline" className="gap-1.5 rounded-full border-border bg-card px-2.5 py-1 text-xs text-foreground"><TriangleAlert className="size-3" />Pendente</Badge>}</td></tr>; })}</tbody>
            </table>
          </Tabela>
        )}
      </Painel>
    </section>
  );
}
