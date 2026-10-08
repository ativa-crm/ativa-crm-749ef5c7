import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type Vinculos = {
  orcamentos: number;
  contratos: number;
  ordens: number;
  imoveis: number;
  oportunidades: number;
  documentos: number;
};

async function contar(tabela: string, clienteId: string): Promise<number> {
  const { count, error } = await supabase
    .from(tabela)
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", clienteId);
  if (error) throw error;
  return count ?? 0;
}

async function carregarVinculos(clienteId: string): Promise<Vinculos> {
  const [orcamentos, contratos, ordens, imoveis, oportunidades, documentos] = await Promise.all([
    contar("orcamentos", clienteId),
    contar("contratos", clienteId),
    contar("ordens_servico", clienteId),
    contar("imoveis", clienteId),
    contar("oportunidades", clienteId),
    contar("documentos", clienteId),
  ]);
  return { orcamentos, contratos, ordens, imoveis, oportunidades, documentos };
}

function plural(n: number, um: string, varios: string): string {
  return `${n} ${n === 1 ? um : varios}`;
}

export function ExcluirClienteDialogo({
  cliente,
  aberto,
  onAbertoChange,
  onExcluido,
}: {
  cliente: { id: string; nome: string } | null;
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  onExcluido?: () => void;
}) {
  const queryClient = useQueryClient();
  const id = cliente?.id ?? "";

  const vinculos = useQuery({
    queryKey: ["cliente", id, "vinculos"],
    queryFn: () => carregarVinculos(id),
    enabled: aberto && !!id,
    staleTime: 0,
  });

  const excluir = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["clientes"] });
      void queryClient.invalidateQueries({ queryKey: ["imoveis"] });
      void queryClient.invalidateQueries({ queryKey: ["oportunidades"] });
      toast.success("Cliente excluído");
      onAbertoChange(false);
      onExcluido?.();
    },
    onError: () =>
      toast.error("Não foi possível excluir. Verifique se há orçamentos, contratos ou OS."),
  });

  const v = vinculos.data;
  const bloqueios = v
    ? [
        v.orcamentos ? plural(v.orcamentos, "orçamento", "orçamentos") : null,
        v.contratos ? plural(v.contratos, "contrato", "contratos") : null,
        v.ordens ? plural(v.ordens, "ordem de serviço", "ordens de serviço") : null,
      ].filter((item): item is string => !!item)
    : [];
  const efeitos = v
    ? [
        v.imoveis
          ? `${plural(v.imoveis, "imóvel continua", "imóveis continuam")} cadastrado${v.imoveis === 1 ? "" : "s"}, sem cliente vinculado`
          : null,
        v.oportunidades
          ? `${plural(v.oportunidades, "oportunidade será apagada", "oportunidades serão apagadas")} do funil, com as mensagens`
          : null,
        v.documentos
          ? `${plural(v.documentos, "documento será apagado", "documentos serão apagados")}`
          : null,
      ].filter((item): item is string => !!item)
    : [];
  const bloqueado = bloqueios.length > 0;

  return (
    <AlertDialog open={aberto} onOpenChange={(valor: boolean) => !excluir.isPending && onAbertoChange(valor)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-base text-muted-foreground">
              <p>
                <span className="font-extrabold text-foreground">{cliente?.nome}</span>
                {bloqueado ? " não pode ser excluído agora." : " será excluído. Essa ação não pode ser desfeita."}
              </p>
              {vinculos.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Verificando vínculos…
                </span>
              ) : vinculos.error ? (
                <p className="font-semibold text-destructive">Não foi possível verificar os vínculos.</p>
              ) : bloqueado ? (
                <p>
                  Ele tem {bloqueios.join(", ")}. Exclua ou transfira esses registros antes de
                  excluir o cliente.
                </p>
              ) : efeitos.length ? (
                <ul className="list-disc space-y-1 pl-5">
                  {efeitos.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={excluir.isPending}>
            {bloqueado ? "Fechar" : "Cancelar"}
          </AlertDialogCancel>
          {bloqueado ? null : (
            <Button
              variant="destructive"
              onClick={() => excluir.mutate()}
              disabled={excluir.isPending || vinculos.isPending || !!vinculos.error}
            >
              {excluir.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Sim, excluir
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
