export default function PredictionsLoading() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4 animate-pulse">
      <div className="h-8 w-56 bg-muted rounded" />
      <div className="h-4 w-40 bg-muted rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="h-4 w-24 bg-muted rounded" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-9 bg-muted rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
