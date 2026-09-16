-- New objects created by our migrations (executed as postgres) must not
-- automatically grant broad privileges to browser roles. Browser access must be
-- explicitly declared by each migration.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;
