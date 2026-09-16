# Sistema de Agendamento de Provas

Sistema web para gerenciamento de laboratórios e agendamento de provas, com áreas separadas para Administrador e Laboratório.

## Estado atual

O projeto utiliza backend real com Supabase. A Área Administrativa e a Área do Laboratório trabalham com autenticação, banco PostgreSQL, Edge Functions e Row Level Security (RLS).

### Área Administrativa

- autenticação real com Supabase Auth;
- cadastro público de administradores desativado;
- novos usuários só podem ser provisionados por fluxos server-side autorizados;
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

## Banco de dados

Tabelas principais:

- `profiles`
- `laboratories`
- `laboratory_schedules`
- `exams`

As tabelas públicas usam RLS. Usuários de laboratório só conseguem acessar dados vinculados ao próprio `laboratory_id`. Mutações administrativas sensíveis não devem ser realizadas diretamente pelo navegador quando existe uma Edge Function responsável pela operação.

As migrations ficam em `supabase/migrations/` e as Edge Functions em `supabase/functions/`.

Edge Functions atuais:

- `provision-laboratory`
- `update-laboratory`
- `set-laboratory-status`

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
- novas contas de laboratório exigem senha provisória forte com pelo menos 12 caracteres, incluindo maiúscula, minúscula, número e símbolo;
- a criação/recuperação de administradores deve ser feita somente por procedimento interno com acesso administrativo ao projeto;
- configurações hosted do Supabase Auth, como proteção contra senhas vazadas, devem ser revisadas antes de produção. Consulte também `SECURITY.md`.

## Desenvolvimento local

```bash
bun install
bun run dev
```

Validações:

```bash
bun run build
bun run lint
```

## Fluxo de desenvolvimento

Mudanças devem ser feitas em branch, revisadas via Pull Request e validadas pelo CI antes de entrar em `main`.

O workflow atual executa instalação, build e lint.

## Regras importantes

- uma conta de laboratório pertence a apenas um laboratório;
- laboratório inativo não recebe acesso aos próprios dados via RLS;
- uma prova só pode usar PCs existentes no laboratório;
- a data/horário da prova precisa corresponder a um horário ativo;
- o mesmo PC não pode ter duas provas no mesmo laboratório, data e horário;
- recuperação precisa apontar para uma tentativa anterior reprovada do mesmo aluno/módulo;
- uma tentativa não pode originar duas recuperações paralelas;
- alterações de quantidade de PCs/horários não podem invalidar provas de hoje ou futuras.

## Mocks antigos

Alguns arquivos de dados/stores mockados ainda podem permanecer no repositório temporariamente como resíduo das primeiras etapas de prototipação. Eles não devem ser usados como fonte de dados definitiva. A remoção física será feita somente após validar completamente a integração real.
