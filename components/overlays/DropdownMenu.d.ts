import type { ReactNode } from "react";

/** Menu suspenso — "mover para" dos cartões do funil. Itens com 48px de altura. */
export interface MenuItem { valor: string; rotulo: string }
export interface DropdownMenuProps {
  gatilho: ReactNode;
  itens: MenuItem[];
  onSelecionar?: (valor: string) => void;
  alinhamento?: "left" | "right";
  style?: React.CSSProperties;
}
export declare function DropdownMenu(props: DropdownMenuProps): JSX.Element;
