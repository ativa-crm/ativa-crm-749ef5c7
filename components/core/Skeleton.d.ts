import type { HTMLAttributes } from "react";

/** Bloco de carregamento pulsante. */
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
}
export declare function Skeleton(props: SkeletonProps): JSX.Element;
