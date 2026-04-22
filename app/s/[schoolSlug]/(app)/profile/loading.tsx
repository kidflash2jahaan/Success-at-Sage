export default function ProfileLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="skeleton h-7 w-48 rounded-xl mb-2" />
        <div className="skeleton h-4 w-32 rounded-lg mb-1" />
        <div className="skeleton h-3 w-40 rounded" />
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton h-3 w-28 rounded" />
        <div className="skeleton h-3 w-6 rounded" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-xl px-5 py-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="skeleton h-4 w-48 rounded-lg mb-1.5" />
              <div className="skeleton h-3 w-32 rounded" />
            </div>
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
