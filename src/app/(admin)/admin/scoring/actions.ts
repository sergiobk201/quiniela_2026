'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { assertAdmin } from '@/lib/supabase/assert-admin'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function recomputeScores(type: string = 'all') {
  await assertAdmin()
  const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/compute-scores`
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const res = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type }),
  })

  const json = await res.json()
  if (!json.success) throw new Error(json.error ?? 'Compute failed')

  revalidatePath('/leaderboard')
  revalidatePath('/dashboard')
  return json
}

export async function saveTournamentResults(formData: FormData) {
  await assertAdmin()
  const admin = createAdminClient()

  const row = {
    champion_team_id:           toInt(formData.get('champion_team_id')),
    runner_up_team_id:          toInt(formData.get('runner_up_team_id')),
    third_place_team_id:        toInt(formData.get('third_place_team_id')),
    golden_boot_player:         str(formData.get('golden_boot_player')),
    golden_glove_player:        str(formData.get('golden_glove_player')),
    kopa_player:                str(formData.get('kopa_player')),
    total_goals:                toInt(formData.get('total_goals')),
    first_eliminated_team_id:   toInt(formData.get('first_eliminated_team_id')),
    most_yellows_team_id:       toInt(formData.get('most_yellows_team_id')),
    updated_at:                 new Date().toISOString(),
  }

  // Single row — delete existing and insert fresh
  await admin.from('tournament_results').delete().neq('id', 0)
  const { error } = await admin.from('tournament_results').insert(row)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/scoring')
}

export async function createRebuyOpportunity(
  userId: string,
  unlockedAtStage: string,
  pointsAvailable: number
) {
  await assertAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('champion_rebuys').upsert(
    { user_id: userId, unlocked_at_stage: unlockedAtStage, points_available: pointsAvailable },
    { onConflict: 'user_id' }
  )
  if (error) throw new Error(error.message)
  revalidatePath('/admin/scoring')
}

export async function sendIntegrityAlert(lines: string[]): Promise<void> {
  await assertAdmin()
  if (lines.length === 0) return

  const rows = lines.map(l => `<li style="margin-bottom:6px;">${l}</li>`).join('')

  await resend.emails.send({
    from: 'Quiniela 2026 <noreply@quiniela2026.space>',
    to: process.env.ADMIN_NOTIFICATION_EMAIL!,
    subject: `⚠️ Quiniela — ${lines.length} prediction conflict${lines.length !== 1 ? 's' : ''} found`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#f59e0b;">Prediction Integrity Alert</h2>
        <p>${lines.length} conflict${lines.length !== 1 ? 's' : ''} detected between users' trophy picks and their group standing predictions.</p>
        <ul style="padding-left:20px;line-height:1.6;font-size:0.9rem;">${rows}</ul>
        <p style="margin-top:20px;">
          <a href="https://www.quiniela2026.space/admin/scoring"
             style="background:#10b981;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;">
            View in Admin → Scoring
          </a>
        </p>
        <p style="color:#9ca3af;font-size:0.8rem;margin-top:16px;">
          Picks are already saved — users need to correct their group standings or trophy picks before June 7.
        </p>
      </div>
    `,
  })
}

function toInt(v: FormDataEntryValue | null): number | null {
  if (!v || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function str(v: FormDataEntryValue | null): string | null {
  const s = (v as string)?.trim()
  return s || null
}
