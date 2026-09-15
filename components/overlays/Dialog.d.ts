import type { HTMLAttributes, ReactNode } from "react";

/** Diálogo modal — "Nova ordem de serviço", "Novo orçamento". Raio 26px, borda de 2px. */
export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  aberto?: boolean;
  titulo?: string;
  onFechar?: () => void;
  rodape?: ReactNode;
  /** Largura máxima em px. Padrão 512. */
  largura?: number;
  iconBase?: string;
  children?: ReactNode;
}
export declare function Dialog(props: DialogProps): JSX.Element | null;
