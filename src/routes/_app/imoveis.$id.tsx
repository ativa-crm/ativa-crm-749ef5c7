import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ClipboardList,
  FileText,
  Fence,
  Loader2,
  MapPinned,
  ScrollText,
  Trash2,
  User,
  ExternalLink,
  Satellite,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Bloco, Campo, CampoLongo, CampoOpcoes, Grade } from "@/components/campos";
import { areaHa, data, mascaraUF, numero, paraNumero, reais, rotulo } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { ImportarKml } from "@/components/importar-kml";
import { PainelAnuencias } from "@/components/painel-anuencias";
import { usePerfil } from "@/lib/perfil";
import { BASE_ESCRITORIO } from "@/lib/rota";
import { centroide, paraGms, paraUtm } from "@/lib/geo";

export const Route = createFileRoute("/_app/imoveis/$id")({
  head: () => ({
    meta: [
      { title: "Ficha do imóvel | CRM de Topografia" },
      {
        name: "description",
        content:
          "Ficha completa do imóvel: identificação, documentação, confrontantes, histórico de serviços e documentos.",
      },
      { property: "og:title", content: "Ficha do imóvel | CRM de Topografia" },
      {
        property: "og:description",
        content: "Identificação, documentação e histórico do imóvel.",
      },
    ],
  }),
  component: Pagina,
});

type Imovel = {
  id: string;
  empresa_id: string;
  cliente_id: string | null;
  nome: string;
  tipo: string | null;
  area_ha: number | null;
  municipio: string | null;
  uf: string | null;
  matricula: string | null;
  cartorio: string | null;
  ccir: string | null;
  codigo_incra: string | null;
  car: string | null;
  sigef: string | null;
  inscricao_municipal: string | null;
  confrontantes: string | null;
  observacoes: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

function Pagina() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [excluindo, setExcluindo] = useState(false);

  const imovelQuery = useQuery({
    queryKey: ["imovel", id],
    queryFn: async (): Promise<Imovel | null> => {
      const { data: linha, error } = await supabase
        .from("imoveis")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (linha as Imovel | null) ?? null;
    },
  });

  const clientesQuery = useQuery({
    queryKey: ["clientes", "resumo"],
    queryFn: async () => {
      const { data: linhas, error } = await supabase
        .from("clientes")
        .select("id, nome")
        .order("nome");
      if (error) throw error;
      return (linhas ?? []) as { id: string; nome: string }[];
    },
  });

  const oportunidadesQuery = useQuery({
    queryKey: ["imovel", id, "oportunidades"],
    queryFn: async () => {
      const { data: linhas, error } = await supabase
        .from("oportunidades")
        .select("id, servico, estagio, valor_estimado, criado_em")
        .eq("imovel_id", id)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return linhas ?? [];
    },
  });

  const orcamentosQuery = useQuery({
    queryKey: ["imovel", id, "orcamentos"],
    queryFn: async () => {
      const { data: linhas, error } = await supabase
        .from("orcamentos")
        .select("id, numero, status, total, criado_em")
        .eq("imovel_id", id)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return linhas ?? [];
    },
  });

  const ordensQuery = useQuery({
    queryKey: ["imovel", id, "ordens"],
    queryFn: async () => {
      const { data: linhas, error } = await supabase
        .from("ordens_servico")
        .select("id, numero, servico, status, prazo, criado_em")
        .eq("imovel_id", id)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return linhas ?? [];
    },
  });

  const documentosQuery = useQuery({
    queryKey: ["imovel", id, "documentos"],
    queryFn: async () => {
      const { data: linhas, error } = await supabase
        .from("documentos")
        .select("id, categoria, nome, url, criado_em")
        .eq("imovel_id", id)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return linhas ?? [];
    },
  });

  const pontosQuery = useQuery({
    queryKey: ["imovel_pontos", id],
    queryFn: async () => {
      const { data: linhas, error } = await supabase
        .from("imovel_pontos")
        .select("id, codigo, lat, lon, lat_gms, lon_gms, utm_e, utm_n, utm_zona, origem")
        .eq("imovel_id", id)
        .order("codigo", { ascending: true });
      if (error) throw error;
      return (linhas ?? []) as {
        id: string;
        codigo: string | null;
        lat: number;
        lon: number;
        lat_gms: string | null;
        lon_gms: string | null;
        utm_e: number | null;
        utm_n: number | null;
        utm_zona: string | null;
        origem: string | null;
      }[];
    },
  });

  // Ponto de referência do imóvel (SIGEF > CAR > CCIR > localização do CRM).
  const { perfil } = usePerfil();
  const referenciaQuery = useQuery({
    queryKey: ["imovel", id, "ponto-referencia"],
    queryFn: async () => {
      const { data: linhas, error } = await supabase.rpc("imovel_ponto_referencia", { p_imovel: id });
      if (error) throw error;
      const r = (linhas ?? [])[0] as { lat: number; lon: number; fonte: string } | undefined;
      return r ?? null;
    },
  });

  // Sem pontos ainda: grava o ponto de referência como primeiro ponto (uma vez).
  const jaGravouRef = useRef(false);
  useEffect(() => {
    const ref = referenciaQuery.data;
    if (jaGravouRef.current || !ref || !perfil?.empresa_id) return;
    if (!pontosQuery.isSuccess || (pontosQuery.data ?? []).length > 0) return;
    jaGravouRef.current = true;
    const utm = paraUtm(ref.lat, ref.lon);
    void supabase
      .from("imovel_pontos")
      .insert({
        empresa_id: perfil.empresa_id,
        imovel_id: id,
        codigo: `REF (${ref.fonte})`,
        lat: ref.lat,
        lon: ref.lon,
        lat_gms: paraGms(ref.lat, "lat"),
        lon_gms: paraGms(ref.lon, "lon"),
        utm_e: utm.e,
        utm_n: utm.n,
        utm_zona: utm.zona,
        origem: "mapa",
      })
      .then(({ error }) => {
        if (!error) void queryClient.invalidateQueries({ queryKey: ["imovel_pontos", id] });
      });
  }, [referenciaQuery.data, pontosQuery.isSuccess, pontosQuery.data, perfil?.empresa_id, id, queryClient]);

  const salvar = useMutation({
    mutationFn: async (campos: Record<string, unknown>) => {
      const { error } = await supabase.from("imoveis").update(campos).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["imovel", id] });
      queryClient.invalidateQueries({ queryKey: ["imoveis"] });
      toast.success("Alteração salva");
    },
    onError: () => toast.error("Não foi possível salvar. Tente de novo."),
  });

  const excluir = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("imoveis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["imoveis"] });
      toast.success("Imóvel excluído");
      navigate({ to: "/imoveis" });
    },
    onError: () => toast.error("Não foi possível excluir este imóvel."),
  });

  if (imovelQuery.isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  const imovel = imovelQuery.data;

  if (imovelQuery.error || !imovel) {
    return (
      <section className="py-10 text-center">
        <h1 className="text-2xl font-extrabold text-foreground">Imóvel não encontrado</h1>
        <p className="mt-2 text-lg font-medium text-muted-foreground">
          Ele pode ter sido excluído ou pertence a outra empresa.
        </p>
        <Button asChild className="mt-6 h-14 rounded-xl px-6 text-lg font-extrabold">
          <Link to="/imoveis">Voltar para imóveis</Link>
        </Button>
      </section>
    );
  }

  const troca = (campo: string) => (v: string) => salvar.mutate({ [campo]: v === "" ? null : v });

  return (
    <section className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <Link
          to="/imoveis"
          className="flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-card text-foreground"
          aria-label="Voltar para a lista de imóveis"
        >
          <ArrowLeft className="size-6" strokeWidth={2.5} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold text-foreground md:text-3xl">
            {imovel.nome}
          </h1>
          <p className="truncate text-base font-semibold text-muted-foreground">
            {imovel.municipio || "Município não informado"}
            {imovel.uf ? ` · ${imovel.uf}` : ""} ·{" "}
            {imovel.area_ha !== null ? areaHa(imovel.area_ha) : "área não informada"}
          </p>
        </div>
      </div>

      <Bloco titulo="Identificação" Icone={MapPinned}>
        <Grade>
          <Campo
            rotulo="Nome do imóvel"
            valor={imovel.nome ?? ""}
            onSalvar={(v) => salvar.mutate({ nome: v === "" ? "Sem nome" : v })}
            larguraTotal
          />
          <CampoOpcoes
            rotulo="Tipo"
            valor={imovel.tipo ?? "rural"}
            opcoes={[
              { valor: "rural", rotulo: "Rural" },
              { valor: "urbano", rotulo: "Urbano" },
            ]}
            onSalvar={(v) => salvar.mutate({ tipo: v })}
          />
          <Campo
            rotulo="Área (ha)"
            valor={imovel.area_ha !== null ? numero(imovel.area_ha, 4) : ""}
            inputMode="decimal"
            onSalvar={(v) => salvar.mutate({ area_ha: paraNumero(v) })}
          />
          <Campo rotulo="Município" valor={imovel.municipio ?? ""} onSalvar={troca("municipio")} />
          <Campo rotulo="UF" valor={imovel.uf ?? ""} mascara={mascaraUF} onSalvar={troca("uf")} />
        </Grade>

        <div className="mt-4">
          <span className="text-base font-bold text-foreground">Cliente vinculado</span>
          <select
            value={imovel.cliente_id ?? ""}
            onChange={(e) =>
              salvar.mutate({ cliente_id: e.target.value === "" ? null : e.target.value })
            }
            className="mt-1.5 h-14 w-full rounded-xl border-2 border-border bg-card px-3 text-lg font-bold text-foreground"
          >
            <option value="">Sem cliente vinculado</option>
            {(clientesQuery.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          {imovel.cliente_id ? (
            <Link
              to="/clientes/$id"
              params={{ id: imovel.cliente_id }}
              className="mt-2 inline-flex items-center gap-2 text-base font-extrabold text-primary underline"
            >
              <User className="size-5" strokeWidth={2.5} />
              Abrir ficha do cliente
            </Link>
          ) : null}
        </div>
      </Bloco>

      <Bloco titulo="Documentação" Icone={FileText}>
        <Grade>
          <Campo rotulo="Matrícula" valor={imovel.matricula ?? ""} onSalvar={troca("matricula")} />
          <Campo rotulo="Cartório" valor={imovel.cartorio ?? ""} onSalvar={troca("cartorio")} />
          <Campo rotulo="CCIR" valor={imovel.ccir ?? ""} onSalvar={troca("ccir")} />
          <Campo
            rotulo="Código INCRA"
            valor={imovel.codigo_incra ?? ""}
            onSalvar={troca("codigo_incra")}
          />
          <Campo
            rotulo="CAR"
            valor={imovel.car ?? ""}
            onSalvar={troca("car")}
            mascara={(v) => v.toUpperCase().replace(/[.\s]/g, "")}
            placeholder="SP-0000000-XXXXXXXX…"
          />
          <Campo rotulo="SIGEF" valor={imovel.sigef ?? ""} onSalvar={troca("sigef")} />
          {(imovel.sigef || imovel.car || imovel.ccir) && (
            <div className="sm:col-span-2">
              <Button asChild variant="outline" className="h-12 w-full text-base font-extrabold sm:w-auto">
                <Link
                  to="/mapa"
                  search={
                    imovel.sigef
                      ? { sigef: imovel.sigef }
                      : imovel.car
                        ? { car: imovel.car }
                        : { ccir: imovel.ccir ?? undefined }
                  }
                >
                  <MapPinned className="size-5" strokeWidth={2.5} />
                  Ver no mapa
                </Link>
              </Button>
            </div>
          )}
          <Campo
            rotulo="Inscrição municipal"
            valor={imovel.inscricao_municipal ?? ""}
            onSalvar={troca("inscricao_municipal")}
            larguraTotal
          />
        </Grade>
      </Bloco>

      <Bloco
        titulo="Confrontantes"
        Icone={Fence}
        acao={
          imovel.sigef || imovel.car || imovel.ccir ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 font-extrabold"
              onClick={() => {
                if (
                  (imovel.confrontantes ?? "").trim() &&
                  !window.confirm("O campo Confrontantes já tem texto. Substituir pelo levantamento do mapa?")
                )
                  return;
                void navigate({
                  to: "/mapa",
                  search: {
                    ...(imovel.sigef ? { sigef: imovel.sigef } : imovel.car ? { car: imovel.car } : { ccir: imovel.ccir ?? undefined }),
                    preencher: id,
                  },
                });
              }}
            >
              <MapPinned className="size-5" strokeWidth={2.5} />
              Preencher pelo mapa
            </Button>
          ) : null
        }
      >
        <CampoLongo
          rotulo="Confrontantes"
          valor={imovel.confrontantes ?? ""}
          onSalvar={troca("confrontantes")}
          placeholder="Ex.: Norte — Sítio São José; Sul — Estrada municipal"
        />
        <div className="mt-4">
          <CampoLongo
            rotulo="Observações"
            valor={imovel.observacoes ?? ""}
            onSalvar={troca("observacoes")}
          />
        </div>
      </Bloco>

      <PainelAnuencias imovelId={id} />

      <Bloco titulo="Histórico" Icone={ScrollText}>
        <div className="space-y-5">
          <Historico
            titulo="Oportunidades"
            vazio="Nenhuma oportunidade para este imóvel."
            itens={(oportunidadesQuery.data ?? []).map((o) => ({
              chave: o.id as string,
              principal: rotulo((o.servico as string | null) ?? "") || "Serviço não informado",
              secundario: `${rotulo((o.estagio as string | null) ?? "")} · ${data(o.criado_em as string)}`,
              extra:
                o.valor_estimado !== null && o.valor_estimado !== undefined
                  ? reais(o.valor_estimado as number)
                  : "",
            }))}
          />
          <Historico
            titulo="Orçamentos"
            vazio="Nenhum orçamento para este imóvel."
            itens={(orcamentosQuery.data ?? []).map((o) => ({
              chave: o.id as string,
              principal: `Orçamento ${o.numero as string}`,
              secundario: `${rotulo((o.status as string | null) ?? "")} · ${data(o.criado_em as string)}`,
              extra: reais(o.total as number),
            }))}
          />
          <Historico
            titulo="Ordens de serviço"
            vazio="Nenhuma ordem de serviço para este imóvel."
            itens={(ordensQuery.data ?? []).map((o) => ({
              chave: o.id as string,
              principal: `OS ${o.numero as string} · ${rotulo((o.servico as string | null) ?? "")}`,
              secundario: `${rotulo((o.status as string | null) ?? "")}${
                o.prazo ? ` · prazo ${data(o.prazo as string)}` : ""
              }`,
              extra: "",
            }))}
          />
        </div>
      </Bloco>

      <Bloco titulo="Pontos GPS" Icone={Satellite} acao={<ImportarKml imovelId={id} />}>
        {(() => {
          const pts = pontosQuery.data ?? [];
          const doLevantamento = pts.filter((p) => p.origem !== "mapa");
          const destino =
            centroide((doLevantamento.length > 0 ? doLevantamento : pts).map((p) => ({ lat: Number(p.lat), lon: Number(p.lon) }))) ??
            (referenciaQuery.data ? { lat: referenciaQuery.data.lat, lon: referenciaQuery.data.lon } : null);
          if (!destino) return null;
          const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(BASE_ESCRITORIO.endereco)}&destination=${destino.lat.toFixed(6)},${destino.lon.toFixed(6)}&travelmode=driving`;
          return (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-border bg-muted/40 p-3">
              <Button asChild className="h-12 text-base font-extrabold">
                <a href={url} target="_blank" rel="noreferrer">
                  <Navigation className="size-5" strokeWidth={2.5} />
                  Traçar rota no Google Maps
                </a>
              </Button>
              <p className="text-sm font-semibold text-muted-foreground">
                Saída: {BASE_ESCRITORIO.endereco}
                <br />
                Destino: {destino.lat.toFixed(6)}, {destino.lon.toFixed(6)}
                {doLevantamento.length > 0 ? " (centro dos pontos)" : referenciaQuery.data ? ` (ponto de referência · ${referenciaQuery.data.fonte})` : ""}
              </p>
            </div>
          );
        })()}
        {(pontosQuery.data ?? []).length === 0 ? (
          <p className="text-lg font-medium text-muted-foreground">
            {referenciaQuery.isPending
              ? "Procurando o ponto de referência do imóvel…"
              : "Nenhum ponto encontrado: o imóvel não tem SIGEF, CAR ou CCIR com localização nas bases. Importe o KML/KMZ pelo botão acima."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="text-sm font-extrabold uppercase text-muted-foreground">
                  <th className="p-2">Código</th>
                  <th className="p-2">Latitude</th>
                  <th className="p-2">Longitude</th>
                  <th className="p-2">UTM</th>
                  <th className="p-2">Origem</th>
                </tr>
              </thead>
              <tbody>
                {(pontosQuery.data ?? []).map((p) => (
                  <tr key={p.id} className="border-t-2 border-border text-base font-semibold">
                    <td className="p-2 font-extrabold text-primary">{p.codigo ?? "—"}</td>
                    <td className="p-2">
                      {Number(p.lat).toFixed(6)}
                      {p.lat_gms ? <span className="block text-xs text-muted-foreground">{p.lat_gms}</span> : null}
                    </td>
                    <td className="p-2">
                      {Number(p.lon).toFixed(6)}
                      {p.lon_gms ? <span className="block text-xs text-muted-foreground">{p.lon_gms}</span> : null}
                    </td>
                    <td className="p-2">
                      {p.utm_e !== null && p.utm_n !== null
                        ? `${numero(p.utm_e, 2)} E · ${numero(p.utm_n, 2)} N · ${p.utm_zona ?? ""}`
                        : "—"}
                    </td>
                    <td className="p-2">{p.origem === "manual" ? "Manual" : p.origem === "mapa" ? "Mapa (referência)" : "KML"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Bloco>

      <Bloco titulo="Documentos" Icone={ClipboardList}>
        {(documentosQuery.data ?? []).length === 0 ? (
          <p className="text-lg font-medium text-muted-foreground">
            Nenhum documento vinculado a este imóvel.
          </p>
        ) : (
          <ul className="space-y-3">
            {(documentosQuery.data ?? []).map((d) => (
              <li key={d.id as string}>
                <a
                  href={d.url as string}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border bg-card p-4 transition-colors hover:bg-accent"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-lg font-extrabold text-foreground">
                      {d.nome as string}
                    </span>
                    <span className="block text-base font-semibold text-muted-foreground">
                      {rotulo((d.categoria as string | null) ?? "") || "Sem categoria"} ·{" "}
                      {data(d.criado_em as string)}
                    </span>
                  </span>
                  <ExternalLink className="size-6 shrink-0 text-primary" strokeWidth={2.5} />
                </a>
              </li>
            ))}
          </ul>
        )}
      </Bloco>

      <div className="rounded-3xl border-2 border-border bg-card p-4">
        {excluindo ? (
          <div className="space-y-3">
            <p className="text-lg font-bold text-foreground">
              Excluir este imóvel? Essa ação não pode ser desfeita.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="destructive"
                onClick={() => excluir.mutate()}
                disabled={excluir.isPending}
                className="h-11 rounded-full px-4 text-base font-semibold"
              >
                {excluir.isPending ? <Loader2 className="size-6 animate-spin" /> : null}
                Sim, excluir
              </Button>
              <Button
                variant="outline"
                onClick={() => setExcluindo(false)}
                className="h-14 rounded-xl border-2 px-5 text-lg font-extrabold"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setExcluindo(true)}
            className="h-14 rounded-xl border-2 px-5 text-lg font-extrabold text-destructive"
          >
            <Trash2 className="size-6" strokeWidth={2.5} />
            Excluir imóvel
          </Button>
        )}
      </div>
    </section>
  );
}

function Historico({
  titulo,
  itens,
  vazio,
}: {
  titulo: string;
  itens: { chave: string; principal: string; secundario: string; extra: string }[];
  vazio: string;
}) {
  return (
    <div>
      <h3 className="text-lg font-extrabold text-foreground">{titulo}</h3>
      {itens.length === 0 ? (
        <p className="mt-1 text-base font-medium text-muted-foreground">{vazio}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {itens.map((i) => (
            <li
              key={i.chave}
              className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border p-3"
            >
              <span className="min-w-0">
                <span className="block truncate text-lg font-bold text-foreground">
                  {i.principal}
                </span>
                <span className="block text-base font-semibold text-muted-foreground">
                  {i.secundario}
                </span>
              </span>
              {i.extra ? (
                <span className="shrink-0 text-lg font-extrabold text-foreground">{i.extra}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
