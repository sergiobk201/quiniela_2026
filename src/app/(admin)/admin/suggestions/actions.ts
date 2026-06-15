'use server'

import { createAdminClient, fetchAll } from '@/lib/supabase/admin'
import { assertAdmin } from '@/lib/supabase/assert-admin'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { DIFFICULTY_PTS, PHASES, type Phase, type Difficulty } from '@/app/community-bets/types'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function updateSuggestionStatus(
  id: number,
  status: 'open' | 'selected' | 'rejected'
): Promise<void> {
  await assertAdmin()
  const admin = createAdminClient()
  await admin.from('bet_suggestions').update({ status }).eq('id', id)
  revalidatePath('/admin/suggestions')
}

export async function sendSuggestionEmail(phase: Phase): Promise<{ error: string | null }> {
  await assertAdmin()
  const admin = createAdminClient()

  const { data: suggestions } = await admin
    .from('bet_suggestions')
    .select('id, suggestion, difficulty, user_id')
    .eq('phase', phase)
    .eq('status', 'open')

  // Paged: vote tally can exceed PostgREST's 1000-row cap — unbounded undercounts. See fetchAll().
  const votes = await fetchAll<{ suggestion_id: number }>((from, to) =>
    admin.from('bet_suggestion_votes').select('suggestion_id').order('id', { ascending: true }).range(from, to))

  if (!suggestions?.length) return { error: 'No open suggestions for this phase.' }

  const counts: Record<number, number> = {}
  for (const v of votes ?? []) counts[v.suggestion_id] = (counts[v.suggestion_id] ?? 0) + 1

  const { data: profiles } = await admin.from('profiles').select('id, display_name')
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.display_name]))

  const top3 = [...suggestions]
    .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))
    .slice(0, 3)

  const phaseLabel = PHASES.find(p => p.key === phase)?.label ?? phase

  const rows = top3.map((s, i) => {
    const pts = DIFFICULTY_PTS[s.difficulty as Difficulty]
    return `<li style="margin-bottom:8px;">
      <strong>#${i + 1}</strong> · ${counts[s.id] ?? 0} votes ·
      <em>${s.difficulty}</em> (${pts}pts) ·
      &ldquo;${s.suggestion}&rdquo; —
      <span style="color:#6b7280;">by ${profileMap.get(s.user_id) ?? 'Unknown'}</span>
    </li>`
  }).join('')

  const { error } = await resend.emails.send({
    from: 'Quiniela 2026 <noreply@quiniela2026.space>',
    to: process.env.ADMIN_NOTIFICATION_EMAIL!,
    subject: `⚽ Bet suggestions due — ${phaseLabel} phase`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#10b981;">⚽ Community Bet Suggestions — ${phaseLabel}</h2>
        <p>Top ${top3.length} voted suggestion${top3.length !== 1 ? 's' : ''} for the <strong>${phaseLabel}</strong> phase:</p>
        <ol style="padding-left:20px;line-height:1.8;font-size:0.9rem;">${rows}</ol>
        <p style="margin-top:20px;">
          <a href="https://www.quiniela2026.space/admin/suggestions"
             style="background:#10b981;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;">
            View all suggestions →
          </a>
        </p>
        <p style="color:#9ca3af;font-size:0.8rem;margin-top:16px;">
          Mark approved bets as "Selected" in the admin panel, then implement them in code before the phase starts.
        </p>
      </div>
    `,
  })

  if (error) return { error: typeof error === 'string' ? error : JSON.stringify(error) }

  await admin.from('audit_log').insert({
    action: 'bet_suggestions_email_sent',
    table_name: phase,
    new_value: { sent_at: new Date().toISOString(), phase, top3_count: top3.length },
  })

  revalidatePath('/admin/suggestions')
  return { error: null }
}
