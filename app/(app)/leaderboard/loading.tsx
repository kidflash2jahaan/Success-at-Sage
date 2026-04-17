export default function LeaderboardLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-10 text-center">
        <div className="skeleton h-8 w-48 rounded-xl mx-auto mb-2" />
        <div className="skeleton h-4 w-56 rounded mx-auto" />
      </div>

      <div className="glass rounded-xl px-5 py-3.5 mb-6 flex items-center justify-between">
        <div className="skeleton h-4 w-20 rounded" />
        <div className="skeleton h-5 w-16 rounded" />
      </div>

      <div className="flex flex-col gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="glass rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="skeleton w-8 h-4 rounded" />
            <div className="flex-1">
              <div className="skeleton h-4 w-36 rounded-lg mb-1.5" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
            <div className="skeleton h-8 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
