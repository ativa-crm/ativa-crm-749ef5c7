import type { ReactNode } from "react";

/** Dica curta no hover. Só no desktop — no celular use rótulo visível. */
export interface TooltipProps {
  texto: string;
  children?: ReactNode;
  style?: React.CSSProperties;
}
export declare function Tooltip(props: TooltipProps): JSX.Element;
