# UI kit — Ativa CRM

Recriação navegável do CRM de topografia e georreferenciamento da Ativa
(`ativa-crm/ativa-crm-749ef5c7`, TanStack Start + shadcn/ui + Tailwind v4).

Abra `index.html`. Os controles no canto inferior direito alternam **Desktop / Celular**,
**tema claro / escuro** e a **tela de login** — as três dimensões que o produto realmente tem.

## Telas

| Arquivo | Rota original | O que mostra |
| --- | --- | --- |
| `TelaEntrar.jsx` | `/entrar` | Login em duas colunas, logo sobre preto |
| `TelaInicio.jsx` | `/inicio` | "Precisam de você agora", "Em andamento", "Este mês" |
| `TelaImoveis.jsx` | `/imoveis` | Busca, filtro segmentado, seletor de cidade, lista |
| `TelaClientes.jsx` | `/clientes` | Lista PF/PJ com documento e telefone mascarados |
| `TelaFunil.jsx` | `/funil` | Kanban de 6 estágios com "mover para" e toast |
| `TelaServicos.jsx` | `/servicos` | OS agrupadas por status, semáforo de prazo, diálogo "Nova OS" |
| `TelaOrcamentos.jsx` | `/orcamentos` | Lista com valores em R$ e status |
| `TelaEmBranco.jsx` | `/medicao`, `/contratos`, `/administracao` | Aviso honesto: rotas não recriadas |

`dados.js` guarda todos os dados fictícios; `AppShell.jsx` é a casca (barra lateral no desktop,
cabeçalho + barra inferior no celular).

## Fidelidade

Desvio proposital: a placa branca do logotipo na barra lateral é fixa em #ffffff. O original usa
`bg-card`, que no tema escuro deixa o logotipo ilegível.


Todos os valores vêm do código-fonte, não de captura de tela: raio 14px dos cartões, botões
`!rounded-full` em caixa alta, alvos de 44/56px, semáforo de `src/lib/prazo.ts`, rótulos de
`src/lib/formato.ts` e `src/lib/funil.ts`.

Não recriado: mapa Leaflet (`mapa-roteiro.tsx`), importação de KML, tela de medição, gráficos
Recharts e a área de administração.
