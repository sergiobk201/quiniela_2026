import { AdminNav } from '@/components/admin-nav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <AdminNav />
      <main className="flex-1 p-6 max-w-5xl">{children}</main>
    </div>
  )
}
