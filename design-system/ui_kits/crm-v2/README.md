# UI kit — Ativa CRM v2 (redesenho)

Redesenho completo do frontend do CRM, dentro do design system da Ativa. Abra `index.html`.
Os controles no canto alternam **Desktop / Celular** e **claro / escuro**; a barra superior
troca o **perfil** (Dono, Administrativo, Eng. responsável), o que muda os itens do menu.

## Decisões de direção

**Duas estéticas no mesmo protótipo.** O botão JARVIS no canto alterna a camada visual:

- **Sóbrio** — o design system puro: tema escuro grafite, barra lateral preta retrátil, verde
  #9ab137 só como energia (números, progresso, item ativo), densidade alta e movimento de
  180–200 ms.
- **JARVIS** (`jarvis.css`, padrão ligado) — a mesma estrutura com camada de HUD: grade técnica
  ao fundo, painéis em vidro fosco com borda luminosa e cantos em esquadro, varredura lenta no
  cabeçalho dos painéis, linha de radar descendo pelo palco, chanfro nos cartões de indicador,
  números com halo e numeral tabular, trilho verde no item ativo do menu.

A camada JARVIS **não inventa cor nenhuma**: o brilho usa `--verde-vivo` (#69d500), que já é o
verde do site institucional da Ativa. Ela é só CSS, aplicada por uma classe no palco — desligar
devolve o produto ao design system puro, sem tocar em componente. Respeita
`prefers-reduced-motion`: com movimento reduzido, a varredura e o radar somem.

**Menu retrátil de verdade.** 248px expandido, 76px recolhido (só ícones, com `title`), estado
salvo em `localStorage` na chave `ativa-crm-v2-lateral`. No celular vira gaveta sobre overlay,
mais a barra inferior com os 5 primeiros itens.

**Gamificação de time, nunca ranking individual.** Duas mecânicas, ambas escolhidas por você:
meta mensal de faturamento (anel + barra + histórico de 6 meses) e pontos por lead respondido
em menos de 24 h, com sequência de dias. Aparecem no painel e na barra superior; ligáveis em
Administração → Empresa.

## Telas

| Arquivo | Tela | Destaque |
| --- | --- | --- |
| `TelaInicioV2.jsx` | Início | 4 alertas acionáveis, meta, pontos, execução, equipe em campo, urgentes, conversão |
| `TelaImoveisV2.jsx` | Imóveis | Busca, tipo, cidade, tabela densa, hectares somados do filtro |
| `TelaClientesV2.jsx` | Clientes | Carteira com valor em aberto e último contato |
| `TelaFunilV2.jsx` | Funil | Kanban de 6 estágios, filtro por nota, mover com toast |
| `TelaServicosV2.jsx` | Serviços | Lista ou agrupado por etapa, progresso de checklist, diálogo Nova OS |
| `TelaOrcamentosV2.jsx` | Orçamentos | Dias de espera do cliente, soma do filtro |
| `TelaMedicao.jsx` | Medição | Roteiro do dia ordenado, km, janelas, importação de campo |
| `TelaContratos.jsx` | Contratos | Vigência, vencimento, alerta de contrato sem assinatura |
| `TelaAdministracao.jsx` | Administração | Usuários, catálogo de serviços, dados da empresa e metas |

`Shell.jsx` é a casca; `widgets.jsx` traz os blocos novos do painel (CartaoIndicador, AnelMeta,
Barras, BarrasFunil, Painel, Tabela, BarraFerramentas); `dados.js` guarda os dados fictícios,
coerentes entre telas — o mesmo cliente aparece no funil, na OS, no orçamento e no contrato.

## Limites honestos

- O **mapa da Medição** é um painel com aviso explícito. Em produção é `mapa-roteiro.tsx` com
  Leaflet e KML; não inventei um desenho que o produto não tem.
- Os widgets do painel usam CSS (`conic-gradient`, barras em flex) em vez de Recharts, para não
  arrastar dependência nova só para a demonstração.
- Nada aqui é lógica de produção: filtros e movimentações funcionam em memória.
