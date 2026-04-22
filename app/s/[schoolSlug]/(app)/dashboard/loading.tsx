export default function DashboardLoading() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="skeleton h-7 w-36 rounded-xl mb-2" />
        <div className="skeleton h-4 w-48 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="skeleton w-2 h-2 rounded-full" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
            <div className="skeleton h-5 w-3/4 rounded-lg mb-3" />
            <div className="skeleton h-3 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
