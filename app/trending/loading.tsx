export default function TrendingLoading() {
  return (
    <div className="min-h-screen">
      <div className="h-[57px] glass-nav" />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="skeleton h-8 w-40 rounded-xl mb-2" />
        <div className="skeleton h-4 w-56 rounded-lg mb-10" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="glass rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="skeleton w-7 h-4 rounded" />
              <div className="skeleton w-10 h-5 rounded" />
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="skeleton h-4 rounded w-3/4" />
                <div className="skeleton h-3 rounded w-1/2" />
              </div>
              <div className="skeleton w-10 h-5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
