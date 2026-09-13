# Administração e geração de contratos

## Implementação
- Adicionar a rota Administração dentro da área autenticada, com bloqueio por `usuarios.papel = admin` e redirecionamento para Início para os demais usuários.
- Exibir o item Administração no menu somente para administradores.
- Criar três abas: Empresas, Usuários da própria empresa e Modelos de documento, com listas e fichas editáveis nos campos solicitados.
- Restringir alterações de papel à tela administrativa e manter todas as leituras/escritas sob a sessão atual e as políticas existentes do banco.
- Localizar ou criar a ficha de Contratos conforme a estrutura já disponível, incluindo o botão que apenas grava `documento_solicitado_em`, acompanha `pdf_url` e oferece o download quando pronto.
- Não criar nem alterar tabelas, colunas, funções ou políticas.

## Detalhes técnicos
- Usar os componentes e tokens existentes, React Query para atualização das telas e o cliente autenticado atual.
- A proteção visual e de rota será baseada no perfil carregado; a autorização definitiva das gravações continua sendo aplicada pelas políticas do banco.
- A espera do PDF fará consultas periódicas por até 40 segundos, sem chamadas externas pelo navegador.
- Validar tipagem, lint e os fluxos acessíveis no preview.

## Premissa
- As tabelas e colunas mencionadas já existem no banco. Se a ficha de Contratos não existir no código, será criada seguindo a rota e os padrões atuais.
