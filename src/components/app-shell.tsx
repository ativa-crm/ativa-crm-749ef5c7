import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  Home,
  MapPinned,
  Users,
  Filter,
  Wrench,
  FileText,
  LogOut,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { usePerfil } from "@/lib/perfil";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

const ITENS = [
  { to: "/inicio", rotulo: "Início", Icone: Home },
  { to: "/imoveis", rotulo: "Imóveis", Icone: MapPinned },
  { to: "/clientes", rotulo: "Clientes", Icone: Users },
  { to: "/funil", rotulo: "Funil", Icone: Filter },
  { to: "/servicos", rotulo: "Serviços", Icone: Wrench },
  { to: "/orcamentos", rotulo: "Orçamentos", Icone: FileText },
] as const;

function useSair() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/entrar", replace: true });
  };
}

export function AppShell({ children }: { children: ReactNode }) {
  const { perfil, carregando, semAcesso } = usePerfil();
  const sair = useSair();

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  if (semAcesso) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted px-5">
        <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card p-7 text-center shadow-lg">
          <ShieldAlert className="mx-auto size-14 text-destructive" strokeWidth={2.5} />
          <h1 className="mt-4 text-2xl font-extrabold text-foreground">Acesso não liberado</h1>
          <p className="mt-3 text-lg font-medium text-muted-foreground">
            Seu acesso ainda não foi liberado. Fale com o administrador.
          </p>
          <Button onClick={sair} className="mt-6 h-14 w-full rounded-xl text-lg font-extrabold">
            Sair
          </Button>
        </div>
      </main>
    );
  }

  const nomeEmpresa = perfil?.empresa?.nome ?? "";
  const logo = perfil?.empresa?.logo_url ?? null;

  return (
    <div className="min-h-screen bg-muted">
      {/* Barra lateral (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r-2 border-border bg-card p-4 md:flex">
        <Marca nome={nomeEmpresa} logo={logo} />
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {ITENS.map(({ to, rotulo, Icone }) => (
            <Link
              key={to}
              to={to}
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-lg font-bold text-foreground transition-colors hover:bg-accent"
            >
              <Icone className="size-6" strokeWidth={2.5} />
              {rotulo}
            </Link>
          ))}
        </nav>
        <div className="border-t-2 border-border pt-3">
          <p className="px-2 pb-2 text-sm font-semibold text-muted-foreground">
            {perfil?.nome ?? ""}
            {perfil?.papel ? ` · ${perfil.papel}` : ""}
          </p>
          <button
            onClick={sair}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-bold text-foreground hover:bg-accent"
          >
            <LogOut className="size-5" strokeWidth={2.5} />
            Sair
          </button>
        </div>
      </aside>

      {/* Cabeçalho (celular) */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b-2 border-border bg-card px-4 py-3 md:hidden">
        <Marca nome={nomeEmpresa} logo={logo} />
        <button
          onClick={sair}
          aria-label="Sair"
          className="flex size-12 items-center justify-center rounded-xl border-2 border-border text-foreground"
        >
          <LogOut className="size-6" strokeWidth={2.5} />
        </button>
      </header>

      <div className="md:pl-64">
        <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 md:pb-10">{children}</div>
      </div>

      {/* Barra inferior (celular) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t-2 border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {ITENS.map(({ to, rotulo, Icone }) => (
          <Link
            key={to}
            to={to}
            activeProps={{ className: "text-primary" }}
            className="flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-muted-foreground"
          >
            <Icone className="size-6" strokeWidth={2.5} />
            <span className="text-[11px] font-bold leading-none">{rotulo}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function Marca({ nome, logo }: { nome: string; logo: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {logo ? (
        <img src={logo} alt={nome} className="size-11 rounded-xl object-contain" />
      ) : (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-extrabold text-primary-foreground">
          {nome.trim().charAt(0).toUpperCase() || "?"}
        </span>
      )}
      <span className="truncate text-lg font-extrabold text-foreground">{nome}</span>
    </div>
  );
}
