import type { HTMLAttributes, ReactNode } from "react";

/** Aviso flutuante (sonner, `position="top-center" richColors` no CRM). */
export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  tom?: "sucesso" | "erro" | "info";
  iconBase?: string;
  children?: ReactNode;
}
export declare function Toast(props: ToastProps): JSX.Element;
