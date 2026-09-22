import type { ComponentType, HTMLAttributes, ReactNode, SVGProps } from "react";

type Icone = ComponentType<SVGProps<SVGSVGElement>>;
export declare function CartaoIndicador(props: { icone: Icone; valor: ReactNode; rotulo: string; apoio: string; tom?: "neutro" | "atencao" | "critico"; destino: "/funil" | "/servicos" | "/orcamentos" | "/imoveis" }): JSX.Element;
export declare function AnelMeta(props: { valor: number; rotulo: string }): JSX.Element;
export declare function Barras(props: { dados: Array<{ rotulo: string; valor: number }> }): JSX.Element;
export declare function BarrasFunil(props: { dados: Array<{ rotulo: string; valor: number }> }): JSX.Element;
export declare function Painel(props: { titulo: string; icone: Icone; acao?: ReactNode; children: ReactNode; className?: string }): JSX.Element;
export declare function Tabela(props: HTMLAttributes<HTMLDivElement>): JSX.Element;
export declare function BarraFerramentas(props: { children: ReactNode }): JSX.Element;