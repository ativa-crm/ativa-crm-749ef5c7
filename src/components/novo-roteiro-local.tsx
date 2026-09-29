import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileUp, Loader2, MapPinned } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { numero, reais } from "@/lib/formato";
import { centroide, dispersaoKm, haversine, paraGms, paraUtm, type Ponto } from "@/lib/geo";
import { lerArquivoGeo, type PontoKml } from "@/lib/kml";
import { parametros, um, type Roteiro } from "@/lib/medicao";
import { BASE_ESCRITORIO, extrairLatLon, rotaPorEstrada, type RotaEstrada } from "@/lib/rota";
import { resolverLinkMaps } from "@/lib/localizacao.functions";
import { MapaRoteiro } from "@/components/mapa-roteiro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Ordem = {
  id: string;
  numero: string | null;
  imovel_id: string | null;
  clientes: { nome: string | null } | { nome: string | null }[] | null;
};

const PADRAO = parametros({} as Roteiro);
const BASE: Ponto = { lat: BASE_ESCRITORIO.lat, lon: BASE_ESCRITORIO.lon };

/** Cria um roteiro a partir de uma localização compartilhada ou de um arquivo KML/KMZ. */
export function NovoRoteiroLocal({ aberta, onFechar }: { aberta: boolean; onFechar: () => void }) {
  const { perfil } = usePerfil();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const resolver = useServerFn(resolverLinkMaps);
  const [nome, setNome] = useState("");
  const [dataPrevista, setDataPrevista] = useState("");
  const [ordemId, setOrdemId] = useState("");
  const [link, setLink] = useState("");
  const [arrastando, setArrastando] = useState(false);
  const [lendo, setLendo] = useState(false);
  const [destino, setDestino] = useState<Ponto | null>(null);
  const [vertices, setVertices] = useState<PontoKml[]>([]);
  const [origem, setOrigem] = useState("");
  const [rota, setRota] = useState<RotaEstrada | null>(null);
  const [calculando, setCalculando] = useState(false);

  useEffect(() => {
    if (!aberta) {
      setNome(""); setDataPrevista(""); setOrdemId(""); setLink("");
      setDestino(null); setVertices([]); setOrigem(""); setRota(null);
    }
  }, [aberta]);

  const ordens = useQuery({
    queryKey: ["ordens_servico", "novo-roteiro-local"],
    enabled: aberta,
    queryFn: async (): Promise<Ordem[]> => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select("id, numero, imovel_id, clientes(nome)")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Ordem[];
    },
  });
  const ordem = ordens.data?.find((o) => o.id === ordemId) ?? null;

  useEffect(() => {
    if (!destino) return;
    let ativo = true;
    setCalculando(true);
    void rotaPorEstrada(BASE, destino).then((r) => {
      if (ativo) { setRota(r); setCalculando(false); }
    });
    return () => { ativo = false; };
  }, [destino]);

  const calculo = useMemo(() => {
    if (!destino) return null;
    const km = rota?.km ?? haversine(BASE, destino) * PADRAO.fator;
    const horasIda = rota?.horas ?? km / PADRAO.velocidade;
    const disp = vertices.length > 0 ? dispersaoKm(vertices, destino) : 0;
    return {
      km,
      horasIda,
      kmTotal: km * 2,
      horasTotal: horasIda * 2 + PADRAO.vistoria,
      custo: km * 2 * PADRAO.custoKm,
      disp,
      estrada: !!rota,
    };
  }, [destino, rota, vertices]);

  async function lerArquivo(arquivo: File) {
    setLendo(true);
    try {
      const pts = await lerArquivoGeo(arquivo);
      const c = centroide(pts);
      if (!c) throw new Error("Nenhum ponto encontrado no arquivo.");
      setVertices(pts);
      setDestino(c);
      setOrigem(`Arquivo ${arquivo.name} · ${pts.length} pontos`);
      if (!nome) setNome(arquivo.name.replace(/\.(kml|kmz)$/i, ""));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível ler o arquivo.");
    } finally {
      setLendo(false);
    }
  }

  async function lerLink() {
    const texto = link.trim();
    if (!texto) return;
    setLendo(true);
    try {
      let ponto = extrairLatLon(texto);
      if (!ponto && /^https?:\/\//.test(texto)) {
        const { url } = await resolver({ data: { url: texto } });
        ponto = extrairLatLon(url);
      }
      if (!ponto) throw new Error("Não achei latitude e longitude nesse link.");
      setVertices([]);
      setDestino(ponto);
      setOrigem("Localização compartilhada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível ler a localização.");
    } finally {
      setLendo(false);
    }
  }

  const criar = useMutation({
    mutationFn: async () => {
      if (!perfil) throw new Error("Perfil não carregado.");
      if (!destino || !calculo) throw new Error("Insira a localização ou o arquivo KML.");
      if (!ordem) throw new Error("Escolha a ordem de serviço desse local.");
      if (!nome.trim()) throw new Error("Informe o nome do roteiro.");

      const { data: rot, error } = await supabase
        .from("roteiros")
        .insert({
          empresa_id: perfil.empresa_id,
          nome: nome.trim(),
          data_prevista: dataPrevista || null,
          base_endereco: BASE_ESCRITORIO.endereco,
          base_lat: BASE.lat,
          base_lon: BASE.lon,
          criado_por: perfil.id,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (ordem.imovel_id) {
        if (vertices.length > 0) {
          await supabase.from("imovel_pontos").delete().eq("imovel_id", ordem.imovel_id).eq("origem", "kml");
          const { error: e1 } = await supabase.from("imovel_pontos").insert(
            vertices.map((p) => {
              const utm = paraUtm(p.lat, p.lon);
              return {
                empresa_id: perfil.empresa_id,
                imovel_id: ordem.imovel_id,
                codigo: p.codigo,
                lat: p.lat,
                lon: p.lon,
                lat_gms: paraGms(p.lat, "lat"),
                lon_gms: paraGms(p.lon, "lon"),
                utm_e: utm.e,
                utm_n: utm.n,
                utm_zona: utm.zona,
                origem: "kml",
              };
            }),
          );
          if (e1) throw e1;
        }
        await supabase.from("imovel_localizacao").upsert(
          {
            empresa_id: perfil.empresa_id,
            imovel_id: ordem.imovel_id,
            lat: destino.lat,
            lon: destino.lon,
            dispersao_km: calculo.disp || null,
            atualizado_em: new Date().toISOString(),
          },
          { onConflict: "imovel_id" },
        );
      }

      const { error: e2 } = await supabase.from("roteiro_paradas").insert({
        empresa_id: perfil.empresa_id,
        roteiro_id: rot.id,
        ordem_servico_id: ordem.id,
        lat: destino.lat,
        lon: destino.lon,
        n_pontos: vertices.length || 1,
        dispersao_km: calculo.disp || null,
        status: "pendente",
        km_previsto: Math.round(calculo.km * 10) / 10,
        horas_previsto: Math.round((calculo.horasIda + PADRAO.vistoria) * 100) / 100,
        custo_previsto: Math.round(calculo.km * PADRAO.custoKm * 100) / 100,
      });
      if (e2) throw e2;
      return rot.id as string;
    },
    onSuccess: (id) => {
      void queryClient.invalidateQueries({ queryKey: ["roteiros"] });
      void queryClient.invalidateQueries({ queryKey: ["imovel_localizacao"] });
      onFechar();
      toast.success("Roteiro criado com a rota calculada.");
      void navigate({ to: "/medicao/$id", params: { id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível criar o roteiro."),
  });

  const campo = "mt-1.5 h-12 rounded-lg border text-base font-semibold";

  return (
    <Dialog open={aberta} onOpenChange={(v) => (v ? null : onFechar())}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto rounded-lg border-2">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">Roteiro por localização ou KML</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <label
            onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
            onDragLeave={() => setArrastando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastando(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void lerArquivo(f);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center ${arrastando ? "border-primary bg-primary/10" : "border-border bg-muted/30"}`}
          >
            {lendo ? <Loader2 className="size-8 animate-spin text-primary" /> : <FileUp className="size-8 text-primary" />}
            <span className="text-base font-bold text-foreground">Arraste o arquivo KML/KMZ aqui</span>
            <span className="text-sm font-medium text-muted-foreground">ou toque para escolher</span>
            <input
              type="file"
              accept=".kml,.kmz"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void lerArquivo(f);
              }}
            />
          </label>

          <div>
            <Label className="text-base font-bold text-foreground">Ou cole a localização compartilhada</Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void lerLink()}
                placeholder="https://maps.app.goo.gl/... ou -23.81, -48.85"
                className="h-12 rounded-lg border text-base font-semibold"
              />
              <Button onClick={() => void lerLink()} disabled={lendo || !link.trim()} className="h-12 px-4">
                <MapPinned className="size-5" />
                Localizar
              </Button>
            </div>
          </div>

          {destino && calculo ? (
            <div className="space-y-3">
              <p className="text-sm font-bold text-primary">
                {origem} · {numero(destino.lat, 6)}, {numero(destino.lon, 6)}
              </p>
              <MapaRoteiro
                base={BASE}
                altura={300}
                trajeto={rota?.trajeto ?? null}
                poligono={vertices.length > 2 ? vertices.map((v) => [v.lat, v.lon] as [number, number]) : null}
                paradas={[{ id: "novo", lat: destino.lat, lon: destino.lon, posicao: 1, baixado: false, proxima: true, cliente: ordem ? um(ordem.clientes)?.nome ?? "Local" : "Local", processo: origem }]}
              />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Distância (ida)", `${numero(calculo.km, 1)} km`],
                  ["Tempo de estrada", `${numero(calculo.horasIda, 1)} h`],
                  ["Ida e volta + vistoria", `${numero(calculo.kmTotal, 1)} km · ${numero(calculo.horasTotal, 1)} h`],
                  ["Custo estimado", reais(calculo.custo)],
                ].map(([t, v]) => (
                  <div key={t} className="rounded-lg border-2 border-border bg-card p-3">
                    <p className="text-xs font-bold uppercase text-muted-foreground">{t}</p>
                    <p className="text-base font-extrabold text-foreground">{v}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                {calculando
                  ? "Calculando a rota pela estrada…"
                  : calculo.estrada
                    ? "Rota calculada pela estrada saindo do escritório."
                    : "Sem resposta do serviço de rotas: distância estimada em linha reta × sinuosidade."}{" "}
                Custo de ida e volta a {reais(PADRAO.custoKm)}/km; vistoria de {numero(PADRAO.vistoria, 0)} h.
                {calculo.disp > 0 ? ` Dispersão dos pontos: ${numero(calculo.disp, 2)} km.` : ""}
              </p>
            </div>
          ) : null}

          <div>
            <Label className="text-base font-bold text-foreground">Ordem de serviço desse local</Label>
            <select
              value={ordemId}
              onChange={(e) => setOrdemId(e.target.value)}
              className="mt-1.5 h-12 w-full rounded-lg border border-border bg-card px-3 text-base font-semibold text-foreground"
            >
              <option value="">Escolha a OS</option>
              {(ordens.data ?? []).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.numero ? `OS ${o.numero}` : "OS"} · {um(o.clientes)?.nome ?? "sem cliente"}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-base font-bold text-foreground">Nome do roteiro</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} className={campo} />
            </div>
            <div>
              <Label className="text-base font-bold text-foreground">Data prevista</Label>
              <Input type="date" value={dataPrevista} onChange={(e) => setDataPrevista(e.target.value)} className={campo} />
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground">Base de saída: {BASE_ESCRITORIO.endereco}</p>
        </div>
        <DialogFooter>
          <Button onClick={() => criar.mutate()} disabled={criar.isPending || !destino} className="h-12 w-full text-base font-extrabold">
            {criar.isPending ? <Loader2 className="size-5 animate-spin" /> : "Criar roteiro com esta rota"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
