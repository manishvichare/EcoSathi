import CityCompareView from '../components/comparison/CityCompareView';
import { Scale, MapPin } from 'lucide-react';

/**
 * Modern Compare Page
 */
export default function Compare() {
  return (
    <div className="bg-slate-50/50 min-h-screen pb-20">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 border-b border-slate-200/80 py-12 lg:py-14">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-emerald-200 shadow-2xs">
              <Scale className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                Cross-City Environmental Telemetry
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              City Environmental Comparison
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              Compare urban air quality, green forest canopy, oxygen demand, and carbon sequestration capacity across metropolises.
            </p>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 sm:px-6 mt-8">
        <CityCompareView />
      </main>
    </div>
  );
}
