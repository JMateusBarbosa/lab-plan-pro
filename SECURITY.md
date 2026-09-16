# Segurança do projeto

Este documento registra decisões de segurança que devem permanecer verdadeiras durante a evolução do sistema.

## Princípios

- autorização crítica deve ser garantida no backend/banco, não apenas na interface;
- operações administrativas sensíveis devem passar por Edge Functions autenticadas;
- usuários de laboratório nunca devem confiar em um `laboratory_id` vindo do cliente para autorização;
- RLS deve continuar sendo a barreira principal para isolamento entre laboratórios;
- privilégios PostgreSQL devem seguir o princípio do menor privilégio e complementar o RLS;
- `SUPABASE_SERVICE_ROLE_KEY` e demais secret keys nunca podem chegar ao frontend;
- migrations históricas não devem ser reescritas; correções devem entrar como novas migrations.

## Provisionamento de usuários

Cadastro público não faz parte do produto.

O trigger `private.handle_new_auth_user()` rejeita novas entradas em `auth.users` que não estejam marcadas em `raw_app_meta_data` com:

```text
provisioned_by_admin = true
```

Contas de laboratório são criadas pela Edge Function `provision-laboratory`, que valida a sessão e o papel Admin antes de utilizar a API administrativa do Supabase Auth.

O primeiro administrador não deve ser criado automaticamente pelo primeiro signup. A criação ou recuperação de administradores deve ser feita por procedimento administrativo controlado no Supabase, ou futuramente por um fluxo server-side específico e autenticado.

## Senhas

Novas contas de laboratório exigem, no mínimo:

- 12 caracteres;
- uma letra minúscula;
- uma letra maiúscula;
- um número;
- um símbolo.

A validação final ocorre na Edge Function, portanto não pode ser contornada alterando apenas o frontend.

No projeto hosted, revisar em **Authentication > Sign In / Providers / Password security**:

- manter o provedor de e-mail ativo para permitir login;
- definir senha mínima de 12 caracteres;
- manter as proteções de alteração de senha/e-mail compatíveis com o fluxo do produto;
- ativar `Leaked Password Protection` quando disponível no plano do Supabase.

No plano Free, `Leaked Password Protection` não está disponível. O warning correspondente do Security Advisor é aceito temporariamente como limitação de plano e deve ser revisto em eventual upgrade.

Mesmo com signup hosted habilitado acidentalmente, o trigger do banco rejeita usuários não provisionados pelo fluxo administrativo autorizado.

## Laboratórios

O papel `authenticated` não possui `UPDATE` direto em `public.laboratories`.

Alterações são realizadas por:

- `update-laboratory` para dados, computadores e horários;
- `set-laboratory-status` para ativação/desativação.

As funções validam que o chamador possui `profiles.role = admin` e utilizam Service Role somente no ambiente server-side.

## Privilégios PostgreSQL

Os papéis usados pelo navegador têm permissões mínimas explícitas:

- `anon`: sem acesso direto às tabelas da aplicação;
- `authenticated`: `SELECT` em `profiles`, `laboratories` e `laboratory_schedules`;
- `authenticated`: `SELECT`, `INSERT`, `UPDATE` e `DELETE` em `exams`;
- mutações administrativas de laboratório/profile não recebem grants de cliente;
- `service_role` permanece reservado ao backend/Edge Functions.

RLS continua definindo **quais linhas** um usuário autenticado pode acessar. Os grants definem **quais operações** podem sequer chegar às policies. As duas camadas devem permanecer coerentes.

Funções usadas exclusivamente como triggers, como `public.set_updated_at()`, `public.validate_exam_schedule()` e `private.sync_profile_email_from_auth()`, não devem possuir `EXECUTE` para papéis de navegador.

As helpers `private.current_laboratory_id()` e `private.is_admin()` são `SECURITY DEFINER`, usam `search_path = ''`, referências de objeto schema-qualified e `EXECUTE` somente para `authenticated`.

Migrations executadas como `postgres` possuem default privileges restritos. Novas tabelas, sequências e funções **não recebem acesso do navegador automaticamente**; cada migration deve conceder explicitamente apenas os grants necessários.

Evite criar objetos de produção manualmente pelo Table Editor/SQL Editor quando eles fizerem parte da aplicação. Prefira migrations versionadas para manter grants, RLS e histórico reproduzíveis.

## RLS

As policies devem garantir que:

- Admin pode consultar os dados administrativos necessários;
- laboratório só visualiza o próprio laboratório ativo e seus horários;
- laboratório só manipula provas cujo `laboratory_id` corresponde a `private.current_laboratory_id()`;
- usuários não podem alterar diretamente `profiles` para mudar role ou vínculo com laboratório.

Qualquer mudança em policies deve ser seguida de testes de isolamento entre dois laboratórios distintos.

## Segredos

O Git ignora `.env`, `.env.*` e `.dev.vars`. Apenas `.env.example`, sem valores reais, deve ser versionado.

Antes de qualquer commit, não inclua:

- Service Role / secret key;
- access tokens pessoais;
- senhas;
- chaves privadas;
- credenciais SMTP ou banco.

## Checklist antes de produção

- Security Advisor sem alertas críticos ou altos não justificados;
- qualquer warning de plano documentado e aceito conscientemente;
- cadastro público bloqueado pelo backend;
- proteção contra senhas vazadas ativada quando disponível;
- grants e RLS revisados após qualquer nova tabela ou função;
- domínio/CORS e headers de segurança revisados;
- auditoria de ações sensíveis implementada;
- política de exclusão/retensão de provas definida;
- migrations e Edge Functions sincronizadas entre Git e Supabase;
- CI verde e testes de autorização executados.
