import React from 'react';

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-800/80 rounded-xl ${className}`} />
);

export const CardSkeleton = () => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-12" />
    </div>
    <Skeleton className="h-10 w-1/2" />
    <Skeleton className="h-4 w-3/4" />
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, idx) => (
      <div key={idx} className="flex gap-4 items-center p-3 bg-slate-900/50 rounded-xl">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/6 ml-auto" />
      </div>
    ))}
  </div>
);
