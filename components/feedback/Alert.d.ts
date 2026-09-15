import type { HTMLAttributes, ReactNode } from "react";

/** Aviso em bloco. O erro de login do CRM é exatamente o tom "erro". */
export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tom?: "info" | "sucesso" | "atencao" | "erro";
  titulo?: string;
  iconBase?: string;
  children?: ReactNode;
}
export declare function Alert(props: AlertProps): JSX.Element;
