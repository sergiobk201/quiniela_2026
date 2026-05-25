import { AdminNav } from '@/components/admin-nav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <AdminNav />
      <main className="flex-1 p-4 lg:p-6 min-w-0">{children}</main>
    </div>
  )
}
