export default function UnitLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="skeleton h-3 w-20 rounded mb-6" />
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="skeleton w-2 h-2 rounded-full" />
          <div className="skeleton h-3 w-32 rounded" />
        </div>
        <div className="skeleton h-7 w-1/2 rounded-xl mb-3" />
        <div className="flex items-center justify-between">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-3 w-28 rounded" />
        </div>
      </div>
      <div className="mb-6">
        <div className="skeleton h-3 w-24 rounded mb-3" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-xl px-5 py-4 flex items-center justify-between">
              <div>
                <div className="skeleton h-4 w-48 rounded-lg mb-1.5" />
                <div className="skeleton h-3 w-32 rounded" />
              </div>
              <div className="skeleton h-5 w-10 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
