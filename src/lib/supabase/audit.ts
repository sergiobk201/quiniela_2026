import { headers } from 'next/headers'
import { createAdminClient } from './admin'

type AuditParams = {
  userId: string
  action: string
  table_name?: string
  record_id?: number | string | null
  old_value?: Record<string, unknown> | null
  new_value?: Record<string, unknown> | null
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    const h = await headers()
    const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
    const userAgent = h.get('user-agent') ?? null

    const admin = createAdminClient()
    await admin.from('audit_log').insert({
      user_id:    params.userId,
      action:     params.action,
      table_name: params.table_name ?? null,
      record_id:  params.record_id != null ? Number(params.record_id) : null,
      old_value:  params.old_value ?? null,
      new_value:  params.new_value ?? null,
      ip_address: ip,
      user_agent: userAgent,
    })
  } catch {
    // Never block the main operation
  }
}
