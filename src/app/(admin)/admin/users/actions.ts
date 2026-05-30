'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { assertAdmin } from '@/lib/supabase/assert-admin'
import { revalidatePath } from 'next/cache'

export async function inviteUser(formData: FormData) {
  await assertAdmin()
  const email = (formData.get('email') as string).trim().toLowerCase()
  const displayName = (formData.get('displayName') as string).trim()

  if (!email || !displayName) throw new Error('Email and display name are required')

  const admin = createAdminClient()

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`,
  })

  if (error) throw new Error(error.message)

  await admin.from('profiles').upsert({
    id: data.user.id,
    display_name: displayName,
  })

  revalidatePath('/admin/users')
}

export async function togglePaid(userId: string, current: boolean) {
  await assertAdmin()
  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ entry_paid: !current })
    .eq('id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}

export async function toggleAdmin(userId: string, current: boolean) {
  await assertAdmin()
  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ is_admin: !current })
    .eq('id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}

export async function deleteUser(userId: string) {
  await assertAdmin()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.id === userId) throw new Error('Cannot delete your own account')

  const admin = createAdminClient()
  // audit_log.user_id has no ON DELETE CASCADE — null it out first to avoid FK violation
  const { error: auditError } = await admin
    .from('audit_log')
    .update({ user_id: null })
    .eq('user_id', userId)
  if (auditError) throw new Error(auditError.message)

  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}
