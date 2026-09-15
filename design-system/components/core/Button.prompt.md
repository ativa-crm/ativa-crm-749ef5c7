Botão em pílula, sempre em CAIXA ALTA e peso 700 — é a assinatura mais reconhecível da interface do CRM.

```jsx
<Button onClick={salvar}>Novo imóvel</Button>
<Button variant="outline" size="sm">Filtrar</Button>
<Button fullWidth style={{ height: 56, fontSize: "var(--texto-lg)" }}>Entrar</Button>
```

- `variant`: default (verde #9ab137 → hover #7e9530), outline, secondary (#0d181c), ghost, link, destructive.
- Em telas de campo o código sobrescreve a altura para 44px (h-11) ou 56px (h-14) — alvo de toque grande é regra do produto.
- O raio é sempre 999px: no código original o utilitário é `!rounded-full`, não negociável.
