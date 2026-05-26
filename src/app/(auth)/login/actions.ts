'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type LoginResult =
  | { status: 'sent_link' }
  | { status: 'sent_invite_request' }
  | { status: 'error'; message: string }

export async function requestAccess(email: string): Promise<LoginResult> {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: 'error', message: 'Invalid email address.' }
  }

  const admin = createAdminClient()

  // Check if email exists in auth.users via service role
  const { data: users, error: listError } = await admin.auth.admin.listUsers()
  if (listError) {
    return { status: 'error', message: 'Something went wrong. Try again.' }
  }

  const exists = users.users.some(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  )

  if (exists) {
    // Known user — use anon client signInWithOtp which triggers the email send
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        shouldCreateUser: false,
      },
    })
    if (error) return { status: 'error', message: error.message }
    return { status: 'sent_link' }
  }

  // Unknown email — notify admin
  const { error: emailError } = await resend.emails.send({
    from: 'Quiniela 2026 <noreply@quiniela2026.space>',
    to: 'sergio.barrientos1401@gmail.com',
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

  if (emailError) return { status: 'error', message: 'Could not send request. Try again.' }
  return { status: 'sent_invite_request' }
}
