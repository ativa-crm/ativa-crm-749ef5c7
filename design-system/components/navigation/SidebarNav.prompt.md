Casca de navegação do CRM. Desktop: `SidebarNav` fixa à esquerda (256px, fundo #000, itens em CAIXA ALTA peso 700, ativo em verde). Celular: `BottomNav` fixa embaixo, alvo de 64px, ativo só muda a cor do ícone e do rótulo.

```jsx
<SidebarNav itens={ITENS} atual="imoveis" onNavegar={ir} marca={<Marca />} />
<BottomNav itens={ITENS} atual="imoveis" onNavegar={ir} />
```

Itens reais, nesta ordem: Início, Imóveis, Clientes, Funil, Serviços, Orçamentos, Medição, Contratos (+ Administração só para `papel === "admin"`).
