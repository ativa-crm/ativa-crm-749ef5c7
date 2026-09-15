import type { HTMLAttributes } from "react";

/** Barra de progresso — andamento do checklist de etapas da OS. */
export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  /** 0 a 100. */
  valor?: number;
  altura?: number;
}
export declare function Progress(props: ProgressProps): JSX.Element;
