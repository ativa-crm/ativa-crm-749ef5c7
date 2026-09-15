Diálogo modal com overlay preto 80%. No celular o botão de confirmação ocupa a largura toda com 56px de altura.

```jsx
<Dialog aberto={aberta} titulo="Nova ordem de serviço" onFechar={fechar}
  rodape={<Button fullWidth style={{height:56}}>Criar OS</Button>}>
  …campos…
</Dialog>
```

O overlay usa `position:absolute` para funcionar dentro de mocks; em produção é `fixed`.
