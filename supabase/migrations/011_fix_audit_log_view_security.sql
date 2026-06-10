-- Fix two Supabase security lints on audit_log_readable:
--   1. security_definer_view — view ran with owner permissions, allowing
--      auth.users data to leak to unprivileged callers.
--   2. auth_users_exposed — anon/authenticated roles could read the view
--      through PostgREST.
--
-- Fix A: security_invoker = true forces the query to run with the CALLER's
--        permissions. anon/authenticated don't have SELECT on auth.users,
--        so the LEFT JOIN returns null (or errors) for them.
-- Fix B: REVOKE removes the view from PostgREST's API surface entirely for
--        anon and authenticated. Admin panel uses service-role client, which
--        bypasses this restriction.

CREATE OR REPLACE VIEW public.audit_log_readable
  WITH (security_invoker = true)
AS
SELECT
  al.id,
  al.created_at                        AS "when",
  p.display_name,
  u.email,
  al.action,
  al.table_name,
  al.record_id,
  al.old_value,
  al.new_value,
  al.ip_address,
  al.user_agent
FROM audit_log al
LEFT JOIN auth.users  u ON u.id = al.user_id
LEFT JOIN profiles    p ON p.id = al.user_id
ORDER BY al.created_at DESC;

REVOKE SELECT ON public.audit_log_readable FROM anon, authenticated;
