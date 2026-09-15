import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Botão da Ativa: pílula, caixa alta, peso 700. Ação principal do app.
 * @startingPoint section="Core" subtitle="Botões em pílula, caixa alta" viewport="700x200"
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Estilo visual. default = verde da marca. */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  /** default 36px · sm 32px · lg 40px · icon 36×36 */
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  /** Ocupa a largura toda — padrão em formulários no celular. */
  fullWidth?: boolean;
  children?: ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;
