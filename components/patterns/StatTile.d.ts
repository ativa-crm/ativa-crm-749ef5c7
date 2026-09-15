import type { HTMLAttributes } from "react";

/**
 * Bloco de número do painel Início: número grande verde + rótulo em caixa alta.
 * @startingPoint section="Padrões" subtitle="Blocos de número do painel" viewport="700x180"
 */
export interface StatTileProps extends HTMLAttributes<HTMLDivElement> {
  /** Nome do ícone Lucide exibido antes do número. */
  icone?: string;
  valor: React.ReactNode;
  rotulo: string;
  iconBase?: string;
}
export declare function StatTile(props: StatTileProps): JSX.Element;
