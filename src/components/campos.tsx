import { useEffect, useId, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/** Cartão de bloco da ficha. */
export function Bloco({
  titulo,
  Icone,
  children,
  acao,
}: {
  titulo: string;
  Icone?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <section className="rounded-3xl border-2 border-border bg-card p-4 shadow-sm md:p-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-extrabold text-foreground">
          {Icone ? <Icone className="size-6 text-primary" strokeWidth={2.5} /> : null}
          {titulo}
        </h2>
        {acao}
      </header>
      {children}
    </section>
  );
}

export function Grade({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

type CampoProps = {
  rotulo: string;
  valor: string;
  onSalvar: (novo: string) => void;
  mascara?: (v: string) => string;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email";
  larguraTotal?: boolean;
};

/** Campo de texto editável que salva ao sair do campo (blur). */
export function Campo({
  rotulo,
  valor,
  onSalvar,
  mascara,
  placeholder = "não informado",
  inputMode = "text",
  larguraTotal = false,
}: CampoProps) {
  const id = useId();
  const [texto, setTexto] = useState(valor ?? "");

  useEffect(() => {
    setTexto(valor ?? "");
  }, [valor]);

  return (
    <div className={larguraTotal ? "sm:col-span-2" : undefined}>
      <Label htmlFor={id} className="text-base font-bold text-foreground">
        {rotulo}
      </Label>
      <Input
        id={id}
        value={texto}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(e) => setTexto(mascara ? mascara(e.target.value) : e.target.value)}
        onBlur={() => {
          const limpo = texto.trim();
          if (limpo !== (valor ?? "").trim()) onSalvar(limpo);
        }}
        className="mt-1.5 h-14 rounded-xl border-2 text-lg font-semibold placeholder:font-medium placeholder:text-muted-foreground/70"
      />
    </div>
  );
}

export function CampoLongo({
  rotulo,
  valor,
  onSalvar,
  placeholder = "não informado",
}: {
  rotulo: string;
  valor: string;
  onSalvar: (novo: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  const [texto, setTexto] = useState(valor ?? "");

  useEffect(() => {
    setTexto(valor ?? "");
  }, [valor]);

  return (
    <div>
      <Label htmlFor={id} className="text-base font-bold text-foreground">
        {rotulo}
      </Label>
      <Textarea
        id={id}
        value={texto}
        placeholder={placeholder}
        rows={4}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => {
          if (texto.trim() !== (valor ?? "").trim()) onSalvar(texto.trim());
        }}
        className="mt-1.5 rounded-xl border-2 text-lg font-semibold placeholder:font-medium placeholder:text-muted-foreground/70"
      />
    </div>
  );
}

export function CampoOpcoes({
  rotulo,
  valor,
  opcoes,
  onSalvar,
  larguraTotal = false,
}: {
  rotulo: string;
  valor: string;
  opcoes: { valor: string; rotulo: string }[];
  onSalvar: (novo: string) => void;
  larguraTotal?: boolean;
}) {
  return (
    <div className={larguraTotal ? "sm:col-span-2" : undefined}>
      <span className="text-base font-bold text-foreground">{rotulo}</span>
      <div className="mt-1.5 flex gap-2">
        {opcoes.map((o) => {
          const ativo = o.valor === valor;
          return (
            <button
              key={o.valor}
              type="button"
              onClick={() => onSalvar(o.valor)}
              className={`h-14 flex-1 rounded-xl border-2 text-lg font-extrabold transition-colors ${
                ativo
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-accent"
              }`}
            >
              {o.rotulo}
            </button>
          );
        })}
      </div>
    </div>
  );
}
