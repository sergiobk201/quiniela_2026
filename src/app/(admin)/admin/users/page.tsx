import { createAdminClient } from '@/lib/supabase/admin'
import { InviteForm } from './invite-form'
import { togglePaid, toggleAdmin, deleteUser } from './actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const dynamic = 'force-dynamic'

async function getUsers() {
  const admin = createAdminClient()

  const [{ data: authData }, { data: profiles }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('profiles').select('*'),
  ])

  return (authData?.users ?? []).map((u) => ({
    ...u,
    profile: profiles?.find((p) => p.id === u.id) ?? null,
  }))
}

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">{users.length} total</p>
        </div>
        <InviteForm />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Paid</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.profile?.display_name ?? <span className="text-muted-foreground italic">—</span>}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {user.profile?.is_admin && <Badge variant="secondary">Admin</Badge>}
                  {!user.confirmed_at && <Badge variant="outline">Pending</Badge>}
                </div>
              </TableCell>
              <TableCell>
                <form
                  action={togglePaid.bind(null, user.id, user.profile?.entry_paid ?? false)}
                >
                  <button
                    type="submit"
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border transition-colors ${
                      user.profile?.entry_paid
                        ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
                        : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                    }`}
                  >
                    {user.profile?.entry_paid ? 'Paid' : 'Unpaid'}
                  </button>
                </form>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : '—'}
              </TableCell>
              <TableCell>
                <div className="flex gap-2 justify-end">
                  <form action={toggleAdmin.bind(null, user.id, user.profile?.is_admin ?? false)}>
                    <Button variant="ghost" size="sm" type="submit">
                      {user.profile?.is_admin ? 'Revoke admin' : 'Make admin'}
                    </Button>
                  </form>
                  <form action={deleteUser.bind(null, user.id)}>
                    <Button variant="ghost" size="sm" type="submit" className="text-destructive hover:text-destructive">
                      Remove
                    </Button>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No users yet. Send the first invite above.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
