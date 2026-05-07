export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex animate-pulse">
      <div className="flex-1 p-4">
        <div className="h-3 bg-gray-200 rounded-full w-24 mb-3" />
        <div className="h-4 bg-gray-200 rounded-full w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded-full w-full mb-1" />
        <div className="h-3 bg-gray-200 rounded-full w-2/3 mb-4" />
        <div className="h-5 bg-gray-200 rounded-full w-16" />
      </div>
      <div className="w-28 h-28 bg-gray-200 self-center mr-3 rounded-xl shrink-0" />
    </div>
  )
}

export function SkeletonMenu() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}