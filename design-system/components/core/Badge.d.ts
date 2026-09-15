import type { HTMLAttributes, ReactNode } from "react";

/** Etiqueta curta de estado (tipo de cliente, status de OS, prazo). */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
  /** Raio 999px — usado nas listas de imóveis, clientes e serviços. */
  pill?: boolean;
  /** Cor CSS do pontinho à esquerda (ex.: "var(--primary)", "var(--ambar)"). */
  dot?: string;
  children?: ReactNode;
}
export declare function Badge(props: BadgeProps): JSX.Element;
