'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function inviteUser(formData: FormData) {
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
  const admin = createAdminClient()
  await admin.from('profiles').upsert({ id: userId, entry_paid: !current }, { onConflict: 'id' })
  revalidatePath('/admin/users')
}

export async function toggleAdmin(userId: string, current: boolean) {
  const admin = createAdminClient()
  await admin.from('profiles').upsert({ id: userId, is_admin: !current }, { onConflict: 'id' })
  revalidatePath('/admin/users')
}

export async function deleteUser(userId: string) {
  const admin = createAdminClient()
  await admin.auth.admin.deleteUser(userId)
  revalidatePath('/admin/users')
}
