import type { HTMLAttributes, ReactNode } from "react";

/**
 * Linha de lista do CRM: título 18px/700, metadados 14px cinza, badge à direita.
 * @startingPoint section="Padrões" subtitle="Linha de lista de imóveis e clientes" viewport="700x200"
 */
export interface ListRowProps extends HTMLAttributes<HTMLDivElement> {
  titulo: string;
  /** Até 3 linhas de apoio. */
  linhas?: string[];
  direita?: ReactNode;
  /** Borda vermelha de 2px — usada em "Precisam de você agora". */
  alerta?: boolean;
}
export declare function ListRow(props: ListRowProps): JSX.Element;
