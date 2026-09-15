import type { HTMLAttributes } from "react";

/** Semáforo de prazo da ordem de serviço. */
export interface DeadlineBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Dias inteiros até o prazo. Negativo = vencido. null = sem prazo. */
  dias: number | null;
}
export declare function DeadlineBadge(props: DeadlineBadgeProps): JSX.Element;
export declare function semaforo(dias: number | null): { nivel: string; texto: string };
