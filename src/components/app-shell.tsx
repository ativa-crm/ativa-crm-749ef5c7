import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronDown,
  Flame,
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
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from "lucide-react";
import { usePerfil } from "@/lib/perfil";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
const CHAVE_LATERAL = "ativa-crm-lateral";

const TITULOS: Record<string, string> = {
  "/inicio": "Início",
  "/imoveis": "Imóveis",
  "/clientes": "Clientes",
  "/funil": "Funil",
  "/oportunidades": "Oportunidade",
  "/servicos": "Serviços",
  "/orcamentos": "Orçamentos",
  "/medicao": "Medição",
  "/contratos": "Contratos",
  "/administracao": "Administração",
};

function itensPorPapel(papel: string | null | undefined) {
  const normalizado = papel?.toLocaleLowerCase("pt-BR") ?? "";
  const engenheiro = normalizado.includes("engenheiro") || normalizado.includes("responsavel");
  const administrativo = normalizado.includes("administrativo");
  const dono = normalizado === "admin" || normalizado.includes("dono");

  if (engenheiro) {
    return ITENS.filter(({ to }) => ["/inicio", "/imoveis", "/servicos", "/medicao"].includes(to));
  }
  const base = administrativo ? ITENS.filter(({ to }) => to !== "/medicao") : [...ITENS];
  return dono ? [...base, ITEM_ADMIN] : base;
}

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
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [aberta, setAberta] = useState(true);
  const [gaveta, setGaveta] = useState(false);

  useEffect(() => {
    try {
      setAberta(localStorage.getItem(CHAVE_LATERAL) !== "0");
    } catch {
      setAberta(true);
    }
  }, []);

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
  const itens = itensPorPapel(perfil?.papel);
  const titulo =
    Object.entries(TITULOS).find(([caminho]) =>
      caminho === "/inicio" ? pathname === caminho : pathname.startsWith(caminho),
    )?.[1] ?? "Ativa CRM";

  function alternarLateral() {
    setAberta((atual) => {
      const proximo = !atual;
      try {
        localStorage.setItem(CHAVE_LATERAL, proximo ? "1" : "0");
      } catch {
        /* armazenamento indisponível */
      }
      return proximo;
    });
  }

  return (
    <div className="jarvis relative flex min-h-screen overflow-hidden bg-background-light">
      <Lateral
        itens={itens}
        aberta={aberta}
        pathname={pathname}
        nomeEmpresa={nomeEmpresa}
        logo={logo}
        perfil={perfil?.papel ?? ""}
        nome={perfil?.nome ?? ""}
        onAlternar={alternarLateral}
        onSair={sair}
        className="hidden md:flex"
      />

      {gaveta && (
        <div
          className="fixed inset-0 z-50 bg-sidebar/60 md:hidden"
          onClick={() => setGaveta(false)}
          role="presentation"
        >
          <Lateral
            itens={itens}
            aberta
            pathname={pathname}
            nomeEmpresa={nomeEmpresa}
            logo={logo}
            perfil={perfil?.papel ?? ""}
            nome={perfil?.nome ?? ""}
            onAlternar={() => setGaveta(false)}
            onSair={sair}
            onNavegar={() => setGaveta(false)}
            className="flex"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <BarraTopo
          titulo={titulo}
          nome={perfil?.nome ?? ""}
          papel={perfil?.papel ?? ""}
          onAbrirMenu={() => setGaveta(true)}
        />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="app-content mx-auto w-full max-w-7xl px-4 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6">
            {children}
          </div>
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden">
          {itens.slice(0, 4).map(({ to, rotulo, Icone }) => {
            const ativo = pathname === to || pathname.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                to={to}
                data-ativo={ativo ? "1" : "0"}
                className="flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-muted transition-colors duration-200 hover:bg-sidebar-accent data-[ativo=1]:text-primary"
              >
                <Icone className="size-5" strokeWidth={2.5} />
                <span className="w-full text-center text-xs font-bold leading-none">{rotulo}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

type ItemMenu = (typeof ITENS)[number] | typeof ITEM_ADMIN;

function Lateral({
  itens,
  aberta,
  pathname,
  nomeEmpresa,
  logo,
  perfil,
  nome,
  onAlternar,
  onSair,
  onNavegar,
  className,
}: {
  itens: readonly ItemMenu[];
  aberta: boolean;
  pathname: string;
  nomeEmpresa: string;
  logo: string | null;
  perfil: string;
  nome: string;
  onAlternar: () => void;
  onSair: () => void;
  onNavegar?: () => void;
  className?: string;
}) {
  return (
    <aside
      onClick={(event) => event.stopPropagation()}
      className={`${className ?? ""} relative z-50 h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-3.5 text-sidebar-foreground transition-[width] duration-200 ${aberta ? "w-62" : "w-19"}`}
    >
      <Marca nome={nomeEmpresa} logo={logo} aberta={aberta} />
      <nav className="mt-5 flex flex-1 flex-col gap-1">
        {itens.map(({ to, rotulo, Icone }) => {
          const ativo = pathname === to || pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              title={aberta ? undefined : rotulo}
              aria-label={rotulo}
              data-ativo={ativo ? "1" : "0"}
              onClick={onNavegar}
              className="flex min-h-11 items-center gap-3 overflow-hidden rounded-sm px-3 text-sm font-bold uppercase text-sidebar-foreground transition-colors duration-200 hover:bg-sidebar-accent data-[ativo=1]:bg-sidebar-primary data-[ativo=1]:text-sidebar-primary-foreground"
            >
              <Icone className="size-5 shrink-0" strokeWidth={2.5} />
              {aberta && <span className="whitespace-nowrap">{rotulo}</span>}
            </Link>
          );
        })}
      </nav>
      {aberta && (
        <p className="truncate border-t border-sidebar-border px-2 pt-3 text-xs font-semibold text-muted">
          {nome || "Usuário"} · {rotuloPerfil(perfil)}
        </p>
      )}
      <Button
        variant="ghost"
        onClick={onSair}
        title={aberta ? undefined : "Sair"}
        aria-label="Sair"
        className="mt-2 min-h-11 w-full justify-start px-3 text-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        <LogOut className="size-5" />
        {aberta && "Sair"}
      </Button>
      <Button
        variant="outline"
        onClick={onAlternar}
        title={aberta ? undefined : "Expandir"}
        aria-label={aberta ? "Recolher menu" : "Expandir menu"}
        className="mt-2 min-h-11 w-full justify-start border-sidebar-border bg-transparent px-3 text-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        {aberta ? <PanelLeftClose className="size-5" /> : <PanelLeftOpen className="size-5" />}
        {aberta && "Recolher"}
      </Button>
    </aside>
  );
}

function BarraTopo({
  titulo,
  nome,
  papel,
  onAbrirMenu,
}: {
  titulo: string;
  nome: string;
  papel: string;
  onAbrirMenu: () => void;
}) {
  const iniciais = useMemo(
    () =>
      (nome || "Usuário")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0])
        .join("")
        .toUpperCase(),
    [nome],
  );

  return (
    <header className="relative z-30 flex h-15 shrink-0 items-center gap-3 border-b border-border bg-card px-3 md:h-17 md:px-6">
      <Button
        variant="outline"
        size="icon"
        onClick={onAbrirMenu}
        aria-label="Abrir menu"
        className="size-11 md:hidden"
      >
        <Menu className="size-5" />
      </Button>
      <h1 className="min-w-0 flex-1 truncate text-base font-bold uppercase text-foreground md:text-xl">
        {titulo}
      </h1>
      <label className="relative hidden w-75 lg:block">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-11 rounded-full pl-10"
          placeholder="Buscar cliente, imóvel, orçamento…"
          aria-label="Busca global"
        />
      </label>
      <span
        className="flex min-h-11 items-center gap-2 rounded-full border border-border bg-secondary px-3 text-xs font-extrabold text-foreground"
        title="Pontos de atividade"
      >
        <Flame className="size-4 text-primary" />
        <span className="tabular-nums">0</span>
        <span className="hidden text-muted-foreground sm:inline">PTS</span>
      </span>
      <span className="hidden min-h-11 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-bold uppercase text-foreground xl:flex">
        {rotuloPerfil(papel)}
        <ChevronDown className="size-4 text-muted-foreground" />
      </span>
      <BotaoTema mostrarRotulo={false} className="size-11 px-0 [&>svg]:size-4.5" />
      <Avatar className="size-11 border border-border">
        <AvatarFallback className="bg-secondary text-xs font-extrabold text-foreground">
          {iniciais}
        </AvatarFallback>
      </Avatar>
    </header>
  );
}

function rotuloPerfil(papel: string) {
  const normalizado = papel.toLocaleLowerCase("pt-BR");
  if (normalizado === "admin" || normalizado.includes("dono")) return "Dono";
  if (normalizado.includes("engenheiro") || normalizado.includes("responsavel"))
    return "Eng. responsável";
  if (normalizado.includes("administrativo")) return "Administrativo";
  return papel || "Usuário";
}

function Marca({ nome, logo, aberta }: { nome: string; logo: string | null; aberta: boolean }) {
  const logoExibido = logo?.trim() || logoPadraoAsset.url;

  return (
    <div className="flex min-h-12 min-w-0 items-center gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-logo bg-card p-1 ring-1 ring-sidebar-border">
        <img
          src={logoExibido}
          alt={`Logo ${nome || "Ativa Consultoria"}`}
          className="h-full w-full object-contain"
        />
      </span>
      {aberta && (
        <span className="truncate text-sm font-extrabold uppercase text-sidebar-foreground">
          {nome}
        </span>
      )}
    </div>
  );
}
