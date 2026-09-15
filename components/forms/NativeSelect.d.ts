import type { SelectHTMLAttributes, ReactNode } from "react";

/**
 * Select nativo estilizado — é o que o CRM usa de verdade nos filtros e diálogos
 * (o Select do Radix existe no repo, mas as telas usam <select>).
 */
export interface NativeSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  size?: "default" | "md" | "lg";
  /** Pílula — filtro de cidade na lista de imóveis. */
  pill?: boolean;
  children?: ReactNode;
}
export declare function NativeSelect(props: NativeSelectProps): JSX.Element;
