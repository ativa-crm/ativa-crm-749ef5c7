import type { HTMLAttributes } from "react";

/** Avatar circular com fallback nas iniciais do nome. */
export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string;
  /** Nome completo — vira as iniciais quando não há imagem. */
  nome?: string;
  /** Diâmetro em px. Padrão 40. */
  size?: number;
}
export declare function Avatar(props: AvatarProps): JSX.Element;
