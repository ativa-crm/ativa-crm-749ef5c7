import type { ReactNode } from "react";

/**
 * Navegação do app: barra lateral preta de 256px no desktop e barra inferior no celular.
 * Vem de src/components/app-shell.tsx.
 * @startingPoint section="Navegação" subtitle="Barra lateral preta + barra inferior" viewport="700x380"
 */
export interface NavItem { valor: string; rotulo: string; icone: string }
export interface SidebarNavProps {
  itens: NavItem[];
  atual?: string;
  onNavegar?: (valor: string) => void;
  /** Bloco de marca no topo (logo em caixa branca + nome da empresa). */
  marca?: ReactNode;
  /** Perfil, tema e sair. */
  rodape?: ReactNode;
  iconBase?: string;
  style?: React.CSSProperties;
}
export declare function SidebarNav(props: SidebarNavProps): JSX.Element;
export interface BottomNavProps {
  itens: NavItem[];
  atual?: string;
  onNavegar?: (valor: string) => void;
  iconBase?: string;
  style?: React.CSSProperties;
}
export declare function BottomNav(props: BottomNavProps): JSX.Element;
