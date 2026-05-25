export default function DashboardLoading() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted rounded" />
      </div>

      {/* Score card */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-10 w-20 bg-muted rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-md" />
          ))}
        </div>
      </div>

      {/* Champion + rebuy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-6 space-y-2">
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="h-5 w-32 bg-muted rounded" />
        </div>
        <div className="border rounded-lg p-6 space-y-2">
          <div className="h-4 w-28 bg-muted rounded" />
          <div className="h-5 w-32 bg-muted rounded" />
        </div>
      </div>

      {/* Predictions links */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="h-4 w-40 bg-muted rounded" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-9 bg-muted rounded-md" />
          ))}
        </div>
      </div>
    </div>
  )
}
