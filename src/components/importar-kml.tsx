import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { centroide, dispersaoKm, paraGms, paraUtm } from "@/lib/geo";
import { lerArquivoGeo, type PontoKml } from "@/lib/kml";
import { Button } from "@/components/ui/button";

export type ResultadoImportacao = {
  imovelId: string;
  lat: number;
  lon: number;
  nPontos: number;
  dispersao: number;
};

/**
 * Botão que importa KML/KMZ para um imóvel: grava os pontos em imovel_pontos
 * e recalcula imovel_localizacao (centróide + dispersão).
 */
export function ImportarKml({
  imovelId,
  rotulo = "Importar KML/KMZ",
  onPronto,
}: {
  imovelId: string;
  rotulo?: string;
  onPronto?: (r: ResultadoImportacao) => void;
}) {
  const { perfil } = usePerfil();
  const queryClient = useQueryClient();
  const entrada = useRef<HTMLInputElement | null>(null);
  const [processando, setProcessando] = useState(false);

  const importar = useMutation({
    mutationFn: async (arquivo: File): Promise<ResultadoImportacao> => {
      if (!perfil) throw new Error("Perfil não carregado.");
      const pontos: PontoKml[] = await lerArquivoGeo(arquivo);
      if (pontos.length === 0) throw new Error("Nenhum ponto encontrado no arquivo.");

      const centro = centroide(pontos);
      if (!centro) throw new Error("Não foi possível calcular o ponto de referência.");
      const dispersao = dispersaoKm(pontos, centro);

      await supabase.from("imovel_pontos").delete().eq("imovel_id", imovelId).eq("origem", "kml");

      const linhas = pontos.map((p) => {
        const utm = paraUtm(p.lat, p.lon);
        return {
          empresa_id: perfil.empresa_id,
          imovel_id: imovelId,
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
      });

      const { error } = await supabase.from("imovel_pontos").insert(linhas);
      if (error) throw error;

      const { error: erroLocal } = await supabase.from("imovel_localizacao").upsert(
        {
          empresa_id: perfil.empresa_id,
          imovel_id: imovelId,
          lat: centro.lat,
          lon: centro.lon,
          dispersao_km: dispersao,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "imovel_id" },
      );
      if (erroLocal) throw erroLocal;

      return {
        imovelId,
        lat: centro.lat,
        lon: centro.lon,
        nPontos: pontos.length,
        dispersao,
      };
    },
    onSuccess: (r) => {
      void queryClient.invalidateQueries({ queryKey: ["imovel_pontos", imovelId] });
      void queryClient.invalidateQueries({ queryKey: ["imovel_localizacao"] });
      toast.success(`${r.nPontos} pontos importados.`);
      onPronto?.(r);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível ler o arquivo."),
    onSettled: () => setProcessando(false),
  });

  return (
    <>
      <input
        ref={entrada}
        type="file"
        accept=".kml,.kmz,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz"
        className="hidden"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          e.target.value = "";
          if (!arquivo) return;
          setProcessando(true);
          importar.mutate(arquivo);
        }}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => entrada.current?.click()}
        disabled={processando}
        className="h-14 rounded-xl border-2 px-5 text-lg font-extrabold"
      >
        {processando ? (
          <Loader2 className="size-6 animate-spin" />
        ) : (
          <Upload className="size-6" strokeWidth={2.5} />
        )}
        {rotulo}
      </Button>
    </>
  );
}
