# Contrato Visual

Este arquivo é a fonte da verdade visual do projeto e deve ser lido antes de criar ou alterar uma interface.

## Regras

- Os tokens vivem em `design-system/tokens/` e são consumidos por CSS variables; não adicione cor, fonte, espaçamento ou raio hardcoded em componentes.
- Componentes novos devem ser adicionados à biblioteca em `design-system/components/`, classificados por domínio, e registrados em `design-system/catalog.ts`.
- O CRM usa Poppins, verde oliva `--verde-ativa` e os tokens semânticos de `design-system/tokens/colors.css`; o site usa Inter e `--site-accent`.
- Estados de interação devem preservar foco visível, desabilitado, carregamento, erro, vazio e selecionado quando fizerem sentido.
- A referência interativa está em `/design-system`. HTMLs de referência ficam em `design-system/referencia/`.

## Mapa da biblioteca

- `design-system/tokens/`: cores, fontes, tipografia, espaçamento, raios, sombras, movimento e base.
- `design-system/components/core/`: Button, Badge, Card, Avatar, Separator, Skeleton e Icon.
- `design-system/components/forms/`: Input, Label, Textarea, NativeSelect, Checkbox, Switch e RadioGroup.
- `design-system/components/navigation/`: SidebarNav, BottomNav, Tabs e SegmentedControl.
- `design-system/components/feedback/`: Alert, Toast e Progress.
- `design-system/components/overlays/`: Dialog, DropdownMenu e Tooltip.
- `design-system/components/patterns/`: padrões reutilizáveis do CRM.
- `design-system/components/site/`: componentes do site institucional.
- `design-system/guidelines/`: fichas de fundamentos visuais em HTML-fonte.
- `design-system/assets/`: marca, imagens e ícones.
- `design-system/ui_kits/`: telas completas de referência do CRM e do site.
- `design-system/referencia/`: HTMLs que podem ser abertos diretamente no navegador.
- `design-system/`: índice, catálogo e showcase integrados ao projeto.

## Processo

1. Leia os tokens e a guideline relevante.
2. Reutilize um componente existente antes de criar outro.
3. Implemente todos os estados aplicáveis e registre a API no catálogo.
4. Verifique `/design-system`, `bun x tsc --noEmit`, `bun run lint` e `bun run build`.

## Lint de aderência

Nenhum `.adherence.oxlintrc.json` existe no material reorganizado ou no projeto. Não há regra adicional de aderência para integrar ao ESLint.