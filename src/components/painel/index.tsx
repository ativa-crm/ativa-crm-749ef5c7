import type { ComponentType, HTMLAttributes, ReactNode, SVGProps } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type Icone = ComponentType<SVGProps<SVGSVGElement>>;
type Tom = "neutro" | "atencao" | "critico";
type DestinoIndicador =
  | "/funil"
  | "/servicos"
  | "/orcamentos"
  | "/imoveis"
  | "/clientes"
  | "/contratos"
  | "/medicao"
  | "/administracao";

const tons: Record<Tom, { icone: string; numero: string }> = {
  neutro: { icone: "bg-secondary text-primary", numero: "text-primary" },
  atencao: {
    icone: "bg-warning/15 text-warning-ink dark:text-warning",
    numero: "text-warning-ink dark:text-warning",
  },
  critico: { icone: "bg-destructive/15 text-destructive", numero: "text-destructive" },
};

export function CartaoIndicador({
  icone: Icone,
  valor,
  rotulo,
  apoio,
  tom = "neutro",
  destino,
}: {
  icone: Icone;
  valor: ReactNode;
  rotulo: string;
  apoio: string;
  tom?: Tom;
  destino: DestinoIndicador;
}) {
  return (
    <Link
      to={destino}
      className="group flex min-h-32 flex-col justify-between rounded-lg border border-border bg-card p-4 shadow-card transition-all duration-200 ease-out hover:-translate-y-px hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className={cn("flex size-7.5 items-center justify-center rounded-sm", tons[tom].icone)}>
        <Icone className="size-4" aria-hidden />
      </span>
      <span>
        <span
          className={cn(
            "block text-3xl font-extrabold leading-none tabular-nums",
            tons[tom].numero,
          )}
        >
          {valor}
        </span>
        <span className="mt-2 block text-sm font-bold uppercase text-foreground">{rotulo}</span>
        <span className="mt-1 block text-xs font-medium text-muted-foreground">{apoio}</span>
      </span>
    </Link>
  );
}

export function AnelMeta({ valor, rotulo }: { valor: number; rotulo: string }) {
  const percentual = Math.min(100, Math.max(0, valor));
  return (
    <div className="flex items-center gap-4">
      <div
        className="grid size-24 shrink-0 place-items-center rounded-full"
        style={{
          background: `conic-gradient(var(--primary) ${percentual}%, var(--secondary) ${percentual}% 100%)`,
        }}
        role="progressbar"
        aria-valuenow={percentual}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={rotulo}
      >
        <span className="grid size-16 place-items-center rounded-full bg-card text-xl font-extrabold tabular-nums text-foreground">
          {percentual}%
        </span>
      </div>
      <span className="text-sm font-bold uppercase text-foreground">{rotulo}</span>
    </div>
  );
}

export function Barras({ dados }: { dados: Array<{ rotulo: string; valor: number }> }) {
  const maior = Math.max(1, ...dados.map((item) => item.valor));
  return (
    <div className="flex h-32 items-end gap-2" aria-label="Histórico mensal">
      {dados.map((item, indice) => (
        <div key={item.rotulo} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
          <span
            className={cn(
              "min-h-1 w-full rounded-sm bg-primary/35 transition-all duration-200",
              indice === dados.length - 1 && "bg-primary",
            )}
            style={{ height: `${Math.max(4, (item.valor / maior) * 100)}%` }}
            title={`${item.rotulo}: ${item.valor}`}
          />
          <span className="truncate text-center text-xs font-semibold uppercase text-muted-foreground">
            {item.rotulo}
          </span>
        </div>
      ))}
    </div>
  );
}

export function BarrasFunil({ dados }: { dados: Array<{ rotulo: string; valor: number }> }) {
  const maior = Math.max(1, ...dados.map((item) => item.valor));
  return (
    <div className="space-y-3">
      {dados.map((item) => (
        <div key={item.rotulo} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold uppercase text-foreground">
              <span className="truncate">{item.rotulo}</span>
              <span className="tabular-nums">{item.valor}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-200"
                style={{ width: `${(item.valor / maior) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Painel({
  titulo,
  icone: Icone,
  acao,
  children,
  className,
}: {
  titulo: string;
  icone: Icone;
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card shadow-card",
        className,
      )}
    >
      <header className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase text-foreground">
          <Icone className="size-4 text-primary" aria-hidden />
          {titulo}
        </h2>
        {acao}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Tabela({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("w-full overflow-x-auto", className)} {...props} />;
}

export function BarraFerramentas({ children }: { children: ReactNode }) {
  return <div className="flex min-h-11 flex-wrap items-center gap-2">{children}</div>;
}
