# Security Block 3 validation scope

This temporary development note records the validation targets for the HTTP hardening block:

- nonce-based CSP compiles with the current TanStack Start version;
- browser security headers are added by SSR middleware;
- Edge Functions keep `verify_jwt = true`;
- administrative Edge Functions restrict CORS to explicit origins;
- production and local origins remain supported;
- no business-rule logic changes are introduced in the Edge Functions.

This file can be removed after the block is merged if it is no longer useful.
