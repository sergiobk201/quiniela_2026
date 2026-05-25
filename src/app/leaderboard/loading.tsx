export default function LeaderboardLoading() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-1">
        <div className="h-8 w-40 bg-muted rounded" />
        <div className="h-4 w-32 bg-muted rounded" />
      </div>

      {/* Podium */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <div className="h-8 w-8 bg-muted rounded mx-auto" />
            <div className="h-4 w-20 bg-muted rounded mx-auto" />
            <div className="h-6 w-14 bg-muted rounded mx-auto" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="border rounded-md overflow-hidden">
        <div className="h-9 bg-muted/50 border-b" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
            <div className="h-4 w-6 bg-muted rounded" />
            <div className="h-4 w-28 bg-muted rounded" />
            <div className="ml-auto h-4 w-12 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
