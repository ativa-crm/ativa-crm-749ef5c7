import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const CHAVE = "ativa-tema";

export type Tema = "claro" | "escuro";

/** Script injetado no <head> para aplicar o tema antes do primeiro render (evita piscar). */
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem("${CHAVE}");document.documentElement.classList.toggle("dark",t!=="claro")}catch(e){document.documentElement.classList.add("dark")}})();`;

function temaAtual(): Tema {
  if (typeof document === "undefined") return "escuro";
  return document.documentElement.classList.contains("dark") ? "escuro" : "claro";
}

export function BotaoTema({
  className,
  mostrarRotulo = true,
}: {
  className?: string;
  mostrarRotulo?: boolean;
}) {
  const [tema, setTema] = useState<Tema>("escuro");

  useEffect(() => {
    setTema(temaAtual());
  }, []);

  function alternar() {
    const novo: Tema = tema === "escuro" ? "claro" : "escuro";
    document.documentElement.classList.toggle("dark", novo === "escuro");
    try {
      localStorage.setItem(CHAVE, novo);
    } catch {
      /* armazenamento indisponível */
    }
    setTema(novo);
  }

  return (
    <Button
      variant="ghost"
      onClick={alternar}
      aria-label={tema === "escuro" ? "Usar tema claro" : "Usar tema escuro"}
      className={className}
    >
      {tema === "escuro" ? (
        <Sun className="size-4.5" strokeWidth={2.5} />
      ) : (
        <Moon className="size-4.5" strokeWidth={2.5} />
      )}
      {mostrarRotulo && (tema === "escuro" ? "Tema claro" : "Tema escuro")}
    </Button>
  );
}
