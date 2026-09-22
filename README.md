# Sistema de Agendamento de Provas

Sistema web para gerenciamento de laboratórios e agendamento de provas, com áreas separadas para Administrador e Laboratório.

## Estado atual

O projeto utiliza backend real com Supabase. A Área Administrativa e a Área do Laboratório trabalham com autenticação, banco PostgreSQL, Edge Functions e Row Level Security (RLS).

### Área Administrativa

- autenticação real com Supabase Auth;
- cadastro público de administradores desativado;
- novos usuários só podem ser provisionados por fluxos server-side autorizados;
- sessão administrativa centralizada e revalidada com React Query;
- cadastro de laboratórios com criação de conta Auth e profile;
- listagem, detalhes, edição e ativação/desativação de laboratórios;
- alterações de laboratório passam por Edge Functions administrativas;
- configuração de quantidade de computadores e horários;
- dashboard com dados reais;
- React Query para cache e invalidação.

### Área do Laboratório

- login real com Supabase Auth;
- sessão validada por `profiles.role = laboratory`;
- acesso restrito ao próprio laboratório via RLS;
- bloqueio automático quando o laboratório está inativo;
- horários reais do laboratório;
- CRUD de provas real;
- exclusão lógica (soft delete) com auditoria;
- filtros de provas;
- fluxo de P1 e recuperação;
- validação de conflito de PC, horários e cadeia de recuperações no banco.

## Stack

- React 19
- TanStack Router / TanStack Start
- TanStack React Query
- TypeScript
- Tailwind CSS / Radix
- Supabase Auth
- Supabase PostgreSQL
- Supabase Edge Functions
- Vercel
- GitHub Actions
- Bun

## Banco de dados

Tabelas principais:

- `profiles`
- `laboratories`
- `laboratory_schedules`
- `exams`
- `audit_logs`
- `admin_operation_requests`

As tabelas públicas usam RLS. Usuários de laboratório só conseguem acessar dados vinculados ao próprio `laboratory_id`. Mutações administrativas sensíveis passam por Edge Functions e RPCs controladas; o navegador não recebe privilégios diretos para essas alterações.

As migrations ficam em `supabase/migrations/`, os testes de banco em `supabase/tests/` e as Edge Functions em `supabase/functions/`.

Edge Functions atuais:

- `provision-laboratory`
- `update-laboratory`
- `set-laboratory-status`
- `manage-laboratory-credentials`

## Variáveis de ambiente

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY`, secret keys ou senhas no frontend. Arquivos `.env` são ignorados pelo Git; somente `.env.example` deve ser versionado.

## Segurança de autenticação

- cadastro público de usuários não faz parte do produto;
- o trigger de `auth.users` rejeita usuários que não tenham sido provisionados por um fluxo administrativo autorizado;
- o primeiro administrador não é mais criado por uma tela pública;
- novas contas de laboratório exigem senha provisória forte com pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo;
- a criação/recuperação de administradores deve ser feita somente por procedimento interno com acesso administrativo ao projeto;
- configurações hosted do Supabase Auth, como proteção contra senhas vazadas, devem ser revisadas antes de produção. Consulte também `SECURITY.md`.

## Desenvolvimento local

O projeto usa Bun como gerenciador de pacotes.

```bash
bun install
bun run dev
```

Validações da aplicação:

```bash
bun run build
bun run lint
```

Validação local do banco, com Supabase CLI e Docker disponíveis:

```bash
supabase start
supabase test db
supabase stop --no-backup
```

## Fluxo de desenvolvimento

Mudanças devem ser feitas em branch, revisadas via Pull Request e validadas pelo CI antes de entrar em `main`.

O workflow executa dois grupos de validação:

- instalação, build e lint da aplicação;
- reconstrução de um Supabase local a partir das migrations e execução dos testes pgTAP de invariantes de segurança.

## Regras importantes

- uma conta de laboratório pertence a apenas um laboratório;
- laboratório inativo não recebe acesso aos próprios dados via RLS;
- uma prova só pode usar PCs existentes no laboratório;
- a data/horário da prova precisa corresponder a um horário ativo;
- o mesmo PC não pode ter duas provas ativas no mesmo laboratório, data e horário;
- recuperação precisa apontar para uma tentativa anterior reprovada do mesmo aluno/módulo;
- uma tentativa não pode originar duas recuperações paralelas;
- uma tentativa com recuperação ativa não pode ser excluída antes da recuperação;
- provas excluídas permanecem retidas no banco, mas não aparecem no acesso normal;
- alterações de quantidade de PCs/horários não podem invalidar provas de hoje ou futuras.

## Dados mockados

Os antigos stores e arquivos de dados mockados usados durante a prototipação foram removidos. A aplicação utiliza apenas as fontes reais de dados e as APIs do Supabase.
