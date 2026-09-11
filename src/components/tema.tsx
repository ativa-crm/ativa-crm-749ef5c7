import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const CHAVE = "ativa-tema";

export type Tema = "claro" | "escuro";

/** Script injetado no <head> para aplicar o tema antes do primeiro render (evita piscar). */
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem("${CHAVE}");if(t==="escuro"){document.documentElement.classList.add("dark")}else if(!t&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches){document.documentElement.classList.add("dark")}}catch(e){}})();`;

function temaAtual(): Tema {
  if (typeof document === "undefined") return "claro";
  return document.documentElement.classList.contains("dark") ? "escuro" : "claro";
}

export function BotaoTema({ className }: { className?: string }) {
  const [tema, setTema] = useState<Tema>("claro");

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
        <Sun className="size-[18px]" strokeWidth={2.5} />
      ) : (
        <Moon className="size-[18px]" strokeWidth={2.5} />
      )}
      {tema === "escuro" ? "Tema claro" : "Tema escuro"}
    </Button>
  );
}
