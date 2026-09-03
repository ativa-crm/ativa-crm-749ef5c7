import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Archive,
  ArrowLeft,
  ClipboardList,
  Loader2,
  MapPinned,
  MessageCircle,
  Plus,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { Bloco, Campo, CampoLongo, Grade } from "@/components/campos";
import { areaHa, mascaraTelefone, numero, paraNumero, rotulo, soDigitos } from "@/lib/formato";
import { desdeAgora, hora } from "@/lib/tempo";
import { ESTAGIOS, MOTIVOS_PERDA, NOTAS, SERVICOS, corDaNota } from "@/lib/funil";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/oportunidades/$id")({
  head: () => ({
    meta: [
      { title: "Ficha da oportunidade | CRM de Topografia" },
      {
        name: "description",
        content:
          "Qualificação do lead, cliente e imóvel vinculados, conversa de WhatsApp e arquivamento com motivo de perda.",
      },
      { property: "og:title", content: "Ficha da oportunidade | CRM de Topografia" },
      {
        property: "og:description",
        content: "Qualifique o lead, veja a conversa completa e vincule o imóvel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pagina,
});

type Oportunidade = {
  id: string;
  empresa_id: string;
  cliente_id: string | null;
  imovel_id: string | null;
  servico: string | null;
  estagio: string | null;
  nota: string | null;
  origem: string | null;
  cidade: string | null;
  area_ha: number | null;
  situacao_documental: string | null;
  motivo_prazo: string | null;
  historico: string | null;
  valor_estimado: number | null;
  arquivada: boolean | null;
  motivo_perda: string | null;
  criado_em: string | null;
  ultima_interacao: string | null;
};

type Cliente = { id: string; nome: string; telefone: string | null; cidade: string | null };
type Imovel = { id: string; nome: string; municipio: string | null; area_ha: number | null };
type Mensagem = {
  id: string;
  direcao: string | null;
  tipo: string | null;
  conteudo: string | null;
  criado_em: string | null;
};

function Pagina() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { perfil } = usePerfil();
  const [motivo, setMotivo] = useState<string>("");
  const [abrirArquivar, setAbrirArquivar] = useState(false);

  const oportunidadeQuery = useQuery({
    queryKey: ["oportunidade", id],
    queryFn: async (): Promise<Oportunidade | null> => {
      const { data, error } = await supabase
        .from("oportunidades")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data as Oportunidade | null) ?? null;
    },
  });

  const oportunidade = oportunidadeQuery.data ?? null;

  const clienteQuery = useQuery({
    queryKey: ["cliente", oportunidade?.cliente_id],
    enabled: !!oportunidade?.cliente_id,
    queryFn: async (): Promise<Cliente | null> => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, telefone, cidade")
        .eq("id", oportunidade!.cliente_id!)
        .maybeSingle();
      if (error) throw error;
      return (data as Cliente | null) ?? null;
    },
  });

  const imoveisQuery = useQuery({
    queryKey: ["imoveis", "resumo"],
    queryFn: async (): Promise<Imovel[]> => {
      const { data, error } = await supabase
        .from("imoveis")
        .select("id, nome, municipio, area_ha")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as Imovel[];
    },
  });

  const mensagensQuery = useQuery({
    queryKey: ["oportunidade", id, "mensagens"],
    queryFn: async (): Promise<Mensagem[]> => {
      const { data, error } = await supabase
        .from("mensagens")
        .select("id, direcao, tipo, conteudo, criado_em")
        .eq("oportunidade_id", id)
        .order("criado_em", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Mensagem[];
    },
  });

  // Realtime: mensagens novas do agente aparecem sem recarregar.
  useEffect(() => {
    const canal = supabase
      .channel(`oportunidade-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "mensagens" }, () => {
        queryClient.invalidateQueries({ queryKey: ["oportunidade", id, "mensagens"] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "oportunidades" }, () => {
        queryClient.invalidateQueries({ queryKey: ["oportunidade", id] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [id, queryClient]);

  const salvar = useMutation({
    mutationFn: async (campos: Record<string, unknown>) => {
      const { error } = await supabase.from("oportunidades").update(campos).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oportunidade", id] });
      queryClient.invalidateQueries({ queryKey: ["oportunidades"] });
      toast.success("Alteração salva");
    },
    onError: () => toast.error("Não foi possível salvar. Tente de novo."),
  });

  const criarImovel = useMutation({
    mutationFn: async () => {
      if (!oportunidade) throw new Error("sem oportunidade");
      const nome =
        (clienteQuery.data?.nome ? `Imóvel de ${clienteQuery.data.nome}` : null) ??
        (oportunidade.cidade ? `Imóvel em ${oportunidade.cidade}` : "Novo imóvel");

      const { data, error } = await supabase
        .from("imoveis")
        .insert({
          empresa_id: oportunidade.empresa_id ?? perfil?.empresa_id ?? null,
          cliente_id: oportunidade.cliente_id,
          nome,
          tipo: "rural",
          municipio: oportunidade.cidade,
          area_ha: oportunidade.area_ha,
        })
        .select("id")
        .single();
      if (error) throw error;

      const { error: erroVinculo } = await supabase
        .from("oportunidades")
        .update({ imovel_id: (data as { id: string }).id })
        .eq("id", id);
      if (erroVinculo) throw erroVinculo;

      return (data as { id: string }).id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oportunidade", id] });
      queryClient.invalidateQueries({ queryKey: ["imoveis"] });
      toast.success("Imóvel criado e vinculado");
    },
    onError: () => toast.error("Não foi possível criar o imóvel."),
  });

  const arquivar = useMutation({
    mutationFn: async (motivoPerda: string) => {
      const { error } = await supabase
        .from("oportunidades")
        .update({ arquivada: true, motivo_perda: motivoPerda })
        .eq("id", id);
      if (error) throw error;

      const { error: erroEvento } = await supabase.from("eventos").insert({
        empresa_id: oportunidade?.empresa_id ?? perfil?.empresa_id ?? null,
        usuario_id: perfil?.id ?? null,
        tipo: "arquivamento",
        entidade: "oportunidades",
        entidade_id: id,
        descricao: `Arquivada: ${rotulo(motivoPerda) || motivoPerda}`,
      });
      if (erroEvento) throw erroEvento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oportunidades"] });
      toast.success("Oportunidade arquivada");
      setAbrirArquivar(false);
      navigate({ to: "/funil" });
    },
    onError: () => toast.error("Não foi possível arquivar."),
  });

  if (oportunidadeQuery.isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  if (oportunidadeQuery.error || !oportunidade) {
    return (
      <section className="py-10 text-center">
        <h1 className="text-2xl font-extrabold text-foreground">Oportunidade não encontrada</h1>
        <p className="mt-2 text-lg font-medium text-muted-foreground">
          Ela pode ter sido excluída ou pertence a outra empresa.
        </p>
        <Button asChild className="mt-6 h-14 rounded-xl px-6 text-lg font-extrabold">
          <Link to="/funil">Voltar para o funil</Link>
        </Button>
      </section>
    );
  }

  const cliente = clienteQuery.data ?? null;
  const telefone = soDigitos(cliente?.telefone ?? "");
  const whatsapp = telefone ? `https://wa.me/${telefone.length <= 11 ? `55${telefone}` : telefone}` : null;
  const imovel = (imoveisQuery.data ?? []).find((i) => i.id === oportunidade.imovel_id) ?? null;
  const mensagens = mensagensQuery.data ?? [];

  const troca = (campo: string) => (v: string) => salvar.mutate({ [campo]: v === "" ? null : v });

  return (
    <section className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <Link
          to="/funil"
          aria-label="Voltar para o funil"
          className="flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-border bg-card text-foreground"
        >
          <ArrowLeft className="size-6" strokeWidth={2.5} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold text-foreground md:text-3xl">
            {cliente?.nome?.trim() || "Sem cliente"}
          </h1>
          <p className="flex items-center gap-2 truncate text-base font-semibold text-muted-foreground">
            <span className={`size-3 shrink-0 rounded-full ${corDaNota(oportunidade.nota)}`} />
            {rotulo(oportunidade.estagio) || "Novo"} ·{" "}
            {desdeAgora(oportunidade.ultima_interacao ?? oportunidade.criado_em)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {whatsapp ? (
          <Button
            asChild
            className="h-14 flex-1 rounded-xl text-lg font-extrabold"
          >
            <a href={whatsapp} target="_blank" rel="noreferrer">
              <MessageCircle className="size-5" strokeWidth={2.5} />
              Abrir no WhatsApp
            </a>
          </Button>
        ) : null}

        <Dialog open={abrirArquivar} onOpenChange={setAbrirArquivar}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-14 flex-1 rounded-xl border-2 text-lg font-extrabold"
            >
              <Archive className="size-5" strokeWidth={2.5} />
              Arquivar
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold">Arquivar oportunidade</DialogTitle>
              <DialogDescription className="text-base font-semibold">
                Escolha o motivo da perda. Ela sai do funil, mas o histórico continua salvo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {MOTIVOS_PERDA.map((m) => (
                <button
                  key={m.valor}
                  type="button"
                  onClick={() => setMotivo(m.valor)}
                  className={`h-14 w-full rounded-xl border-2 text-lg font-extrabold transition-colors ${
                    motivo === m.valor
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-accent"
                  }`}
                >
                  {m.rotulo}
                </button>
              ))}
            </div>
            <Button
              disabled={!motivo || arquivar.isPending}
              onClick={() => arquivar.mutate(motivo)}
              className="h-14 rounded-xl text-lg font-extrabold"
            >
              {arquivar.isPending ? <Loader2 className="size-5 animate-spin" /> : "Confirmar"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <Bloco titulo="Qualificação" Icone={ClipboardList}>
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <span className="text-base font-bold text-foreground">Serviço</span>
            <select
              value={oportunidade.servico ?? ""}
              onChange={(e) => salvar.mutate({ servico: e.target.value || null })}
              className="mt-1.5 h-14 w-full rounded-xl border-2 border-border bg-card px-3 text-lg font-bold text-foreground"
            >
              <option value="">não informado</option>
              {SERVICOS.map((s) => (
                <option key={s.valor} value={s.valor}>
                  {s.rotulo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="text-base font-bold text-foreground">Estágio</span>
            <select
              value={oportunidade.estagio ?? "novo"}
              onChange={(e) => salvar.mutate({ estagio: e.target.value })}
              className="mt-1.5 h-14 w-full rounded-xl border-2 border-border bg-card px-3 text-lg font-bold text-foreground"
            >
              {ESTAGIOS.map((s) => (
                <option key={s.valor} value={s.valor}>
                  {s.rotulo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="text-base font-bold text-foreground">Nota</span>
            <select
              value={oportunidade.nota ?? "morno"}
              onChange={(e) => salvar.mutate({ nota: e.target.value })}
              className="mt-1.5 h-14 w-full rounded-xl border-2 border-border bg-card px-3 text-lg font-bold text-foreground"
            >
              {NOTAS.map((n) => (
                <option key={n.valor} value={n.valor}>
                  {n.rotulo}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Grade>
          <Campo rotulo="Cidade" valor={oportunidade.cidade ?? ""} onSalvar={troca("cidade")} />
          <Campo
            rotulo="Área (ha)"
            valor={oportunidade.area_ha !== null ? numero(oportunidade.area_ha, 4) : ""}
            inputMode="decimal"
            onSalvar={(v) => salvar.mutate({ area_ha: paraNumero(v) })}
          />
        </Grade>

        <div className="mt-4 space-y-4">
          <CampoLongo
            rotulo="Situação documental"
            valor={oportunidade.situacao_documental ?? ""}
            onSalvar={troca("situacao_documental")}
            placeholder="Tem matrícula? CCIR e ITR em dia? Inventário pendente?"
          />
          <CampoLongo
            rotulo="Motivo e prazo"
            valor={oportunidade.motivo_prazo ?? ""}
            onSalvar={troca("motivo_prazo")}
            placeholder="Por que precisa do serviço e para quando"
          />
          <CampoLongo
            rotulo="Histórico"
            valor={oportunidade.historico ?? ""}
            onSalvar={troca("historico")}
            placeholder="Já tentou antes? Com quem? O que travou?"
          />
        </div>
      </Bloco>

      <Bloco titulo="Cliente e imóvel" Icone={MapPinned}>
        <div className="space-y-4">
          <div>
            <span className="text-base font-bold text-foreground">Cliente</span>
            <p className="mt-1.5 text-lg font-extrabold text-foreground">
              {cliente?.nome?.trim() || "Sem cliente vinculado"}
            </p>
            {cliente?.telefone ? (
              <p className="text-base font-semibold text-muted-foreground">
                {mascaraTelefone(cliente.telefone)}
              </p>
            ) : null}
            {oportunidade.cliente_id ? (
              <Link
                to="/clientes/$id"
                params={{ id: oportunidade.cliente_id }}
                className="mt-2 inline-flex items-center gap-2 text-base font-extrabold text-primary underline"
              >
                <User className="size-5" strokeWidth={2.5} />
                Abrir ficha do cliente
              </Link>
            ) : null}
          </div>

          <div>
            <span className="text-base font-bold text-foreground">Imóvel vinculado</span>
            <select
              value={oportunidade.imovel_id ?? ""}
              onChange={(e) => salvar.mutate({ imovel_id: e.target.value || null })}
              className="mt-1.5 h-14 w-full rounded-xl border-2 border-border bg-card px-3 text-lg font-bold text-foreground"
            >
              <option value="">Sem imóvel vinculado</option>
              {(imoveisQuery.data ?? []).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                  {i.municipio ? ` — ${i.municipio}` : ""}
                </option>
              ))}
            </select>

            {imovel ? (
              <Link
                to="/imoveis/$id"
                params={{ id: imovel.id }}
                className="mt-2 inline-flex items-center gap-2 text-base font-extrabold text-primary underline"
              >
                <MapPinned className="size-5" strokeWidth={2.5} />
                Abrir ficha do imóvel
                {imovel.area_ha !== null ? ` · ${areaHa(imovel.area_ha)}` : ""}
              </Link>
            ) : (
              <Button
                variant="outline"
                disabled={criarImovel.isPending}
                onClick={() => criarImovel.mutate()}
                className="mt-3 h-14 w-full rounded-xl border-2 text-lg font-extrabold"
              >
                {criarImovel.isPending ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="size-5" strokeWidth={2.5} />
                    Criar imóvel com os dados da qualificação
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Bloco>

      <Bloco titulo="Conversa" Icone={MessageCircle}>
        {mensagensQuery.isPending ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : mensagens.length === 0 ? (
          <p className="py-6 text-center text-base font-semibold text-muted-foreground">
            Nenhuma mensagem registrada ainda.
          </p>
        ) : (
          <ol className="space-y-2">
            {mensagens.map((m) => {
              const recebida = m.direcao === "recebida";
              const humano = m.direcao === "enviada_humano";
              return (
                <li key={m.id} className={`flex ${recebida ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl border-2 px-3 py-2 ${
                      recebida
                        ? "border-border bg-muted text-foreground"
                        : humano
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-secondary bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-base font-semibold">
                      {m.conteudo?.trim() || (m.tipo ? `[${m.tipo}]` : "[sem conteúdo]")}
                    </p>
                    <p className="mt-1 text-right text-xs font-bold opacity-75">
                      {humano ? "você · " : recebida ? "" : "agente · "}
                      {hora(m.criado_em)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Bloco>
    </section>
  );
}
