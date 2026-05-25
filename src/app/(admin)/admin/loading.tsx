export default function AdminLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-40 bg-muted rounded" />
      <div className="h-4 w-24 bg-muted rounded" />
      <div className="border rounded-md overflow-hidden">
        <div className="h-9 bg-muted/50 border-b" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b last:border-0">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="ml-auto h-4 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
