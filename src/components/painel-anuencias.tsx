import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileSignature,
  Loader2,
  MapPinned,
  MessageCircle,
  Paperclip,
  Pencil,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { areaHa as fmtArea, data as dataBR, mascaraTelefone, soDigitos } from "@/lib/formato";
import {
  abrirJanelaDocumento,
  escreverDocumento,
  htmlCartasAnuencia,
  type DadosConfrontanteAnuencia,
  type DadosImovelAnuencia,
} from "@/lib/documento-impressao";
import { Bloco } from "@/components/campos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Gestão das cartas de anuência dos confrontantes de um imóvel (georreferenciamento SIGEF/INCRA).

export type Anuencia = {
  id: string;
  imovel_id: string;
  os_id: string | null;
  numero: number | null;
  camada: string | null;
  chave: string | null;
  rumo: string | null;
  imovel_confrontante: string | null;
  imovel_confrontante_id: string | null;
  matricula: string | null;
  cliente_id: string | null;
  nome: string | null;
  documento: string | null;
  estado_civil: string | null;
  conjuge_nome: string | null;
  conjuge_documento: string | null;
  telefone: string | null;
  endereco: string | null;
  status: string;
  enviada_em: string | null;
  assinada_em: string | null;
  arquivo_path: string | null;
  observacoes: string | null;
};

export const STATUS_ANUENCIA = [
  { valor: "pendente", rotulo: "Pendente", cor: "bg-muted text-muted-foreground" },
  { valor: "contatado", rotulo: "Contatado", cor: "bg-amber-500 text-white" },
  { valor: "enviada", rotulo: "Carta enviada", cor: "bg-primary text-primary-foreground" },
  { valor: "assinada", rotulo: "Assinada", cor: "bg-emerald-600 text-white" },
  { valor: "recusada", rotulo: "Recusada", cor: "bg-destructive text-destructive-foreground" },
  { valor: "dispensada", rotulo: "Dispensada", cor: "bg-muted text-muted-foreground" },
] as const;

const COLUNAS =
  "id, imovel_id, os_id, numero, camada, chave, rumo, imovel_confrontante, imovel_confrontante_id, matricula, cliente_id, nome, documento, estado_civil, conjuge_nome, conjuge_documento, telefone, endereco, status, enviada_em, assinada_em, arquivo_path, observacoes";

const CLASSE_SELECT =
  "h-11 rounded-xl border-2 border-border bg-card px-2 text-base font-bold text-foreground";

function corStatus(s: string) {
  return STATUS_ANUENCIA.find((x) => x.valor === s)?.cor ?? "bg-muted text-muted-foreground";
}

function paraCarta(a: Anuencia): DadosConfrontanteAnuencia {
  return {
    nome: a.nome ?? "",
    documento: a.documento ?? "",
    estadoCivil: a.estado_civil ?? "",
    conjugeNome: a.conjuge_nome ?? "",
    conjugeDocumento: a.conjuge_documento ?? "",
    endereco: a.endereco ?? "",
    imovelConfrontante: a.imovel_confrontante ?? "",
    matricula: a.matricula ?? "",
    rumo: a.rumo ?? "",
  };
}

type ImovelCarta = {
  nome: string | null;
  municipio: string | null;
  uf: string | null;
  matricula: string | null;
  cartorio: string | null;
  ccir: string | null;
  car: string | null;
  sigef: string | null;
  area_ha: number | null;
  clientes: { nome: string | null; documento: string | null } | { nome: string | null; documento: string | null }[] | null;
};

export function PainelAnuencias({ imovelId, osId }: { imovelId: string; osId?: string | null }) {
  const { perfil } = usePerfil();
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState<Anuencia | null>(null);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);
  const alvoArquivo = useRef<Anuencia | null>(null);
  const chave = ["anuencias", imovelId];

  const lista = useQuery({
    queryKey: chave,
    queryFn: async (): Promise<Anuencia[]> => {
      const { data, error } = await supabase
        .from("anuencias")
        .select(COLUNAS)
        .eq("imovel_id", imovelId)
        .order("numero", { ascending: true, nullsFirst: false })
        .order("criado_em", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Anuencia[];
    },
  });

  const imovel = useQuery({
    queryKey: ["anuencias", imovelId, "imovel"],
    queryFn: async (): Promise<ImovelCarta | null> => {
      const { data, error } = await supabase
        .from("imoveis")
        .select("nome, municipio, uf, matricula, cartorio, ccir, car, sigef, area_ha, clientes(nome, documento)")
        .eq("id", imovelId)
        .maybeSingle();
      if (error) throw error;
      return data as ImovelCarta | null;
    },
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: chave });

  const atualizar = useMutation({
    mutationFn: async ({ id, campos }: { id: string; campos: Partial<Anuencia> }) => {
      const { error } = await supabase.from("anuencias").update(campos).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void invalidar(),
    onError: () => toast.error("Não foi possível salvar."),
  });

  const adicionar = useMutation({
    mutationFn: async () => {
      const proximo = Math.max(0, ...(lista.data ?? []).map((a) => a.numero ?? 0)) + 1;
      const { data, error } = await supabase
        .from("anuencias")
        .insert({ imovel_id: imovelId, os_id: osId ?? null, numero: proximo })
        .select(COLUNAS)
        .single();
      if (error) throw error;
      return data as Anuencia;
    },
    onSuccess: (nova) => {
      void invalidar();
      setEditando(nova);
    },
    onError: () => toast.error("Não foi possível adicionar."),
  });

  const excluir = useMutation({
    mutationFn: async (a: Anuencia) => {
      if (a.arquivo_path) await supabase.storage.from("anuencias").remove([a.arquivo_path]);
      const { error } = await supabase.from("anuencias").delete().eq("id", a.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void invalidar();
      toast.success("Confrontante removido.");
    },
    onError: () => toast.error("Não foi possível remover."),
  });

  const dadosImovel = (): DadosImovelAnuencia => {
    const im = imovel.data;
    const cli = Array.isArray(im?.clientes) ? im?.clientes[0] : im?.clientes;
    return {
      nome: im?.nome ?? "",
      municipio: im?.municipio ?? "",
      uf: im?.uf ?? "SP",
      matricula: im?.matricula ?? "",
      cartorio: im?.cartorio ?? "",
      ccir: im?.ccir ?? "",
      car: im?.car ?? "",
      areaHa: im?.area_ha != null ? fmtArea(im.area_ha).replace(/\s*ha$/i, "") : "",
      proprietario: cli?.nome ?? "",
      documentoProprietario: cli?.documento ?? "",
    };
  };

  const imprimir = (itens: Anuencia[]) => {
    if (itens.length === 0) {
      toast.info("Nenhuma carta pendente para gerar.");
      return;
    }
    const w = abrirJanelaDocumento();
    escreverDocumento(w, htmlCartasAnuencia(dadosImovel(), itens.map(paraCarta)));
    const pendentes = itens.filter((a) => a.status === "pendente" || a.status === "contatado");
    if (pendentes.length > 0) {
      toast("Marcar como carta enviada?", {
        action: {
          label: "Marcar",
          onClick: () =>
            pendentes.forEach((a) => atualizar.mutate({ id: a.id, campos: { status: "enviada" } })),
        },
      });
    }
  };

  const escolherArquivo = (a: Anuencia) => {
    alvoArquivo.current = a;
    arquivoRef.current?.click();
  };

  const enviarArquivo = async (arquivo: File) => {
    const a = alvoArquivo.current;
    if (!a || !perfil?.empresa_id) return;
    setEnviandoId(a.id);
    try {
      const ext = arquivo.name.includes(".") ? arquivo.name.split(".").pop() : "pdf";
      const caminho = `${perfil.empresa_id}/${imovelId}/${a.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("anuencias").upload(caminho, arquivo, {
        upsert: false,
        contentType: arquivo.type || undefined,
      });
      if (error) throw error;
      if (a.arquivo_path) await supabase.storage.from("anuencias").remove([a.arquivo_path]);
      await atualizar.mutateAsync({ id: a.id, campos: { arquivo_path: caminho, status: "assinada" } });
      toast.success("Carta assinada anexada.");
    } catch {
      toast.error("Não foi possível anexar o arquivo.");
    } finally {
      setEnviandoId(null);
      alvoArquivo.current = null;
    }
  };

  const abrirArquivo = async (path: string) => {
    const w = window.open("", "_blank");
    const { data, error } = await supabase.storage.from("anuencias").createSignedUrl(path, 300);
    if (error || !data?.signedUrl) {
      w?.close();
      toast.error("Não foi possível abrir o arquivo.");
      return;
    }
    if (w) w.location.href = data.signedUrl;
  };

  const itens = lista.data ?? [];
  const validos = itens.filter((a) => a.status !== "dispensada");
  const assinadas = validos.filter((a) => a.status === "assinada").length;
  const progresso = validos.length === 0 ? 0 : Math.round((assinadas / validos.length) * 100);
  const im = imovel.data;
  const carNorm = im?.car ? im.car.toUpperCase().replace(/[.\s]/g, "") : null;
  const buscaMapa = im?.sigef
    ? { sigef: im.sigef, anuencias: imovelId }
    : carNorm
      ? { car: carNorm, anuencias: imovelId }
      : im?.ccir
        ? { ccir: im.ccir, anuencias: imovelId }
        : null;

  return (
    <Bloco
      titulo="Anuências dos confrontantes"
      Icone={FileSignature}
      acao={
        <Button
          type="button"
          variant="outline"
          className="font-bold"
          disabled={adicionar.isPending}
          onClick={() => adicionar.mutate()}
        >
          <Plus className="size-5" strokeWidth={2.5} /> Adicionar
        </Button>
      }
    >
      <input
        ref={arquivoRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void enviarArquivo(f);
        }}
      />

      {lista.isPending ? (
        <Loader2 className="size-6 animate-spin text-primary" />
      ) : itens.length === 0 ? (
        <div className="space-y-3">
          <p className="text-lg font-medium text-muted-foreground">
            Nenhum confrontante cadastrado. Use o botão abaixo: o mapa encontra os vizinhos da área
            deste imóvel e preenche esta lista sozinho. Também dá para adicionar manualmente.
          </p>
          {buscaMapa ? (
            <Button asChild variant="outline" className="h-12 font-extrabold">
              <Link to="/mapa" search={buscaMapa}>
                <MapPinned className="size-5" strokeWidth={2.5} /> Buscar confrontantes no mapa e preencher
              </Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between text-base font-bold text-foreground">
              <span>
                {assinadas} de {validos.length} assinadas
              </span>
              <span>{progresso}%</span>
            </div>
            <Progress value={progresso} className="mt-2 h-3" />
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              type="button"
              className="font-bold"
              onClick={() =>
                imprimir(itens.filter((a) => !["assinada", "dispensada", "recusada"].includes(a.status)))
              }
            >
              <Printer className="size-5" strokeWidth={2.5} /> Gerar cartas pendentes
            </Button>
            {buscaMapa ? (
              <Button asChild variant="outline" className="font-bold">
                <Link to="/mapa" search={buscaMapa}>
                  <MapPinned className="size-5" strokeWidth={2.5} /> Atualizar pelo mapa
                </Link>
              </Button>
            ) : null}
          </div>

          <ul className="space-y-2">
            {itens.map((a) => {
              const tel = soDigitos(a.telefone ?? "");
              return (
                <li key={a.id} className="rounded-2xl border-2 border-border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-foreground">
                        {a.numero ? `${a.numero}. ` : ""}
                        {a.nome || <span className="text-muted-foreground">confrontante sem nome</span>}
                      </p>
                      <p className="text-sm font-semibold text-muted-foreground">
                        {[a.imovel_confrontante, a.rumo ? `divisa ${a.rumo}` : null, a.chave]
                          .filter(Boolean)
                          .join(" · ") || "sem dados do imóvel vizinho"}
                      </p>
                      {a.cliente_id ? (
                        <p className="text-sm font-bold text-primary">Já é cliente no CRM</p>
                      ) : null}
                      <p className="text-sm font-semibold text-muted-foreground">
                        {a.assinada_em
                          ? `Assinada em ${dataBR(a.assinada_em)}`
                          : a.enviada_em
                            ? `Enviada em ${dataBR(a.enviada_em)}`
                            : null}
                      </p>
                    </div>
                    <select
                      value={a.status}
                      onChange={(e) => atualizar.mutate({ id: a.id, campos: { status: e.target.value } })}
                      className={`${CLASSE_SELECT} ${corStatus(a.status)}`}
                      aria-label="Situação da anuência"
                    >
                      {STATUS_ANUENCIA.map((s) => (
                        <option key={s.valor} value={s.valor}>
                          {s.rotulo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditando(a)}>
                      <Pencil className="size-4" /> Dados
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => imprimir([a])}>
                      <Printer className="size-4" /> Carta
                    </Button>
                    {tel ? (
                      <Button asChild variant="outline" size="sm">
                        <a href={`https://wa.me/${tel.length <= 11 ? `55${tel}` : tel}`} target="_blank" rel="noreferrer">
                          <MessageCircle className="size-4" /> WhatsApp
                        </a>
                      </Button>
                    ) : null}
                    {a.arquivo_path ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => void abrirArquivo(a.arquivo_path!)}>
                        <Paperclip className="size-4" /> Ver assinada
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={enviandoId === a.id}
                      onClick={() => escolherArquivo(a)}
                    >
                      {enviandoId === a.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Paperclip className="size-4" />
                      )}
                      {a.arquivo_path ? "Trocar arquivo" : "Anexar assinada"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        if (window.confirm("Remover este confrontante da lista de anuências?")) excluir.mutate(a);
                      }}
                    >
                      <Trash2 className="size-4" /> Remover
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <EditarAnuencia
        anuencia={editando}
        onFechar={() => setEditando(null)}
        onSalvar={(campos) => {
          if (!editando) return;
          atualizar.mutate(
            { id: editando.id, campos },
            {
              onSuccess: () => {
                toast.success("Salvo.");
                setEditando(null);
              },
            },
          );
        }}
        salvando={atualizar.isPending}
      />
    </Bloco>
  );
}

const CAMPOS: { chave: keyof Anuencia; rotulo: string; largo?: boolean; tel?: boolean }[] = [
  { chave: "nome", rotulo: "Nome do confrontante", largo: true },
  { chave: "documento", rotulo: "CPF/CNPJ" },
  { chave: "estado_civil", rotulo: "Estado civil" },
  { chave: "conjuge_nome", rotulo: "Cônjuge (se houver)" },
  { chave: "conjuge_documento", rotulo: "CPF do cônjuge" },
  { chave: "telefone", rotulo: "Telefone", tel: true },
  { chave: "endereco", rotulo: "Endereço", largo: true },
  { chave: "imovel_confrontante", rotulo: "Imóvel confrontante", largo: true },
  { chave: "matricula", rotulo: "Matrícula do confrontante" },
  { chave: "rumo", rotulo: "Lado da divisa (ex.: Norte)" },
];

function EditarAnuencia({
  anuencia,
  onFechar,
  onSalvar,
  salvando,
}: {
  anuencia: Anuencia | null;
  onFechar: () => void;
  onSalvar: (campos: Partial<Anuencia>) => void;
  salvando: boolean;
}) {
  return (
    <Dialog open={anuencia !== null} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dados do confrontante</DialogTitle>
        </DialogHeader>
        {anuencia ? (
          <form
            key={anuencia.id}
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const campos: Record<string, string | null> = {};
              for (const c of CAMPOS) campos[c.chave] = String(fd.get(c.chave) ?? "").trim() || null;
              campos.observacoes = String(fd.get("observacoes") ?? "").trim() || null;
              onSalvar(campos as Partial<Anuencia>);
            }}
          >
            {CAMPOS.map((c) => (
              <div key={c.chave} className={c.largo ? "sm:col-span-2" : undefined}>
                <Label htmlFor={`anu-${c.chave}`} className="text-base font-bold">
                  {c.rotulo}
                </Label>
                <Input
                  id={`anu-${c.chave}`}
                  name={c.chave}
                  defaultValue={(anuencia[c.chave] as string | null) ?? ""}
                  inputMode={c.tel ? "tel" : "text"}
                  onChange={c.tel ? (e) => (e.target.value = mascaraTelefone(e.target.value)) : undefined}
                  className="mt-1 h-12 rounded-xl border-2 text-base font-semibold"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Label htmlFor="anu-obs" className="text-base font-bold">
                Observações
              </Label>
              <Textarea
                id="anu-obs"
                name="observacoes"
                defaultValue={anuencia.observacoes ?? ""}
                className="mt-1 rounded-xl border-2 text-base"
              />
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={onFechar}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? <Loader2 className="size-4 animate-spin" /> : null} Salvar
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
