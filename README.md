# ativa-crm 

Estou construindo um CRM para empresas brasileiras de topografia e

georreferenciamento. O banco de dados Supabase JÁ EXISTE, com tabelas,

funções e políticas de RLS criadas. NÃO crie, altere nem apague nenhuma

tabela, coluna, função ou política. Se achar que falta algo, me pergunte

antes.

REGRAS QUE VALEM PARA TODO O PROJETO

- Interface inteira em português do Brasil. Datas em dd/mm/aaaa. Números

  com vírgula decimal. Valores em R$.

- É um produto multi-empresa. Toda consulta filtra pela empresa do usuário

  logado, e o RLS do banco já garante isso — nunca desative RLS, nunca use

  a chave service_role no front-end, use sempre a chave publicável.

- Nenhuma rota acessível sem login. Sem cadastro público de usuários.

- Prioridade de uso é o celular: o usuário típico é um técnico em campo,

  em pé, com uma mão só, sob sol forte. Alto contraste, tipografia grande,

  alvos de toque generosos.

- Cor de marca verde #73d52d sobre fundo claro.

- O nome exibido no topo do app e nos documentos NÃO fica escrito no

  código: vem sempre de `empresas.nome` e `empresas.logo_url` da empresa

  do usuário logado. Para o Renato vai aparecer "Ativa Consultoria"

  porque é o que está na linha dele no banco.

- Nunca invente campos que não existem no banco.

PROJETO SUPABASE

URL: https://rgxznheljwzswihtkyau.supabase.co

Este projeto é exclusivo deste CRM e já tem o schema criado. Use a chave

publicável (sb_publishable_...), nunca a service_role.

TABELAS DISPONÍVEIS (leia o schema pelo conector do Supabase)

empresas, usuarios, clientes, imoveis, oportunidades, mensagens,

orcamentos, orcamento_itens, contratos, ordens_servico, os_etapas,

documentos, modelos_documento, eventos, contadores.

CONCEITO CENTRAL, NÃO INVERTA

O imóvel é o centro do sistema, não o cliente. Um cliente tem vários

imóveis. Um imóvel passa por vários serviços ao longo dos anos. A tela do

imóvel deve mostrar o histórico completo dele: oportunidades, orçamentos,

ordens de serviço e documentos.

NESTA PRIMEIRA ETAPA, construa apenas:

1. Login por e-mail e senha (Supabase Auth), sem opção de cadastro.

2. Carregamento do perfil: após o login, buscar a linha em `usuarios`

   correspondente ao auth.uid() e manter empresa_id e papel em contexto

   global.

3. Layout base: barra lateral no desktop, barra inferior no celular, com

   os itens Início, Imóveis, Clientes, Funil, Serviços, Orçamentos.

   As telas ainda podem ser vazias.

4. Tela de erro amigável para usuário autenticado sem linha em `usuarios`

   ("Seu acesso ainda não foi liberado. Fale com o administrador.").

Não construa mais nada agora. Me mostre o resultado.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9f919530-9059-457b-bb7d-a947fad33c61).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
