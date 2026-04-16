export default function CourseLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="skeleton h-3 w-20 rounded mb-6" />
      <div className="glass rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="skeleton w-2 h-2 rounded-full" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
        <div className="skeleton h-7 w-2/3 rounded-xl mb-3" />
        <div className="skeleton h-4 w-full rounded-lg mb-1" />
        <div className="skeleton h-4 w-5/6 rounded-lg mb-5" />
        <div className="skeleton h-9 w-36 rounded-xl" />
      </div>
      <div className="skeleton h-3 w-12 rounded mb-3" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass rounded-xl px-5 py-4 flex items-center justify-between">
            <div className="skeleton h-4 w-40 rounded-lg" />
            <div className="skeleton h-3 w-10 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
