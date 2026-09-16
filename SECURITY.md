# Segurança do projeto

Este documento registra decisões de segurança que devem permanecer verdadeiras durante a evolução do sistema.

## Princípios

- autorização crítica deve ser garantida no backend/banco, não apenas na interface;
- operações administrativas sensíveis devem passar por Edge Functions autenticadas;
- usuários de laboratório nunca devem confiar em um `laboratory_id` vindo do cliente para autorização;
- RLS deve continuar sendo a barreira principal para isolamento entre laboratórios;
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

- desativar `Allow new users to sign up`;
- definir uma política mínima de senha compatível com o produto;
- ativar `Leaked Password Protection` quando disponível no plano do Supabase.

Mesmo com signup hosted habilitado acidentalmente, o trigger do banco rejeita usuários não provisionados. O toggle hosted deve permanecer desligado como defesa em profundidade.

## Laboratórios

O papel `authenticated` não possui `UPDATE` direto em `public.laboratories`.

Alterações são realizadas por:

- `update-laboratory` para dados, computadores e horários;
- `set-laboratory-status` para ativação/desativação.

As funções validam que o chamador possui `profiles.role = admin` e utilizam Service Role somente no ambiente server-side.

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
- signup público desativado no Supabase hosted;
- proteção contra senhas vazadas ativada quando disponível;
- domínio/CORS e headers de segurança revisados;
- auditoria de ações sensíveis implementada;
- política de exclusão/retensão de provas definida;
- migrations e Edge Functions sincronizadas entre Git e Supabase;
- CI verde e testes de autorização executados.
