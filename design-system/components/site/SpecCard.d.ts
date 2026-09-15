import type { HTMLAttributes, ReactNode } from "react";

/** Cartão técnico da seção Equipamentos (drone, ortomosaico). */
export interface SpecCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Etiqueta acima do título: "Aeronave", "Produto final". */
  tag?: string;
  titulo: ReactNode;
  children?: ReactNode;
}
export declare function SpecCard(props: SpecCardProps): JSX.Element;

export interface SpecItem { titulo: string; detalhe: string }
export interface SpecGridProps extends HTMLAttributes<HTMLDivElement> { itens: SpecItem[] }
export declare function SpecGrid(props: SpecGridProps): JSX.Element;

/** Pílula de característica sob o ortomosaico. */
export declare function Chip(props: HTMLAttributes<HTMLSpanElement>): JSX.Element;
