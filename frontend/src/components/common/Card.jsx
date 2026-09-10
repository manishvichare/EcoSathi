import React from 'react';

/**
 * Modern Card Component - EcoSathi Redesign
 */
export default function Card({ children, className = '', onClick, title }) {
  return (
    <div
      onClick={onClick}
      className={`
        glass-card rounded-3xl border border-slate-200/80 shadow-sm
        transition-all duration-300 p-6 sm:p-8
        ${onClick ? 'cursor-pointer card-hover' : ''}
        ${className}
      `}
    >
      {title && (
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">{title}</h3>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      )}
      {children}
    </div>
  );
}