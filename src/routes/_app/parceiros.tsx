import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  Gift,
  Handshake,
  Loader2,
  MessageCircle,
  PauseCircle,
  Phone,
  Send,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { dataHora, mascaraTelefone, soDigitos } from "@/lib/formato";
import { desdeAgora } from "@/lib/tempo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { BarraFerramentas, CartaoIndicador, Painel, Tabela } from "@/components/painel";
import { ConversaWhatsapp, type MensagemConversa } from "@/components/conversa-whatsapp";

export const Route = createFileRoute("/_app/parceiros")({
  head: () => ({
    meta: [
      { title: "Parceiros e Indicações | CRM de Topografia" },
      {
        name: "description",
        content:
          "Escritórios de contabilidade, sindicatos e Casas da Agricultura parceiros: mensagens pelo WhatsApp profissional e clientes indicados com desconto.",
      },
    ],
  }),
  component: Pagina,
});

type Parceiro = {
  id: string;
  tipo: string;
  nome: string;
  cidade: string | null;
  contato_nome: string | null;
  whatsapp: string | null;
  telefones: string[] | null;
  emails: string[] | null;
  socios: string | null;
  n_produtores: number | null;
  municipios_produtores: string | null;
  etapa: string;
  desconto_cliente_pct: number | null;
  observacoes: string | null;
  ativo_desde: string | null;
};

type Resumo = {
  parceiro_id: string;
  indicacoes: number;
  indicacoes_fechadas: number;
  mensagens: number;
  ultima_mensagem: string | null;
  ultima_recebida: string | null;
};

type Modelo = { codigo: string; nome: string; publico: string; texto: string; ordem: number };

type Indicacao = {
  id: string;
  parceiro_id: string | null;
  nome: string;
  telefone: string;
  municipio: string | null;
  imovel: string | null;
  desconto_pct: number | null;
  status: string;
  criado_em: string;
};

type Identificacao = {
  valido: boolean;
  telefone?: string;
  parceiro?: { id: string; nome: string; contato: string | null; cidade: string | null; etapa: string; tipo: string };
  lead?: { id: string; nome: string; estagio: string; origem: string };
  indicacao?: { id: string; nome: string; status: string; desconto_pct: number | null; parceiro: string | null };
};

type Destino = "parceiro" | "indicacao" | "avulso";

const DESCONTO_PADRAO = 10;

const ETAPAS: Record<string, { rotulo: string; variante: "default" | "secondary" | "outline" | "destructive" }> = {
  a_contatar: { rotulo: "A contatar", variante: "outline" },
  contatado: { rotulo: "Contatado", variante: "secondary" },
  reuniao: { rotulo: "Reunião", variante: "secondary" },
  ativo: { rotulo: "Parceiro ativo", variante: "default" },
  sem_interesse: { rotulo: "Sem interesse", variante: "outline" },
};

const TIPOS: Record<string, string> = {
  escritorio: "Escritório contábil",
  sindicato: "Sindicato",
  casa_agricultura: "Casa da Agricultura",
  assessoria: "Assessoria rural",
  outro: "Outro",
};

const STATUS_INDICACAO: Record<string, string> = {
  indicado: "Indicado",
  mensagem_enviada: "Mensagem enviada",
  respondeu: "Respondeu",
  orcamento: "Orçamento",
  fechado: "Fechado",
  perdido: "Perdido",
};

const SELECT =
  "h-11 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground";

/** 55 + DDD + número, igual à função tel_whats do banco. */
function telWhats(v: string | null | undefined): string | null {
  let d = soDigitos(String(v ?? ""));
  if (d.length === 10 || d.length === 11) d = "55" + d;
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) return d;
  return null;
}

function celular(v: string): boolean {
  const d = telWhats(v);
  return !!d && d.length === 13 && d[4] === "9";
}

/** Nome do parceiro como vai na mensagem: sem o que está entre parênteses ou depois de "—". */
function nomeNaMensagem(nome: string | null | undefined): string {
  return String(nome ?? "")
    .split(" — ")[0]
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function primeiroNome(v: string | null | undefined): string {
  return String(v ?? "").trim().split(/\s+/)[0] ?? "";
}

function preencher(texto: string, v: { nome: string; parceiro: string; desconto: number | null }): string {
  const nome = v.nome.trim();
  const desc = v.desconto && v.desconto > 0 ? `${String(v.desconto).replace(".", ",")}% de desconto` : "desconto";
  return texto
    .replaceAll("{nome_virgula}", nome ? `, ${nome}` : "")
    .replaceAll("{nome}", nome)
    .replaceAll("{parceiro}", v.parceiro.trim() || "escritório parceiro")
    .replaceAll("{desconto}", desc);
}

function Pagina() {
  const qc = useQueryClient();
  const painelEnvio = useRef<HTMLDivElement>(null);

  const parceirosQuery = useQuery({
    queryKey: ["parceiros"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parceiros")
        .select(
          "id, tipo, nome, cidade, contato_nome, whatsapp, telefones, emails, socios, n_produtores, municipios_produtores, etapa, desconto_cliente_pct, observacoes, ativo_desde",
        )
        .order("n_produtores", { ascending: false, nullsFirst: false })
        .order("nome");
      if (error) throw error;
      return (data ?? []) as Parceiro[];
    },
  });

  const resumoQuery = useQuery({
    queryKey: ["parceiros-resumo"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("parceiros_resumo");
      if (error) throw error;
      return Object.fromEntries(((data ?? []) as Resumo[]).map((r) => [r.parceiro_id, r]));
    },
  });

  const modelosQuery = useQuery({
    queryKey: ["whatsapp-modelos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_modelos")
        .select("codigo, nome, publico, texto, ordem")
        .eq("ativo", true)
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as Modelo[];
    },
  });

  const indicacoesQuery = useQuery({
    queryKey: ["indicacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("indicacoes")
        .select("id, parceiro_id, nome, telefone, municipio, imovel, desconto_pct, status, criado_em")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Indicacao[];
    },
  });

  const parceiros = parceirosQuery.data ?? [];
  const porId = useMemo(() => Object.fromEntries(parceiros.map((p) => [p.id, p])), [parceiros]);
  const resumo = resumoQuery.data ?? {};
  const modelos = modelosQuery.data ?? [];
  const indicacoes = indicacoesQuery.data ?? [];

  // ---------- Envio ----------
  const [destino, setDestino] = useState<Destino>("parceiro");
  const [parceiroId, setParceiroId] = useState("");
  const [telefone, setTelefone] = useState("");
  const [nome, setNome] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [imovel, setImovel] = useState("");
  const [desconto, setDesconto] = useState(String(DESCONTO_PADRAO));
  const [modelo, setModelo] = useState("P1");
  const [texto, setTexto] = useState("");
  const [editado, setEditado] = useState(false);

  const parceiro = parceiroId ? porId[parceiroId] : undefined;
  const tel = telWhats(telefone);

  const modelosDoDestino = useMemo(() => {
    const publicos = destino === "parceiro" ? ["parceiro"] : destino === "indicacao" ? ["indicado", "produtor"] : ["produtor", "parceiro", "indicado"];
    return modelos.filter((m) => publicos.includes(m.publico));
  }, [modelos, destino]);

  // modelo padrão de cada destino
  useEffect(() => {
    if (modelosDoDestino.length && !modelosDoDestino.some((m) => m.codigo === modelo)) {
      const preferido = destino === "parceiro" ? (parceiro?.tipo === "sindicato" || parceiro?.tipo === "casa_agricultura" ? "P2" : "P1") : destino === "indicacao" ? "I1" : "AV";
      setModelo(modelosDoDestino.find((m) => m.codigo === preferido)?.codigo ?? modelosDoDestino[0].codigo);
    }
  }, [modelosDoDestino, modelo, destino, parceiro?.tipo]);

  // ao escolher parceiro: número, nome e desconto dele (só quando muda a escolha, não a cada recarga)
  useEffect(() => {
    const parceiro = parceiroId ? porId[parceiroId] : undefined;
    if (!parceiro) return;
    if (destino === "parceiro") {
      setTelefone(mascaraTelefone(parceiro.whatsapp ?? parceiro.telefones?.find((t) => celular(t)) ?? parceiro.telefones?.[0] ?? ""));
      setNome(primeiroNome(parceiro.contato_nome));
      if (parceiro.tipo === "sindicato" || parceiro.tipo === "casa_agricultura") setModelo("P2");
      else if (parceiro.etapa === "ativo") setModelo("P4");
      else if (parceiro.etapa === "contatado" || parceiro.etapa === "reuniao") setModelo("P3");
      else setModelo("P1");
    }
    if (parceiro.desconto_cliente_pct != null) setDesconto(String(parceiro.desconto_cliente_pct));
    setEditado(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parceiroId, destino, parceirosQuery.isSuccess]);

  // texto do modelo preenchido (enquanto o usuário não editar à mão)
  const textoModelo = useMemo(() => {
    const m = modelos.find((x) => x.codigo === modelo);
    if (!m) return "";
    return preencher(m.texto, {
      nome,
      parceiro: nomeNaMensagem(parceiro?.nome),
      desconto: Number(String(desconto).replace(",", ".")) || null,
    });
  }, [modelos, modelo, nome, parceiro?.nome, desconto]);

  useEffect(() => {
    if (!editado) setTexto(textoModelo);
  }, [textoModelo, editado]);

  // quem é este número?
  const [telDebounce, setTelDebounce] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setTelDebounce(tel), 400);
    return () => clearTimeout(t);
  }, [tel]);

  const identQuery = useQuery({
    queryKey: ["identificar-telefone", telDebounce],
    enabled: !!telDebounce,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("identificar_telefone", { p_telefone: telDebounce });
      if (error) throw error;
      return data as Identificacao;
    },
  });

  const conversaQuery = useQuery({
    queryKey: ["conversa-telefone", telDebounce],
    enabled: !!telDebounce,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("conversa_telefone", { p_telefone: telDebounce });
      if (error) throw error;
      return (data ?? []) as MensagemConversa[];
    },
  });

  const ident = identQuery.data;
  const parceiroDoNumero = ident?.parceiro;
  const parceiroAtivoNoNumero = parceiroDoNumero && parceiroDoNumero.etapa === "ativo";

  const enviar = useMutation({
    mutationFn: async () => {
      if (!tel) throw new Error("Digite um telefone com DDD.");
      if (!texto.trim()) throw new Error("A mensagem está vazia.");
      if (destino === "indicacao") {
        if (!parceiroId) throw new Error("Escolha o parceiro que indicou.");
        if (!nome.trim()) throw new Error("Digite o nome do cliente indicado.");
      }
      if (destino === "parceiro" && !parceiroId) throw new Error("Escolha o parceiro.");
      const corpo: Record<string, unknown> = {
        telefone: tel,
        mensagem: texto.trim(),
        modelo,
        parceiro_id: destino === "parceiro" ? parceiroId : null,
      };
      if (destino === "indicacao") {
        corpo.indicacao = {
          parceiro_id: parceiroId,
          nome: nome.trim(),
          municipio: municipio.trim() || null,
          imovel: imovel.trim() || null,
          desconto_pct: Number(String(desconto).replace(",", ".")) || null,
        };
      }
      const { data, error } = await supabase.functions.invoke("enviar-whatsapp-avulso", { body: corpo });
      if (error) {
        const ctx = (error as { context?: Response }).context;
        const j = ctx ? await ctx.json().catch(() => null) : null;
        throw new Error(j?.error ?? error.message);
      }
      if (!data?.ok) throw new Error(data?.error ?? "Falha no envio.");
      return data as { ok: true; registro: { destino: string } };
    },
    onSuccess: (r) => {
      const d = r.registro?.destino;
      toast.success(
        d === "indicacao"
          ? "Mensagem enviada. O indicado entrou na Prospecção e a IA continua a conversa quando ele responder."
          : d === "parceiro"
            ? "Mensagem enviada ao parceiro. Quando ele responder, o Renato é avisado no WhatsApp."
            : "Mensagem enviada.",
      );
      setEditado(false);
      qc.invalidateQueries({ queryKey: ["conversa-telefone"] });
      qc.invalidateQueries({ queryKey: ["identificar-telefone"] });
      qc.invalidateQueries({ queryKey: ["parceiros"] });
      qc.invalidateQueries({ queryKey: ["parceiros-resumo"] });
      qc.invalidateQueries({ queryKey: ["indicacoes"] });
      if (destino === "indicacao") {
        setNome("");
        setTelefone("");
        setMunicipio("");
        setImovel("");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mudarEtapa = useMutation({
    mutationFn: async ({ id, etapa }: { id: string; etapa: string }) => {
      const { error } = await supabase.from("parceiros").update({ etapa }).eq("id", id);
      if (error) throw error;
      return etapa;
    },
    onSuccess: (etapa) => {
      toast.success(
        etapa === "ativo"
          ? "Parceiro ativo. A campanha automática não manda mais mensagens para este escritório."
          : "Etapa atualizada.",
      );
      qc.invalidateQueries({ queryKey: ["parceiros"] });
      qc.invalidateQueries({ queryKey: ["identificar-telefone"] });
    },
    onError: () => toast.error("Não foi possível mudar a etapa."),
  });

  const mudarStatusIndicacao = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("indicacoes").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Indicação atualizada.");
      qc.invalidateQueries({ queryKey: ["indicacoes"] });
      qc.invalidateQueries({ queryKey: ["parceiros-resumo"] });
    },
    onError: () => toast.error("Não foi possível atualizar a indicação."),
  });

  function abrirParceiro(p: Parceiro, como: Destino = "parceiro") {
    setDestino(como);
    setParceiroId(p.id);
    if (como === "indicacao") {
      setTelefone("");
      setNome("");
    }
    setEditado(false);
    painelEnvio.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function trocarDestino(d: Destino) {
    setDestino(d);
    setEditado(false);
    if (d !== "parceiro") {
      setTelefone("");
      setNome("");
    }
    if (d === "avulso") setParceiroId("");
  }

  // ---------- Lista ----------
  const [busca, setBusca] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState("todas");
  const [filtroCidade, setFiltroCidade] = useState("todas");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [soWhats, setSoWhats] = useState(false);

  const cidades = useMemo(
    () => Array.from(new Set(parceiros.map((p) => p.cidade).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [parceiros],
  );

  const filtrados = useMemo(() => {
    const q = busca.trim().toLocaleLowerCase("pt-BR");
    const qd = soDigitos(busca);
    return parceiros.filter((p) => {
      if (filtroEtapa !== "todas" && p.etapa !== filtroEtapa) return false;
      if (filtroCidade !== "todas" && p.cidade !== filtroCidade) return false;
      if (filtroTipo !== "todos" && p.tipo !== filtroTipo) return false;
      if (soWhats && !p.whatsapp) return false;
      if (!q) return true;
      const alvo = [p.nome, p.contato_nome, p.socios, p.cidade, ...(p.emails ?? [])].join(" ").toLocaleLowerCase("pt-BR");
      if (alvo.includes(q)) return true;
      return qd.length >= 4 && (p.telefones ?? []).some((t) => t.includes(qd));
    });
  }, [parceiros, busca, filtroEtapa, filtroCidade, filtroTipo, soWhats]);

  const contagem = useMemo(() => {
    const c = { total: parceiros.length, whats: 0, contatados: 0, ativos: 0, produtores: 0 };
    for (const p of parceiros) {
      if (p.whatsapp) c.whats++;
      if (p.etapa !== "a_contatar") c.contatados++;
      if (p.etapa === "ativo") {
        c.ativos++;
        c.produtores += p.n_produtores ?? 0;
      }
    }
    return c;
  }, [parceiros]);

  const parceirosOrdenados = useMemo(
    () => [...parceiros].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [parceiros],
  );

  const tituloConversa =
    destino === "parceiro"
      ? (parceiro?.contato_nome ? `${parceiro.contato_nome} · ` : "") + (nomeNaMensagem(parceiro?.nome) || "Parceiro")
      : nome.trim() || parceiroDoNumero?.nome || ident?.lead?.nome || (tel ? mascaraTelefone(tel) : "Novo contato");

  const mensagens = conversaQuery.data ?? [];

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Handshake className="size-6 text-primary" strokeWidth={2.5} />
            Parceiros e Indicações
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Escritórios, sindicatos e Casas da Agricultura. As mensagens saem do WhatsApp profissional.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CartaoIndicador
          icone={Building2}
          valor={parceirosQuery.isPending ? "…" : contagem.total}
          rotulo="Cadastrados"
          apoio={`${contagem.whats} com WhatsApp`}
          destino="/parceiros"
        />
        <CartaoIndicador
          icone={MessageCircle}
          valor={parceirosQuery.isPending ? "…" : contagem.contatados}
          rotulo="Já contatados"
          apoio="contato, reunião ou parceria"
          destino="/parceiros"
        />
        <CartaoIndicador
          icone={CheckCircle2}
          valor={parceirosQuery.isPending ? "…" : contagem.ativos}
          rotulo="Parceiros ativos"
          apoio={contagem.ativos ? `${contagem.produtores} produtores atendidos por eles` : "nenhum ainda"}
          destino="/parceiros"
        />
        <CartaoIndicador
          icone={Gift}
          valor={indicacoesQuery.isPending ? "…" : indicacoes.length}
          rotulo="Indicações"
          apoio={`${indicacoes.filter((i) => i.status === "fechado").length} fechadas`}
          destino="/parceiros"
        />
      </div>

      <div ref={painelEnvio} className="grid scroll-mt-4 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Painel titulo="Nova mensagem" icone={Send}>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Para quem">
              {(
                [
                  ["parceiro", "Parceiro", Handshake],
                  ["indicacao", "Cliente indicado", UserPlus],
                  ["avulso", "Outro número", Phone],
                ] as const
              ).map(([v, r, I]) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={destino === v}
                  onClick={() => trocarDestino(v)}
                  className="flex h-12 items-center justify-center gap-2 rounded-lg border border-border bg-card px-2 text-sm font-bold text-foreground transition-colors aria-selected:border-primary aria-selected:bg-primary aria-selected:text-primary-foreground"
                >
                  <I className="size-4 shrink-0" />
                  <span className="truncate">{r}</span>
                </button>
              ))}
            </div>

            {destino !== "avulso" && (
              <div className="space-y-1.5">
                <Label htmlFor="parceiro">{destino === "indicacao" ? "Indicado por" : "Parceiro"}</Label>
                <select
                  id="parceiro"
                  value={parceiroId}
                  onChange={(e) => setParceiroId(e.target.value)}
                  className={`${SELECT} w-full`}
                >
                  <option value="">Escolha…</option>
                  {(destino === "indicacao"
                    ? [...parceirosOrdenados].sort((a, b) => Number(b.etapa === "ativo") - Number(a.etapa === "ativo"))
                    : parceirosOrdenados
                  ).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.etapa === "ativo" ? "★ " : ""}
                      {p.nome}
                      {p.cidade ? ` — ${p.cidade}` : ""}
                      {destino === "parceiro" && !p.whatsapp ? " (sem WhatsApp)" : ""}
                    </option>
                  ))}
                </select>
                {destino === "parceiro" && parceiro && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-sm font-medium text-muted-foreground">
                    <Badge variant={ETAPAS[parceiro.etapa]?.variante ?? "outline"} className="rounded-full">
                      {ETAPAS[parceiro.etapa]?.rotulo ?? parceiro.etapa}
                    </Badge>
                    <span>{TIPOS[parceiro.tipo] ?? parceiro.tipo}</span>
                    {parceiro.n_produtores ? <span>· {parceiro.n_produtores} produtores na planilha</span> : null}
                    {parceiro.socios ? <span className="w-full text-xs">Sócios: {parceiro.socios}</span> : null}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="telefone">WhatsApp</Label>
                {destino === "parceiro" && parceiro && (parceiro.telefones?.length ?? 0) > 1 ? (
                  <select
                    id="telefone"
                    value={tel ?? ""}
                    onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
                    className={`${SELECT} w-full`}
                  >
                    {(parceiro.telefones ?? []).map((t) => {
                      const tw = telWhats(t) ?? t;
                      return (
                        <option key={t} value={tw}>
                          {mascaraTelefone(t)}
                          {tw === parceiro.whatsapp ? " · WhatsApp confirmado" : celular(t) ? " · celular" : " · fixo"}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <Input
                    id="telefone"
                    inputMode="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
                    placeholder="(15) 99999-9999"
                    className="h-11 rounded-full"
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nome">{destino === "indicacao" ? "Nome do cliente" : "Nome para a saudação"}</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder={destino === "indicacao" ? "Ex.: João da Silva" : "Ex.: Ricardo (opcional)"}
                  className="h-11 rounded-full"
                />
              </div>
            </div>

            {destino === "indicacao" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_140px]">
                <div className="space-y-1.5">
                  <Label htmlFor="municipio">Município do imóvel</Label>
                  <Input id="municipio" value={municipio} onChange={(e) => setMunicipio(e.target.value)} className="h-11 rounded-full" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="imovel">Imóvel (opcional)</Label>
                  <Input id="imovel" value={imovel} onChange={(e) => setImovel(e.target.value)} placeholder="Ex.: Sítio São José" className="h-11 rounded-full" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="desconto">Desconto (%)</Label>
                  <Input
                    id="desconto"
                    inputMode="decimal"
                    value={desconto}
                    onChange={(e) => setDesconto(e.target.value.replace(/[^\d,.]/g, ""))}
                    className="h-11 rounded-full text-right"
                  />
                </div>
              </div>
            )}

            {tel && ident && (
              <div className="space-y-1 rounded-lg bg-muted/40 p-3 text-sm font-medium text-foreground">
                {parceiroDoNumero && (
                  <p>
                    Número do parceiro <b>{parceiroDoNumero.nome}</b> ({ETAPAS[parceiroDoNumero.etapa]?.rotulo ?? parceiroDoNumero.etapa}).
                    {destino !== "parceiro" && (
                      <Button
                        variant="link"
                        className="h-auto px-1 py-0"
                        onClick={() => {
                          const p = porId[parceiroDoNumero.id];
                          if (p) abrirParceiro(p);
                        }}
                      >
                        Abrir como parceiro
                      </Button>
                    )}
                  </p>
                )}
                {ident.lead && (
                  <p>
                    Já está na Prospecção como <b>{ident.lead.nome}</b> ({ident.lead.estagio.replaceAll("_", " ")}).
                  </p>
                )}
                {ident.indicacao && (
                  <p>
                    Já indicado{ident.indicacao.parceiro ? ` por ${ident.indicacao.parceiro}` : ""} —{" "}
                    {STATUS_INDICACAO[ident.indicacao.status] ?? ident.indicacao.status}.
                  </p>
                )}
                {!parceiroDoNumero && !ident.lead && !ident.indicacao && <p>Número novo, sem conversa no CRM.</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="modelo">Modelo de mensagem</Label>
              <select
                id="modelo"
                value={modelo}
                onChange={(e) => {
                  setModelo(e.target.value);
                  setEditado(false);
                }}
                className={`${SELECT} w-full`}
              >
                {modelosDoDestino.map((m) => (
                  <option key={m.codigo} value={m.codigo}>
                    {m.codigo} · {m.nome}
                  </option>
                ))}
              </select>
              <p className="text-xs font-medium text-muted-foreground">
                O texto aparece no celular ao lado: dá para editar antes de enviar.
                {editado && (
                  <Button variant="link" className="h-auto px-1 py-0 text-xs" onClick={() => setEditado(false)}>
                    Voltar ao texto do modelo
                  </Button>
                )}
              </p>
            </div>

            {destino === "parceiro" && parceiro && (
              <div className="space-y-1.5 border-t border-border pt-4">
                <Label htmlFor="etapa">Etapa da parceria</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    id="etapa"
                    value={parceiro.etapa}
                    onChange={(e) => mudarEtapa.mutate({ id: parceiro.id, etapa: e.target.value })}
                    disabled={mudarEtapa.isPending}
                    className={SELECT}
                  >
                    {Object.entries(ETAPAS).map(([v, e]) => (
                      <option key={v} value={v}>
                        {e.rotulo}
                      </option>
                    ))}
                  </select>
                  {parceiro.etapa === "ativo" && (
                    <span className="flex items-center gap-1 text-sm font-semibold text-muted-foreground">
                      <PauseCircle className="size-4 text-primary" />
                      Campanha automática pausada para este escritório
                      {parceiro.ativo_desde ? ` desde ${new Date(parceiro.ativo_desde).toLocaleDateString("pt-BR")}` : ""}
                    </span>
                  )}
                </div>
              </div>
            )}

            {parceiroAtivoNoNumero && destino === "avulso" && (
              <p className="text-sm font-medium text-muted-foreground">
                Este número é de um parceiro ativo: a campanha automática não envia para ele.
              </p>
            )}
          </div>
        </Painel>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <ConversaWhatsapp
            titulo={tituloConversa}
            subtitulo={tel ? mascaraTelefone(tel) : "digite o número"}
            rotuloRecebida={destino === "parceiro" || parceiroDoNumero ? "Parceiro" : "Contato"}
            mensagens={mensagens}
            className="max-h-[820px]"
            rodape={
              <form
                className="flex items-end gap-1.5 pb-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  enviar.mutate();
                }}
              >
                <textarea
                  aria-label="Mensagem"
                  value={texto}
                  onChange={(e) => {
                    setTexto(e.target.value);
                    setEditado(true);
                  }}
                  rows={Math.min(9, Math.max(2, texto.split("\n").length + Math.floor(texto.length / 60)))}
                  placeholder="Mensagem"
                  className="max-h-60 min-h-11 flex-1 resize-none rounded-3xl bg-chat-recebida px-4 py-2.5 text-sm font-medium text-chat-texto shadow-sm outline-none placeholder:text-chat-texto/50"
                />
                <button
                  type="submit"
                  disabled={enviar.isPending || !tel || !texto.trim()}
                  aria-label="Enviar mensagem"
                  title="Enviar pelo WhatsApp profissional"
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-chat-cabecalho text-chat-cabecalho-foreground shadow-md transition-opacity disabled:opacity-40"
                >
                  {enviar.isPending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
                </button>
              </form>
            }
          />
        </div>
      </div>

      <Painel
        titulo="Parceiros"
        icone={Building2}
        acao={<span className="text-sm font-bold text-muted-foreground">{filtrados.length} de {parceiros.length}</span>}
      >
        <BarraFerramentas>
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, sócio, e-mail ou telefone"
            className="h-11 min-w-64 flex-1 rounded-full"
          />
          <select value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)} aria-label="Cidade" className={SELECT}>
            <option value="todas">Todas as cidades</option>
            {cidades.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={filtroEtapa} onChange={(e) => setFiltroEtapa(e.target.value)} aria-label="Etapa" className={SELECT}>
            <option value="todas">Todas as etapas</option>
            {Object.entries(ETAPAS).map(([v, e]) => (
              <option key={v} value={v}>
                {e.rotulo}
              </option>
            ))}
          </select>
          <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} aria-label="Tipo" className={SELECT}>
            <option value="todos">Todos os tipos</option>
            {Object.entries(TIPOS).map(([v, r]) => (
              <option key={v} value={v}>
                {r}
              </option>
            ))}
          </select>
          <label className="flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground">
            <input type="checkbox" checked={soWhats} onChange={(e) => setSoWhats(e.target.checked)} className="size-4 accent-primary" />
            Só com WhatsApp
          </label>
        </BarraFerramentas>

        <div className="mt-3">
          {parceirosQuery.error ? (
            <p className="text-base font-bold text-destructive">Não foi possível carregar os parceiros.</p>
          ) : parceirosQuery.isPending ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : filtrados.length === 0 ? (
            <p className="text-base font-medium text-muted-foreground">Nenhum parceiro com esses filtros.</p>
          ) : (
            <Tabela>
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border text-xs font-bold uppercase text-muted-foreground">
                    <th className="px-3 py-2">Parceiro</th>
                    <th className="px-3 py-2">Cidade</th>
                    <th className="px-3 py-2">Contato</th>
                    <th className="px-3 py-2 text-right">Produtores</th>
                    <th className="px-3 py-2">Etapa</th>
                    <th className="px-3 py-2">Última resposta</th>
                    <th className="px-3 py-2 text-right">Indicações</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((p) => {
                    const r = resumo[p.id];
                    return (
                      <tr key={p.id} className="border-b border-border align-top last:border-0">
                        <td className="max-w-80 px-3 py-2">
                          <p className="font-bold text-foreground">{p.nome}</p>
                          <p className="text-xs font-medium text-muted-foreground">{TIPOS[p.tipo] ?? p.tipo}</p>
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-foreground">{p.cidade ?? "—"}</td>
                        <td className="px-3 py-2 text-sm">
                          {p.contato_nome && <p className="font-bold text-foreground">{p.contato_nome}</p>}
                          <p className="font-medium tabular-nums text-foreground">
                            {p.whatsapp ? mascaraTelefone(p.whatsapp) : p.telefones?.[0] ? mascaraTelefone(p.telefones[0]) : "—"}
                            {p.whatsapp ? (
                              <Badge variant="secondary" className="ml-1.5 rounded-full px-1.5 py-0 text-[10px]">WhatsApp</Badge>
                            ) : null}
                          </p>
                          {p.emails?.[0] && <p className="truncate text-xs font-medium text-muted-foreground">{p.emails[0]}</p>}
                        </td>
                        <td className="px-3 py-2 text-right font-extrabold tabular-nums text-foreground">{p.n_produtores ?? 0}</td>
                        <td className="px-3 py-2">
                          <select
                            value={p.etapa}
                            onChange={(e) => mudarEtapa.mutate({ id: p.id, etapa: e.target.value })}
                            aria-label={`Etapa de ${p.nome}`}
                            className="h-9 rounded-full border border-border bg-card px-3 text-xs font-bold text-foreground"
                          >
                            {Object.entries(ETAPAS).map(([v, e]) => (
                              <option key={v} value={v}>
                                {e.rotulo}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-muted-foreground">
                          {r?.ultima_recebida ? (
                            <span title={dataHora(r.ultima_recebida)}>{desdeAgora(r.ultima_recebida)}</span>
                          ) : r?.ultima_mensagem ? (
                            <span title={dataHora(r.ultima_mensagem)}>enviada {desdeAgora(r.ultima_mensagem)}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-bold tabular-nums text-foreground">
                          {r?.indicacoes ? `${r.indicacoes}${r.indicacoes_fechadas ? ` (${r.indicacoes_fechadas} fech.)` : ""}` : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1.5">
                            <Button size="sm" variant="outline" onClick={() => abrirParceiro(p)} disabled={!p.telefones?.length}>
                              <MessageCircle className="size-4" /> Conversa
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => abrirParceiro(p, "indicacao")} title="Registrar cliente indicado por este parceiro">
                              <UserPlus className="size-4" /> Indicação
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Tabela>
          )}
        </div>
      </Painel>

      <Painel
        titulo="Clientes indicados"
        icone={Gift}
        acao={<span className="text-sm font-bold text-muted-foreground">{indicacoes.length}</span>}
      >
        {indicacoesQuery.isPending ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : indicacoes.length === 0 ? (
          <p className="text-base font-medium text-muted-foreground">
            Nenhuma indicação ainda. Quando um parceiro mandar um cliente, use “Cliente indicado” acima: o cliente recebe a
            mensagem com o desconto e entra na Prospecção, onde a IA continua a conversa.
          </p>
        ) : (
          <Tabela>
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border text-xs font-bold uppercase text-muted-foreground">
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Telefone</th>
                  <th className="px-3 py-2">Indicado por</th>
                  <th className="px-3 py-2">Município / imóvel</th>
                  <th className="px-3 py-2 text-right">Desconto</th>
                  <th className="px-3 py-2">Situação</th>
                  <th className="px-3 py-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {indicacoes.map((i) => (
                  <tr key={i.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-bold text-foreground">{i.nome}</td>
                    <td className="px-3 py-2 text-sm font-medium tabular-nums text-foreground">
                      <button
                        type="button"
                        className="underline-offset-2 hover:underline"
                        onClick={() => {
                          trocarDestino("avulso");
                          setTelefone(mascaraTelefone(i.telefone));
                          setNome(primeiroNome(i.nome));
                          painelEnvio.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        title="Ver a conversa"
                      >
                        {mascaraTelefone(i.telefone)}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-foreground">
                      {i.parceiro_id ? (porId[i.parceiro_id]?.nome ?? "—") : "—"}
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-muted-foreground">
                      {[i.municipio, i.imovel].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-bold tabular-nums text-foreground">
                      {i.desconto_pct != null ? `${String(i.desconto_pct).replace(".", ",")}%` : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={i.status}
                        onChange={(e) => mudarStatusIndicacao.mutate({ id: i.id, status: e.target.value })}
                        aria-label={`Situação de ${i.nome}`}
                        className="h-9 rounded-full border border-border bg-card px-3 text-xs font-bold text-foreground"
                      >
                        {Object.entries(STATUS_INDICACAO).map(([v, r]) => (
                          <option key={v} value={v}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-muted-foreground">{dataHora(i.criado_em)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tabela>
        )}
      </Painel>
    </section>
  );
}
