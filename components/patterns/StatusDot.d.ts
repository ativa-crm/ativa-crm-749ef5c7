import type { HTMLAttributes } from "react";

/** Pontinho de estado. Nota do lead: quente=vermelho, morno=âmbar, frio=cinza. */
export interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
  cor?: string;
  size?: number;
}
export declare function StatusDot(props: StatusDotProps): JSX.Element;
export declare const CORES_NOTA: Record<"quente" | "morno" | "frio", string>;
export declare const CORES_PRAZO: Record<"verde" | "ambar" | "vermelho" | "nenhum", string>;
