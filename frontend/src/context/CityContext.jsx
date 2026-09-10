import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { DEFAULTS } from '../utils/constants';
import { getCityAqi, getCityEnvironment } from '../services/cityService';

/**
 * CityContext - Global single source of truth for city selection & metrics.
 *
 * Two-phase loading strategy:
 *  Phase 1 (fast, ~1-2 s): GET /api/environment/:city/aqi
 *    → paints AQI, temperature, humidity, provider, lastUpdated immediately.
 *  Phase 2 (full, ~2-4 s): GET /api/environment/:city/today
 *    → fills in health score, green cover, CO2/O2 metrics.
 */
export const CityContext = createContext();

export function CityProvider({ children }) {
  const [selectedCity, setSelectedCity] = useState(DEFAULTS.CITY || 'Pune');
  const [cityData, setCityData]         = useState(null);
  const [loading, setLoading]           = useState(true);   // true only until Phase 1 done
  const [fullLoading, setFullLoading]   = useState(false);  // true while Phase 2 is running
  const [error, setError]               = useState(null);

  // Request counter to avoid race conditions when switching cities rapidly
  const currentRequestId = useRef(0);

  /**
   * Fetch city data using two-phase loading.
   * Phase 1 loads instantly; Phase 2 enriches in background.
   */
  const fetchCityData = async (cityName) => {
    const requestId = ++currentRequestId.current;
    setLoading(true);
    setFullLoading(false);
    setError(null);
    setCityData(null);

    // ── Phase 1: fast AQI-only ──────────────────────────────────
    try {
      const aqiRes = await getCityAqi(cityName);
      if (requestId !== currentRequestId.current) return; // city changed mid-flight

      if (aqiRes && aqiRes.success) {
        // Merge fast payload into cityData so AQI card renders immediately.
        // health score / green cover will be null until Phase 2 completes.
        setCityData({
          city:        aqiRes.city || cityName,
          aqi:         aqiRes.aqi,
          aqiScale:    aqiRes.aqiScale,
          pollutants:  aqiRes.pollutants,
          weather:     aqiRes.weather,
          provider:    aqiRes.provider,
          lastUpdated: aqiRes.lastUpdated,
          isLive:      true,
          // placeholders until Phase 2:
          healthScore:            null,
          greenCoverPercent:      null,
          estimatedTreeCount:     null,
          co2AbsorbedPerYear:     null,
          o2ReleasedPerYear:      null,
          o2RequiredForPopulation: null,
          o2Deficit:              null,
          greenCoverSource:       null,
        });
      }
    } catch (aqiErr) {
      if (requestId !== currentRequestId.current) return;
      console.warn(`Phase 1 AQI fetch failed for ${cityName}:`, aqiErr.message);
      // Don't set error yet — Phase 2 might still succeed.
    } finally {
      if (requestId === currentRequestId.current) {
        setLoading(false);    // Hide main spinner after Phase 1
        setFullLoading(true); // Show subtle enrichment indicator
      }
    }

    // ── Phase 2: full data (green cover, health score, CO2/O2) ──
    try {
      const fullRes = await getCityEnvironment(cityName);
      if (requestId !== currentRequestId.current) return;

      if (fullRes && fullRes.data) {
        setCityData(fullRes.data);
        setError(null);
      } else if (!cityData) {
        setError(`No data returned for ${cityName}.`);
      }
    } catch (fullErr) {
      if (requestId !== currentRequestId.current) return;
      console.warn(`Phase 2 full fetch failed for ${cityName}:`, fullErr.message);
      // If Phase 1 succeeded, cityData is already set; only show error if nothing loaded.
      if (!cityData) {
        setError(`Could not fetch environmental data for ${cityName}.`);
      }
    } finally {
      if (requestId === currentRequestId.current) {
        setFullLoading(false);
      }
    }
  };

  /**
   * Change selected city — triggers two-phase reload.
   * @param {string} cityName
   */
  const changeCity = (cityName) => {
    if (!cityName || cityName === selectedCity) return;
    setSelectedCity(cityName);
    fetchCityData(cityName);
  };

  useEffect(() => {
    fetchCityData(selectedCity);
  }, []);

  const value = {
    selectedCity,
    cityData,
    loading,       // true only until Phase 1 finishes
    fullLoading,   // true while Phase 2 is still enriching
    error,
    changeCity,
    refetchCityData: () => fetchCityData(selectedCity),
  };

  return (
    <CityContext.Provider value={value}>
      {children}
    </CityContext.Provider>
  );
}

export function useCityContext() {
  return useContext(CityContext);
}