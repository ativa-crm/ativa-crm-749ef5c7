/** Caixa de seleção — checklist técnico das etapas de OS. */
export interface CheckboxProps {
  checked?: boolean;
  onChange?: (valor: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
