import type { HTMLAttributes, ReactNode } from "react";

/** Título de seção em CAIXA ALTA. Com `sublinhado`, ganha a régua verde de 2px do styles.css. */
export interface SectionHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  icone?: string;
  corIcone?: string;
  sublinhado?: boolean;
  iconBase?: string;
  children?: ReactNode;
}
export declare function SectionHeading(props: SectionHeadingProps): JSX.Element;
