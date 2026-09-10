import { useState, useEffect } from 'react';
import { getCityData, getCityHistoryData, getAvailableCities } from '../../services/mockData';
import { useCity } from '../../hooks/useCity';
import Loader from '../common/Loader';
import Card from '../common/Card';

// Dashboard widgets
import AQIWidget from './AQIWidget';
import HealthScoreGauge from './HealthScoreGauge';
import CO2Widget from './CO2Widget';
import OxygenWidget from './OxygenWidget';
import GreenCoverMap from './GreenCoverMap';
import ProgressGraph from './ProgressGraph';

/**
 * CityDashboard Component
 * 
 * Main dashboard showing:
 * - City selection dropdown
 * - AQI, Temperature, Humidity widget
 * - Environmental Health Score gauge
 * - CO2 absorption metrics
 * - Oxygen supply vs demand
 * - Green cover map
 * - 30-day trend chart
 * 
 * Manages:
 * - Loading states
 * - Error handling
 * - City selection
 * - Data fetching
 */
export default function CityDashboard() {
  const { selectedCity, changeCity } = useCity();
  const [cityData, setCityData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const availableCities = getAvailableCities();

  // Fetch data when city changes
  useEffect(() => {
    fetchCityData(selectedCity);
  }, [selectedCity]);

  /**
   * Fetch environmental data for selected city
   */
  const fetchCityData = async (cityName) => {
    setLoading(true);
    setError(null);

    try {
      // In real app, this would be API calls:
      // const response = await api.get(`/environment/${cityName}/today`);
      // setCityData(response.data);

      // For now, use mock data
      const data = getCityData(cityName);
      const history = getCityHistoryData(cityName);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      setCityData(data);
      setHistoryData(history);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Error fetching city data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <Loader message="Loading environmental data..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Dashboard</h1>
        <Card>
          <div className="text-center py-12">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => fetchCityData(selectedCity)}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // Empty state
  if (!cityData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Dashboard</h1>
        <Card>
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-gray-600">No data available for selected city</p>
          </div>
        </Card>
      </div>
    );
  }

  // Get city coordinates for map
  const cityCoordinates = {
    Pune: { lat: 18.5204, lng: 73.8567 },
    Delhi: { lat: 28.6139, lng: 77.209 },
    Mumbai: { lat: 19.076, lng: 72.8777 },
    Bangalore: { lat: 12.9716, lng: 77.5946 },
  };

  const coords = cityCoordinates[selectedCity] || cityCoordinates.Pune;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Environmental Dashboard
        </h1>
        <p className="text-gray-600">
          Real-time environmental health monitoring for {selectedCity}
        </p>
      </div>

      {/* City Selector */}
      <Card className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <label htmlFor="city-select" className="font-medium text-gray-700">
            📍 Select City:
          </label>
          <select
            id="city-select"
            value={selectedCity}
            onChange={(e) => changeCity(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 font-medium"
          >
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-600 ml-auto">
            Last updated: {new Date(cityData.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </Card>

      {/* Main Metrics Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* AQI Widget */}
        <div className="lg:col-span-1">
          <AQIWidget
            aqi={cityData.aqi}
            temperature={cityData.temperature}
            humidity={cityData.humidity}
          />
        </div>

        {/* Health Score Gauge */}
        <div className="lg:col-span-1">
          <HealthScoreGauge score={cityData.healthScore} />
        </div>

        {/* CO2 Widget */}
        <div className="lg:col-span-1">
          <CO2Widget
            co2Absorbed={cityData.co2Absorbed}
            treeCount={cityData.treeCount}
            co2Emitted={cityData.co2Emitted}
          />
        </div>

        {/* Oxygen Widget */}
        <div className="lg:col-span-1">
          <OxygenWidget
            o2Released={cityData.o2Released}
            o2Required={cityData.o2Required}
          />
        </div>
      </div>

      {/* Map Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Green Cover Map */}
        <div className="lg:col-span-1">
          <GreenCoverMap
            cityName={selectedCity}
            lat={coords.lat}
            lng={coords.lng}
            greenCoverPercent={cityData.greenCoverPercent}
          />
        </div>

        {/* Quick Stats Card */}
        <div>
          <Card title="City Overview">
            <div className="space-y-4">
              <div className="pb-4 border-b border-gray-200">
                <p className="text-gray-600 text-sm mb-1">City</p>
                <p className="text-2xl font-bold text-gray-800">{selectedCity}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-xs uppercase font-bold mb-1">
                    Green Cover
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {cityData.greenCoverPercent}%
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-xs uppercase font-bold mb-1">
                    Tree Count
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {(cityData.treeCount / 1000000).toFixed(1)}M
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-xs uppercase font-bold mb-1">
                    Population
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {(cityData.o2Required / 740 / 1000000).toFixed(1)}M
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-xs uppercase font-bold mb-1">
                    Health Score
                  </p>
                  <p className="text-2xl font-bold text-primary-600">
                    {cityData.healthScore}/100
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  <strong>Data Source:</strong> Mock data for demonstration
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  <strong>Updated:</strong> {new Date(cityData.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Progress Graph Row */}
      <div className="mb-8">
        <ProgressGraph data={historyData} />
      </div>

      {/* Info Section */}
      <Card className="bg-blue-50 border-l-4 border-l-blue-500">
        <div className="flex gap-4">
          <div className="text-2xl">ℹ️</div>
          <div>
            <h3 className="font-bold text-blue-900 mb-2">About This Dashboard</h3>
            <p className="text-blue-800 text-sm mb-2">
              This dashboard uses <strong>mock data for demonstration</strong>. In production:
            </p>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>
                • <strong>AQI Data:</strong> From WAQI API (api.waqi.info) or OpenWeatherMap Air Pollution API
              </li>
              <li>
                • <strong>Green Cover:</strong> OpenStreetMap Overpass API (parks, forests, trees)
              </li>
              <li>
                • <strong>Maps:</strong> Leaflet with OpenStreetMap tiles
              </li>
              <li>
                • <strong>Weather:</strong> Temperature and humidity from OpenWeatherMap
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}