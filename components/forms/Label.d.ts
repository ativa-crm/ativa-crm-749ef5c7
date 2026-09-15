import type { LabelHTMLAttributes, ReactNode } from "react";

/** Rótulo de campo. */
export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** 16px / peso 700 — versão usada nos formulários de campo. */
  forte?: boolean;
  children?: ReactNode;
}
export declare function Label(props: LabelProps): JSX.Element;
