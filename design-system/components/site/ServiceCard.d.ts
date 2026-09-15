import type { HTMLAttributes, ReactNode } from "react";

/** Cartão de serviço do site. O "ícone" é um glifo Unicode (⌖ ◈ ⌘ ▣ ▧) — decisão da marca. */
export interface ServiceCardProps extends HTMLAttributes<HTMLDivElement> {
  glifo: string;
  titulo: ReactNode;
  descricao: string;
}
export declare function ServiceCard(props: ServiceCardProps): JSX.Element;
