/** Filtro compacto `.seg` definido no styles.css do CRM. Altura 32px, quebra linha no celular. */
export interface SegItem { valor: string; rotulo: string }
export interface SegmentedControlProps {
  itens: SegItem[];
  valor?: string;
  onChange?: (valor: string) => void;
  style?: React.CSSProperties;
}
export declare function SegmentedControl(props: SegmentedControlProps): JSX.Element;
