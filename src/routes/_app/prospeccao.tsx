import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Download,
  Loader2,
  Mail,
  MapPinned,
  MessageCircle,
  Phone,
  Search,
  Settings2,
  Target,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { areaHa } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BarraFerramentas, CartaoIndicador, Painel, Tabela } from "@/components/painel";
import { MapaProspeccao, type PontoImovel } from "@/components/mapa-prospeccao";
import {
  aplicarModelo,
  baixarCsv,
  ESTAGIOS,
  gravarModelo,
  lerModelo,
  linkEmail,
  linkWhats,
  rotuloEstagio,
  SERVICOS_SUGERIDOS,
  telefoneVisivel,
  type Estagio,
  type ModeloMensagem,
} from "@/lib/prospeccao";

export const Route = createFileRoute("/_app/prospeccao")({
  head: () => ({
    meta: [
      { title: "Prospecção | CRM de Topografia" },
      {
        name: "description",
        content:
          "Prospecção de imóveis rurais por município, com mapa, filtros por serviço sugerido, contatos e funil de leads.",
      },
      { property: "og:title", content: "Prospecção | CRM de Topografia" },
      {
        property: "og:description",
        content: "Mapa, tabela e funil de prospecção de imóveis rurais por município.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pagina,
});

type Lead = {
  id: string;
  nome: string | null;
  telefone: string | null;
  email: string | null;
  estagio: string | null;
  documento: string | null;
  proxima_acao: string | null;
  proxima_data: string | null;
  observacoes: string | null;
};

type LinhaImovel = {
  id: string;
  nome: string;
  municipio: string | null;
  uf: string | null;
  area_ha: number | null;
  servico_sugerido: string | null;
  titular_ccir: string | null;
  titular_tipo: string | null;
  observacoes: string | null;
  tem_candidato_pendente: boolean | null;
  prospeccao_id: string | null;
  cliente_id: string | null;
  prospeccao: Lead | Lead[] | null;
};

type Localizacao = { imovel_id: string; lat: number | null; lon: number | null };

const LIMITE = 800;

function um<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function useMunicipios() {
  return useQuery({
    queryKey: ["prospeccao", "municipios"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("imoveis")
        .select("municipio")
        .not("municipio", "is", null)
        .order("municipio", { ascending: true });
      if (error) throw error;
      const set = new Set<string>();
      for (const linha of data ?? []) {
        const m = (linha as { municipio: string | null }).municipio;
        if (m) set.add(m);
      }
      return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
    },
    staleTime: 10 * 60 * 1000,
  });
}

function useImoveis(municipio: string, servico: string) {
  return useQuery({
    queryKey: ["prospeccao", "imoveis", municipio, servico],
    queryFn: async (): Promise<LinhaImovel[]> => {
      let consulta = supabase
        .from("imoveis")
        .select(
          "id, nome, municipio, uf, area_ha, servico_sugerido, titular_ccir, titular_tipo, observacoes, tem_candidato_pendente, prospeccao_id, cliente_id, prospeccao(id, nome, telefone, email, estagio, documento, proxima_acao, proxima_data, observacoes)",
        )
        .order("nome", { ascending: true })
        .limit(LIMITE);
      if (municipio !== "todos") consulta = consulta.eq("municipio", municipio);
      if (servico !== "todos") consulta = consulta.eq("servico_sugerido", servico);
      const { data, error } = await consulta;
      if (error) throw error;
      return (data ?? []) as unknown as LinhaImovel[];
    },
  });
}

function useLocalizacoes(ids: string[]) {
  return useQuery({
    queryKey: ["prospeccao", "localizacoes", ids.length, ids[0] ?? ""],
    enabled: ids.length > 0,
    queryFn: async (): Promise<Localizacao[]> => {
      const { data, error } = await supabase
        .from("imovel_localizacao")
        .select("imovel_id, lat, lon")
        .in("imovel_id", ids);
      if (error) throw error;
      return (data ?? []) as Localizacao[];
    },
  });
}

function Pagina() {
  const { perfil } = usePerfil();
  const queryClient = useQueryClient();

  const [municipio, setMunicipio] = useState("todos");
  const [servico, setServico] = useState("todos");
  const [soContato, setSoContato] = useState(false);
  const [soCandidato, setSoCandidato] = useState(false);
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [modelo, setModelo] = useState<ModeloMensagem>(() => lerModelo());
  const [configAberta, setConfigAberta] = useState(false);

  useEffect(() => setModelo(lerModelo()), []);

  const municipiosQuery = useMunicipios();
  const { data: imoveis, isPending, error } = useImoveis(municipio, servico);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return (imoveis ?? []).filter((i) => {
      if (soContato && !i.prospeccao_id) return false;
      if (soCandidato && !(i.tem_candidato_pendente && !i.prospeccao_id)) return false;
      if (!termo) return true;
      const lead = um(i.prospeccao);
      const alvo = `${i.nome} ${i.municipio ?? ""} ${i.titular_ccir ?? ""} ${i.servico_sugerido ?? ""} ${lead?.nome ?? ""}`;
      return alvo.toLocaleLowerCase("pt-BR").includes(termo);
    });
  }, [imoveis, soContato, soCandidato, busca]);

  const idsFiltrados = useMemo(() => filtrados.map((i) => i.id), [filtrados]);
  const localizacoesQuery = useLocalizacoes(idsFiltrados);

  const pontos = useMemo<PontoImovel[]>(() => {
    const porId = new Map(filtrados.map((i) => [i.id, i]));
    const lista: PontoImovel[] = [];
    for (const loc of localizacoesQuery.data ?? []) {
      const imovel = porId.get(loc.imovel_id);
      if (!imovel || loc.lat === null || loc.lon === null) continue;
      lista.push({
        id: imovel.id,
        lat: Number(loc.lat),
        lon: Number(loc.lon),
        nome: imovel.nome,
        municipio: [imovel.municipio, imovel.uf].filter(Boolean).join("/"),
        servico: imovel.servico_sugerido ?? "Sem serviço sugerido",
        comContato: Boolean(imovel.prospeccao_id),
      });
    }
    return lista;
  }, [filtrados, localizacoesQuery.data]);

  const comContato = filtrados.filter((i) => i.prospeccao_id).length;
  const candidatos = filtrados.filter((i) => i.tem_candidato_pendente && !i.prospeccao_id).length;
  const areaTotal = filtrados.reduce((soma, i) => soma + Number(i.area_ha ?? 0), 0);

  const leadsDoFiltro = useMemo(() => {
    const mapa = new Map<string, { lead: Lead; imovel: LinhaImovel }>();
    for (const i of filtrados) {
      const lead = um(i.prospeccao);
      if (lead && !mapa.has(lead.id)) mapa.set(lead.id, { lead, imovel: i });
    }
    return [...mapa.values()];
  }, [filtrados]);

  const imovelAberto = filtrados.find((i) => i.id === selecionado) ?? null;

  const mudarEstagio = useMutation({
    mutationFn: async ({ leadId, estagio }: { leadId: string; estagio: Estagio }) => {
      const { error: erro } = await supabase
        .from("prospeccao")
        .update({ estagio })
        .eq("id", leadId);
      if (erro) throw erro;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["prospeccao", "imoveis"] });
    },
    onError: () => toast.error("Não foi possível mover o lead."),
  });

  function mensagemDo(imovel: LinhaImovel) {
    const lead = um(imovel.prospeccao);
    const dados = {
      nome: lead?.nome ?? "",
      imovel: imovel.nome,
      municipio: [imovel.municipio, imovel.uf].filter(Boolean).join("/"),
      servico: imovel.servico_sugerido ?? "",
      area: imovel.area_ha !== null ? areaHa(imovel.area_ha) : "",
    };
    return {
      assunto: aplicarModelo(modelo.assunto, dados),
      corpo: aplicarModelo(modelo.corpo, dados),
    };
  }

  function abrirWhats(imovel: LinhaImovel) {
    const lead = um(imovel.prospeccao);
    if (!lead?.telefone) {
      toast.error("Esse lead não tem telefone cadastrado.");
      return;
    }
    const { corpo } = mensagemDo(imovel);
    window.open(linkWhats(lead.telefone, corpo), "_blank", "noopener,noreferrer");
    if ((lead.estagio ?? "novo") === "novo") {
      mudarEstagio.mutate({ leadId: lead.id, estagio: "mensagem_enviada" });
    }
  }

  function abrirEmail(imovel: LinhaImovel) {
    const lead = um(imovel.prospeccao);
    if (!lead?.email) {
      toast.error("Esse lead não tem e-mail cadastrado.");
      return;
    }
    const { assunto, corpo } = mensagemDo(imovel);
    window.open(linkEmail(lead.email, assunto, corpo), "_blank", "noopener,noreferrer");
    if ((lead.estagio ?? "novo") === "novo") {
      mudarEstagio.mutate({ leadId: lead.id, estagio: "mensagem_enviada" });
    }
  }

  function exportar() {
    baixarCsv(
      `prospeccao-${municipio === "todos" ? "todos-municipios" : municipio.toLocaleLowerCase("pt-BR").replace(/\s+/g, "-")}.csv`,
      [
        "Imóvel",
        "Município",
        "UF",
        "Área (ha)",
        "Serviço sugerido",
        "Titular CCIR",
        "Candidato pendente",
        "Situação documental",
        "Lead",
        "Telefone",
        "E-mail",
        "Etapa do lead",
        "Próxima ação",
        "Próxima data",
      ],
      filtrados.map((i) => {
        const lead = um(i.prospeccao);
        return [
          i.nome,
          i.municipio ?? "",
          i.uf ?? "",
          i.area_ha !== null ? String(i.area_ha).replace(".", ",") : "",
          i.servico_sugerido ?? "",
          i.titular_ccir ?? "",
          i.tem_candidato_pendente ? "sim" : "não",
          i.observacoes ?? "",
          lead?.nome ?? "",
          lead?.telefone ?? "",
          lead?.email ?? "",
          lead ? rotuloEstagio(lead.estagio) : "",
          lead?.proxima_acao ?? "",
          lead?.proxima_data ?? "",
        ];
      }),
    );
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Target className="size-6 text-primary" strokeWidth={2.5} />
          Prospecção
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={municipio}
            onChange={(e) => {
              setMunicipio(e.target.value);
              setSelecionado(null);
            }}
            aria-label="Município"
            className="h-11 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground"
          >
            <option value="todos">Todos os municípios</option>
            {(municipiosQuery.data ?? []).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            onClick={() => setConfigAberta(true)}
            className="h-11 px-4 text-base"
          >
            <Settings2 className="size-5" strokeWidth={2.5} />
            Mensagem
          </Button>
          <Button variant="outline" onClick={exportar} className="h-11 px-4 text-base">
            <Download className="size-5" strokeWidth={2.5} />
            Exportar CSV
          </Button>
        </div>
      </header>

      <BarraFerramentas>
        <div className="relative min-w-64 flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            strokeWidth={2.5}
          />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por imóvel, titular ou lead"
            className="h-11 rounded-full border pl-11"
          />
        </div>
        <select
          value={servico}
          onChange={(e) => setServico(e.target.value)}
          aria-label="Serviço sugerido"
          className="h-11 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground"
        >
          <option value="todos">Todos os serviços</option>
          {SERVICOS_SUGERIDOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
          <Switch
            id="so-contato"
            checked={soContato}
            onCheckedChange={(v) => {
              setSoContato(v);
              if (v) setSoCandidato(false);
            }}
          />
          <Label htmlFor="so-contato" className="text-sm font-bold">
            Só com contato
          </Label>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
          <Switch
            id="so-candidato"
            checked={soCandidato}
            onCheckedChange={(v) => {
              setSoCandidato(v);
              if (v) setSoContato(false);
            }}
          />
          <Label htmlFor="so-candidato" className="text-sm font-bold">
            Só candidato pendente
          </Label>
        </div>
      </BarraFerramentas>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <CartaoIndicador
          icone={MapPinned}
          valor={filtrados.length}
          rotulo="Imóveis no filtro"
          apoio={`limite de ${LIMITE} por consulta`}
          destino="/prospeccao"
        />
        <CartaoIndicador
          icone={Phone}
          valor={comContato}
          rotulo="Com contato"
          apoio="lead vinculado ao imóvel"
          destino="/prospeccao"
        />
        <CartaoIndicador
          icone={UserCheck}
          valor={candidatos}
          rotulo="Candidato a confirmar"
          apoio="sem contato conhecido"
          tom="atencao"
          destino="/prospeccao"
        />
        <CartaoIndicador
          icone={Target}
          valor={areaHa(areaTotal)}
          rotulo="Área somada"
          apoio="hectares no filtro"
          destino="/prospeccao"
        />
      </div>

      <Tabs defaultValue="mapa">
        <TabsList className="h-11">
          <TabsTrigger value="mapa" className="text-sm font-bold">
            Mapa
          </TabsTrigger>
          <TabsTrigger value="funil" className="text-sm font-bold">
            Funil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mapa" className="mt-3">
          <Painel titulo="Localização dos imóveis" icone={MapPinned}>
            {localizacoesQuery.isPending && idsFiltrados.length > 0 ? (
              <div className="flex justify-center py-10">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : (
              <MapaProspeccao
                pontos={pontos}
                selecionado={selecionado}
                onSelecionar={setSelecionado}
              />
            )}
          </Painel>
        </TabsContent>

        <TabsContent value="funil" className="mt-3">
          <Painel titulo="Funil de leads do filtro" icone={Users}>
            {leadsDoFiltro.length === 0 ? (
              <p className="text-base font-medium text-muted-foreground">
                Nenhum lead vinculado aos imóveis desse filtro.
              </p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {ESTAGIOS.map((etapa) => {
                  const cartoes = leadsDoFiltro.filter(
                    ({ lead }) => (lead.estagio ?? "novo") === etapa,
                  );
                  return (
                    <div
                      key={etapa}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const leadId = e.dataTransfer.getData("text/plain");
                        if (leadId) mudarEstagio.mutate({ leadId, estagio: etapa });
                      }}
                      className="flex min-h-40 w-60 shrink-0 flex-col gap-2 rounded-lg border border-border bg-muted/30 p-2"
                    >
                      <p className="flex items-center justify-between px-1 text-xs font-bold uppercase text-muted-foreground">
                        {rotuloEstagio(etapa)}
                        <span className="tabular-nums">{cartoes.length}</span>
                      </p>
                      {cartoes.map(({ lead, imovel }) => (
                        <button
                          key={lead.id}
                          type="button"
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("text/plain", lead.id)}
                          onClick={() => setSelecionado(imovel.id)}
                          className="rounded-lg border border-border bg-card p-2 text-left shadow-card hover:border-primary"
                        >
                          <span className="block truncate text-sm font-extrabold text-foreground">
                            {lead.nome || "Lead sem nome"}
                          </span>
                          <span className="block truncate text-xs font-medium text-muted-foreground">
                            {imovel.nome} · {imovel.municipio ?? ""}
                          </span>
                          {lead.telefone && (
                            <span className="mt-1 block text-xs font-semibold text-primary">
                              {telefoneVisivel(lead.telefone)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </Painel>
        </TabsContent>
      </Tabs>

      <Painel
        titulo="Imóveis para prospectar"
        icone={Target}
        acao={
          <span className="text-sm font-bold text-muted-foreground">{filtrados.length} itens</span>
        }
      >
        {error ? (
          <p className="text-base font-bold text-destructive">
            Não foi possível carregar os imóveis.
          </p>
        ) : isPending ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : filtrados.length === 0 ? (
          <p className="text-base font-medium text-muted-foreground">
            Nenhum imóvel encontrado com esses filtros.
          </p>
        ) : (
          <>
            {(imoveis ?? []).length >= LIMITE && (
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                Mostrando os primeiros {LIMITE} imóveis. Escolha um município ou serviço para
                estreitar a lista.
              </p>
            )}
            <Tabela>
              <table className="w-full min-w-[1040px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border text-xs font-bold uppercase text-muted-foreground">
                    <th className="px-3 py-2">Imóvel</th>
                    <th className="px-3 py-2">Município/UF</th>
                    <th className="px-3 py-2 text-right">Área</th>
                    <th className="px-3 py-2">Serviço sugerido</th>
                    <th className="px-3 py-2">Titular (CCIR)</th>
                    <th className="px-3 py-2">Situação documental</th>
                    <th className="px-3 py-2">Contato</th>
                    <th className="px-3 py-2">Etapa do lead</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((i) => {
                    const lead = um(i.prospeccao);
                    return (
                      <tr
                        key={i.id}
                        onClick={() => setSelecionado(i.id)}
                        data-ativo={selecionado === i.id ? "1" : "0"}
                        className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40 data-[ativo=1]:bg-secondary"
                      >
                        <td className="px-3 py-3 text-sm font-extrabold text-foreground">
                          {i.nome}
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-muted-foreground">
                          {[i.municipio, i.uf].filter(Boolean).join("/") || "—"}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-extrabold text-foreground">
                          {i.area_ha !== null ? areaHa(i.area_ha) : "—"}
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-foreground">
                          {i.servico_sugerido || "—"}
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-muted-foreground">
                          {i.titular_ccir || "—"}
                          {i.titular_tipo ? ` · ${i.titular_tipo.toUpperCase()}` : ""}
                        </td>
                        <td className="max-w-72 px-3 py-3 text-sm font-medium text-muted-foreground">
                          <span className="line-clamp-2">{i.observacoes || "—"}</span>
                        </td>
                        <td className="px-3 py-3">
                          {lead ? (
                            <Badge className="gap-1 rounded-full px-2.5 py-1 text-xs">
                              <Phone className="size-3.5" aria-hidden />
                              Contato
                            </Badge>
                          ) : i.tem_candidato_pendente ? (
                            <Badge
                              variant="outline"
                              className="rounded-full border-border px-2.5 py-1 text-xs text-foreground"
                            >
                              Confirmar
                            </Badge>
                          ) : (
                            <span className="text-sm font-semibold text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm font-bold text-foreground">
                          {lead ? rotuloEstagio(lead.estagio) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Tabela>
          </>
        )}
      </Painel>

      {imovelAberto && (
        <DetalheImovel
          imovel={imovelAberto}
          responsavel={perfil?.nome ?? ""}
          onFechar={() => setSelecionado(null)}
          onWhats={() => abrirWhats(imovelAberto)}
          onEmail={() => abrirEmail(imovelAberto)}
          onEstagio={(estagio) => {
            const lead = um(imovelAberto.prospeccao);
            if (lead) mudarEstagio.mutate({ leadId: lead.id, estagio });
          }}
        />
      )}

      <Dialog open={configAberta} onOpenChange={setConfigAberta}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Modelo de mensagem</DialogTitle>
            <DialogDescription>
              Use {"{nome}"}, {"{imovel}"}, {"{municipio}"}, {"{servico}"} e {"{area}"} — trocamos
              pelos dados do imóvel na hora de abrir o WhatsApp ou o e-mail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="assunto-modelo">Assunto do e-mail</Label>
              <Input
                id="assunto-modelo"
                value={modelo.assunto}
                onChange={(e) => setModelo((m) => ({ ...m, assunto: e.target.value }))}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="corpo-modelo">Texto da mensagem</Label>
              <Textarea
                id="corpo-modelo"
                value={modelo.corpo}
                onChange={(e) => setModelo((m) => ({ ...m, corpo: e.target.value }))}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                gravarModelo(modelo);
                setConfigAberta(false);
                toast.success("Modelo de mensagem salvo neste navegador.");
              }}
              className="h-11 px-5 text-base"
            >
              Salvar modelo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function DetalheImovel({
  imovel,
  responsavel,
  onFechar,
  onWhats,
  onEmail,
  onEstagio,
}: {
  imovel: LinhaImovel;
  responsavel: string;
  onFechar: () => void;
  onWhats: () => void;
  onEmail: () => void;
  onEstagio: (estagio: Estagio) => void;
}) {
  const lead = um(imovel.prospeccao);
  return (
    <div className="fixed inset-0 z-[600] flex justify-end bg-foreground/40" onClick={onFechar}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card p-4"
      >
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-extrabold text-foreground">{imovel.nome}</h2>
            <p className="text-sm font-semibold text-muted-foreground">
              {[imovel.municipio, imovel.uf].filter(Boolean).join("/") || "Sem município"}
              {imovel.area_ha !== null ? ` · ${areaHa(imovel.area_ha)}` : ""}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onFechar} aria-label="Fechar">
            <X className="size-5" />
          </Button>
        </header>

        <dl className="mt-4 space-y-2 text-sm">
          <Campo rotulo="Serviço sugerido" valor={imovel.servico_sugerido} />
          <Campo
            rotulo="Titular no CCIR"
            valor={
              imovel.titular_ccir
                ? `${imovel.titular_ccir}${imovel.titular_tipo ? ` · ${imovel.titular_tipo.toUpperCase()}` : ""}`
                : null
            }
          />
          <Campo rotulo="Situação documental" valor={imovel.observacoes} />
          <Campo
            rotulo="Candidato a confirmar"
            valor={imovel.tem_candidato_pendente ? "Sim" : "Não"}
          />
        </dl>

        <div className="mt-5 rounded-lg border border-border bg-muted/30 p-3">
          {lead ? (
            <>
              <p className="text-xs font-bold uppercase text-muted-foreground">Contato do lead</p>
              <p className="mt-1 text-lg font-extrabold text-foreground">
                {lead.nome || "Lead sem nome"}
              </p>
              <p className="text-sm font-semibold text-muted-foreground">
                {lead.telefone ? telefoneVisivel(lead.telefone) : "Sem telefone"} ·{" "}
                {lead.email || "sem e-mail"}
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">
                Etapa: {rotuloEstagio(lead.estagio)}
              </p>
              {lead.proxima_acao && (
                <p className="text-sm font-medium text-muted-foreground">
                  Próxima ação: {lead.proxima_acao}
                  {lead.proxima_data ? ` (${lead.proxima_data})` : ""}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={onWhats} disabled={!lead.telefone} className="h-11 px-4 text-base">
                  <MessageCircle className="size-5" strokeWidth={2.5} />
                  Enviar WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={onEmail}
                  disabled={!lead.email}
                  className="h-11 px-4 text-base"
                >
                  <Mail className="size-5" strokeWidth={2.5} />
                  Enviar e-mail
                </Button>
              </div>

              <div className="mt-3">
                <Label htmlFor="etapa-lead" className="text-xs font-bold uppercase">
                  Mudar etapa
                </Label>
                <select
                  id="etapa-lead"
                  value={(lead.estagio ?? "novo") as Estagio}
                  onChange={(e) => onEstagio(e.target.value as Estagio)}
                  className="mt-1 h-11 w-full rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground"
                >
                  {ESTAGIOS.map((etapa) => (
                    <option key={etapa} value={etapa}>
                      {rotuloEstagio(etapa)}
                    </option>
                  ))}
                </select>
              </div>
              {responsavel && (
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  Abordagem por {responsavel}.
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-xs font-bold uppercase text-muted-foreground">Sem contato</p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {imovel.tem_candidato_pendente
                  ? "Há um candidato a confirmar para este imóvel. Confirme o titular antes de abordar."
                  : "Este imóvel ainda não tem lead vinculado."}
              </p>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-muted-foreground">{rotulo}</dt>
      <dd className="text-sm font-semibold text-foreground">{valor || "—"}</dd>
    </div>
  );
}
