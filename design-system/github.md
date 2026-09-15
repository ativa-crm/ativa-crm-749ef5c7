repo: ativa-crm/ativa-crm-749ef5c7
branch: main

## Last sync
date: 2026-09-14T19:57:49Z

### Updated in this project
- Tokens de cor, tipografia, forma e movimento organizados em `design-system/tokens/`.
- 23 componentes React recriados a partir de `src/components/ui/*` e das telas de rota, catalogados em `design-system/components/`.
- UI kit navegável do CRM com 7 telas (desktop, celular, claro e escuro).
- UI kit do site institucional a partir de FABIOHGG28/ativa-consultoria.

## Screen map
| Tela do projeto | Arquivos de origem |
| --- | --- |
| `design-system/ui_kits/crm/AppShell.jsx` | `src/components/app-shell.tsx` |
| `design-system/ui_kits/crm/TelaEntrar.jsx` | `src/routes/entrar.tsx` |
| `design-system/ui_kits/crm/TelaInicio.jsx` | `src/routes/_app/inicio.tsx`, `src/lib/prazo.ts` |
| `design-system/ui_kits/crm/TelaImoveis.jsx` | `src/routes/_app/imoveis.index.tsx`, `src/lib/formato.ts` |
| `design-system/ui_kits/crm/TelaClientes.jsx` | `src/routes/_app/clientes.index.tsx` |
| `design-system/ui_kits/crm/TelaFunil.jsx` | `src/routes/_app/funil.tsx`, `src/lib/funil.ts` |
| `design-system/ui_kits/crm/TelaServicos.jsx` | `src/routes/_app/servicos.index.tsx`, `src/lib/prazo.ts` |
| `design-system/ui_kits/crm/TelaOrcamentos.jsx` | `src/routes/_app/orcamentos.index.tsx` |
| `design-system/components/core/*`, `design-system/components/forms/*` | `src/components/ui/{button,badge,card,input,label,select,dialog,tabs}.tsx` |
| `design-system/tokens/*.css` | `src/styles.css` |
| `design-system/ui_kits/site/*` | FABIOHGG28/ativa-consultoria `index.html` (branch main) |
