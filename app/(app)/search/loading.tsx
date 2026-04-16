export default function SearchLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="skeleton h-7 w-48 rounded-xl mb-2" />
      <div className="skeleton h-4 w-24 rounded-lg mb-8" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <div className="skeleton h-4 w-44 rounded-lg mb-1.5" />
              <div className="skeleton h-3 w-28 rounded" />
            </div>
            <div className="skeleton h-3 w-12 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
