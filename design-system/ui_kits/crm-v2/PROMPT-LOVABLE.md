# Prompt para o Lovable — redesenho do frontend do Ativa CRM

Cole o conteúdo abaixo no Lovable. Ele foi escrito para ser aplicado em **uma passada por tela**,
na ordem em que está: primeiro a casca, depois cada tela. Se o Lovable travar em prompt longo,
mande a seção "Regras gerais" primeiro e depois uma seção de tela por vez, sempre repetindo a
linha "Siga as Regras gerais que já enviei".

O design system está no próprio repositório, em `design-system/`, e o contrato de tokens em
`DESIGN.md`. O protótipo navegável de referência é `design-system/ui_kits/crm-v2/index.html`.

---

## Regras gerais (envie primeiro)

Vou redesenhar o frontend do CRM. **Não mexa em nenhuma lógica de backend, integração com
WhatsApp, classificação de leads, queries ou rotas de API.** Só camada visual e navegação.

O design system já está no repositório:

- Tokens CSS: `src/styles.css` (já existente) e `design-system/tokens/*.css`. Contrato em `DESIGN.md`.
- Componentes de referência: `design-system/components/**`
- Telas de referência: `design-system/ui_kits/crm-v2/**`
- Ícones: **Lucide** (`lucide-react`), já instalado. Nenhuma outra família de ícones.
- Fonte: **Poppins** (já carregada). Nenhuma outra fonte.

**Proibido:** qualquer cor, tamanho de fonte, espaçamento ou raio escrito à mão no JSX. Tudo sai
das classes Tailwind mapeadas aos tokens (`bg-card`, `text-foreground", `border-border`,
`bg-primary`, `rounded-lg`, etc.) ou de `var(--token)`. Se faltar um token, me avise em vez de
inventar um valor.

### Identidade visual, em uma frase
Escuro, denso e técnico, com uma camada de HUD discreta por cima — painel de instrumentos, não
videogame.

### Camada HUD (arquivo único, `src/styles/jarvis.css`)
Copie `design-system/ui_kits/crm-v2/jarvis.css` para o projeto e aplique a classe `jarvis` no
container raiz do app. Ela é **só CSS** e não altera componente nenhum — deve ser possível
desligar a classe e voltar ao visual sóbrio. O que ela faz:

- Grade técnica de 64px ao fundo do conteúdo, com vinheta verde muito fraca no topo.
- Painéis em vidro fosco (`backdrop-filter: blur(8px)`) com borda luminosa e **cantos em
  esquadro** de 14px desenhados com `::before`/`::after`.
- Varredura lenta (5,5s) atravessando o cabeçalho de cada painel.
- Linha de radar de 2px descendo pelo palco a cada 7s.
- Cartões de indicador com canto chanfrado (`clip-path`), numeral tabular e halo no número.
- Item ativo do menu com trilho verde de 3px à esquerda e halo; marque o botão ativo com
  `data-ativo="1"` para o seletor funcionar.
- Títulos de painel e de tela em verde-vivo com `letter-spacing` aberto e brilho suave.

**Restrições da camada:** nenhuma cor nova — o brilho usa `--verde-vivo` (#69d500), que já é o
verde do site institucional. Sem ciano, sem roxo, sem gradiente arco-íris. Tudo desaparece sob
`@media (prefers-reduced-motion: reduce)`. O texto **nunca** perde contraste por causa do
efeito: brilho vai em título e número, nunca em texto corrido.

### Regras duras
1. **Tema:** escuro é o padrão; o usuário alterna e a escolha persiste em `localStorage`. A classe
   `.dark` no `<html>` é o que troca o tema (já existe).
2. **Verde #9ab137 é energia, não decoração.** Use em: item ativo do menu, números de destaque,
   barras de progresso, botão primário. Nunca em fundo de tela, nunca em texto corrido.
3. **Botão é sempre pílula em CAIXA ALTA, peso 700.** `rounded-full`, sem exceção.
4. **Cartão:** `rounded-[14px] border border-border bg-card` com sombra `0 1px 3px rgba(0,0,0,.04)`.
   A hierarquia vem da borda, não da sombra. Borda de 2px só quando o elemento pede atenção.
5. **Alvos de toque:** 44px mínimo em qualquer coisa clicável; 56px em campo de formulário e CTA.
6. **Transições de 180 a 200ms, `ease`.** Hover levanta 1px. Nada de bounce, mola ou parallax.
7. **Texto em português do Brasil.** Nenhuma palavra em inglês na interface — nem "dashboard",
   nem "lead" visível (use "oportunidade" ou o nome do cliente). Sem emoji.
8. **Números no padrão brasileiro:** área `142,5000 ha`, dinheiro `R$ 28.400,00`, data `15/09/2026`,
   prazo relativo em minúsculas (`faltam 5 d`, `vencido há 4 d`, `vence hoje`).
9. **CAIXA ALTA é estrutural:** botões, itens de menu, títulos de seção e filtros. Nunca no `h1`
   da tela, em nome de pessoa ou em texto corrido.

### Casca do app (faça isto primeiro)
- **Barra lateral preta retrátil.** 248px expandida, 76px recolhida (só ícones, com `title` no
  hover). O estado persiste em `localStorage`. Botão "Recolher" fixo no pé da barra.
- Item ativo: **fundo verde sólido**, texto branco. Hover: fundo `--sidebar-accent` (#0d181c).
- Topo da barra: logo dentro de uma **caixa branca de 44px, raio 8px** (o logotipo é arte escura;
  sobre fundo escuro ele desaparece — a caixa branca é obrigatória nos dois temas).
- **Barra superior** com: título da tela em caixa alta, busca global em pílula (300px),
  contador de pontos, seletor de perfil, botão de tema, avatar.
- **Celular (até 768px):** a lateral vira gaveta sobre overlay preto 60%, e aparece uma barra
  inferior fixa com os 5 primeiros itens do menu, alvo de 64px. Nenhum recurso desaparece no
  celular — as tabelas ganham rolagem horizontal, nunca esconda coluna sem aviso.
- **Menu por perfil:** Dono vê tudo; Administrativo não vê Medição; Eng. responsável não vê
  Clientes, Funil, Orçamentos, Contratos nem Administração.

### Blocos novos a criar (em `src/components/painel/`)
- `CartaoIndicador`: ícone em quadrado de 30px com fundo tonal, número em 30px/800, rótulo em
  caixa alta, linha de apoio em cinza. Recebe tom `neutro | atencao | critico` e é clicável —
  cada indicador leva para a tela que resolve o problema.
- `AnelMeta`: anel de progresso em `conic-gradient` (sem biblioteca de gráfico).
- `Barras`: histórico mensal em barras verticais; a última barra é a cheia.
- `BarrasFunil`: uma barra horizontal por estágio, largura proporcional.
- `Painel`: cartão com cabeçalho (título em caixa alta + ícone verde + ação à direita).
- `Tabela`: tabela densa, cabeçalho em caixa alta 12px cinza, linhas de 44px com hover
  `--accent`, borda superior de 1px, rolagem horizontal no celular.
- `BarraFerramentas`: busca em pílula de 44px + filtros + botão primário, com `flex-wrap`.

---

## Tela por tela

### 1. Início
Quatro `CartaoIndicador` no topo, todos clicáveis, nesta ordem: **Leads sem resposta** (crítico →
Funil), **OS vencendo ou vencida** (crítico → Serviços), **Orçamentos em decisão** (atenção →
Orçamentos, com o valor em jogo na linha de apoio), **Contratos a vencer** (atenção → Contratos).

Depois, duas colunas (1,15fr / 1fr):
- **Faturamento do mês:** `AnelMeta` com o percentual, valor realizado em 24px/800, "de R$ X ·
  faltam R$ Y", barra de progresso, contratos fechados e ticket médio; abaixo, `Barras` com os
  últimos 6 meses.
- **Resposta rápida** (gamificação): "N de M leads da semana respondidos em menos de 24 h", barra
  de progresso, pontos ganhos na semana e no total, e a sequência de dias como badge.
- **Em execução:** área total em ha, OS ativas, imóveis; embaixo, "Equipe em campo hoje" com o
  destino e o estado de cada equipe.

Por fim, duas colunas: **Precisam de você agora** (lista com borda vermelha de 2px, semáforo de
prazo à direita) e **Conversão do funil** (`BarrasFunil` + uma frase em português explicando a
taxa: "De 18 leads novos, 3 fecharam — 17% de conversão no mês").

### 2. Imóveis
`BarraFerramentas` com busca (nome, município, matrícula, cliente), filtro segmentado
Todos/Rural/Urbano e seletor de cidade. Três indicadores: imóveis no filtro, **hectares somados
do filtro atual**, com serviço ativo. Tabela: Imóvel, Município·UF, Tipo, Área (ha, alinhada à
direita), Matrícula, Cliente, Situação (badge com pontinho). Ação de topo: "Novo imóvel"; ação do
painel: "Exportar KML".

### 3. Clientes
Busca por nome, documento ou telefone; segmentado Todos/Física/Jurídica. Tabela com avatar +
nome (+ nome fantasia embaixo, quando houver), CPF/CNPJ, telefone, nº de imóveis, **valor em
aberto**, último contato e tipo.

### 4. Funil
Kanban de 6 colunas de 280px com rolagem horizontal: Novo, Qualificando, Quente, Orçamento,
Negociação, Fechado. Cada coluna tem contador em pílula verde. O cartão mostra pontinho da **nota
do lead** (quente vermelho, morno âmbar, frio cinza — é a nota, não o estágio), nome do cliente
em 18px/800, cidade · área, chip do serviço e tempo desde a última interação. Botão "mover para"
de 40px abre menu com os outros estágios; ao mover, toast verde **no topo-centro**. Filtro
segmentado por nota acima do quadro.

### 5. Serviços
Duas vistas alternadas por segmentado: **Lista** (tabela com OS, cliente, imóvel, serviço, etapa,
progresso do checklist como barra + "4/8", responsável e prazo com semáforo + data) e **Por
etapa** (um painel por status, com linhas de lista). Quatro indicadores: OS no filtro, vencidas
(crítico), vencem em 7 dias (atenção), em campo.

Semáforo de prazo — regra fixa, não reinvente: **mais de 7 dias verde, de 7 a 3 dias âmbar,
menos de 3 dias ou vencido vermelho**, sem prazo cinza.

Diálogo "Nova OS": raio 26px, borda 2px, overlay preto 80%, campos de 56px (Cliente, Imóvel,
Serviço, Prazo, Responsável) e botão de largura total com 56px de altura.

### 6. Orçamentos
Busca + segmentado Todos/Rascunho/Enviado/Aprovado/Recusado. Três indicadores: aguardando
decisão (com o total em R$ em jogo), aprovados, e **dias de espera do orçamento mais antigo**
(crítico). Tabela com nº, cliente, serviço, data de envio, **tempo esperando** (badge âmbar até 7
dias, vermelho acima), valor à direita e situação. No cabeçalho do painel, a soma do filtro.

### 7. Medição
Segmentado por equipe + resumo do dia ("Roteiro de 15/09/2026 · 3 paradas · 206 km previstos").
Duas colunas: **Roteiro do dia** (cada parada com número da ordem em quadrado de 40px, imóvel,
OS · município · km · janela de horário, badge de estado e equipe) e, na direita, o **mapa
Leaflet** já existente (`mapa-roteiro.tsx`) mais um painel de **importar dados de campo**
(KML, KMZ, CSV de coordenadas, bruto do GNSS) com aviso de que o sistema valida o fechamento do
polígono antes de anexar à OS.

### 8. Contratos
Busca + três indicadores: total na carteira, vencem em 30 dias (atenção), **sem assinatura**
(crítico — o serviço não avança sem assinatura). Se houver contrato sem assinatura, mostre um
alerta âmbar acima da tabela nomeando o primeiro. Tabela: contrato, cliente, objeto, valor,
vigência, vence em (semáforo) e assinatura.

### 9. Administração
Três abas em pílula: **Usuários** (avatar, nome, e-mail, papel, situação — com "Convite
pendente" em âmbar), **Serviços** (catálogo com preço base, prazo padrão e ativo/desativado) e
**Empresa** (dados cadastrais + **metas e gamificação**: meta mensal, pontos por lead respondido
em 24 h, e dois interruptores — mostrar pontos na barra superior, avisar quando um lead passar de
12 h sem resposta).

Deixe explícito na tela de Administração que a gamificação é **de time, nunca ranking
individual**: o placar mede a resposta ao cliente, não compara pessoas.

---

## O que NÃO fazer
- Não crie tela nova além dessas nove.
- Não troque a biblioteca de ícones, a fonte ou as cores.
- Não adicione biblioteca de gráfico só para o painel — os quatro blocos de dados são CSS puro.
  O Recharts que já existe no projeto pode continuar onde já está.
- Não mexa na classificação de leads nem na integração de WhatsApp: elas alimentam o funil e o
  indicador de resposta rápida, e devem continuar exatamente como estão.
- Não esconda recurso no celular. Rolagem horizontal e gaveta, nunca amputação.
