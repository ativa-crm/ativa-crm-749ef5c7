import type { AnchorHTMLAttributes, ReactNode } from "react";

/** Botão do site institucional (Inter, cantos quase retos, sobe 2px no hover). */
export interface SiteButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "primary" | "whatsapp" | "outline" | "ghost";
  /** default = 38px do hero · cta = 54px da faixa de contato */
  tamanho?: "default" | "cta";
  /** URL do PNG oficial da marca (WhatsApp/Instagram) exibido antes do texto. */
  icone?: string;
  children?: ReactNode;
}
export declare function SiteButton(props: SiteButtonProps): JSX.Element;
