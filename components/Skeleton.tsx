// Skeleton loading components — used in Suspense fallbacks

export function TopicCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 h-full space-y-4">
      <div className="skeleton w-14 h-14 rounded-xl" />
      <div className="skeleton h-6 w-3/4" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-5/6" />
      <div className="mt-6 space-y-2">
        <div className="flex justify-between">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-3 w-8" />
        </div>
        <div className="skeleton h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

export function TopicsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <TopicCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FlashcardSkeleton() {
  return (
    <div className="h-[280px] rounded-[2rem] skeleton" />
  );
}

export function FlashcardsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <FlashcardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 space-y-3">
      <div className="skeleton w-12 h-12 rounded-xl" />
      <div className="skeleton h-8 w-16" />
      <div className="skeleton h-3 w-24" />
    </div>
  );
}

export function ProgressPageSkeleton() {
  return (
    <div className="space-y-16 pt-32 pb-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-3">
        <div className="skeleton h-4 w-32 rounded-full" />
        <div className="skeleton h-12 w-64" />
        <div className="skeleton h-5 w-48" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
      </div>
      {/* Banner */}
      <div className="skeleton h-48 rounded-[2rem]" />
      {/* Topics */}
      <div className="space-y-6">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

export function NavSkeleton() {
  return <div className="w-10 h-10 rounded-full skeleton" />;
}
