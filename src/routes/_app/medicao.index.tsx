import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Route as RotaIcone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { data as dataBR, numero, reais } from "@/lib/formato";
import { rotuloStatusRoteiro } from "@/lib/medicao";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/medicao/")({
  head: () => ({
    meta: [
      { title: "Medição de campo | CRM de Topografia" },
      {
        name: "description",
        content:
          "Roteiros de campo para levantamento topográfico: paradas, distâncias, custos e janela de voo.",
      },
      { property: "og:title", content: "Medição de campo | CRM de Topografia" },
      {
        property: "og:description",
        content: "Planeje o roteiro de campo com paradas, custos e previsão do tempo.",
      },
    ],
  }),
  component: Pagina,
});

type ParadaResumo = { id: string; status: string | null; custo_previsto: number | null };

type RoteiroLista = {
  id: string;
  nome: string;
  data_prevista: string | null;
  status: string | null;
  base_endereco: string | null;
  roteiro_paradas: ParadaResumo[] | null;
};

function Pagina() {
  const [novoAberto, setNovoAberto] = useState(false);

  const roteirosQuery = useQuery({
    queryKey: ["roteiros"],
    queryFn: async (): Promise<RoteiroLista[]> => {
      const { data, error } = await supabase
        .from("roteiros")
        .select(
          "id, nome, data_prevista, status, base_endereco, roteiro_paradas(id, status, custo_previsto)",
        )
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RoteiroLista[];
    },
  });

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <RotaIcone className="size-6 text-primary" strokeWidth={2.5} />
          Medição
        </h1>
        <Button
          onClick={() => setNovoAberto(true)}
          className="h-11 rounded-full px-4 text-base font-semibold"
        >
          <Plus className="size-6" strokeWidth={3} />
          Novo roteiro
        </Button>
      </header>

      <p className="mt-2 text-lg font-medium text-muted-foreground">
        Monte a viagem de campo, calcule a melhor sequência de paradas e acompanhe a execução.
      </p>

      {roteirosQuery.isPending ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-10 animate-spin text-primary" />
        </div>
      ) : roteirosQuery.error ? (
        <p className="mt-6 text-lg font-semibold text-destructive">
          Não foi possível carregar os roteiros.
        </p>
      ) : (roteirosQuery.data ?? []).length === 0 ? (
        <div className="mt-6 rounded-3xl border-2 border-border bg-card p-8 text-center shadow-sm">
          <RotaIcone className="mx-auto size-12 text-primary" strokeWidth={2.5} />
          <p className="mt-3 text-lg font-bold text-foreground">Nenhum roteiro criado ainda</p>
          <p className="mt-1 text-base font-medium text-muted-foreground">
            Crie um roteiro e adicione as ordens de serviço que serão visitadas.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {(roteirosQuery.data ?? []).map((r) => {
            const paradas = r.roteiro_paradas ?? [];
            const feitas = paradas.filter((p) => p.status === "baixado").length;
            const custo = paradas.reduce((s, p) => s + Number(p.custo_previsto ?? 0), 0);
            return (
              <Link
                key={r.id}
                to="/medicao/$id"
                params={{ id: r.id }}
                className="block rounded-3xl border-2 border-border bg-card p-4 shadow-sm transition-colors duration-200 hover:bg-accent"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xl font-extrabold text-foreground">{r.nome}</p>
                    <p className="text-base font-semibold text-muted-foreground">
                      {r.data_prevista ? dataBR(r.data_prevista) : "sem data prevista"}
                      {r.base_endereco ? ` · saída de ${r.base_endereco}` : ""}
                    </p>
                    <p className="mt-1 text-base font-bold text-primary">
                      {feitas} de {paradas.length} paradas baixadas
                      {paradas.length > 0
                        ? ` · ${numero((feitas / paradas.length) * 100, 0)}%`
                        : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge
                      variant="outline"
                      className="gap-1.5 rounded-full border-border bg-card px-2.5 py-1 text-xs text-foreground"
                    >
                      <span
                        className={`size-2 rounded-full ${r.status === "concluido" ? "bg-primary" : "bg-amber-500"}`}
                        aria-hidden
                      />
                      {rotuloStatusRoteiro(r.status)}
                    </Badge>
                    <p className="mt-1 text-lg font-extrabold text-foreground">{reais(custo)}</p>
                    <p className="text-sm font-bold text-muted-foreground">custo previsto</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <NovoRoteiro aberto={novoAberto} onFechar={() => setNovoAberto(false)} />
    </section>
  );
}

function NovoRoteiro({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { perfil } = usePerfil();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [nome, setNome] = useState("");
  const [dataPrevista, setDataPrevista] = useState("");
  const [endereco, setEndereco] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");

  useEffect(() => {
    if (!aberto) {
      setNome("");
      setDataPrevista("");
      setEndereco("");
      setLat("");
      setLon("");
    }
  }, [aberto]);

  const criar = useMutation({
    mutationFn: async () => {
      if (!perfil) throw new Error("Perfil não carregado.");
      if (!nome.trim()) throw new Error("Informe o nome do roteiro.");
      const { data, error } = await supabase
        .from("roteiros")
        .insert({
          empresa_id: perfil.empresa_id,
          nome: nome.trim(),
          data_prevista: dataPrevista || null,
          base_endereco: endereco.trim() || null,
          base_lat: lat.trim() ? Number(lat.replace(",", ".")) : null,
          base_lon: lon.trim() ? Number(lon.replace(",", ".")) : null,
          criado_por: perfil.id,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      void queryClient.invalidateQueries({ queryKey: ["roteiros"] });
      onFechar();
      toast.success("Roteiro criado.");
      void navigate({ to: "/medicao/$id", params: { id } });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Não foi possível criar o roteiro."),
  });

  return (
    <Dialog open={aberto} onOpenChange={(v) => (v ? null : onFechar())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-2">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">Novo roteiro de campo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="nome-roteiro" className="text-base font-bold text-foreground">
              Nome do roteiro
            </Label>
            <Input
              id="nome-roteiro"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Campo Itapeva — semana 12"
              className="mt-1.5 h-14 rounded-xl border-2 text-lg font-semibold"
            />
          </div>
          <div>
            <Label htmlFor="data-roteiro" className="text-base font-bold text-foreground">
              Data prevista
            </Label>
            <Input
              id="data-roteiro"
              type="date"
              value={dataPrevista}
              onChange={(e) => setDataPrevista(e.target.value)}
              className="mt-1.5 h-14 rounded-xl border-2 text-lg font-semibold"
            />
          </div>
          <div>
            <Label htmlFor="base-roteiro" className="text-base font-bold text-foreground">
              Base de saída (opcional)
            </Label>
            <Input
              id="base-roteiro"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Ex.: Escritório — Itapeva/SP"
              className="mt-1.5 h-14 rounded-xl border-2 text-lg font-semibold"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="lat-roteiro" className="text-base font-bold text-foreground">
                Latitude da base
              </Label>
              <Input
                id="lat-roteiro"
                value={lat}
                inputMode="decimal"
                onChange={(e) => setLat(e.target.value)}
                placeholder="-23.98"
                className="mt-1.5 h-14 rounded-xl border-2 text-lg font-semibold"
              />
            </div>
            <div>
              <Label htmlFor="lon-roteiro" className="text-base font-bold text-foreground">
                Longitude da base
              </Label>
              <Input
                id="lon-roteiro"
                value={lon}
                inputMode="decimal"
                onChange={(e) => setLon(e.target.value)}
                placeholder="-48.87"
                className="mt-1.5 h-14 rounded-xl border-2 text-lg font-semibold"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => criar.mutate()}
            disabled={criar.isPending}
            className="h-14 w-full rounded-xl text-lg font-extrabold"
          >
            {criar.isPending ? <Loader2 className="size-6 animate-spin" /> : "Criar roteiro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
