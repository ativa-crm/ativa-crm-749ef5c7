import type { SVGProps } from "react";

/** Ícone Lucide (a única família de ícones da Ativa), com os traçados embutidos. */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name" | "color"> {
  /** Nome kebab-case do Lucide: "map-pinned", "flame", "chevron-right". */
  name: string;
  /** Lado do quadrado em px. 18–20 no menu, 22–24 em destaques. */
  size?: number;
  /** Qualquer cor CSS. Padrão currentColor. */
  color?: string;
  /** Base remota usada só quando o nome não está embutido. */
  base?: string;
}
export declare function Icon(props: IconProps): JSX.Element;
export declare const ICON_BASE: string;
export declare const TRACOS_ICONES: Record<string, string>;
