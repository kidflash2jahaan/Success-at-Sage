export default function BrowseLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="skeleton h-8 w-48 rounded-xl mb-2" />
      <div className="skeleton h-4 w-72 rounded mb-10" />

      <div className="flex flex-col gap-10">
        {[1, 2, 3].map(d => (
          <div key={d}>
            <div className="flex items-center gap-3 mb-4">
              <div className="skeleton w-3 h-3 rounded-full" />
              <div className="skeleton h-4 w-32 rounded" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass rounded-xl p-4">
                  <div className="skeleton h-3 w-20 rounded mb-2" />
                  <div className="skeleton h-4 w-full rounded-lg mb-3" />
                  <div className="skeleton h-3 w-28 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
