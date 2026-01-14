export default function SkeletonLoader({ type = 'card', count = 1 }) {
  const renderCardSkeleton = () => (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
          <div className="h-6 w-20 bg-gray-700 rounded-full"></div>
        </div>
        <div className="h-6 w-24 bg-gray-700 rounded-full"></div>
      </div>

      {/* Title */}
      <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>

      {/* Description */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
      </div>

      {/* Tags */}
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 bg-gray-700 rounded-full"></div>
        <div className="h-6 w-20 bg-gray-700 rounded-full"></div>
        <div className="h-6 w-14 bg-gray-700 rounded-full"></div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <div className="h-4 w-24 bg-gray-700 rounded"></div>
        <div className="h-10 w-28 bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gray-700 rounded-full flex-shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="h-8 w-20 bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden animate-pulse">
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-700">
        <div className="h-5 bg-gray-700 rounded"></div>
        <div className="h-5 bg-gray-700 rounded"></div>
        <div className="h-5 bg-gray-700 rounded"></div>
        <div className="h-5 bg-gray-700 rounded"></div>
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-700/50">
          <div className="h-4 bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
  );

  const renderStatCardSkeleton = () => (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-gray-700 rounded"></div>
        <div className="w-12 h-12 bg-gray-700 rounded-lg"></div>
      </div>
      <div className="h-10 w-20 bg-gray-700 rounded mb-2"></div>
      <div className="h-3 w-32 bg-gray-700 rounded"></div>
    </div>
  );

  const renderProfileSkeleton = () => (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700 animate-pulse">
      <div className="flex flex-col items-center">
        <div className="w-32 h-32 bg-gray-700 rounded-full mb-4"></div>
        <div className="h-8 w-48 bg-gray-700 rounded mb-2"></div>
        <div className="h-6 w-32 bg-gray-700 rounded mb-6"></div>
        
        <div className="w-full space-y-4">
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-gray-700 rounded"></div>
            <div className="h-4 w-32 bg-gray-700 rounded"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-gray-700 rounded"></div>
            <div className="h-4 w-40 bg-gray-700 rounded"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-gray-700 rounded"></div>
            <div className="h-4 w-28 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTimelineSkeleton = () => (
    <div className="relative pl-20 animate-pulse">
      <div className="absolute left-0 w-16 h-16 bg-gray-700 rounded-xl"></div>
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-6 w-20 bg-gray-700 rounded-full"></div>
              <div className="h-4 w-32 bg-gray-700 rounded"></div>
            </div>
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          </div>
          <div className="h-8 w-16 bg-gray-700 rounded ml-4"></div>
        </div>
      </div>
    </div>
  );

  const renderFormSkeleton = () => (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 space-y-6 animate-pulse">
      <div>
        <div className="h-4 w-24 bg-gray-700 rounded mb-2"></div>
        <div className="h-10 bg-gray-700 rounded-lg w-full"></div>
      </div>
      <div>
        <div className="h-4 w-32 bg-gray-700 rounded mb-2"></div>
        <div className="h-10 bg-gray-700 rounded-lg w-full"></div>
      </div>
      <div>
        <div className="h-4 w-28 bg-gray-700 rounded mb-2"></div>
        <div className="h-32 bg-gray-700 rounded-lg w-full"></div>
      </div>
      <div className="flex gap-3">
        <div className="h-12 bg-gray-700 rounded-lg flex-1"></div>
        <div className="h-12 bg-gray-700 rounded-lg flex-1"></div>
      </div>
    </div>
  );

  const skeletonTypes = {
    card: renderCardSkeleton,
    list: renderListSkeleton,
    table: renderTableSkeleton,
    stat: renderStatCardSkeleton,
    profile: renderProfileSkeleton,
    timeline: renderTimelineSkeleton,
    form: renderFormSkeleton
  };

  const renderSkeleton = skeletonTypes[type] || renderCardSkeleton;

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div key={index} style={{ animation: `fadeIn 0.3s ease-out ${index * 0.1}s backwards` }}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
}
