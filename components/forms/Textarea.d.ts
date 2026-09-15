import type { TextareaHTMLAttributes } from "react";

/** Área de texto — anotações de oportunidade, observações de OS. */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}
export declare function Textarea(props: TextareaProps): JSX.Element;
