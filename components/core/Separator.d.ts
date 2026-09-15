import type { HTMLAttributes } from "react";

/** Linha de 1px em --border. */
export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}
export declare function Separator(props: SeparatorProps): JSX.Element;
