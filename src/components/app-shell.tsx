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
  Route as RotaIcone,
  LogOut,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  FileSignature,
} from "lucide-react";
import { usePerfil } from "@/lib/perfil";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { BotaoTema } from "@/components/tema";
import logoPadraoAsset from "@/assets/ativa-consultoria-logo.png.asset.json";

const ITENS = [
  { to: "/inicio", rotulo: "Início", Icone: Home },
  { to: "/imoveis", rotulo: "Imóveis", Icone: MapPinned },
  { to: "/clientes", rotulo: "Clientes", Icone: Users },
  { to: "/funil", rotulo: "Funil", Icone: Filter },
  { to: "/servicos", rotulo: "Serviços", Icone: Wrench },
  { to: "/orcamentos", rotulo: "Orçamentos", Icone: FileText },
  { to: "/medicao", rotulo: "Medição", Icone: RotaIcone },
  { to: "/contratos", rotulo: "Contratos", Icone: FileSignature },
] as const;

const ITEM_ADMIN = { to: "/administracao", rotulo: "Administração", Icone: ShieldCheck } as const;

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
  const itens = perfil?.papel === "admin" ? [...ITENS, ITEM_ADMIN] : ITENS;

  return (
    <div className="min-h-screen bg-background-light">
      {/* Barra lateral (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground md:flex">
        <Marca nome={nomeEmpresa} logo={logo} />
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {itens.map(({ to, rotulo, Icone }) => (
            <Link
              key={to}
              to={to}
              activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground" }}
              className="flex items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 text-base font-bold uppercase text-sidebar-foreground transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Icone className="size-[18px]" strokeWidth={2.5} />
              {rotulo}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border pt-3">
          <p className="px-2 pb-2 text-sm font-semibold text-muted">
            {perfil?.nome ?? ""}
            {perfil?.papel ? ` · ${perfil.papel}` : ""}
          </p>
          <BotaoTema className="h-auto w-full justify-start gap-2.5 px-4 py-2 text-xs text-muted hover:bg-sidebar-accent hover:text-sidebar-foreground" />
          <Button
            variant="ghost"
            onClick={sair}
            className="flex h-auto w-full justify-start gap-2.5 rounded-[10px] px-4 py-2 text-xs text-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="size-5" strokeWidth={2.5} />
            Sair
          </Button>
        </div>
      </aside>

      {/* Cabeçalho (celular) */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-sidebar-border bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
        <Marca nome={nomeEmpresa} logo={logo} />
        <Button
          variant="ghost"
          size="icon"
          onClick={sair}
          aria-label="Sair"
          className="size-12 rounded-full border border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="size-6" strokeWidth={2.5} />
        </Button>
      </header>

      <div className="md:pl-64">
        <div className="app-content mx-auto w-full max-w-5xl px-4 pb-28 pt-6 md:px-6 md:pb-10 md:pt-8">
          {children}
        </div>
      </div>

      {/* Barra inferior (celular) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex overflow-x-auto border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden">
        {itens.map(({ to, rotulo, Icone }) => (
          <Link
            key={to}
            to={to}
            activeProps={{ className: "text-primary" }}
            className="flex min-h-16 min-w-20 flex-1 flex-col items-center justify-center gap-1 px-1 text-muted transition-colors duration-200 hover:bg-sidebar-accent"
          >
            <Icone className="size-5" strokeWidth={2.5} />
            <span className="text-[11px] font-bold leading-none">{rotulo}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function Marca({ nome, logo }: { nome: string; logo: string | null }) {
  const logoExibido = logo?.trim() || logoPadraoAsset.url;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-card p-1 ring-1 ring-sidebar-border">
        <img
          src={logoExibido}
          alt={`Logo ${nome || "Ativa Consultoria"}`}
          className="h-full w-full object-contain"
        />
      </span>
      <span className="truncate text-base font-extrabold uppercase text-sidebar-foreground">
        {nome}
      </span>
    </div>
  );
}
