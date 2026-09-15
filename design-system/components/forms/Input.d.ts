import type { InputHTMLAttributes } from "react";

/** Campo de texto. Raio 18px; foco pinta a borda de verde com anel 20%. */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** default 36px · md 44px (busca) · lg 56px (formulário em campo) */
  size?: "default" | "md" | "lg";
  /** Raio 999px — usado em todos os campos "Buscar…". */
  pill?: boolean;
  invalid?: boolean;
}
export declare function Input(props: InputProps): JSX.Element;
