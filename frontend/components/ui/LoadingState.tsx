import React from "react";

export function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return <div className={`bg-[#F0F0F0] rounded-[1px] ${className}`} />;
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="border border-[#E5E5E5] bg-white divide-y divide-[#E5E5E5]">
      <div className="p-4 bg-[#FAFAFA] flex gap-4">
        <SkeletonBlock className="h-4 w-1/4" />
        <SkeletonBlock className="h-4 w-1/3" />
        <SkeletonBlock className="h-4 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex gap-4">
          <SkeletonBlock className="h-4 w-1/4" />
          <SkeletonBlock className="h-4 w-1/3" />
          <SkeletonBlock className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="border border-[#E5E5E5] bg-white grid grid-cols-1 md:grid-cols-4 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={`p-5 ${i !== 3 ? "md:border-r border-[#E5E5E5]" : ""}`}
        >
          <SkeletonBlock className="h-3 w-20 mb-3" />
          <SkeletonBlock className="h-8 w-16 mb-2" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#E5E5E5] pb-6">
        <SkeletonBlock className="h-3 w-24 mb-2" />
        <SkeletonBlock className="h-7 w-48 mb-2" />
        <SkeletonBlock className="h-4 w-96" />
      </div>
      <StatSkeleton />
      <TableSkeleton rows={3} />
    </div>
  );
}
