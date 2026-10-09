-- RLS does not govern TRUNCATE, REFERENCES, or TRIGGER. API roles need none
-- of these table-level privileges, even when a table allows row writes.
revoke truncate, references, trigger on all tables in schema public
  from anon, authenticated;

-- Migrations in this project create tables as postgres. Keep the same
-- boundary for future public tables created by that role.
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger on tables from anon, authenticated;
