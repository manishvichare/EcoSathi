import React from 'react';
import { formatCO2, formatCompactNumber } from '../../utils/formatters';
import { Globe, TreePine, ArrowUpRight } from 'lucide-react';

/**
 * Modern CO2 Widget Component
 */
export default function CO2Widget({ co2Absorbed = 9900000, treeCount = 450000, co2Emitted = 15000000, loading = false }) {
  if (loading) {
    return (
      <div className="glass-card p-6 rounded-3xl border border-slate-200/80 animate-pulse space-y-4">
        <div className="h-4 w-28 bg-slate-200 rounded" />
        <div className="h-10 w-36 bg-slate-200 rounded-xl" />
        <div className="h-14 w-full bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  const offsetPercent = Math.min(100, Math.round((co2Absorbed / co2Emitted) * 100));

  return (
    <div className="glass-card p-6 rounded-3xl border border-slate-200/80 card-hover flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
            CO₂ Absorption
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
          Annual Metric
        </span>
      </div>

      {/* Main Digits */}
      <div className="space-y-1">
        <p className="text-xs text-slate-500 font-bold">Urban Tree Canopy Sequestering</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-black text-emerald-700 tracking-tight">
            {formatCompactNumber(co2Absorbed)}
          </span>
          <span className="text-xs font-extrabold text-slate-400">kg CO₂/yr</span>
        </div>
      </div>

      {/* Offset Comparison Progress */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-[11px] font-bold">
          <span className="text-slate-600">Emissions Offset</span>
          <span className="text-emerald-700">{offsetPercent}% Offset</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
            style={{ width: `${offsetPercent}%` }}
          />
        </div>
      </div>

      {/* Tree Count Footnote */}
      <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
          <TreePine className="w-4 h-4 text-emerald-700" />
          <span>Active Trees</span>
        </div>
        <span className="font-extrabold text-xs text-emerald-800">
          {formatCompactNumber(treeCount)}
        </span>
      </div>
    </div>
  );
}