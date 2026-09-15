Filtro compacto. É a classe `.seg`/`.seg-item` que já existe no `styles.css` do CRM — use para "Todos / Rural / Urbano".

```jsx
<SegmentedControl valor={tipo} onChange={setTipo} itens={[{valor:"todos",rotulo:"Todos"},{valor:"rural",rotulo:"Rural"},{valor:"urbano",rotulo:"Urbano"}]} />
```
