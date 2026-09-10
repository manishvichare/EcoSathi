import React from 'react';
import { formatCompactNumber } from '../../utils/formatters';
import { Sparkles, Users, Wind } from 'lucide-react';

/**
 * Modern Oxygen Widget Component
 */
export default function OxygenWidget({ o2Released = 53100000, o2Required = 856000000, loading = false }) {
  if (loading) {
    return (
      <div className="glass-card p-6 rounded-3xl border border-slate-200/80 animate-pulse space-y-4">
        <div className="h-4 w-28 bg-slate-200 rounded" />
        <div className="h-10 w-36 bg-slate-200 rounded-xl" />
        <div className="h-14 w-full bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  const sufficiencyRatio = o2Released / (o2Required || 1);
  const sufficiencyPercent = Math.min(100, Math.round(sufficiencyRatio * 100));

  return (
    <div className="glass-card p-6 rounded-3xl border border-slate-200/80 card-hover flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Wind className="w-4 h-4" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
            Oxygen Indicator
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-300">
          Vital Metric
        </span>
      </div>

      {/* Main Digits */}
      <div className="space-y-1">
        <p className="text-xs text-slate-500 font-bold">Biomass Oxygen Release</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-black text-sky-700 tracking-tight">
            {formatCompactNumber(o2Released)}
          </span>
          <span className="text-xs font-extrabold text-slate-400">kg O₂/yr</span>
        </div>
      </div>

      {/* Sufficiency Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-[11px] font-bold">
          <span className="text-slate-600">Population Respiratory Share</span>
          <span className="text-sky-700">{sufficiencyPercent}% Met</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(5, sufficiencyPercent)}%` }}
          />
        </div>
      </div>

      {/* Population Respiratory Footnote */}
      <div className="p-3 bg-sky-50/70 rounded-2xl border border-sky-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
          <Users className="w-4 h-4 text-sky-700" />
          <span>Demand Baseline</span>
        </div>
        <span className="font-extrabold text-xs text-sky-800">
          {formatCompactNumber(o2Required)} kg
        </span>
      </div>
    </div>
  );
}