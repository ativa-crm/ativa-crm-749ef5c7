import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownAZ, ArrowUpZA, ChevronDown, Filter, Loader2, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

/** Valor especial que representa células vazias, como o "(Vazias)" do Excel. */
export const VAZIO = "__vazio__";

/**
 * Filtro de uma coluna, no estilo do Excel:
 * - incluir: só os valores marcados;
 * - excluir: todos menos os desmarcados;
 * - contem: texto pesquisado (quando a lista é grande demais);
 * - faixa: mínimo/máximo para colunas numéricas.
 */
export type FiltroColuna =
  | { tipo: "incluir"; valores: string[] }
  | { tipo: "excluir"; valores: string[] }
  | { tipo: "contem"; texto: string }
  | { tipo: "faixa"; min: number | null; max: number | null };

export type Ordenacao = { campo: string; asc: boolean } | null;

type OpcaoFixa = { valor: string; rotulo: string };

type ValorColuna = { valor: string | null; qtd: number };

function rotuloValor(v: string | null): string {
  return v === null || v === "" ? "(Vazias)" : v;
}

export function FiltroExcel({
  titulo,
  campo,
  filtro,
  onFiltro,
  ordenacao,
  onOrdenar,
  ordenavel = true,
  numerico = false,
  opcoes,
  formatar,
}: {
  titulo: string;
  /** Campo usado na RPC prospeccao_valores_coluna (ignorado se `opcoes` vier preenchido). */
  campo: string;
  filtro: FiltroColuna | undefined;
  onFiltro: (f: FiltroColuna | undefined) => void;
  ordenacao: Ordenacao;
  onOrdenar?: (o: Ordenacao) => void;
  ordenavel?: boolean;
  numerico?: boolean;
  /** Lista fixa de valores (ex.: Contato) — dispensa consulta ao banco. */
  opcoes?: OpcaoFixa[];
  /** Formata o valor exibido na lista (ex.: etapa, telefone). */
  formatar?: (v: string) => string;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [buscaAtraso, setBuscaAtraso] = useState("");
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [todosMarcados, setTodosMarcados] = useState(true);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setBuscaAtraso(busca.trim()), 250);
    return () => clearTimeout(t);
  }, [busca]);

  const valores = useQuery({
    queryKey: ["prospeccao", "valores-coluna", campo, buscaAtraso],
    enabled: aberto && !numerico && !opcoes,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("prospeccao_valores_coluna", {
        p_campo: campo,
        p_busca: buscaAtraso || null,
        p_limite: 300,
      });
      if (error) throw error;
      return (data ?? []) as ValorColuna[];
    },
  });

  const lista: { chave: string; rotulo: string; qtd?: number }[] = useMemo(() => {
    if (opcoes) {
      const t = buscaAtraso.toLocaleLowerCase("pt-BR");
      return opcoes
        .filter((o) => !t || o.rotulo.toLocaleLowerCase("pt-BR").includes(t))
        .map((o) => ({ chave: o.valor, rotulo: o.rotulo }));
    }
    return (valores.data ?? []).map((v) => ({
      chave: v.valor === null || v.valor === "" ? VAZIO : v.valor,
      rotulo: v.valor === null || v.valor === "" ? "(Vazias)" : formatar ? formatar(v.valor) : rotuloValor(v.valor),
      qtd: v.qtd,
    }));
  }, [opcoes, valores.data, buscaAtraso, formatar]);

  // Ao abrir, carrega o estado atual do filtro nas caixinhas.
  useEffect(() => {
    if (!aberto) return;
    setBusca(filtro?.tipo === "contem" ? filtro.texto : "");
    setBuscaAtraso(filtro?.tipo === "contem" ? filtro.texto : "");
    if (filtro?.tipo === "incluir") {
      setTodosMarcados(false);
      setMarcados(new Set(filtro.valores));
    } else if (filtro?.tipo === "excluir") {
      setTodosMarcados(true);
      setMarcados(new Set(filtro.valores)); // aqui guarda os DESMARCADOS
    } else {
      setTodosMarcados(true);
      setMarcados(new Set());
    }
    setMin(filtro?.tipo === "faixa" && filtro.min !== null ? String(filtro.min) : "");
    setMax(filtro?.tipo === "faixa" && filtro.max !== null ? String(filtro.max) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  /** Em modo "todos", `marcados` guarda os desmarcados; senão, os marcados. */
  const estaMarcado = (chave: string) => (todosMarcados ? !marcados.has(chave) : marcados.has(chave));
  const alternar = (chave: string) => {
    setMarcados((atual) => {
      const novo = new Set(atual);
      if (novo.has(chave)) novo.delete(chave);
      else novo.add(chave);
      return novo;
    });
  };
  const visiveisMarcados = lista.filter((i) => estaMarcado(i.chave)).length;
  const selecionarTudo = visiveisMarcados === lista.length && lista.length > 0;

  function alternarTudo() {
    if (busca.trim()) {
      // com pesquisa: marca/desmarca só os resultados visíveis
      setMarcados((atual) => {
        const novo = new Set(atual);
        for (const i of lista) {
          const marcar = !selecionarTudo;
          const deveEstarNoSet = todosMarcados ? !marcar : marcar;
          if (deveEstarNoSet) novo.add(i.chave);
          else novo.delete(i.chave);
        }
        return novo;
      });
      return;
    }
    setTodosMarcados(!selecionarTudo);
    setMarcados(new Set());
  }

  function aplicar() {
    if (numerico) {
      const a = min.trim() ? Number(min.replace(",", ".")) : null;
      const b = max.trim() ? Number(max.replace(",", ".")) : null;
      onFiltro(a === null && b === null ? undefined : { tipo: "faixa", min: Number.isFinite(a) ? a : null, max: Number.isFinite(b) ? b : null });
      setAberto(false);
      return;
    }
    const temBusca = busca.trim().length > 0;
    if (temBusca) {
      // Como no Excel: com pesquisa, aplica os resultados marcados.
      const escolhidos = lista.filter((i) => estaMarcado(i.chave)).map((i) => i.chave);
      if (escolhidos.length === lista.length && !opcoes && (valores.data?.length ?? 0) >= 300) {
        onFiltro({ tipo: "contem", texto: busca.trim() }); // lista cortada: filtra pelo texto
      } else {
        onFiltro(escolhidos.length ? { tipo: "incluir", valores: escolhidos } : { tipo: "incluir", valores: ["__nenhum__"] });
      }
    } else if (todosMarcados) {
      onFiltro(marcados.size ? { tipo: "excluir", valores: [...marcados] } : undefined);
    } else {
      onFiltro({ tipo: "incluir", valores: marcados.size ? [...marcados] : ["__nenhum__"] });
    }
    setAberto(false);
  }

  const ativo = !!filtro;
  const ordenadoAqui = ordenacao?.campo === campo;

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <div className="flex items-center gap-1">
        <span>{titulo}</span>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Filtrar ${titulo}`}
            onClick={(e) => e.stopPropagation()}
            data-ativo={ativo ? "1" : "0"}
            className="flex size-6 items-center justify-center rounded border border-border bg-card text-muted-foreground transition hover:bg-muted data-[ativo=1]:border-primary data-[ativo=1]:bg-primary data-[ativo=1]:text-primary-foreground"
          >
            {ativo ? <Filter className="size-3.5" /> : ordenadoAqui ? (ordenacao?.asc ? <ArrowDownAZ className="size-3.5" /> : <ArrowUpZA className="size-3.5" />) : <ChevronDown className="size-3.5" />}
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent align="start" className="w-72 p-0 normal-case" onClick={(e) => e.stopPropagation()}>
        {ordenavel && onOrdenar && (
          <div className="border-b border-border p-1">
            <button
              type="button"
              onClick={() => {
                onOrdenar({ campo, asc: true });
                setAberto(false);
              }}
              className="flex h-9 w-full items-center gap-2 rounded px-2 text-left text-sm font-semibold hover:bg-muted"
            >
              <ArrowDownAZ className="size-4" /> {numerico ? "Classificar do menor para o maior" : "Classificar de A a Z"}
            </button>
            <button
              type="button"
              onClick={() => {
                onOrdenar({ campo, asc: false });
                setAberto(false);
              }}
              className="flex h-9 w-full items-center gap-2 rounded px-2 text-left text-sm font-semibold hover:bg-muted"
            >
              <ArrowUpZA className="size-4" /> {numerico ? "Classificar do maior para o menor" : "Classificar de Z a A"}
            </button>
          </div>
        )}

        {ativo && (
          <div className="border-b border-border p-1">
            <button
              type="button"
              onClick={() => {
                onFiltro(undefined);
                setAberto(false);
              }}
              className="flex h-9 w-full items-center gap-2 rounded px-2 text-left text-sm font-semibold text-destructive hover:bg-muted"
            >
              <X className="size-4" /> Limpar filtro de "{titulo}"
            </button>
          </div>
        )}

        {numerico ? (
          <div className="space-y-2 p-3">
            <p className="text-xs font-bold uppercase text-muted-foreground">Filtros de número</p>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <span className="w-24">Maior ou igual a</span>
              <Input value={min} onChange={(e) => setMin(e.target.value)} inputMode="decimal" className="h-9" placeholder="ha" />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <span className="w-24">Menor ou igual a</span>
              <Input value={max} onChange={(e) => setMax(e.target.value)} inputMode="decimal" className="h-9" placeholder="ha" />
            </label>
          </div>
        ) : (
          <div className="p-2">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") aplicar();
                }}
                placeholder="Pesquisar"
                className="h-9 pl-8"
                autoFocus
              />
            </label>
            <div className="mt-2 max-h-64 overflow-y-auto rounded border border-border">
              {valores.isFetching && !opcoes ? (
                <p className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Carregando…
                </p>
              ) : lista.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">Nenhum valor.</p>
              ) : (
                <>
                  <label className="flex min-h-9 cursor-pointer items-center gap-2 border-b border-border px-2 text-sm font-bold hover:bg-muted">
                    <Checkbox checked={selecionarTudo} onCheckedChange={alternarTudo} />
                    {busca.trim() ? "(Selecionar todos os resultados)" : "(Selecionar tudo)"}
                  </label>
                  {lista.map((i) => (
                    <label
                      key={i.chave}
                      className="flex min-h-8 cursor-pointer items-center gap-2 px-2 text-sm hover:bg-muted"
                    >
                      <Checkbox checked={estaMarcado(i.chave)} onCheckedChange={() => alternar(i.chave)} />
                      <span className="min-w-0 flex-1 truncate">{i.rotulo}</span>
                      {i.qtd !== undefined && <span className="text-xs tabular-nums text-muted-foreground">{i.qtd}</span>}
                    </label>
                  ))}
                </>
              )}
            </div>
            {!opcoes && (valores.data?.length ?? 0) >= 300 && (
              <p className="mt-1 text-[11px] text-muted-foreground">Mostrando os 300 primeiros. Pesquise para refinar.</p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-border p-2">
          <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => setAberto(false)}>
            Cancelar
          </Button>
          <Button type="button" size="sm" className="h-9 font-bold" onClick={aplicar}>
            OK
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
