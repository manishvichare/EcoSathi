import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Card from '../common/Card';
import { compareCities, getAvailableCities } from '../../services/compareService';

const METRICS = [
  { key: 'aqi', label: 'AQI', color: '#ef4444' },
  { key: 'greenCover', label: 'Green Cover (%)', color: '#16a34a' },
  { key: 'healthScore', label: 'Health Score', color: '#3b82f6' },
  { key: 'co2Balance', label: 'CO2 Balance', color: '#f59e0b' },
  { key: 'o2Balance', label: 'O2 Balance', color: '#14b8a6' },
];

const MIN_CITIES = 2;

/**
 * CityCompareView Component
 *
 * Lets the user pick 2+ cities and compares them on AQI, green cover,
 * health score, CO2 balance, and O2 balance — as cards and a bar chart.
 *
 * Self-contained: owns its own city selection, fetching (via
 * compareService), loading/error/empty states.
 */
export default function CityCompareView() {
  const availableCities = getAvailableCities();

  const [selectedCities, setSelectedCities] = useState(
    availableCities.slice(0, MIN_CITIES)
  );
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const validSelection = selectedCities.filter(Boolean);
  const hasEnoughCities = validSelection.length >= MIN_CITIES;

  useEffect(() => {
    if (!hasEnoughCities) {
      setData([]);
      return;
    }

    let cancelled = false;

    async function loadComparison() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await compareCities(validSelection);
        if (!cancelled) {
          setData(result.cities || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load comparison data');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadComparison();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(validSelection)]);

  const handleCityChange = (index, value) => {
    setSelectedCities((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddCity = () => {
    const remaining = availableCities.find((c) => !selectedCities.includes(c));
    setSelectedCities((prev) => [...prev, remaining || '']);
  };

  const handleRemoveCity = (index) => {
    setSelectedCities((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* City selectors */}
      <Card title="Select Cities to Compare">
        <div className="flex flex-wrap gap-3">
          {selectedCities.map((city, index) => (
            <div key={index} className="flex items-center gap-1">
              <select
                value={city}
                onChange={(e) => handleCityChange(index, e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="">-- Select City --</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {selectedCities.length > MIN_CITIES && (
                <button
                  type="button"
                  onClick={() => handleRemoveCity(index)}
                  aria-label={`Remove city selector ${index + 1}`}
                  className="w-8 h-8 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddCity}
            disabled={selectedCities.length >= availableCities.length}
            className="px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:border-primary-600 hover:text-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Add City
          </button>
        </div>
      </Card>

      {/* Empty state: not enough cities selected */}
      {!hasEnoughCities && (
        <Card>
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🏙️</div>
            <p className="text-gray-600 font-medium">Select at least 2 cities to compare</p>
          </div>
        </Card>
      )}

      {/* Loading state */}
      {hasEnoughCities && isLoading && (
        <Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {validSelection.map((_, i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </Card>
      )}

      {/* Error state */}
      {hasEnoughCities && !isLoading && error && (
        <Card>
          <div className="text-center py-10">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-red-700 font-bold">Couldn't load comparison data</p>
            <p className="text-gray-500 text-sm mt-1">{error}</p>
          </div>
        </Card>
      )}

      {/* Results */}
      {hasEnoughCities && !isLoading && !error && data.length > 0 && (
        <>
          {/* Comparison cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((cityData) => (
              <Card key={cityData.city}>
                <h3 className="font-bold text-gray-800 text-lg mb-3">{cityData.city}</h3>
                <div className="space-y-2">
                  {METRICS.map((metric) => (
                    <div key={metric.key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{metric.label}</span>
                      <span className="font-bold text-gray-800">
                        {cityData[metric.key]}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Chart */}
          <Card title="Metric Comparison">
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="city" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  {METRICS.map((metric) => (
                    <Bar
                      key={metric.key}
                      dataKey={metric.key}
                      name={metric.label}
                      fill={metric.color}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}