'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function checkEmailExists(email: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.listUsers()
  if (error || !data) return false
  return data.users.some((u) => u.email?.toLowerCase() === email.toLowerCase())
}

export async function sendInviteRequest(email: string): Promise<{ ok: boolean }> {
  const { error } = await resend.emails.send({
    from: 'Quiniela 2026 <noreply@quiniela2026.space>',
    to: process.env.ADMIN_NOTIFICATION_EMAIL!,
    subject: `⚽ Invite request — ${email}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #10b981;">New invite request</h2>
        <p><strong>${email}</strong> tried to sign in to Quiniela 2026 but is not yet invited.</p>
        <p>If you want to add them:</p>
        <ol>
          <li>Go to <a href="https://www.quiniela2026.space/admin/users">Admin → Users</a></li>
          <li>Click <strong>Invite User</strong> and enter their email</li>
          <li>Collect the $10 entry fee</li>
        </ol>
        <p style="color: #6b7280; font-size: 0.85rem;">Sent automatically from the login page.</p>
      </div>
    `,
  })
  return { ok: !error }
}
