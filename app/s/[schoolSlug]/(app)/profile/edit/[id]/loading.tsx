export default function EditLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-6">
      <div>
        <div className="skeleton h-7 w-40 rounded-xl mb-1" />
        <div className="skeleton h-4 w-56 rounded" />
      </div>

      <div className="skeleton h-10 w-full rounded-xl" />

      {/* Mode toggle */}
      <div className="glass rounded-xl p-1 flex gap-2">
        <div className="flex-1 skeleton h-9 rounded-lg" />
        <div className="flex-1 skeleton h-9 rounded-lg" />
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <div className="skeleton h-3 w-10 rounded" />
        <div className="skeleton h-10 w-full rounded-xl" />
      </div>

      {/* Content / PDF */}
      <div className="flex flex-col gap-1.5">
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton h-40 w-full rounded-xl" />
      </div>

      <div className="flex gap-3">
        <div className="skeleton h-10 w-36 rounded-xl" />
        <div className="skeleton h-10 w-24 rounded-xl" />
      </div>
    </div>
  )
}
