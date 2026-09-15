# Ativa Consultoria — Design System

Sistema de design da **Ativa Consultoria**, empresa de **georreferenciamento e topografia** sediada em
**Itapeva-SP**, atendendo produtores rurais, escritórios de advocacia e empresas agropecuárias da região
(Itaberá, Buri, Taquarivaí, Ribeirão Branco, Itararé). A marca aparece em dois produtos digitais bem
diferentes entre si, e este sistema cobre os dois.

## Produtos

| Produto | O que é | Stack de origem |
| --- | --- | --- |
| **Ativa CRM** | Aplicativo interno de gestão: imóveis, clientes, funil de vendas, ordens de serviço, orçamentos, medição e contratos. Multiempresa, com papel `admin`. | TanStack Start + React 19, Tailwind v4, shadcn/ui (Radix), lucide-react, sonner, Recharts, Leaflet |
| **Site institucional** | Página única de captação: hero, serviços, sobre, equipamentos (drone e ortomosaico), portfólio e contato por WhatsApp. | HTML + CSS puro, Inter via Google Fonts, sem framework |

Os dois falam **português do Brasil**, para **o mesmo público**, mas com registros opostos:
o CRM é um instrumento de trabalho de campo; o site é uma peça de venda.

## Fontes consultadas

- `https://github.com/ativa-crm/ativa-crm-749ef5c7` — CRM. Lidos: `src/styles.css` (tokens),
  `src/components/app-shell.tsx`, `src/components/ui/*`, `src/routes/entrar.tsx`,
  `src/routes/_app/{inicio,imoveis,clientes,funil,servicos}.tsx`, `src/lib/{prazo,formato,funil}.ts`.
- `https://github.com/FABIOHGG28/ativa-consultoria` — site institucional. Lido: `index.html` inteiro
  (CSS embutido, com as camadas de override V8–V13); copiados logotipo, fotos e ícones de marca.
- `https://github.com/lucide-icons/lucide` — 40 ícones SVG da biblioteca que o CRM já usa.
- 24 capturas de tela enviadas pelo usuário (`uploads/`), usadas apenas como referência de alto nível —
  todos os valores numéricos vêm do código.

Se você tiver acesso a esses repositórios, explore-os: eles têm muito mais telas e detalhes do que
cabe aqui, e são a melhor referência para qualquer trabalho novo sobre esta marca.

---

## Fundamentos de conteúdo

**Idioma.** Português do Brasil, sempre. Nenhum termo em inglês na interface — nem "dashboard",
nem "lead" no rótulo visível (internamente o modelo se chama `lead`, mas a tela diz "oportunidade" ou
usa o nome do cliente). Os únicos estrangeirismos aceitos são nomes próprios: WhatsApp, Instagram,
DJI Phantom 4 Pro, GNSS RTK, GeoTIFF, DWG.

**Pessoa e tom.** O CRM fala **com** o usuário, na segunda pessoa, e assume a responsabilidade do
trabalho: *"Precisam de você agora"*, *"Nada urgente por aqui. Bom trabalho."* Não há "nós". O site
institucional inverte: fala em **nós** sobre a empresa e em **você** sobre o cliente — *"Atuamos em
diversos tipos de terrenos"*, *"Precisão que gera segurança e valor para o seu projeto"*.

**Direto, curto, sem enfeite.** Rótulos de uma a três palavras: "Novo imóvel", "Nova OS", "Em campo",
"Aguardando documentos", "Sem prazo". Mensagens de estado dizem o que aconteceu, não como você deve se
sentir: *"E-mail ou senha incorretos. Tente novamente."*, *"Movido para Negociação"*. Nada de
"Ops!", "Ótimo!" ou exclamações no produto — a exceção é o site, onde há uma: *"Olá! Quero falar sobre
um projeto."* no texto pré-preenchido do WhatsApp.

**Caixa alta é estrutural, não enfática.** Vão em CAIXA ALTA: botões, itens do menu lateral, títulos de
seção (`h2`), filtros e títulos de coluna do rodapé. **Nunca** vão: o `h1` da tela, nomes de pessoas,
nomes de imóveis, corpo de texto.

**Números e unidades seguem o padrão brasileiro** (`src/lib/formato.ts`): área com vírgula e quatro
casas (**142,5000 ha**), dinheiro em `R$ 28.400,00`, datas em `dd/mm/aaaa`, telefone `(15) 99828-8637`,
CPF `123.456.789-00`, CNPJ `12.345.678/0001-90`. Prazos são relativos e minúsculos: *"faltam 5 d"*,
*"vencido há 4 d"*, *"vence hoje"*, *"há 2 d"*.

**Emoji: nunca.** Nem no produto, nem no site. O site usa **glifos Unicode geométricos** como ornamento
técnico — ⌖ ◈ ⌘ ▣ ▧ ◉ ♧ ◇ ✉ — e isso é uma decisão de marca, não um substituto de ícone: dá ao site
um ar de instrumento de medição. No CRM esse papel é do Lucide.

**Vibe.** Sério, técnico, de campo. Um agrimensor de botina lendo a tela no sol, com uma mão só.
Nada de linguagem de startup, nada de gamificação, nada de "vamos lá!".

---

## Fundamentos visuais

### Cor

O verde é a marca, mas há **dois verdes**, e eles não se misturam: o CRM usa o verde-oliva
**#9ab137** (hover **#7e9530**); o site usa o verde-vivo **#69d500**. Use o verde do produto em que
estiver trabalhando. O resto da paleta é neutro puro: preto **#000** na barra lateral, areia
**#f7f8f5** no fundo das telas, branco nos cartões, **#eeeeee** nas bordas, **#999999** no texto
secundário, **#333333** no texto principal. O tema escuro troca os neutros por grafites
(**#101414 / #191d1d / #232827 / #2c3130**) e **mantém o verde igual**.

Cores de sinalização existem em dois lugares, com regra fixa: o **semáforo de prazo** da OS
(`src/lib/prazo.ts`: mais de 7 dias verde, de 7 a 3 dias âmbar **#f59e0b**, menos de 3 ou vencido
vermelho) e a **nota do lead** no funil (quente vermelho **#ef4444**, morno âmbar, frio cinza).
Fora disso, nenhuma cor decorativa.

### Tipografia

**Poppins** no produto (400–800), **Inter** no site (400–800). Nenhuma serifada, nenhuma display.
No CRM a escala é curta e os pesos são altos: corpo 14–16px em peso 500, títulos de lista 18px/700,
`h1` 24px/700, número de KPI 30px/800. `letter-spacing` fica em zero em quase tudo; só o `h1` abre
0.01em. O site é o oposto: texto minúsculo e denso (9 a 13px), títulos grandes com tracking negativo
forte (-0.035em a -0.045em) e um kicker verde de 14px com +1.6px de espacejamento.

### Espaçamento e alvos de toque

Escala de 4px, com 10px e 14px como exceções reais do código. O que manda mesmo é o **alvo de toque**:
44px é o mínimo de qualquer coisa tocável (busca, ações de topo), 56px é a altura de campo de
formulário e de CTA nas telas usadas em campo, 64px é a altura dos itens da barra inferior. Conteúdo
do app limitado a `max-w-5xl` (1024px); site limitado a 1180px com respiro de 42px.

### Forma

Raio base **14px** (`--radius: 0.875rem`), e a partir dele: 10px em itens de menu, 12px em toasts,
14px em cartões, 18px em inputs, 22px em linhas de lista, 26px em diálogos. **Botão é sempre pílula**
(999px) — no código original é `!rounded-full`, com `!important`, o que diz bastante sobre o quanto
isso importa. O site vai na direção contrária: 4 a 10px, cantos quase retos.

Bordas fazem o trabalho que sombra faria em outros sistemas: 1px `#eeeeee` no normal, **2px** quando o
elemento pede atenção (diálogo, alerta, linha de OS, campo de formulário em campo).

### Sombra

Praticamente inexistente no app: `0 1px 3px rgba(0,0,0,.04)` no cartão, um degrau acima no hover,
`0 10px 15px -3px` só em diálogo e menu suspenso. O site, ao contrário, usa sombras profundas e
brilho colorido nos botões (`0 10px 28px rgba(105,213,0,.25)`).

### Movimento

Transições de **180–200ms** com `ease` padrão no app; 280ms no site. O hover levanta o elemento
**1px** (2px no site) e, em botão primário, escurece o verde. O press não tem tratamento próprio —
o produto confia no feedback do sistema operacional. A única animação real é o spinner
`loader-circle` girando em verde, e no site uma entrada por scroll de 700ms
(`cubic-bezier(.2,.7,.2,1)`, fade + 18px de subida) disparada por IntersectionObserver.
Nada de bounce, nada de mola, nada de parallax.

### Estados

Hover no app: fundo `--accent` em elementos neutros, verde escuro no primário, e a linha de lista
troca de branco para areia. Foco: borda verde + anel de 2px com 20% de opacidade. Desativado:
opacidade 0.5 e cursor bloqueado. Item ativo do menu lateral: **fundo verde sólido**, não um
indicador lateral. Item ativo da barra inferior: só a cor do ícone e do rótulo muda.

### Transparência e desfoque

Quase ausente no app — apenas o overlay preto a 80% atrás do diálogo. No site há exatamente um uso:
o cabeçalho fixo com `rgba(5,8,6,.62)` e `backdrop-filter: blur(13px)`.

### Imagens e fundos

O app **não usa imagem nenhuma** além do logotipo: fundo chapado, sem textura, sem padrão, sem
gradiente. O site usa fotografia real da operação — campo aberto, equipamento GNSS no tripé, a equipe
trabalhando, um ortomosaico de verdade —, sempre **quente, ensolarada, verde-terra**, nunca banco de
imagens genérico. Toda foto de fundo recebe gradiente de proteção lateral escuro
(`rgba(4,8,5,.84)` → `.08`) para o texto ficar legível; nunca capsula.

### Layout

App: barra lateral preta fixa de 256px no desktop, cabeçalho preto + barra inferior fixa no celular
(a quebra é em 768px). Conteúdo centralizado, coluna única, blocos empilhados com 32px entre seções.
As grades de KPI caem de 3 para 2 colunas em telas estreitas. O funil é a única tela com rolagem
horizontal — colunas de 272px.

---

## Iconografia

**Lucide é a única família de ícones** do produto — `lucide-react` no CRM, `"iconLibrary": "lucide"`
no `components.json`. Traço 2px, cantos arredondados, 24×24 de viewBox. Tamanhos: 18–20px no menu e
nos botões, 22–24px em destaques e cabeçalhos de tela. Ícones herdam `currentColor`; ficam verdes em
cabeçalho de tela e em número de KPI, vermelhos em alerta.

Os 40 SVGs realmente usados estão em `assets/icons/` (copiados de `lucide-icons/lucide`) e também
**embutidos no componente `Icon`**, para funcionar offline. Os nomes do produto:
`house`, `map-pinned`, `users`, `funnel`, `wrench`, `file-text`, `route`, `file-pen-line`,
`shield-check`, `log-out`, `flame`, `triangle-alert`, `clock-3`, `clipboard-list`, `settings-2`,
`file-check`, `plus`, `search`, `move-right`, `chevron-right`, `loader-circle`, `sun`, `moon`.

**No site institucional não há ícone vetorial nenhum** — e isso é proposital. O papel de ícone é
cumprido por **glifos Unicode** (⌖ ◈ ⌘ ▣ ▧ ◉ ♧ ◇ ✉) renderizados em verde, no tamanho de um título.
As duas únicas imagens de ícone são os **PNGs oficiais de marca** do WhatsApp e do Instagram
(`assets/brand/`), usados em botão redondo de 43px e nos CTAs — nunca redesenhados em SVG.

**Emoji nunca é usado**, em nenhum dos dois produtos.

## Logotipo

O logotipo real da empresa está em `assets/brand/logo-ativa.png` (versão principal, fundo claro) e
`logo-ativa-footer.png` (versão para fundo escuro, usada no cabeçalho e rodapé do site). No CRM ele
aparece **dentro de uma caixa branca de 80×48px com raio 6px** sobre a barra lateral preta — nunca
solto sobre o preto. A placa é **branca fixa (#ffffff) nos dois temas**: no código original ela usa
`bg-card`, que no tema escuro vira #191d1d e faz o logotipo (arte escura sobre transparência) sumir —
este sistema corrige isso de propósito. Não existe versão monocromática ou marca reduzida nos repositórios; quando
precisar de um símbolo isolado, use o nome "ATIVA" em Poppins 800 caixa alta.

---

## Índice do projeto

| Caminho | O que é |
| --- | --- |
| `styles.css` | Entrada única de CSS — só `@import` |
| `tokens/` | `fonts`, `colors`, `typography`, `spacing`, `radius`, `shadows`, `motion`, `base` |
| `components/core/` | Button, Badge, Card, Avatar, Separator, Skeleton, Icon |
| `components/forms/` | Input, Label, Textarea, NativeSelect, Checkbox, Switch, RadioGroup |
| `components/navigation/` | SidebarNav + BottomNav, Tabs, SegmentedControl |
| `components/feedback/` | Alert, Toast, Progress |
| `components/overlays/` | Dialog, DropdownMenu, Tooltip |
| `components/patterns/` | StatTile, ListRow, KanbanCard, DeadlineBadge, StatusDot, SectionHeading |
| `components/site/` | SiteButton, ServiceCard, SpecCard + SpecGrid + Chip, SiteSectionHeading |
| `ui_kits/crm/` | App navegável do CRM (7 telas, desktop/celular, claro/escuro) |
| `ui_kits/site/` | Site institucional em página única |
| `guidelines/` | 17 fichas de fundamento (cor, tipografia, espaçamento, forma, marca) |
| `assets/brand/` | Logotipos, favicon, PNGs de WhatsApp e Instagram |
| `assets/imagens/` | Fotos de campo, drone, ortomosaico, equipe |
| `assets/icons/` | 40 SVGs Lucide |
| `SKILL.md` | Empacotamento como Agent Skill |
| `github.md` | Associação com os repositórios de origem |

### Adições intencionais

Estes componentes não existem como arquivo isolado nos repositórios, mas foram extraídos de padrões
que se repetem literalmente nas telas: **StatTile** (bloco de KPI do Início), **ListRow** (linha de
lista de imóveis/clientes/serviços/orçamentos), **KanbanCard** (cartão do funil), **DeadlineBadge**
(semáforo de `prazo.ts`), **StatusDot**, **SectionHeading**, **BottomNav** e **Icon** (embrulho do
Lucide). Nenhum deles inventa desenho novo.

### O que falta

- **Fontes:** Poppins e Inter vêm do Google Fonts por `@import`, como nos projetos de origem.
  Não há arquivo de fonte próprio da marca. Se existir um binário licenciado, envie que eu troco.
- **Telas não recriadas:** medição (com mapa Leaflet e importação de KML), contratos, administração
  e os gráficos Recharts do CRM; o vídeo do portfólio do site.
- **Sem slides:** nenhum modelo de apresentação foi fornecido, então nenhum foi criado.
