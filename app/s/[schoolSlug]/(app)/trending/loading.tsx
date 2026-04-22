export default function TrendingLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-10">
        <div className="skeleton h-8 w-36 rounded-xl mb-1" />
        <div className="skeleton h-4 w-56 rounded" />
      </div>

      <div className="flex flex-col gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="glass rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="skeleton w-7 h-4 rounded" />
            <div className="flex-1">
              <div className="skeleton h-4 w-48 rounded-lg mb-1.5" />
              <div className="skeleton h-3 w-32 rounded mb-2" />
              <div className="skeleton h-0.5 w-24 rounded-full" />
            </div>
            <div className="skeleton h-8 w-12 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
