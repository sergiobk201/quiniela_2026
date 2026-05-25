import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

const actionColors: Record<string, string> = {
  score_updated: 'bg-blue-500/20 text-blue-400',
}

async function getAuditLog(page: number) {
  const admin = createAdminClient()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, count } = await admin
    .from('audit_log')
    .select(
      `id, action, table_name, record_id, new_value, created_at,
       profile:profiles(display_name)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  return { rows: data ?? [], total: count ?? 0 }
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const { rows, total } = await getAuditLog(page)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString()} entries · insert-only
        </p>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>Record</TableHead>
              <TableHead>New Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(row.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </TableCell>
                <TableCell className="text-sm">
                  {(row.profile as unknown as { display_name: string } | null)?.display_name ?? (
                    <span className="text-muted-foreground italic">system</span>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      actionColors[row.action] ?? 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {row.action}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.table_name ?? '—'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.record_id ?? '—'}
                </TableCell>
                <TableCell className="max-w-xs">
                  {row.new_value ? (
                    <details className="cursor-pointer">
                      <summary className="text-xs text-muted-foreground select-none">
                        View
                      </summary>
                      <pre className="mt-1 text-xs bg-muted rounded p-2 overflow-auto max-h-32 whitespace-pre-wrap">
                        {JSON.stringify(row.new_value, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No audit entries yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={`?page=${page - 1}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md opacity-40 cursor-not-allowed">
                <ChevronLeft className="h-4 w-4" />
                Prev
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={`?page=${page + 1}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md opacity-40 cursor-not-allowed">
                Next
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
