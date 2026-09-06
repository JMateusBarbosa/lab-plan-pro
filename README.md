# Lab Scheduler Pro

Quero criar a primeira versão visual de um sistema web para gerenciamento e agendamento de provas em laboratórios de informática de escolas.

Neste momento, NÃO quero implementar backend, banco de dados, autenticação real ou integração com Supabase. O objetivo desta etapa é criar apenas a estrutura inicial das telas, rotas, componentes e navegação, usando dados fictícios/mockados para conseguirmos visualizar o funcionamento do sistema antes de implementar a lógica real.

Também não quero gastar muito tempo com design avançado agora. A interface deve ser simples, limpa, organizada, responsiva e funcional, mas sem preocupação com identidade visual definitiva, animações elaboradas ou estilização excessiva.

## Contexto do sistema

O sistema terá futuramente duas áreas principais:

1. Área Administrativa Geral
2. Área do Laboratório

Nesta primeira etapa, desenvolver APENAS a Área Administrativa Geral.

O administrador geral será responsável futuramente por cadastrar e gerenciar os laboratórios/escolas que utilizarão o sistema.

Cada laboratório terá posteriormente seu próprio login e poderá acessar apenas suas próprias provas, mas essa parte será desenvolvida em outra etapa.

---

# Rotas iniciais

Criar as seguintes rotas:

* `/`
* `/admin/login`
* `/admin`
* `/admin/laboratorios`
* `/admin/laboratorios/novo`
* `/admin/laboratorios/:id`
* `/admin/laboratorios/:id/editar`

Não implementar proteção real de rotas ainda.

Os botões de login podem apenas realizar navegação simulada.

---

# 1. Tela inicial

Rota:

`/`

Criar uma tela inicial simples apresentando o sistema.

Exibir:

* Nome provisório do sistema: "Sistema de Agendamento de Provas"
* Pequena descrição explicando que o sistema será usado para gerenciar laboratórios e provas.
* Botão "Entrar como Administrador"
* Botão "Entrar como Laboratório"

Nesta etapa:

* O botão "Entrar como Administrador" deve navegar para `/admin/login`.
* O botão "Entrar como Laboratório" pode existir visualmente, mas ainda não precisa ter uma área desenvolvida. Pode apontar para uma página simples de "Em desenvolvimento" ou permanecer desabilitado.

Não criar cadastro público de usuário ou laboratório.

---

# 2. Login do Administrador

Rota:

`/admin/login`

Criar formulário simples com:

* E-mail
* Senha
* Botão "Entrar"
* Botão ou link "Voltar"

Não realizar autenticação real.

Ao clicar em "Entrar", navegar diretamente para:

`/admin`

Pode fazer validações visuais básicas de campos obrigatórios, mas sem backend.

---

# Layout da Área Administrativa

Todas as páginas dentro de `/admin` devem compartilhar um layout administrativo.

Criar:

## Menu lateral

Itens:

* Dashboard
* Laboratórios
* Sair

Dashboard deve apontar para:

`/admin`

Laboratórios deve apontar para:

`/admin/laboratorios`

O botão Sair pode simplesmente redirecionar para `/admin/login`.

## Cabeçalho

Adicionar um cabeçalho simples contendo:

* Nome do sistema
* Identificação do usuário: "Administrador"
* Espaço reservado futuramente para avatar/menu de usuário

O layout deve funcionar também em telas menores.

No mobile, o menu lateral pode virar um menu recolhível.

---

# 3. Dashboard Administrativo

Rota:

`/admin`

Criar uma página de dashboard simples.

Exibir cards com dados fictícios:

* Total de laboratórios
* Laboratórios ativos
* Laboratórios inativos
* Total de provas agendadas

Exemplo:

* Total de laboratórios: 5
* Ativos: 4
* Inativos: 1
* Provas agendadas: 126

Adicionar um botão:

"Cadastrar novo laboratório"

Esse botão deve levar para:

`/admin/laboratorios/novo`

Também criar uma seção chamada:

"Laboratórios recentes"

Mostrar uma tabela ou lista com alguns laboratórios fictícios.

Exemplo:

* Laboratório Indústria do Saber - Maués
* Laboratório Unidade Centro
* Laboratório Unidade Norte

Mostrar:

* Nome
* Unidade
* Responsável
* Status
* Ações

Ações:

* Visualizar
* Editar

Não implementar dados reais.

---

# 4. Lista de Laboratórios

Rota:

`/admin/laboratorios`

Esta será a página principal do CRUD de laboratórios.

Criar título:

"Laboratórios"

Adicionar botão:

"Novo laboratório"

Navegando para:

`/admin/laboratorios/novo`

Adicionar campo de busca para pesquisar futuramente por:

* Nome
* Unidade
* Responsável
* E-mail

Adicionar também filtro de status:

* Todos
* Ativos
* Inativos

Os filtros podem funcionar apenas sobre os dados mockados.

Criar tabela no desktop contendo:

* Nome do laboratório
* Unidade/Escola
* Responsável
* E-mail
* Cidade
* Estado
* Status
* Data de cadastro
* Ações

No mobile, evitar tabela horizontal muito larga.

Transformar cada laboratório em um card contendo as mesmas informações principais.

Ações disponíveis:

* Visualizar
* Editar
* Ativar/Desativar
* Excluir

Neste momento essas ações não precisam alterar banco.

Pode simular alterações apenas localmente.

Ao clicar em "Visualizar":

navegar para:

`/admin/laboratorios/:id`

Ao clicar em "Editar":

navegar para:

`/admin/laboratorios/:id/editar`

Para excluir, mostrar modal simples de confirmação:

"Tem certeza que deseja excluir este laboratório?"

---

# 5. Cadastro de Laboratório

Rota:

`/admin/laboratorios/novo`

Criar formulário dividido visualmente em seções.

## Informações do laboratório

Campos:

* Nome do laboratório *
* Nome da unidade/escola *
* Responsável
* Telefone
* Cidade
* Estado

## Dados de acesso

Campos:

* E-mail/login *
* Senha provisória *
* Confirmar senha *

IMPORTANTE:

Esses campos são apenas visuais nesta etapa.

Não implementar Supabase Auth ou qualquer autenticação real.

## Status

Campo:

* Ativo
* Inativo

Deixar "Ativo" como padrão.

## Botões

* Cancelar
* Cadastrar laboratório

Cancelar deve retornar para:

`/admin/laboratorios`

Cadastrar pode apenas simular sucesso e retornar para a listagem.

Exibir uma mensagem visual do tipo:

"Laboratório cadastrado com sucesso."

Não salvar permanentemente.

---

# 6. Detalhes do Laboratório

Rota:

`/admin/laboratorios/:id`

Criar uma página apresentando as informações completas de um laboratório fictício.

Exibir:

## Informações gerais

* Nome do laboratório
* Unidade/escola
* Responsável
* Telefone
* Cidade
* Estado
* Status
* Data de cadastro

## Informações de acesso

Mostrar:

* E-mail/login

NÃO mostrar senha.

## Resumo

Adicionar cards com dados fictícios:

* Provas agendadas
* Provas realizadas
* Provas pendentes
* Provas hoje

Exemplo:

* Agendadas: 32
* Realizadas: 25
* Pendentes: 7
* Hoje: 3

Adicionar botões:

* Editar laboratório
* Ativar/Desativar
* Voltar

Editar deve navegar para:

`/admin/laboratorios/:id/editar`

---

# 7. Editar Laboratório

Rota:

`/admin/laboratorios/:id/editar`

Reutilizar o formulário de cadastro.

Preencher os campos com dados fictícios.

Permitir alterar:

* Nome do laboratório
* Unidade
* Responsável
* Telefone
* Cidade
* Estado
* E-mail/login
* Status

Não mostrar senha atual.

Adicionar futuramente espaço para uma funcionalidade de redefinição de senha, mas nesta etapa apenas deixar um botão visual:

"Redefinir senha"

Ele não precisa funcionar.

Botões:

* Cancelar
* Salvar alterações

Ao salvar:

simular sucesso e retornar para a página de detalhes.

---

# Dados mockados

Criar alguns laboratórios fictícios para conseguirmos testar a interface.

Exemplo:

1.

Nome:
Laboratório de Informática 01

Unidade:
Indústria do Saber - Maués

Responsável:
Maria Silva

E-mail:
[lab.maues@exemplo.com](mailto:lab.maues@exemplo.com)

Telefone:
(92) 99999-0001

Cidade:
Maués

Estado:
AM

Status:
Ativo

---

2.

Nome:
Laboratório de Informática 02

Unidade:
Unidade Centro

Responsável:
Carlos Oliveira

E-mail:
[lab.centro@exemplo.com](mailto:lab.centro@exemplo.com)

Telefone:
(92) 99999-0002

Cidade:
Manaus

Estado:
AM

Status:
Ativo

---

3.

Nome:
Laboratório de Informática 03

Unidade:
Unidade Norte

Responsável:
Ana Souza

E-mail:
[lab.norte@exemplo.com](mailto:lab.norte@exemplo.com)

Telefone:
(92) 99999-0003

Cidade:
Manaus

Estado:
AM

Status:
Inativo

---

# Componentização

Evitar repetir código.

Criar componentes reutilizáveis sempre que fizer sentido.

Exemplos:

* AdminLayout
* Sidebar
* Header
* StatusBadge
* LaboratoryForm
* LaboratoryCard
* ConfirmationDialog
* DashboardCard

O formulário de cadastro e edição deve preferencialmente utilizar o mesmo componente.

---

# Estrutura do código

Manter o projeto organizado desde o início.

Separar:

* páginas
* componentes
* layouts
* tipos/interfaces
* dados mockados

Criar uma interface/type para Laboratory.

Exemplo conceitual:

Laboratory

* id
* name
* schoolName
* responsible
* email
* phone
* city
* state
* status
* createdAt

Não criar ainda tipos relacionados ao banco Supabase.

---

# Responsividade

Apesar de ainda não estarmos trabalhando no design definitivo, todas as telas devem ser minimamente responsivas.

Desktop:

* Sidebar lateral
* Conteúdo principal
* Tabelas

Mobile:

* Menu administrativo recolhível
* Cards no lugar de tabelas muito largas
* Formulários em coluna
* Botões adaptados para telas pequenas

Evitar scroll horizontal desnecessário.

---

# Design nesta etapa

Manter visual:

* simples
* neutro
* limpo
* profissional
* fácil de alterar futuramente

Não gastar esforço com:

* animações complexas
* gradientes exagerados
* ilustrações
* identidade visual definitiva
* efeitos visuais sofisticados

Utilizar uma paleta neutra e componentes consistentes.

O objetivo desta versão é permitir avaliar:

* organização das páginas
* navegação
* campos necessários
* fluxo administrativo
* estrutura do CRUD

---

# IMPORTANTE

Não conectar com Supabase nesta etapa.

Não criar tabelas.

Não criar migrations.

Não configurar RLS.

Não criar autenticação real.

Não criar APIs.

Não implementar backend.

Não utilizar localStorage como se fosse banco definitivo.

Os dados devem ser mockados e usados apenas para permitir visualizar e testar as telas.

Primeiro queremos concluir a interface estrutural.

Depois, em uma próxima etapa, iremos analisar essas telas e projetar corretamente:

* banco PostgreSQL no Supabase
* relacionamentos
* Supabase Auth
* perfis de usuário
* permissões
* RLS
* CRUD real
* integração frontend/backend

Crie inicialmente toda a Área Administrativa descrita acima mantendo o código preparado para que futuramente possamos substituir os dados mockados pela integração com Supabase sem precisar refazer toda a interface.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f0d52ce3-1939-44f1-a566-34faf374bb32).

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
