import type { HTMLAttributes, ReactNode } from "react";

/** Cartão de oportunidade do funil (arrastável). */
export interface KanbanCardProps extends HTMLAttributes<HTMLElement> {
  cliente: string;
  cidade?: string;
  /** Área já formatada, ex.: "142,5000 ha". */
  area?: string;
  /** Rótulo do serviço, ex.: "Georreferenciamento". */
  servico?: string;
  /** Tempo desde a última interação, ex.: "há 3 d". */
  tempo?: string;
  nota?: "quente" | "morno" | "frio";
  /** Botão "mover para" no canto superior direito. */
  acao?: ReactNode;
}
export declare function KanbanCard(props: KanbanCardProps): JSX.Element;
