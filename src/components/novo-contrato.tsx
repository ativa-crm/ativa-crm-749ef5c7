import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { paraNumero } from "@/lib/formato";
import {
  abrirJanelaDocumento,
  dadosCliente,
  escreverDocumento,
  htmlContrato,
} from "@/lib/documento-impressao";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const OBJETO_PADRAO =
  "Prestação de serviços técnicos de topografia e georreferenciamento do imóvel rural, com elaboração de planta, memorial descritivo e ART.";

type Cliente = { id: string; nome: string } & Record<string, unknown>;

export function NovoContrato({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { perfil } = usePerfil();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [clienteId, setClienteId] = useState("");
  const [imovelId, setImovelId] = useState("");
  const [documento, setDocumento] = useState("");
  const [endereco, setEndereco] = useState("");
  const [objeto, setObjeto] = useState(OBJETO_PADRAO);
  const [valor, setValor] = useState("");
  const [extenso, setExtenso] = useState("");

  const clientes = useQuery({
    queryKey: ["clientes", "resumo-completo"],
    enabled: aberto,
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("*").order("nome");
      if (error) throw error;
      return (data ?? []) as Cliente[];
    },
  });
  const imoveis = useQuery({
    queryKey: ["imoveis", "do-cliente", clienteId],
    enabled: aberto && !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imoveis")
        .select("id, nome")
        .eq("cliente_id", clienteId)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as { id: string; nome: string }[];
    },
  });

  function escolherCliente(id: string) {
    setClienteId(id);
    setImovelId("");
    const c = (clientes.data ?? []).find((x) => x.id === id);
    const d = dadosCliente(c);
    setDocumento(d.documento);
    setEndereco(d.endereco);
  }

  const criar = useMutation({
    mutationFn: async (janela: Window | null) => {
      if (!perfil) throw new Error("Perfil não carregado.");
      if (!clienteId) throw new Error("Escolha o cliente.");
      const v = paraNumero(valor) ?? 0;
      if (v <= 0) throw new Error("Informe o valor dos honorários.");
      const { data, error } = await supabase
        .from("contratos")
        .insert({
          empresa_id: perfil.empresa_id,
          cliente_id: clienteId,
          imovel_id: imovelId || null,
          valor: v,
        })
        .select("id")
        .single();
      if (error) throw error;
      const cli = (clientes.data ?? []).find((c) => c.id === clienteId);
      escreverDocumento(
        janela,
        htmlContrato({
          contratante: cli?.nome ?? "",
          documento,
          endereco,
          objeto,
          valor: v,
          valorExtenso: extenso,
        }),
      );
      return data.id as string;
    },
    onSuccess: (id) => {
      void qc.invalidateQueries({ queryKey: ["contratos"] });
      onFechar();
      navigate({ to: "/contratos/$id", params: { id } });
    },
    onError: (e, janela) => {
      janela?.close();
      toast.error(e instanceof Error ? e.message : "Não foi possível criar o contrato.");
    },
  });

  const campo = "mt-1 h-12 rounded-lg border text-base font-semibold";
  const select =
    "mt-1 h-12 w-full rounded-lg border border-input bg-card px-3 text-base font-semibold text-foreground";

  return (
    <Dialog open={aberto} onOpenChange={(a) => !a && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg border-2 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold">Novo contrato</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-bold text-foreground">
            Cliente (contratante)
            <select className={select} value={clienteId} onChange={(e) => escolherCliente(e.target.value)}>
              <option value="">Escolha…</option>
              {(clientes.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold text-foreground">
            Imóvel
            <select
              className={select}
              value={imovelId}
              disabled={!clienteId}
              onChange={(e) => setImovelId(e.target.value)}
            >
              <option value="">Sem imóvel</option>
              {(imoveis.data ?? []).map((i) => (
                <option key={i.id} value={i.id}>{i.nome}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold text-foreground">
            CPF/CNPJ
            <Input value={documento} onChange={(e) => setDocumento(e.target.value)} className={campo} />
          </label>
          <label className="block text-sm font-bold text-foreground">
            Endereço completo
            <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} className={campo} />
          </label>
          <label className="block text-sm font-bold text-foreground sm:col-span-2">
            Objeto (Cláusula 1ª)
            <Textarea
              value={objeto}
              rows={4}
              onChange={(e) => setObjeto(e.target.value)}
              className="mt-1 rounded-lg border text-base font-semibold"
            />
          </label>
          <label className="block text-sm font-bold text-foreground">
            Honorários (R$)
            <Input
              value={valor}
              inputMode="decimal"
              placeholder="0,00"
              onChange={(e) => setValor(e.target.value)}
              className={campo}
            />
          </label>
          <label className="block text-sm font-bold text-foreground">
            Valor por extenso
            <Input value={extenso} onChange={(e) => setExtenso(e.target.value)} className={campo} />
          </label>
        </div>
        <p className="text-sm font-semibold text-muted-foreground">
          Pagamento: 50% na assinatura e 50% na entrega · Foro: Comarca de Itapeva/SP.
        </p>
        <DialogFooter>
          <Button
            type="button"
            onClick={() => criar.mutate(abrirJanelaDocumento())}
            disabled={criar.isPending || !clienteId}
            className="h-12 text-base font-extrabold"
          >
            {criar.isPending ? <Loader2 className="size-5 animate-spin" /> : null}
            Criar contrato e gerar documento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
