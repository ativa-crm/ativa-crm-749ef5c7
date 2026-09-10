import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CloudSun,
  ClipboardCheck,
  Loader2,
  MapPinned,
  Navigation,
  Plus,
  RotateCcw,
  Settings2,
  Table2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { Bloco, Campo, CampoLongo } from "@/components/campos";
import { data as dataBR, numero, paraNumero, reais, rotulo } from "@/lib/formato";
import { linkRota, type Ponto } from "@/lib/geo";
import {
  AJUDA_PARAMETROS,
  baseDoRoteiro,
  calcularCircuito,
  parametros,
  rotuloStatusRoteiro,
  somar,
  um,
  type Parada,
  type ParadaCalculada,
  type Roteiro,
} from "@/lib/medicao";
import {
  buscarPrevisao,
  buscarRadar,
  classificarJanela,
  previsaoDeTextoColado,
  urlPrevisao,
  type LocalClima,
  type PrevisaoParada,
} from "@/lib/clima";
import { ImportarKml } from "@/components/importar-kml";
import { MapaRoteiro, type ParadaMapa } from "@/components/mapa-roteiro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/medicao/$id")({
  head: () => ({
    meta: [
      { title: "Roteiro de campo | CRM de Topografia" },
      {
        name: "description",
        content:
          "Painel do roteiro de campo: próxima parada, rota calculada, janela de voo por dia e execução real.",
      },
      { property: "og:title", content: "Roteiro de campo | CRM de Topografia" },
      {
        property: "og:description",
        content: "Próxima parada, rota, clima e custos previstos x realizados.",
      },
    ],
  }),
  component: Pagina,
});

const SELECT_PARADA =
  "id, roteiro_id, ordem_servico_id, ordem, lat, lon, n_pontos, dispersao_km, status, sequencia_baixa, km_previsto, horas_previsto, custo_previsto, km_real, horas_real, custo_real, data_execucao, observacoes_campo, ordens_servico(id, numero, servico, status, clientes(nome), imoveis(nome, municipio, uf))";

function nomeCliente(p: Parada): string {
  return um(um(p.ordens_servico)?.clientes)?.nome ?? "sem cliente";
}

function processo(p: Parada): string {
  const os = um(p.ordens_servico);
  return `${os?.numero ? `OS ${os.numero}` : "OS sem número"} · ${rotulo(os?.servico ?? "")}`;
}

function cidade(p: Parada): string {
  const im = um(um(p.ordens_servico)?.imoveis);
  if (!im) return "";
  return `${im.municipio ?? ""}${im.uf ? `/${im.uf}` : ""}`;
}

function horas(v: number | null | undefined): string {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n) || n === 0) return "0 h";
  return `${numero(n, 1)} h`;
}

function Pagina() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  const roteiroQuery = useQuery({
    queryKey: ["roteiro", id],
    queryFn: async (): Promise<Roteiro | null> => {
      const { data, error } = await supabase
        .from("roteiros")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as Roteiro | null) ?? null;
    },
  });

  const paradasQuery = useQuery({
    queryKey: ["roteiro", id, "paradas"],
    queryFn: async (): Promise<Parada[]> => {
      const { data, error } = await supabase
        .from("roteiro_paradas")
        .select(SELECT_PARADA)
        .eq("roteiro_id", id)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Parada[];
    },
  });

  const radarQuery = useQuery({
    queryKey: ["radar-chuva"],
    queryFn: buscarRadar,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  const roteiro = roteiroQuery.data ?? null;
  const paradas = paradasQuery.data ?? [];

  const circuito = useMemo(() => {
    if (!roteiro) return { feitas: [] as ParadaCalculada[], abertas: [] as ParadaCalculada[] };
    return calcularCircuito(roteiro, paradas, roteiro.reotimizar_pendentes !== false);
  }, [roteiro, paradas]);

  const invalidar = () => {
    void queryClient.invalidateQueries({ queryKey: ["roteiro", id] });
    void queryClient.invalidateQueries({ queryKey: ["roteiros"] });
  };

  /** Grava no banco a ordem e os valores previstos das paradas calculadas. */
  const persistir = useMutation({
    mutationFn: async (lista: ParadaCalculada[]) => {
      for (const p of lista) {
        const { error } = await supabase
          .from("roteiro_paradas")
          .update({
            ordem: p.posicao,
            km_previsto: Number(p.previsto.km.toFixed(2)),
            horas_previsto: Number(p.previsto.horas.toFixed(2)),
            custo_previsto: Number(p.previsto.custo.toFixed(2)),
            atualizado_em: new Date().toISOString(),
          })
          .eq("id", p.id);
        if (error) throw error;
      }
    },
    onSuccess: invalidar,
  });

  // Mantém no banco a sequência e os previstos calculados na tela.
  useEffect(() => {
    if (!roteiro) return;
    const todas = [...circuito.feitas, ...circuito.abertas];
    const precisa = todas.some(
      (p) =>
        p.ordem !== p.posicao ||
        p.km_previsto === null ||
        Math.abs(Number(p.km_previsto ?? 0) - p.previsto.km) > 0.05,
    );
    if (precisa && !persistir.isPending) persistir.mutate(todas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circuito.feitas, circuito.abertas, roteiro]);

  const salvarRoteiro = useMutation({
    mutationFn: async (campos: Record<string, unknown>) => {
      const { error } = await supabase
        .from("roteiros")
        .update({ ...campos, atualizado_em: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidar();
      toast.success("Roteiro atualizado.");
    },
    onError: () => toast.error("Não foi possível salvar."),
  });

  if (roteiroQuery.isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  if (roteiroQuery.error || !roteiro) {
    return (
      <section className="py-10 text-center">
        <h1 className="text-2xl font-extrabold text-foreground">Roteiro não encontrado</h1>
        <Button asChild className="mt-6 h-14 rounded-xl px-6 text-lg font-extrabold">
          <Link to="/medicao">Voltar para Medição</Link>
        </Button>
      </section>
    );
  }

  const base = baseDoRoteiro(roteiro, paradas);
  const totaisFeitas = somar(circuito.feitas);
  const totaisAbertas = somar(circuito.abertas);
  const proxima = circuito.abertas[0] ?? null;

  const previsoes = ((roteiro.clima_dados as { previsoes?: PrevisaoParada[] } | null)?.previsoes ??
    []) as PrevisaoParada[];

  const paradasMapa: ParadaMapa[] = [...circuito.feitas, ...circuito.abertas].map((p) => {
    const previsao = previsoes.find((x) => x.paradaId === p.id);
    const primeiroDia = previsao?.dias[0];
    return {
      id: p.id,
      lat: Number(p.lat),
      lon: Number(p.lon),
      posicao: p.posicao,
      baixado: p.status === "baixado",
      proxima: proxima?.id === p.id,
      cliente: nomeCliente(p),
      processo: processo(p),
      chuvaMm: primeiroDia?.chuvaMm ?? null,
      chuvaProb: primeiroDia?.chuvaProb ?? null,
      nivelClima: primeiroDia ? classificarJanela(primeiroDia).nivel : null,
    };
  });

  return (
    <section className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <Link
          to="/medicao"
          className="flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-card text-foreground"
          aria-label="Voltar para Medição"
        >
          <ArrowLeft className="size-6" strokeWidth={2.5} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold text-foreground md:text-3xl">
            {roteiro.nome}
          </h1>
          <p className="truncate text-base font-semibold text-muted-foreground">
            {roteiro.data_prevista ? dataBR(roteiro.data_prevista) : "sem data prevista"} ·{" "}
            {rotuloStatusRoteiro(roteiro.status)} · {paradas.length} paradas
          </p>
        </div>
      </div>

      <Tabs defaultValue="painel">
        <TabsList className="flex h-auto w-full flex-wrap gap-1">
          <TabsTrigger value="painel" className="h-12 flex-1 text-base font-extrabold">
            <MapPinned className="mr-1 size-5" strokeWidth={2.5} />
            Painel
          </TabsTrigger>
          <TabsTrigger value="rota" className="h-12 flex-1 text-base font-extrabold">
            <Table2 className="mr-1 size-5" strokeWidth={2.5} />
            Rota
          </TabsTrigger>
          <TabsTrigger value="clima" className="h-12 flex-1 text-base font-extrabold">
            <CloudSun className="mr-1 size-5" strokeWidth={2.5} />
            Clima
          </TabsTrigger>
          <TabsTrigger value="parametros" className="h-12 flex-1 text-base font-extrabold">
            <Settings2 className="mr-1 size-5" strokeWidth={2.5} />
            Parâmetros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="painel" className="mt-4 space-y-4">
          <Bloco titulo="Próxima parada" Icone={Navigation}>
            {proxima ? (
              <ProximaParada parada={proxima} base={base} roteiroId={id} />
            ) : (
              <p className="text-lg font-medium text-muted-foreground">
                Nenhuma parada pendente. Adicione ordens de serviço ao roteiro.
              </p>
            )}
          </Bloco>

          <Bloco titulo="Mapa do roteiro" Icone={MapPinned}>
            <MapaRoteiro base={base} paradas={paradasMapa} radarUrl={radarQuery.data ?? null} />
          </Bloco>

          <Bloco titulo="Medidores do circuito" Icone={ClipboardCheck}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <Medidor titulo="Km realizados" valor={`${numero(totaisFeitas.kmReal, 1)} km`} />
              <Medidor titulo="Horas realizadas" valor={horas(totaisFeitas.horasReal)} />
              <Medidor titulo="Custo realizado" valor={reais(totaisFeitas.custoReal)} />
              <Medidor titulo="Km pendentes" valor={`${numero(totaisAbertas.kmPrevisto, 1)} km`} />
              <Medidor titulo="Horas pendentes" valor={horas(totaisAbertas.horasPrevisto)} />
              <Medidor titulo="Custo pendente" valor={reais(totaisAbertas.custoPrevisto)} />
              <Medidor
                titulo="Km total do circuito"
                valor={`${numero(totaisFeitas.kmPrevisto + totaisAbertas.kmPrevisto, 1)} km`}
              />
              <Medidor
                titulo="Horas totais"
                valor={horas(totaisFeitas.horasPrevisto + totaisAbertas.horasPrevisto)}
              />
              <Medidor
                titulo="Custo total previsto"
                valor={reais(totaisFeitas.custoPrevisto + totaisAbertas.custoPrevisto)}
              />
            </div>
            <p className="mt-3 text-base font-semibold text-muted-foreground">
              Jornada de campo de {numero(parametros(roteiro).jornada, 1)} h por dia.
            </p>
          </Bloco>

          <IncluirOrdens roteiroId={id} paradas={paradas} />
        </TabsContent>

        <TabsContent value="rota" className="mt-4 space-y-4">
          <Bloco
            titulo="Rota calculada"
            Icone={Table2}
            acao={
              <label className="flex items-center gap-2 text-base font-bold text-foreground">
                <Checkbox
                  checked={roteiro.reotimizar_pendentes !== false}
                  onCheckedChange={(v) =>
                    salvarRoteiro.mutate({ reotimizar_pendentes: v === true })
                  }
                  className="size-6"
                />
                Reotimizar pendentes
              </label>
            }
          >
            <TabelaRota
              feitas={circuito.feitas}
              abertas={circuito.abertas}
              base={base}
              roteiroId={id}
            />
          </Bloco>
        </TabsContent>

        <TabsContent value="clima" className="mt-4 space-y-4">
          <AbaClima roteiro={roteiro} abertas={circuito.abertas} />
        </TabsContent>

        <TabsContent value="parametros" className="mt-4 space-y-4">
          <Bloco titulo="Parâmetros de cálculo" Icone={Settings2}>
            <div className="grid gap-4 sm:grid-cols-2">
              <ParametroCampo
                rotulo="Fator de sinuosidade"
                ajuda={AJUDA_PARAMETROS.fator}
                valor={numero(roteiro.fator_sinuosidade ?? 1.35, 2)}
                onSalvar={(v) => salvarRoteiro.mutate({ fator_sinuosidade: paraNumero(v) })}
              />
              <ParametroCampo
                rotulo="Velocidade média (km/h)"
                ajuda={AJUDA_PARAMETROS.velocidade}
                valor={numero(roteiro.velocidade_media_kmh ?? 55, 0)}
                onSalvar={(v) => salvarRoteiro.mutate({ velocidade_media_kmh: paraNumero(v) })}
              />
              <ParametroCampo
                rotulo="Tempo de vistoria (h)"
                ajuda={AJUDA_PARAMETROS.vistoria}
                valor={numero(roteiro.tempo_vistoria_h ?? 2, 1)}
                onSalvar={(v) => salvarRoteiro.mutate({ tempo_vistoria_h: paraNumero(v) })}
              />
              <ParametroCampo
                rotulo="Jornada de campo (h)"
                ajuda={AJUDA_PARAMETROS.jornada}
                valor={numero(roteiro.jornada_h ?? 9, 1)}
                onSalvar={(v) => salvarRoteiro.mutate({ jornada_h: paraNumero(v) })}
              />
              <ParametroCampo
                rotulo="Custo por km (R$)"
                ajuda={AJUDA_PARAMETROS.custoKm}
                valor={numero(roteiro.custo_km ?? 2.2, 2)}
                onSalvar={(v) => salvarRoteiro.mutate({ custo_km: paraNumero(v) })}
              />
            </div>
          </Bloco>

          <Bloco titulo="Roteiro" Icone={CalendarDays}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                rotulo="Nome do roteiro"
                valor={roteiro.nome}
                onSalvar={(v) => salvarRoteiro.mutate({ nome: v || roteiro.nome })}
              />
              <Campo
                rotulo="Base de saída"
                valor={roteiro.base_endereco ?? ""}
                onSalvar={(v) => salvarRoteiro.mutate({ base_endereco: v || null })}
              />
              <Campo
                rotulo="Latitude da base"
                valor={roteiro.base_lat !== null ? String(roteiro.base_lat) : ""}
                inputMode="decimal"
                onSalvar={(v) => salvarRoteiro.mutate({ base_lat: paraNumero(v) })}
              />
              <Campo
                rotulo="Longitude da base"
                valor={roteiro.base_lon !== null ? String(roteiro.base_lon) : ""}
                inputMode="decimal"
                onSalvar={(v) => salvarRoteiro.mutate({ base_lon: paraNumero(v) })}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {["planejamento", "em_andamento", "concluido"].map((s) => (
                <Button
                  key={s}
                  variant={roteiro.status === s ? "default" : "outline"}
                  onClick={() => salvarRoteiro.mutate({ status: s })}
                  className="h-14 rounded-xl border-2 px-5 text-lg font-extrabold"
                >
                  {rotuloStatusRoteiro(s)}
                </Button>
              ))}
            </div>
          </Bloco>
        </TabsContent>
      </Tabs>
    </section>
  );
}

function Medidor({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-background-light p-3">
      <p className="text-2xl font-extrabold text-primary">{valor}</p>
      <p className="text-sm font-bold uppercase text-foreground">{titulo}</p>
    </div>
  );
}

function ParametroCampo({
  rotulo: nome,
  ajuda,
  valor,
  onSalvar,
}: {
  rotulo: string;
  ajuda: string;
  valor: string;
  onSalvar: (v: string) => void;
}) {
  return (
    <div>
      <Campo rotulo={nome} valor={valor} inputMode="decimal" onSalvar={onSalvar} />
      <p className="mt-1 text-sm font-medium text-muted-foreground">{ajuda}</p>
    </div>
  );
}

function ProximaParada({
  parada,
  base,
  roteiroId,
}: {
  parada: ParadaCalculada;
  base: Ponto | null;
  roteiroId: string;
}) {
  const [baixaAberta, setBaixaAberta] = useState(false);
  const destino: Ponto = { lat: Number(parada.lat), lon: Number(parada.lon) };
  return (
    <div className="rounded-2xl border-l-4 border-primary bg-background-light p-4">
      <p className="text-xl font-extrabold text-foreground">{nomeCliente(parada)}</p>
      <p className="text-base font-semibold text-muted-foreground">
        {processo(parada)}
        {cidade(parada) ? ` · ${cidade(parada)}` : ""}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Medidor titulo="km" valor={numero(parada.km_previsto ?? parada.previsto.km, 1)} />
        <Medidor titulo="horas" valor={horas(parada.horas_previsto ?? parada.previsto.horas)} />
        <Medidor titulo="custo" valor={reais(parada.custo_previsto ?? parada.previsto.custo)} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          asChild
          variant="outline"
          className="h-14 rounded-xl border-2 px-5 text-lg font-extrabold"
        >
          <a href={linkRota(base ?? destino, destino)} target="_blank" rel="noreferrer">
            <Navigation className="size-6" strokeWidth={2.5} />
            Traçar rota
          </a>
        </Button>
        <Button
          onClick={() => setBaixaAberta(true)}
          className="h-14 rounded-xl px-5 text-lg font-extrabold"
        >
          <CheckCircle2 className="size-6" strokeWidth={2.5} />
          Dar baixa
        </Button>
      </div>
      <DialogBaixa
        parada={baixaAberta ? parada : null}
        roteiroId={roteiroId}
        onFechar={() => setBaixaAberta(false)}
      />
    </div>
  );
}

function TabelaRota({
  feitas,
  abertas,
  base,
  roteiroId,
}: {
  feitas: ParadaCalculada[];
  abertas: ParadaCalculada[];
  base: Ponto | null;
  roteiroId: string;
}) {
  const [emBaixa, setEmBaixa] = useState<ParadaCalculada | null>(null);
  const todas = [...feitas, ...abertas];
  const totais = somar(todas);
  const queryClient = useQueryClient();

  const reabrir = useMutation({
    mutationFn: async (parada: ParadaCalculada) => {
      const { error } = await supabase
        .from("roteiro_paradas")
        .update({
          status: "pendente",
          sequencia_baixa: null,
          km_real: null,
          horas_real: null,
          custo_real: null,
          data_execucao: null,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", parada.id);
      if (error) throw error;
      await supabase
        .from("ordens_servico")
        .update({ status: "em_campo" })
        .eq("id", parada.ordem_servico_id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roteiro", roteiroId] });
      toast.success("Baixa desfeita.");
    },
    onError: () => toast.error("Não foi possível desfazer a baixa."),
  });

  if (todas.length === 0) {
    return (
      <p className="text-lg font-medium text-muted-foreground">Nenhuma parada no roteiro ainda.</p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="text-sm font-extrabold uppercase text-muted-foreground">
              <th className="p-2">Trecho</th>
              <th className="p-2">Cliente</th>
              <th className="p-2">Cidade</th>
              <th className="p-2">Km prev. / real</th>
              <th className="p-2">Horas prev. / real</th>
              <th className="p-2">Custo prev. / real</th>
              <th className="p-2">Data</th>
              <th className="p-2">Status</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {todas.map((p) => (
              <tr key={p.id} className="border-t-2 border-border text-base font-semibold">
                <td className="p-2 font-extrabold text-primary">{p.posicao}</td>
                <td className="p-2">
                  <span className="block font-bold text-foreground">{nomeCliente(p)}</span>
                  <span className="block text-sm text-muted-foreground">{processo(p)}</span>
                </td>
                <td className="p-2">{cidade(p) || "—"}</td>
                <td className="p-2">
                  {numero(p.km_previsto ?? p.previsto.km, 1)} /{" "}
                  {p.km_real !== null ? numero(p.km_real, 1) : "—"}
                </td>
                <td className="p-2">
                  {numero(p.horas_previsto ?? p.previsto.horas, 1)} /{" "}
                  {p.horas_real !== null ? numero(p.horas_real, 1) : "—"}
                </td>
                <td className="p-2">
                  {reais(p.custo_previsto ?? p.previsto.custo)} /{" "}
                  {p.custo_real !== null ? reais(p.custo_real) : "—"}
                </td>
                <td className="p-2">{p.data_execucao ? dataBR(p.data_execucao) : "—"}</td>
                <td className="p-2">
                  <Badge
                    className={`rounded-lg text-sm font-extrabold ${
                      p.status === "baixado" ? "" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.status === "baixado" ? "Baixado" : "Pendente"}
                  </Badge>
                </td>
                <td className="p-2">
                  {p.status === "baixado" ? (
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        onClick={() => setEmBaixa(p)}
                        className="h-12 rounded-xl border-2 px-3 text-base font-extrabold"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => reabrir.mutate(p)}
                        aria-label="Desfazer baixa"
                        className="h-12 rounded-xl px-3"
                      >
                        <RotateCcw className="size-5" strokeWidth={2.5} />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setEmBaixa(p)}
                      className="h-12 rounded-xl px-3 text-base font-extrabold"
                    >
                      Dar baixa
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-border text-base font-extrabold text-foreground">
              <td className="p-2" colSpan={3}>
                Totais
              </td>
              <td className="p-2">
                {numero(totais.kmPrevisto, 1)} / {numero(totais.kmReal, 1)}
              </td>
              <td className="p-2">
                {numero(totais.horasPrevisto, 1)} / {numero(totais.horasReal, 1)}
              </td>
              <td className="p-2">
                {reais(totais.custoPrevisto)} / {reais(totais.custoReal)}
              </td>
              <td className="p-2" colSpan={3}></td>
            </tr>
          </tbody>
        </table>
      </div>
      {base ? null : (
        <p className="mt-3 text-base font-semibold text-muted-foreground">
          Informe a base de saída em Parâmetros para o cálculo do primeiro trecho.
        </p>
      )}
      <DialogBaixa parada={emBaixa} roteiroId={roteiroId} onFechar={() => setEmBaixa(null)} />
    </>
  );
}

function DialogBaixa({
  parada,
  roteiroId,
  onFechar,
}: {
  parada: ParadaCalculada | null;
  roteiroId: string;
  onFechar: () => void;
}) {
  const queryClient = useQueryClient();
  const [dataExec, setDataExec] = useState("");
  const [km, setKm] = useState("");
  const [hs, setHs] = useState("");
  const [custo, setCusto] = useState("");
  const [obs, setObs] = useState("");

  useEffect(() => {
    if (parada) {
      setDataExec(parada.data_execucao ?? new Date().toISOString().slice(0, 10));
      setKm(parada.km_real !== null ? numero(parada.km_real, 1) : "");
      setHs(parada.horas_real !== null ? numero(parada.horas_real, 1) : "");
      setCusto(parada.custo_real !== null ? numero(parada.custo_real, 2) : "");
      setObs(parada.observacoes_campo ?? "");
    }
  }, [parada]);

  const confirmar = useMutation({
    mutationFn: async () => {
      if (!parada) return;
      let sequencia = parada.sequencia_baixa;
      if (sequencia === null) {
        const { data } = await supabase
          .from("roteiro_paradas")
          .select("sequencia_baixa")
          .eq("roteiro_id", roteiroId)
          .not("sequencia_baixa", "is", null)
          .order("sequencia_baixa", { ascending: false })
          .limit(1);
        const maior = (data?.[0]?.sequencia_baixa as number | undefined) ?? 0;
        sequencia = maior + 1;
      }

      const { error } = await supabase
        .from("roteiro_paradas")
        .update({
          status: "baixado",
          sequencia_baixa: sequencia,
          data_execucao: dataExec || null,
          km_real: paraNumero(km),
          horas_real: paraNumero(hs),
          custo_real: paraNumero(custo),
          observacoes_campo: obs.trim() || null,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", parada.id);
      if (error) throw error;

      // Depois do campo, a OS segue para processamento dos dados.
      await supabase
        .from("ordens_servico")
        .update({ status: "processamento" })
        .eq("id", parada.ordem_servico_id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roteiro", roteiroId] });
      void queryClient.invalidateQueries({ queryKey: ["ordens_servico"] });
      toast.success("Parada baixada.");
      onFechar();
    },
    onError: () => toast.error("Não foi possível registrar a baixa."),
  });

  return (
    <Dialog open={parada !== null} onOpenChange={(v) => (v ? null : onFechar())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-2">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">Dar baixa na parada</DialogTitle>
        </DialogHeader>

        {parada ? (
          <div className="space-y-4">
            <p className="text-lg font-bold text-foreground">
              {nomeCliente(parada)} · {processo(parada)}
            </p>

            <div>
              <Label htmlFor="data-exec" className="text-base font-bold text-foreground">
                Data de execução
              </Label>
              <Input
                id="data-exec"
                type="date"
                value={dataExec}
                onChange={(e) => setDataExec(e.target.value)}
                className="mt-1.5 h-14 rounded-xl border-2 text-lg font-semibold"
              />
            </div>

            <CampoReal
              id="km-real"
              rotulo="Km rodados"
              valor={km}
              onChange={setKm}
              referencia={`previsto: ${numero(parada.km_previsto ?? parada.previsto.km, 1)} km`}
            />
            <CampoReal
              id="horas-real"
              rotulo="Horas gastas"
              valor={hs}
              onChange={setHs}
              referencia={`previsto: ${numero(parada.horas_previsto ?? parada.previsto.horas, 1)} h`}
            />
            <CampoReal
              id="custo-real"
              rotulo="Custo (R$)"
              valor={custo}
              onChange={setCusto}
              referencia={`previsto: ${reais(parada.custo_previsto ?? parada.previsto.custo)}`}
            />

            <div>
              <Label htmlFor="obs-campo" className="text-base font-bold text-foreground">
                Observações de campo
              </Label>
              <Textarea
                id="obs-campo"
                rows={4}
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Ex.: acesso por estrada de terra, portão trancado"
                className="mt-1.5 rounded-xl border-2 text-lg font-semibold"
              />
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            onClick={() => confirmar.mutate()}
            disabled={confirmar.isPending}
            className="h-14 w-full rounded-xl text-lg font-extrabold"
          >
            {confirmar.isPending ? <Loader2 className="size-6 animate-spin" /> : "Confirmar baixa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CampoReal({
  id,
  rotulo: nome,
  valor,
  onChange,
  referencia,
}: {
  id: string;
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  referencia: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-base font-bold text-foreground">
        {nome}
      </Label>
      <Input
        id={id}
        value={valor}
        inputMode="decimal"
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-14 rounded-xl border-2 text-lg font-semibold"
      />
      <p className="mt-1 text-sm font-bold text-muted-foreground">{referencia}</p>
    </div>
  );
}

type OrdemDisponivel = {
  id: string;
  numero: string | null;
  servico: string | null;
  imovel_id: string | null;
  clientes: { nome: string | null } | { nome: string | null }[] | null;
  imoveis:
    | { nome: string | null; municipio: string | null; uf: string | null }
    | { nome: string | null; municipio: string | null; uf: string | null }[]
    | null;
};

function IncluirOrdens({ roteiroId, paradas }: { roteiroId: string; paradas: Parada[] }) {
  const { perfil } = usePerfil();
  const queryClient = useQueryClient();
  const [escolhida, setEscolhida] = useState<OrdemDisponivel | null>(null);

  const jaNoRoteiro = new Set(paradas.map((p) => p.ordem_servico_id));

  const ordensQuery = useQuery({
    queryKey: ["ordens_servico", "para-roteiro"],
    queryFn: async (): Promise<OrdemDisponivel[]> => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select("id, numero, servico, imovel_id, clientes(nome), imoveis(nome, municipio, uf)")
        .not("imovel_id", "is", null)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrdemDisponivel[];
    },
  });

  const disponiveis = (ordensQuery.data ?? []).filter((o) => !jaNoRoteiro.has(o.id));
  const imovelIds = disponiveis.map((o) => o.imovel_id).filter((v): v is string => !!v);

  const localizacoesQuery = useQuery({
    queryKey: ["imovel_localizacao", imovelIds.join(",")],
    enabled: imovelIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imovel_localizacao")
        .select("imovel_id, lat, lon, dispersao_km")
        .in("imovel_id", imovelIds);
      if (error) throw error;
      return (data ?? []) as {
        imovel_id: string;
        lat: number;
        lon: number;
        dispersao_km: number | null;
      }[];
    },
  });

  const pontosQuery = useQuery({
    queryKey: ["imovel_pontos", "contagem", imovelIds.join(",")],
    enabled: imovelIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imovel_pontos")
        .select("imovel_id")
        .in("imovel_id", imovelIds);
      if (error) throw error;
      const contagem = new Map<string, number>();
      for (const linha of (data ?? []) as { imovel_id: string }[]) {
        contagem.set(linha.imovel_id, (contagem.get(linha.imovel_id) ?? 0) + 1);
      }
      return contagem;
    },
  });

  const adicionar = useMutation({
    mutationFn: async (dados: {
      ordem: OrdemDisponivel;
      lat: number;
      lon: number;
      dispersao: number | null;
      nPontos: number;
    }) => {
      if (!perfil) throw new Error("Perfil não carregado.");
      const { error } = await supabase.from("roteiro_paradas").insert({
        empresa_id: perfil.empresa_id,
        roteiro_id: roteiroId,
        ordem_servico_id: dados.ordem.id,
        lat: dados.lat,
        lon: dados.lon,
        n_pontos: dados.nPontos,
        dispersao_km: dados.dispersao,
        status: "pendente",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roteiro", roteiroId] });
      void queryClient.invalidateQueries({ queryKey: ["roteiros"] });
      setEscolhida(null);
      toast.success("Parada adicionada ao roteiro.");
    },
    onError: () => toast.error("Não foi possível adicionar a parada."),
  });

  const localizacaoDe = (imovelId: string | null) =>
    imovelId ? (localizacoesQuery.data ?? []).find((l) => l.imovel_id === imovelId) : undefined;

  return (
    <Bloco titulo="Incluir ordens de serviço" Icone={Plus}>
      {ordensQuery.isPending ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : disponiveis.length === 0 ? (
        <p className="text-lg font-medium text-muted-foreground">
          Nenhuma ordem de serviço com imóvel vinculado fora do roteiro.
        </p>
      ) : (
        <ul className="space-y-2">
          {disponiveis.map((o) => {
            const im = um(o.imoveis);
            const loc = localizacaoDe(o.imovel_id);
            return (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-lg font-extrabold text-foreground">
                    {um(o.clientes)?.nome ?? "sem cliente"}
                  </p>
                  <p className="truncate text-base font-semibold text-muted-foreground">
                    {o.numero ? `OS ${o.numero}` : "OS sem número"} · {rotulo(o.servico ?? "")} ·{" "}
                    {im?.nome ?? "sem imóvel"}
                    {im?.municipio ? ` · ${im.municipio}` : ""}
                  </p>
                  {loc ? (
                    <p className="text-sm font-bold text-primary">
                      georreferenciado · {numero(loc.lat, 5)}, {numero(loc.lon, 5)}
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-destructive">
                      sem pontos GPS — importe o KML/KMZ do imóvel
                    </p>
                  )}
                </div>
                {loc ? (
                  <Button
                    onClick={() =>
                      adicionar.mutate({
                        ordem: o,
                        lat: Number(loc.lat),
                        lon: Number(loc.lon),
                        dispersao: loc.dispersao_km,
                        nPontos: pontosQuery.data?.get(o.imovel_id ?? "") ?? 0,
                      })
                    }
                    disabled={adicionar.isPending}
                    className="h-14 rounded-xl px-5 text-lg font-extrabold"
                  >
                    <Plus className="size-6" strokeWidth={3} />
                    Adicionar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setEscolhida(o)}
                    className="h-14 rounded-xl border-2 px-5 text-lg font-extrabold"
                  >
                    Importar KML/KMZ
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={escolhida !== null} onOpenChange={(v) => (v ? null : setEscolhida(null))}>
        <DialogContent className="rounded-3xl border-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold">Importar pontos do imóvel</DialogTitle>
          </DialogHeader>
          <p className="text-lg font-medium text-muted-foreground">
            Escolha o arquivo KML ou KMZ do imóvel {um(escolhida?.imoveis)?.nome ?? ""}. Os pontos
            entram na ficha do imóvel e a parada é criada em seguida.
          </p>
          {escolhida?.imovel_id ? (
            <ImportarKml
              imovelId={escolhida.imovel_id}
              onPronto={(r) => {
                if (!escolhida) return;
                adicionar.mutate({
                  ordem: escolhida,
                  lat: r.lat,
                  lon: r.lon,
                  dispersao: r.dispersao,
                  nPontos: r.nPontos,
                });
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Bloco>
  );
}

function AbaClima({ roteiro, abertas }: { roteiro: Roteiro; abertas: ParadaCalculada[] }) {
  const queryClient = useQueryClient();
  const [manualAberto, setManualAberto] = useState(false);
  const [colado, setColado] = useState("");
  const [diaFoco, setDiaFoco] = useState<string | null>(null);

  const locais: LocalClima[] = abertas.map((p) => ({
    id: p.id,
    lat: Number(p.lat),
    lon: Number(p.lon),
  }));

  const previsoes = ((roteiro.clima_dados as { previsoes?: PrevisaoParada[] } | null)?.previsoes ??
    []) as PrevisaoParada[];

  const gravar = useMutation({
    mutationFn: async (lista: PrevisaoParada[]) => {
      const { error } = await supabase
        .from("roteiros")
        .update({
          clima_dados: { previsoes: lista },
          clima_atualizado_em: new Date().toISOString(),
        })
        .eq("id", roteiro.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["roteiro", roteiro.id] });
      setManualAberto(false);
      setColado("");
      toast.success("Previsão atualizada.");
    },
    onError: () => toast.error("Não foi possível salvar a previsão."),
  });

  const atualizar = useMutation({
    mutationFn: async () => buscarPrevisao(locais),
    onSuccess: (lista) => gravar.mutate(lista),
    onError: () => {
      toast.error("A previsão não pôde ser buscada. Use o caminho manual.");
      setManualAberto(true);
    },
  });

  const dias = useMemo(() => {
    const set = new Set<string>();
    for (const p of previsoes) for (const d of p.dias) set.add(d.dia);
    return [...set].sort();
  }, [previsoes]);

  const paradaPorId = new Map(abertas.map((p) => [p.id, p]));

  if (abertas.length === 0) {
    return (
      <Bloco titulo="Janela de voo" Icone={CloudSun}>
        <p className="text-lg font-medium text-muted-foreground">
          A previsão só faz sentido para paradas pendentes. Adicione paradas ao roteiro.
        </p>
      </Bloco>
    );
  }

  return (
    <>
      <Bloco titulo="Janela de voo" Icone={CloudSun}>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => atualizar.mutate()}
            disabled={atualizar.isPending || gravar.isPending}
            className="h-14 rounded-xl px-5 text-lg font-extrabold"
          >
            {atualizar.isPending ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <CloudSun className="size-6" strokeWidth={2.5} />
            )}
            Atualizar previsão
          </Button>
          <Button
            variant="outline"
            onClick={() => setManualAberto(true)}
            className="h-14 rounded-xl border-2 px-5 text-lg font-extrabold"
          >
            Colar previsão manualmente
          </Button>
        </div>
        <p className="mt-2 text-base font-semibold text-muted-foreground">
          {roteiro.clima_atualizado_em
            ? `Atualizada em ${dataBR(roteiro.clima_atualizado_em)}`
            : "Nenhuma previsão carregada ainda."}
        </p>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Limites de voo: rajada de 45 km/h ou mais não voar; 70% de chuva ou 10 mm ruim.
        </p>
      </Bloco>

      {dias.length > 0 ? (
        <>
          <Bloco titulo="Por dia" Icone={CalendarDays}>
            <div className="space-y-4">
              {(diaFoco ? dias.filter((d) => d === diaFoco) : dias.slice(0, 7)).map((dia) => {
                const linhas = previsoes
                  .map((p) => {
                    const d = p.dias.find((x) => x.dia === dia);
                    const parada = paradaPorId.get(p.paradaId);
                    if (!d || !parada) return null;
                    return { parada, clima: d, janela: classificarJanela(d) };
                  })
                  .filter((x): x is NonNullable<typeof x> => x !== null)
                  .sort(
                    (a, b) =>
                      b.janela.nota - a.janela.nota ||
                      (a.clima.chuvaProb ?? 0) - (b.clima.chuvaProb ?? 0),
                  );
                const melhor = linhas[0];
                return (
                  <div key={dia} className="rounded-2xl border-2 border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-lg font-extrabold text-foreground">{dataBR(dia)}</h3>
                      {melhor ? (
                        <span className="text-base font-bold text-primary">
                          melhor parada: {nomeCliente(melhor.parada)}
                        </span>
                      ) : null}
                    </div>
                    <ul className="mt-2 space-y-2">
                      {linhas.map(({ parada, clima, janela }) => (
                        <li
                          key={parada.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-border bg-background-light p-2"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-base font-extrabold text-foreground">
                              {parada.posicao}. {nomeCliente(parada)}
                            </span>
                            <span className="block text-sm font-semibold text-muted-foreground">
                              {numero(clima.chuvaProb ?? 0, 0)}% chuva ·{" "}
                              {numero(clima.chuvaMm ?? 0, 1)} mm · rajada{" "}
                              {numero(clima.rajada ?? 0, 0)} km/h · nuvens{" "}
                              {numero(clima.nuvens ?? 0, 0)}% · {numero(clima.tmin ?? 0, 0)}° a{" "}
                              {numero(clima.tmax ?? 0, 0)}°
                            </span>
                          </span>
                          <Badge className={`rounded-lg text-sm font-extrabold ${janela.classe}`}>
                            {janela.rotulo}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            {diaFoco ? (
              <Button
                variant="outline"
                onClick={() => setDiaFoco(null)}
                className="mt-3 h-14 rounded-xl border-2 px-5 text-lg font-extrabold"
              >
                Ver todos os dias
              </Button>
            ) : null}
          </Bloco>

          <Bloco titulo="Semana" Icone={Table2}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="text-sm font-extrabold uppercase text-muted-foreground">
                    <th className="p-2">Parada</th>
                    {dias.slice(0, 7).map((d) => (
                      <th key={d} className="p-2">
                        {dataBR(d).slice(0, 5)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previsoes.map((p) => {
                    const parada = paradaPorId.get(p.paradaId);
                    if (!parada) return null;
                    return (
                      <tr key={p.paradaId} className="border-t-2 border-border">
                        <td className="p-2 text-base font-bold text-foreground">
                          {parada.posicao}. {nomeCliente(parada)}
                        </td>
                        {dias.slice(0, 7).map((dia) => {
                          const d = p.dias.find((x) => x.dia === dia);
                          if (!d)
                            return (
                              <td key={dia} className="p-2">
                                —
                              </td>
                            );
                          const janela = classificarJanela(d);
                          return (
                            <td key={dia} className="p-2">
                              <button
                                type="button"
                                onClick={() => setDiaFoco(dia)}
                                className={`w-full rounded-lg px-2 py-2 text-sm font-extrabold transition-colors duration-150 ${janela.classe}`}
                              >
                                {janela.rotulo}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Bloco>
        </>
      ) : null}

      <Dialog open={manualAberto} onOpenChange={setManualAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold">Colar previsão do tempo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-base font-semibold text-muted-foreground">
              Abra o endereço abaixo em outra aba, copie todo o conteúdo e cole no campo.
            </p>
            <a
              href={urlPrevisao(locais)}
              target="_blank"
              rel="noreferrer"
              className="block break-all text-base font-extrabold text-primary underline"
            >
              {urlPrevisao(locais)}
            </a>
            <Textarea
              rows={8}
              value={colado}
              onChange={(e) => setColado(e.target.value)}
              placeholder="Cole aqui o conteúdo retornado"
              className="rounded-xl border-2 text-base font-semibold"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                try {
                  gravar.mutate(previsaoDeTextoColado(colado, locais));
                } catch {
                  toast.error("Conteúdo inválido. Copie o texto completo da página.");
                }
              }}
              disabled={colado.trim() === "" || gravar.isPending}
              className="h-14 w-full rounded-xl text-lg font-extrabold"
            >
              Usar este conteúdo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
