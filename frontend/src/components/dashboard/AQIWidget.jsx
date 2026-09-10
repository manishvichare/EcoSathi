import React from 'react';
import { Wind, Thermometer, Droplets, Info } from 'lucide-react';

/**
 * Modern AQI Widget Component
 */
export default function AQIWidget({ aqi = 72, temperature = 24, humidity = 60, pollutants = null, loading = false }) {
  if (loading) {
    return (
      <div className="glass-card p-6 rounded-3xl border border-slate-200/80 animate-pulse space-y-4">
        <div className="h-4 w-28 bg-slate-200 rounded" />
        <div className="h-12 w-24 bg-slate-200 rounded-xl" />
        <div className="h-16 w-full bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  const getStatus = (val) => {
    if (val == null) return { label: 'Loading...', color: 'text-slate-600 bg-slate-100 border-slate-300', advice: 'Connecting to live environmental sensor...' };
    if (val <= 50) return { label: 'Good', color: 'text-emerald-700 bg-emerald-100 border-emerald-300', advice: 'Air quality is satisfactory and poses little risk.' };
    if (val <= 100) return { label: 'Moderate', color: 'text-teal-700 bg-teal-100 border-teal-300', advice: 'Acceptable; sensitive individuals should monitor outdoor time.' };
    if (val <= 200) return { label: 'Poor', color: 'text-amber-700 bg-amber-100 border-amber-300', advice: 'Breathing discomfort possible for active children & elderly.' };
    if (val <= 300) return { label: 'Very Poor', color: 'text-orange-700 bg-orange-100 border-orange-300', advice: 'Significant pollution. Wear a mask outdoors.' };
    return { label: 'Hazardous', color: 'text-rose-700 bg-rose-100 border-rose-300', advice: 'Severe health warning. Avoid prolonged outdoor exertion.' };
  };

  const status = getStatus(aqi);

  return (
    <div className="glass-card p-6 rounded-3xl border border-slate-200/80 card-hover flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Wind className="w-4 h-4" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
            Air Quality Index
          </span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Main AQI Digits */}
      <div className="flex items-baseline gap-2">
        <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
          {aqi != null ? Math.round(aqi) : '--'}
        </span>
        <span className="text-xs font-extrabold text-slate-400 uppercase">US AQI</span>
      </div>

      {/* Ambient Progress Bar */}
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, (((aqi || 0)) / 350) * 100)}%` }}
        />
      </div>

      {/* Weather & Live Pollutant Row */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <Thermometer className="w-3.5 h-3.5 text-amber-500" />
            <span>Temp</span>
          </div>
          <span className="font-extrabold text-sm text-slate-900">{temperature != null ? `${Math.round(temperature)}°C` : '--'}</span>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <Droplets className="w-3.5 h-3.5 text-teal-500" />
            <span>Humidity</span>
          </div>
          <span className="font-extrabold text-sm text-slate-900">{humidity != null ? `${Math.round(humidity)}%` : '--'}</span>
        </div>
      </div>

      {/* Real Pollutant Sensors Pill */}
      {pollutants && (pollutants.pm2_5 != null || pollutants.pm10 != null) && (
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50/80 rounded-xl border border-slate-100 text-[10px] text-slate-500 font-bold">
          <span>PM2.5: <strong className="text-slate-800">{pollutants.pm2_5 ?? '--'}</strong> µg/m³</span>
          <span className="text-slate-300">•</span>
          <span>PM10: <strong className="text-slate-800">{pollutants.pm10 ?? '--'}</strong> µg/m³</span>
        </div>
      )}

      <p className="text-[11px] text-slate-400 leading-tight">
        {status.advice}
      </p>
    </div>
  );
}