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

O provisionamento usa `x-idempotency-key` e a tabela server-only `admin_operation_requests`. Uma repetição da mesma operação com a mesma chave não deve criar outro laboratório. Senhas não entram no `request_hash` persistido.

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

A alteração de laboratório e horários é executada pela RPC `admin_update_laboratory_config()` em uma única transação PostgreSQL. Não deve voltar a existir sequência de `UPDATE` + `DELETE` + `INSERT` com rollback compensatório no navegador/Edge Function.

A alteração de status usa `admin_set_laboratory_status()` e grava auditoria na mesma transação.

## Provas: retenção e integridade

Provas não são removidas fisicamente pelo fluxo normal da aplicação. A exclusão é lógica:

- `deleted_at` marca o momento da exclusão;
- `deleted_by` registra o usuário responsável;
- o registro permanece retido no banco;
- RLS e os fluxos normais escondem registros excluídos;
- índices únicos de PC/horário e recuperação consideram apenas registros ativos (`deleted_at is null`).

O navegador não possui `DELETE` em `public.exams`. A operação passa por `public.soft_delete_exam()`.

`public.soft_delete_exam()` é `SECURITY DEFINER`, usa `search_path = ''` e faz autorização explícita antes da mutação: exige sessão autenticada, profile `laboratory`, laboratório ativo e prova pertencente ao mesmo `laboratory_id`. Isso permite que o registro seja marcado como excluído sem precisar relaxar a policy de `SELECT` que esconde `deleted_at is not null`.

Uma prova que possui recuperação ativa não pode ser excluída antes da recuperação. Isso preserva a cadeia histórica `previous_exam_id`.

## Auditoria

A tabela `public.audit_logs` é append-only para a aplicação. Usuários de laboratório não possuem acesso direto e Admin possui somente leitura sob RLS.

São auditados atualmente:

- criação, edição e soft delete de provas;
- alteração administrativa de laboratório;
- ativação/desativação de laboratório;
- provisionamento de nova conta/laboratório.

Os eventos armazenam, conforme aplicável, `actor_user_id`, papel, laboratório, ação, entidade, estado anterior, estado posterior e timestamp.

Não armazenar senhas, tokens ou outras credenciais em `audit_logs`.

## Privilégios PostgreSQL

Os papéis usados pelo navegador têm permissões mínimas explícitas:

- `anon`: sem acesso direto às tabelas da aplicação;
- `authenticated`: `SELECT` em `profiles`, `laboratories` e `laboratory_schedules`;
- `authenticated`: `SELECT`, `INSERT` e `UPDATE` em `exams`; `DELETE` físico é revogado;
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
- registros de provas com `deleted_at` não nulo ficam fora do acesso operacional normal;
- deve existir somente uma policy permissiva de `SELECT` para `authenticated` em `public.exams`, evitando que uma policy antiga contorne o filtro de soft delete;
- usuários não podem alterar diretamente `profiles` para mudar role ou vínculo com laboratório.

Qualquer mudança em policies deve ser seguida de testes de isolamento entre dois laboratórios distintos.

## Testes automatizados de segurança

Os invariantes de banco ficam em `supabase/tests/` e são executados com pgTAP sobre um Supabase local descartável no CI.

O job `database-security` deve reconstruir o banco a partir de todas as migrations e validar, entre outros pontos:

- grants mínimos de `anon` e `authenticated`;
- ausência de `DELETE` físico de provas pelo navegador;
- RPCs administrativas inacessíveis a `authenticated`;
- existência de uma única policy de `SELECT` operacional em `exams`;
- soft delete escondendo a prova via RLS enquanto mantém o registro fisicamente retido;
- atribuição de `deleted_by` ao ator correto;
- bloqueio de soft delete entre laboratórios distintos.

Nenhuma mudança em RLS, grants ou `soft_delete_exam()` deve entrar em `main` com esse job falhando.

## HTTP, CSP e CORS

Respostas SSR de produção aplicam headers de segurança no middleware do TanStack Start:

- `Content-Security-Policy` com nonce criptográfico por requisição;
- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `Permissions-Policy` desativando recursos que a aplicação não utiliza;
- `Strict-Transport-Security` em respostas HTTPS.

A CSP deve continuar sem `unsafe-inline` em `script-src`. Scripts SSR/hidratação recebem nonce pelo `router.options.ssr.nonce`. `style-src` ainda permite `unsafe-inline` por compatibilidade com a camada visual atual e deve ser reavaliado caso a arquitetura de estilos mude.

O `connect-src` permite somente a própria origem e o projeto Supabase configurado, incluindo WebSocket do Supabase. `frame-ancestors 'none'` e `X-Frame-Options: DENY` bloqueiam clickjacking.

As Edge Functions administrativas não usam `Access-Control-Allow-Origin: *`. O CORS aceita explicitamente:

- origens locais de desenvolvimento conhecidas do projeto atual;
- origens extras fornecidas por `ALLOWED_ORIGINS` no ambiente server-side.

Enquanto este sistema ainda não possuir um domínio de produção próprio, nenhuma origem de produção fica hardcoded na allowlist. Quando o novo frontend for publicado, o domínio definitivo deve ser adicionado explicitamente ao ambiente e aos testes antes do deploy.

O header `x-idempotency-key` faz parte da allowlist CORS por ser utilizado no provisionamento administrativo.

Uma origem de preview/staging nova deve ser adicionada explicitamente à configuração; não ampliar o CORS com curingas genéricos de domínio.

CORS é apenas uma proteção de navegador e **não substitui autenticação/autorização**. As Edge Functions continuam exigindo JWT válido e validação de `profiles.role = admin`.

## Segredos e dependências

O Git ignora `.env`, `.env.*` e `.dev.vars`. Apenas `.env.example`, sem valores reais, deve ser versionado.

O projeto usa Bun e mantém `bun.lock` como lockfile canônico. O CI deve instalar dependências com `bun install --frozen-lockfile`, para impedir atualização silenciosa de versões durante uma validação.

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
- testes pgTAP de segurança e isolamento verdes;
- CSP e demais headers de segurança confirmados em resposta HTTPS real;
- CORS das Edge Functions testado com origem autorizada e origem rejeitada;
- auditoria de ações sensíveis ativa e sem segredos;
- soft delete de provas e cadeia histórica validados;
- operações administrativas multi-etapa executadas de forma transacional quando possível;
- migrations e Edge Functions sincronizadas entre Git e Supabase;
- `routeTree.gen.ts` sincronizado com o gerador do TanStack;
- instalação reproduzível via lockfile congelado;
- CI verde antes de merge em `main`.
