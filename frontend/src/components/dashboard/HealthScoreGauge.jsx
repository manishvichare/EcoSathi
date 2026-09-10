import React from 'react';
import { Activity, ShieldCheck } from 'lucide-react';

/**
 * Modern Health Score Gauge Component
 */
export default function HealthScoreGauge({ score = 78, loading = false }) {
  if (loading) {
    return (
      <div className="glass-card p-6 rounded-3xl border border-slate-200/80 animate-pulse space-y-4">
        <div className="h-4 w-32 bg-slate-200 rounded" />
        <div className="h-32 w-32 rounded-full bg-slate-200 mx-auto" />
      </div>
    );
  }

  const roundedScore = Math.round(score);
  const strokeDashoffset = 263.8 - (263.8 * roundedScore) / 100;

  const getHealthStatus = (s) => {
    if (s >= 80) return { label: 'Optimal Ecosystem', color: 'text-emerald-700 bg-emerald-100 border-emerald-300' };
    if (s >= 65) return { label: 'Good Conditions', color: 'text-teal-700 bg-teal-100 border-teal-300' };
    if (s >= 50) return { label: 'Moderate Balance', color: 'text-amber-700 bg-amber-100 border-amber-300' };
    return { label: 'Action Required', color: 'text-rose-700 bg-rose-100 border-rose-300' };
  };

  const status = getHealthStatus(roundedScore);

  return (
    <div className="glass-card p-6 rounded-3xl border border-slate-200/80 card-hover flex flex-col justify-between space-y-4 text-center">
      {/* Header */}
      <div className="flex items-center justify-between text-left">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
            Health Score
          </span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Circular Gauge Visualizer */}
      <div className="relative w-36 h-36 mx-auto my-1 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="url(#healthGaugeGrad)"
            strokeWidth="8"
            strokeDasharray="263.8"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
          <defs>
            <linearGradient id="healthGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl sm:text-4xl font-black text-slate-900">{roundedScore}</span>
          <span className="text-[10px] text-slate-400 font-extrabold uppercase">Out of 100</span>
        </div>
      </div>

      {/* Health factor breakdown note */}
      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-around">
        <span>Canopy: 35%</span>
        <span>•</span>
        <span>Clean Air: 35%</span>
        <span>•</span>
        <span>O₂ / CO₂: 30%</span>
      </div>
    </div>
  );
}