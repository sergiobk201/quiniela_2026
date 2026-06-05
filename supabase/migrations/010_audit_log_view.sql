-- Human-readable audit log view for admin investigations.
-- Joins auth.users for email and profiles for display_name.
CREATE OR REPLACE VIEW audit_log_readable AS
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
