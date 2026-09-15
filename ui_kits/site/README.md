# UI kit — site institucional Ativa Consultoria

Recriação da página única de `FABIOHGG28/ativa-consultoria` (`index.html`, HTML/CSS puro).
Abra `index.html`; o controle no canto alterna **Desktop / Celular**.

| Arquivo | Seção original |
| --- | --- |
| `Cabecalho.jsx` | `<header>` fixo de 78px com blur de 13px |
| `Hero.jsx` | `#inicio` — 550px, foto `campo-02.webp` com gradiente lateral |
| `Servicos.jsx` | `#servicos` — grade de 5 cartões com glifos Unicode |
| `Sobre.jsx` | `#sobre` — foto + texto + três pontos |
| `Equipamentos.jsx` | `#equipamentos` — características, drone e ortomosaico |
| `Portfolio.jsx` | `#portfolio` — título de 48px com régua verde |
| `Rodape.jsx` | `#contato` (faixa com foto) e `<footer>` de 4 colunas |

## Diferenças conhecidas

- O vídeo `assets/video-ativa.mp4` e a moldura de iPhone do portfólio não foram importados;
  no lugar há uma foto com aviso explícito.
- O site original acumula várias camadas de override (V8 a V13). Os valores usados aqui são os
  **finais** — kicker 14px, título de seção 36px, título do portfólio 48px, cartão de serviço 148px.
- A animação de entrada por scroll (IntersectionObserver, 700ms) não foi replicada.
