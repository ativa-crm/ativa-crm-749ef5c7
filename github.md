repo: ativa-crm/ativa-crm-749ef5c7
branch: main

## Last sync
date: 2026-09-14T19:57:49Z

### Updated in this project
- Tokens de cor, tipografia, forma e movimento extraídos de `src/styles.css`.
- 23 componentes React recriados a partir de `src/components/ui/*` e das telas de rota.
- UI kit navegável do CRM com 7 telas (desktop, celular, claro e escuro).
- UI kit do site institucional a partir de FABIOHGG28/ativa-consultoria.

## Screen map
| Tela do projeto | Arquivos de origem |
| --- | --- |
| `ui_kits/crm/AppShell.jsx` | `src/components/app-shell.tsx` |
| `ui_kits/crm/TelaEntrar.jsx` | `src/routes/entrar.tsx` |
| `ui_kits/crm/TelaInicio.jsx` | `src/routes/_app/inicio.tsx`, `src/lib/prazo.ts` |
| `ui_kits/crm/TelaImoveis.jsx` | `src/routes/_app/imoveis.index.tsx`, `src/lib/formato.ts` |
| `ui_kits/crm/TelaClientes.jsx` | `src/routes/_app/clientes.index.tsx` |
| `ui_kits/crm/TelaFunil.jsx` | `src/routes/_app/funil.tsx`, `src/lib/funil.ts` |
| `ui_kits/crm/TelaServicos.jsx` | `src/routes/_app/servicos.index.tsx`, `src/lib/prazo.ts` |
| `ui_kits/crm/TelaOrcamentos.jsx` | `src/routes/_app/orcamentos.index.tsx` |
| `components/core/*`, `components/forms/*` | `src/components/ui/{button,badge,card,input,label,select,dialog,tabs}.tsx` |
| `tokens/*.css` | `src/styles.css` |
| `ui_kits/site/*` | FABIOHGG28/ativa-consultoria `index.html` (branch main) |
