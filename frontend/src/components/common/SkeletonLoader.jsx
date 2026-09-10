import React from 'react';

/**
 * Reusable Modern Skeleton Loaders for EcoSathi
 */

export function SkeletonCard({ lines = 3, hasImage = false, className = '' }) {
  return (
    <div className={`glass-card p-6 rounded-3xl border border-slate-200/80 space-y-4 ${className}`}>
      {hasImage && (
        <div className="w-full h-48 rounded-2xl skeleton-shimmer mb-4" />
      )}
      <div className="h-6 w-3/4 rounded-xl skeleton-shimmer" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 rounded-lg skeleton-shimmer"
            style={{ width: `${100 - i * 15}%` }}
          />
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <div className="h-9 w-24 rounded-xl skeleton-shimmer" />
        <div className="h-9 w-20 rounded-xl skeleton-shimmer" />
      </div>
    </div>
  );
}

export function SkeletonMetric() {
  return (
    <div className="glass-card p-6 rounded-3xl border border-slate-200/80 space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-4 w-28 rounded-md skeleton-shimmer" />
        <div className="w-8 h-8 rounded-xl skeleton-shimmer" />
      </div>
      <div className="h-10 w-24 rounded-lg skeleton-shimmer" />
      <div className="h-4 w-36 rounded-md skeleton-shimmer" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="glass-card rounded-3xl border border-slate-200/80 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between">
        <div className="h-6 w-40 rounded-md skeleton-shimmer" />
        <div className="h-6 w-24 rounded-md skeleton-shimmer" />
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full skeleton-shimmer shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-1/3 rounded skeleton-shimmer" />
              <div className="h-3 w-1/4 rounded skeleton-shimmer" />
            </div>
            <div className="h-6 w-16 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
