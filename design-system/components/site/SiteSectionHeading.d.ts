import type { HTMLAttributes, ReactNode } from "react";

/** Kicker verde em caixa alta + título grande do site institucional. */
export interface SiteSectionHeadingProps extends HTMLAttributes<HTMLDivElement> {
  kicker?: string;
  /** Régua verde de 4px sob o título (usada em "Nossos trabalhos"). */
  sublinhado?: boolean;
  /** Tamanho do título em px. 36 nas seções, 48 no destaque. */
  tamanho?: number;
  children?: ReactNode;
}
export declare function SiteSectionHeading(props: SiteSectionHeadingProps): JSX.Element;
