import type { HTMLAttributes, ReactNode } from "react";

/** Superfície branca, raio 14px, borda 1px #eeeeee e sombra quase invisível. */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Sobe 1px no hover — comportamento dos cartões clicáveis do app. */
  hover?: boolean;
  children?: ReactNode;
}
export declare function Card(props: CardProps): JSX.Element;
export declare function CardHeader(props: HTMLAttributes<HTMLDivElement>): JSX.Element;
export declare function CardTitle(props: HTMLAttributes<HTMLDivElement>): JSX.Element;
export declare function CardDescription(props: HTMLAttributes<HTMLDivElement>): JSX.Element;
export declare function CardContent(props: HTMLAttributes<HTMLDivElement>): JSX.Element;
export declare function CardFooter(props: HTMLAttributes<HTMLDivElement>): JSX.Element;
