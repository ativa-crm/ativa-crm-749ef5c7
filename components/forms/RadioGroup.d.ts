/** Grupo de opções exclusivas (tipo de cliente, motivo de perda). */
export interface RadioOpcao { valor: string; rotulo: string }
export interface RadioGroupProps {
  opcoes: RadioOpcao[];
  valor?: string;
  onChange?: (valor: string) => void;
  name?: string;
  style?: React.CSSProperties;
}
export declare function RadioGroup(props: RadioGroupProps): JSX.Element;
