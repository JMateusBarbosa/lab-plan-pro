# Bloco 4 — Integridade, auditoria e resiliência

Este arquivo resume a validação técnica do bloco e pode ser removido após o merge.

- soft delete de provas com `deleted_at`/`deleted_by`;
- índices únicos ignoram registros excluídos;
- cadeia P1 → recuperação protegida durante exclusão;
- `audit_logs` registra mudanças sensíveis sem expor escrita ao navegador;
- atualização de laboratório + horários ocorre em uma RPC transacional;
- troca de status ocorre em RPC transacional e auditada;
- provisionamento usa idempotency key e ledger server-only;
- Edge Functions continuam com JWT, papel Admin e CORS restrito;
- dados existentes preservados durante as migrations.
