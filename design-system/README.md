# Biblioteca Ativa

Este diretório é a porta de entrada do design system integrado. As implementações canônicas vivem aqui, evitando duas versões do mesmo componente.

- `catalog.ts`: inventário tipado dos componentes e grupos.
- `/design-system`: showcase de estados e dos dois temas.
- `components/`: implementação, declarações e prompts por grupo.
- `guidelines/`: fonte das guidelines de fundamentos.
- `referencia/`: HTMLs prontos para abrir diretamente no navegador.
- `ui_kits/`: implementação dos templates completos; suas entradas HTML estão em `referencia/ui_kits/`.

Para criar um componente, adicione a implementação ao grupo apropriado em `design-system/components/`, a declaração `.d.ts` correspondente, o prompt/documentação se necessário e uma entrada no catálogo. Nunca copie valores visuais diretamente para a implementação: use os tokens CSS de `design-system/tokens/`.