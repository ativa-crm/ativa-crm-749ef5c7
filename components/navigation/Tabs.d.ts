/**
 * Abas em pílula, caixa alta, 13px.
 * @startingPoint section="Navegação" subtitle="Abas e filtros em pílula" viewport="700x160"
 */
export interface TabItem { valor: string; rotulo: string }
export interface TabsProps {
  itens: TabItem[];
  valor?: string;
  onChange?: (valor: string) => void;
  style?: React.CSSProperties;
}
export declare function Tabs(props: TabsProps): JSX.Element;
