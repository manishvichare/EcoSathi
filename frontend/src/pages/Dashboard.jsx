import { useState, useEffect } from 'react';
import { useCity } from '../hooks/useCity';
import { getCityHistory } from '../services/cityService';
import AQIWidget from '../components/dashboard/AQIWidget';
import HealthScoreGauge from '../components/dashboard/HealthScoreGauge';
import CO2Widget from '../components/dashboard/CO2Widget';
import OxygenWidget from '../components/dashboard/OxygenWidget';
import GreenCoverMap from '../components/dashboard/GreenCoverMap';
import ProgressGraph from '../components/dashboard/ProgressGraph';
import EcoGuidanceWidget from '../components/dashboard/EcoGuidanceWidget';
import { SkeletonMetric } from '../components/common/SkeletonLoader';
import { Activity, MapPin, Sparkles, RefreshCw, ShieldCheck } from 'lucide-react';

/**
 * Modern Environmental Dashboard Page
 */
export default function Dashboard() {
  const { selectedCity, cityData, changeCity, loading } = useCity();
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Extract metrics directly from live cityData
  const aqi = cityData?.aqi != null ? Math.round(Number(cityData.aqi)) : null;
  const temp = cityData?.weather?.temp != null ? Math.round(Number(cityData.weather.temp)) : null;
  const humidity = cityData?.weather?.humidity != null ? Math.round(Number(cityData.weather.humidity)) : null;
  const healthScore = cityData?.healthScore != null ? Math.round(Number(cityData.healthScore)) : null;
  const greenCover = cityData?.greenCoverPercent != null ? Number(cityData.greenCoverPercent) : 20.0;
  const treeCount = cityData?.estimatedTreeCount != null ? Number(cityData.estimatedTreeCount) : 400000;
  const co2Absorbed = cityData?.co2AbsorbedPerYear != null ? Number(cityData.co2AbsorbedPerYear) : 8000000;
  const co2Emitted = cityData?.co2Emitted || 15000000;
  const o2Released = cityData?.o2ReleasedPerYear != null ? Number(cityData.o2ReleasedPerYear) : 45000000;
  const o2Required = cityData?.o2RequiredForPopulation != null ? Number(cityData.o2RequiredForPopulation) : 800000000;
  const lat = cityData?.location?.lat || 18.5204;
  const lng = cityData?.location?.lng || 73.8567;
  const provider = cityData?.provider || 'OpenWeatherMap Real-time Sensors';
  const lastUpdated = cityData?.lastUpdated
    ? new Date(cityData.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  // Load genuine historical telemetry / forecast records
  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      setHistoryLoading(true);
      try {
        const res = await getCityHistory(selectedCity, '30d');
        if (!cancelled && res?.history) {
          setHistoryData(res.history);
        }
      } catch (e) {
        if (!cancelled) setHistoryData([]);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }
    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [selectedCity]);

  return (
    <div className="bg-slate-50/50 min-h-screen pb-20">
      
      {/* ========================================================================
          DASHBOARD HEADER & REAL-TIME CONTROLS
          ======================================================================== */}
      <section className="bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 border-b border-slate-200/80 py-10 lg:py-14">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                  Live Sensor Network Active
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-bold text-slate-500">{provider}</span>
                {lastUpdated && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-400">Updated {lastUpdated}</span>
                  </>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Urban Environmental Dashboard
              </h1>
              <p className="text-sm text-slate-600 max-w-xl">
                Real-time atmospheric telemetry, urban forest coverage, and carbon-oxygen balance for{' '}
                <strong>{selectedCity}</strong>.
              </p>
            </div>

            {/* City Selection Pill */}
            <div className="glass-card p-2 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5 pl-3">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">City:</span>
              </div>
              <select
                id="city-select"
                value={selectedCity}
                onChange={(e) => changeCity(e.target.value)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 rounded-xl font-extrabold text-slate-900 text-xs focus:outline-none cursor-pointer border border-slate-200 transition-colors"
              >
                <option value="Pune">Pune, MH</option>
                <option value="Delhi">Delhi, NCR</option>
                <option value="Mumbai">Mumbai, MH</option>
                <option value="Bangalore">Bangalore, KA</option>
                <option value="Ratnagiri">Ratnagiri, MH</option>
              </select>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================
          MAIN DASHBOARD WIDGETS
          ======================================================================== */}
      <main className="container mx-auto px-4 sm:px-6 -mt-4 space-y-8">
        
        {/* Row 1: Core 4 Telemetry Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <>
              <SkeletonMetric />
              <SkeletonMetric />
              <SkeletonMetric />
              <SkeletonMetric />
            </>
          ) : (
            <>
              <AQIWidget
                aqi={aqi}
                temperature={temp}
                humidity={humidity}
                pollutants={cityData?.pollutants}
              />
              <HealthScoreGauge score={healthScore} />
              <CO2Widget co2Absorbed={co2Absorbed} treeCount={treeCount} co2Emitted={co2Emitted} />
              <OxygenWidget o2Released={o2Released} o2Required={o2Required} />
            </>
          )}
        </div>

        {/* Row 2: Eco Guidance & Interactive Leaflet Green Canopy Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <EcoGuidanceWidget selectedCity={selectedCity} />
          </div>
          <div className="lg:col-span-7">
            <GreenCoverMap
              cityName={selectedCity}
              lat={lat}
              lng={lng}
              greenCoverPercent={greenCover}
            />
          </div>
        </div>

        {/* Row 3: 30-Day Environmental Progress & Future Forecast Trend */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-md">
          <ProgressGraph data={historyData} />
        </div>

      </main>

    </div>
  );
}