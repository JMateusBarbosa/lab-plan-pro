# Bloco 3 — Hardening HTTP

Escopo técnico deste bloco:

- CSP com nonce por requisição no SSR;
- proteção contra clickjacking;
- headers de segurança HTTP;
- CORS restrito nas Edge Functions administrativas;
- manutenção de `verify_jwt=true` e validação de papel Admin.

Validação obrigatória antes do merge:

- `bun run build`;
- `eslint`;
- teste funcional em produção/preview após deploy;
- inspeção dos headers HTTP reais;
- teste de preflight CORS com origem autorizada e rejeitada.
