Semáforo de prazo — a regra vem de `src/lib/prazo.ts` e não deve ser reinventada.

```jsx
<DeadlineBadge dias={2} />   {/* vermelho: faltam 2 d */}
<DeadlineBadge dias={-4} />  {/* vermelho: vencido há 4 d */}
```
