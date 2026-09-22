import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Home, Loader2, MapPinned, Plus, Search, Wrench } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { areaHa, rotulo, soDigitos } from "@/lib/formato";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarraFerramentas, CartaoIndicador, Painel, Tabela } from "@/components/painel";

export const Route = createFileRoute("/_app/imoveis/")({
  head: () => ({
    meta: [
      { title: "Imóveis | CRM de Topografia" },
      {
        name: "description",
        content:
          "Lista de imóveis rurais e urbanos com busca por nome, município, matrícula, cliente e status do serviço.",
      },
      { property: "og:title", content: "Imóveis | CRM de Topografia" },
      { property: "og:description", content: "Imóveis, matrículas, clientes e status de serviço." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pagina,
});

type Linha = {
  id: string;
  nome: string;
  tipo: string | null;
  municipio: string | null;
  uf: string | null;
  matricula: string | null;
  area_ha: number | null;
  cliente_id: string | null;
  clientes: { nome: string | null } | { nome: string | null }[] | null;
};

type Localizacao = { imovel_id: string; lat: number | null; lon: number | null };

function um<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function useImoveis() {
  return useQuery({
    queryKey: ["imoveis"],
    queryFn: async (): Promise<Linha[]> => {
      const { data, error } = await supabase
        .from("imoveis")
        .select("id, nome, tipo, municipio, uf, matricula, area_ha, cliente_id, clientes(nome)")
        .order("nome", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Linha[];
    },
  });
}

function useStatusServico() {
  return useQuery({
    queryKey: ["imoveis", "status-servico"],
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select("imovel_id, status, criado_em")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      const mapa: Record<string, string> = {};
      for (const os of data ?? []) {
        const id = (os as { imovel_id: string | null }).imovel_id;
        const status = (os as { status: string | null }).status;
        if (id && status && !mapa[id]) mapa[id] = status;
      }
      return mapa;
    },
  });
}

function Pagina() {
  const { perfil } = usePerfil();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: imoveis, isPending, error } = useImoveis();
  const { data: statusPorImovel } = useStatusServico();

  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<"todos" | "rural" | "urbano">("todos");
  const [cidade, setCidade] = useState("todas");

  const cidades = useMemo(() => {
    const set = new Set<string>();
    for (const i of imoveis ?? []) if (i.municipio) set.add(i.municipio);
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [imoveis]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const digitos = soDigitos(busca);
    return (imoveis ?? []).filter((i) => {
      if (tipo !== "todos" && (i.tipo ?? "rural") !== tipo) return false;
      if (cidade !== "todas" && i.municipio !== cidade) return false;
      if (!termo) return true;
      const alvo = `${i.nome} ${i.municipio ?? ""} ${i.uf ?? ""} ${i.matricula ?? ""} ${um(i.clientes)?.nome ?? ""}`.toLowerCase();
      if (alvo.includes(termo)) return true;
      return digitos.length > 0 && soDigitos(i.matricula ?? "").includes(digitos);
    });
  }, [imoveis, busca, tipo, cidade]);

  const localizacoesQuery = useQuery({
    queryKey: ["imovel_localizacao", "exportacao"],
    enabled: (imoveis ?? []).length > 0,
    queryFn: async (): Promise<Localizacao[]> => {
      const ids = (imoveis ?? []).map((i) => i.id);
      const { data, error } = await supabase
        .from("imovel_localizacao")
        .select("imovel_id, lat, lon")
        .in("imovel_id", ids);
      if (error) throw error;
      return (data ?? []) as Localizacao[];
    },
  });

  const criar = useMutation({
    mutationFn: async () => {
      if (!perfil) throw new Error("Perfil não carregado.");
      const { data, error: erro } = await supabase
        .from("imoveis")
        .insert({ empresa_id: perfil.empresa_id, nome: "Novo imóvel", tipo: "rural" })
        .select("id")
        .single();
      if (erro) throw erro;
      return data.id as string;
    },
    onSuccess: (id) => {
      void queryClient.invalidateQueries({ queryKey: ["imoveis"] });
      void navigate({ to: "/imoveis/$id", params: { id } });
    },
  });

  const areaTotal = filtrados.reduce((soma, item) => soma + Number(item.area_ha ?? 0), 0);
  const comServico = filtrados.filter((item) => statusPorImovel?.[item.id]).length;

  function exportarKml() {
    const porId = new Map((localizacoesQuery.data ?? []).map((l) => [l.imovel_id, l]));
    const placemarks = filtrados
      .map((imovel) => {
        const loc = porId.get(imovel.id);
        if (!loc?.lat || !loc.lon) return null;
        return `<Placemark><name>${imovel.nome}</name><description>${um(imovel.clientes)?.nome ?? ""}</description><Point><coordinates>${loc.lon},${loc.lat},0</coordinates></Point></Placemark>`;
      })
      .filter((linha): linha is string => linha !== null)
      .join("");
    const kml = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>${placemarks}</Document></kml>`;
    const url = URL.createObjectURL(new Blob([kml], { type: "application/vnd.google-earth.kml+xml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "imoveis.kml";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <MapPinned className="size-6 text-primary" strokeWidth={2.5} />
          Imóveis
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportarKml} className="h-11 px-4 text-base">
            <Download className="size-5" strokeWidth={2.5} />
            Exportar KML
          </Button>
          <Button onClick={() => criar.mutate()} disabled={criar.isPending} className="h-11 px-4 text-base">
            {criar.isPending ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" strokeWidth={3} />}
            Novo imóvel
          </Button>
        </div>
      </header>

      <BarraFerramentas>
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" strokeWidth={2.5} />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por imóvel, município, matrícula ou cliente" className="h-11 rounded-full border pl-11" />
        </div>
        <div className="seg">
          {(["todos", "rural", "urbano"] as const).map((t) => (
            <button key={t} type="button" data-ativo={tipo === t} onClick={() => setTipo(t)} className="seg-item">
              {t === "todos" ? "Todos" : rotulo(t)}
            </button>
          ))}
        </div>
        <select value={cidade} onChange={(e) => setCidade(e.target.value)} className="h-11 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground">
          <option value="todas">Todas as cidades</option>
          {cidades.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </BarraFerramentas>

      <div className="grade-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CartaoIndicador icone={MapPinned} valor={filtrados.length} rotulo="Imóveis no filtro" apoio={`de ${(imoveis ?? []).length} cadastrados`} destino="/imoveis" />
        <CartaoIndicador icone={Home} valor={areaHa(areaTotal)} rotulo="Área somada" apoio="hectares no filtro" destino="/imoveis" />
        <CartaoIndicador icone={Wrench} valor={comServico} rotulo="Com serviço ativo" apoio="última OS vinculada" tom="atencao" destino="/servicos" />
      </div>

      <Painel titulo="Carteira de imóveis" icone={MapPinned} acao={<span className="text-sm font-bold text-muted-foreground">{filtrados.length} itens</span>}>
        {error ? (
          <p className="text-base font-bold text-destructive">Não foi possível carregar os imóveis.</p>
        ) : isPending ? (
          <div className="flex justify-center py-10"><Loader2 className="size-8 animate-spin text-primary" /></div>
        ) : filtrados.length === 0 ? (
          <p className="text-base font-medium text-muted-foreground">Nenhum imóvel encontrado com esses filtros.</p>
        ) : (
          <Tabela>
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border text-xs font-bold uppercase text-muted-foreground">
                  <th className="px-3 py-2">Imóvel</th>
                  <th className="px-3 py-2">Município/UF</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2 text-right">Área</th>
                  <th className="px-3 py-2">Matrícula</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Situação</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((i) => {
                  const status = statusPorImovel?.[i.id];
                  return (
                    <tr key={i.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-3">
                        <Link to="/imoveis/$id" params={{ id: i.id }} className="font-extrabold text-foreground hover:text-primary">{i.nome}</Link>
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-muted-foreground">{[i.municipio, i.uf].filter(Boolean).join("/") || "—"}</td>
                      <td className="px-3 py-3 text-sm font-semibold text-foreground">{rotulo(i.tipo ?? "rural")}</td>
                      <td className="px-3 py-3 text-right text-sm font-extrabold text-foreground">{i.area_ha !== null ? areaHa(i.area_ha) : "—"}</td>
                      <td className="px-3 py-3 text-sm font-semibold text-muted-foreground">{i.matricula || "—"}</td>
                      <td className="px-3 py-3 text-sm font-bold text-foreground">{um(i.clientes)?.nome ?? "—"}</td>
                      <td className="px-3 py-3">
                        <Badge variant="outline" className="gap-1.5 rounded-full border-border bg-card px-2.5 py-1 text-xs text-foreground">
                          <span className={`size-2 rounded-full ${status ? "bg-primary" : "bg-muted-foreground"}`} aria-hidden />
                          {status ? rotulo(status) : "Sem serviço"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Tabela>
        )}
      </Painel>
    </section>
  );
}
