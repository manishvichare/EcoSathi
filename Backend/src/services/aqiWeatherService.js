// src/services/aqiWeatherService.js
// PRIMARY PROVIDER: Open-Meteo (ECMWF/Copernicus CAMS Atmospheric Model)
//   - Weather:     https://api.open-meteo.com/v1/forecast  (no API key needed)
//   - Air Quality: https://air-quality-api.open-meteo.com/v1/air-quality  (no API key)
//   - Geocoding:   https://geocoding-api.open-meteo.com/v1/search  (no API key)
// FALLBACK PROVIDER: OpenWeatherMap Real-time API (uses OPENWEATHER_API_KEY)
//
// Open-Meteo uses ECMWF high-resolution model (~1 km grid) and
// Copernicus CAMS for air quality — same data source as Google Weather/AQI.

const axios = require('axios');
const env = require('../config/env');

// ─────────────────────────────────────────────────────────────────────────────
// WMO Weather Code → Human Readable Condition
// ─────────────────────────────────────────────────────────────────────────────
const WMO_CODES = {
  0: 'Clear', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Rime Fog',
  51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
  56: 'Light Freezing Drizzle', 57: 'Heavy Freezing Drizzle',
  61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
  66: 'Light Freezing Rain', 67: 'Heavy Freezing Rain',
  71: 'Slight Snowfall', 73: 'Moderate Snowfall', 75: 'Heavy Snowfall',
  77: 'Snow Grains',
  80: 'Slight Rain Showers', 81: 'Moderate Rain Showers', 82: 'Violent Rain Showers',
  85: 'Slight Snow Showers', 86: 'Heavy Snow Showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with Slight Hail', 99: 'Thunderstorm with Heavy Hail',
};
const wmoDescription = (code) => WMO_CODES[code] || 'Clear';

// ─────────────────────────────────────────────────────────────────────────────
// AQI Category label (US EPA scale)
// ─────────────────────────────────────────────────────────────────────────────
function aqiCategory(aqi) {
  if (aqi == null) return 'Unknown';
  if (aqi <= 50)  return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

// ─────────────────────────────────────────────────────────────────────────────
// EPA Breakpoint AQI calculator (fallback when us_aqi is unavailable)
// ─────────────────────────────────────────────────────────────────────────────
const PM25_BREAKPOINTS = [
  { clow: 0.0,   chigh: 12.0,  ilow: 0,   ihigh: 50  },
  { clow: 12.1,  chigh: 35.4,  ilow: 51,  ihigh: 100 },
  { clow: 35.5,  chigh: 55.4,  ilow: 101, ihigh: 150 },
  { clow: 55.5,  chigh: 150.4, ilow: 151, ihigh: 200 },
  { clow: 150.5, chigh: 250.4, ilow: 201, ihigh: 300 },
  { clow: 250.5, chigh: 350.4, ilow: 301, ihigh: 400 },
  { clow: 350.5, chigh: 500.4, ilow: 401, ihigh: 500 },
];
const PM10_BREAKPOINTS = [
  { clow: 0,   chigh: 54,  ilow: 0,   ihigh: 50  },
  { clow: 55,  chigh: 154, ilow: 51,  ihigh: 100 },
  { clow: 155, chigh: 254, ilow: 101, ihigh: 150 },
  { clow: 255, chigh: 354, ilow: 151, ihigh: 200 },
  { clow: 355, chigh: 424, ilow: 201, ihigh: 300 },
  { clow: 425, chigh: 504, ilow: 301, ihigh: 400 },
  { clow: 505, chigh: 604, ilow: 401, ihigh: 500 },
];
function calcSubIndex(conc, bps) {
  if (conc == null || isNaN(conc) || conc < 0) return null;
  for (const bp of bps) {
    if (conc >= bp.clow && conc <= bp.chigh) {
      return Math.round(((bp.ihigh - bp.ilow) / (bp.chigh - bp.clow)) * (conc - bp.clow) + bp.ilow);
    }
  }
  const last = bps[bps.length - 1];
  return conc > last.chigh ? Math.min(500, Math.round(last.ihigh + (conc - last.chigh) * 0.5)) : 0;
}
function calculateEpaAqi(pm25, pm10) {
  const indices = [calcSubIndex(pm25, PM25_BREAKPOINTS), calcSubIndex(pm10, PM10_BREAKPOINTS)].filter(v => v !== null);
  return indices.length ? Math.max(...indices) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// City name aliases — normalise common alternate spellings before geocoding
// so Open-Meteo returns the correct Indian city.
// ─────────────────────────────────────────────────────────────────────────────
const CITY_ALIASES = {
  'bangalore': 'Bengaluru',
  'bombay':    'Mumbai',
  'calcutta':  'Kolkata',
  'madras':    'Chennai',
  'poona':     'Pune',
};

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY: Open-Meteo + Copernicus CAMS
// ─────────────────────────────────────────────────────────────────────────────
const fetchFromOpenMeteo = async (cityName, coords = null) => {
  // Normalise city name
  const normalised = CITY_ALIASES[cityName.toLowerCase()] || cityName;
  let lat, lon, resolvedName, resolvedCountry, resolvedTimezone;

  if (coords && coords.lat && coords.lng) {
    lat = coords.lat;
    lon = coords.lng;
    resolvedName = cityName;
    resolvedCountry = 'IN';
    resolvedTimezone = 'Asia/Kolkata';
  } else {
    const geoRes = await axios.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(normalised)}&count=5&language=en&format=json`,
      { timeout: 8000 }
    );
    const results = geoRes.data?.results || [];
    if (!results.length) throw new Error(`Open-Meteo geocoding: city not found — "${normalised}" (from "${cityName}")`);
    // Prefer India (IN) result; fall back to first result
    const place = results.find(r => r.country_code?.toUpperCase() === 'IN') || results[0];
    lat = place.latitude;
    lon = place.longitude;
    resolvedName    = place.name || cityName;
    resolvedCountry = (place.country_code || 'IN').toUpperCase();
    resolvedTimezone = place.timezone || 'Asia/Kolkata';
  }

  const weatherParams = 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,surface_pressure,cloud_cover';
  const aqParams      = 'us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone';
  const tz            = encodeURIComponent(resolvedTimezone);

  const [weatherRes, aqRes] = await Promise.all([
    axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${weatherParams}&timezone=${tz}`, { timeout: 8000 }),
    axios.get(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=${aqParams}&timezone=${tz}`, { timeout: 8000 }),
  ]);

  const wc = weatherRes.data?.current || {};
  const ac = aqRes.data?.current     || {};

  const pm25 = ac.pm2_5            ?? null;
  const pm10 = ac.pm10             ?? null;
  const no2  = ac.nitrogen_dioxide ?? null;
  const so2  = ac.sulphur_dioxide  ?? null;
  const co   = ac.carbon_monoxide  ?? null;
  const o3   = ac.ozone            ?? null;

  // Open-Meteo provides us_aqi pre-calculated on US EPA scale — use directly.
  const usAqi = ac.us_aqi != null ? Math.round(ac.us_aqi) : calculateEpaAqi(pm25, pm10);

  const condition   = wmoDescription(wc.weather_code ?? 0);
  const lastUpdated = wc.time ? new Date(wc.time).toISOString() : new Date().toISOString();

  return {
    isLive: true,
    provider: 'Open-Meteo (ECMWF/CAMS Atmospheric Model)',
    lastUpdated,
    location: { name: resolvedName, country: resolvedCountry, lat, lng: lon },
    aqi: usAqi,
    aqiCategory: aqiCategory(usAqi),
    aqiScale: 'US EPA AQI (0-500)',
    pollutants: { pm2_5: pm25, pm10, no2, so2, co, o3 },
    weather: {
      temp:          wc.temperature_2m       != null ? Math.round(wc.temperature_2m * 10) / 10 : null,
      feels_like:    wc.apparent_temperature != null ? Math.round(wc.apparent_temperature * 10) / 10 : null,
      humidity:      wc.relative_humidity_2m ?? null,
      pressure:      wc.surface_pressure     != null ? Math.round(wc.surface_pressure) : null,
      windSpeed:     wc.wind_speed_10m       != null ? Math.round(wc.wind_speed_10m * 10) / 10 : null,
      clouds:        wc.cloud_cover          ?? null,
      precipitation: wc.precipitation        ?? null,
      condition,
      description: condition.toLowerCase(),
      wmoCode:     wc.weather_code ?? 0,
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK: OpenWeatherMap
// ─────────────────────────────────────────────────────────────────────────────
const fetchFromOpenWeatherLive = async (cityName, coords = null) => {
  if (!env.OPENWEATHER_API_KEY) throw new Error('OPENWEATHER_API_KEY not configured');

  const weatherUrl = (coords && coords.lat && coords.lng)
    ? `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lng}&appid=${env.OPENWEATHER_API_KEY}&units=metric`
    : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${env.OPENWEATHER_API_KEY}&units=metric`;

  const weatherRes = await axios.get(weatherUrl, { timeout: 8000 });
  const wData = weatherRes.data;
  const lat   = wData.coord?.lat;
  const lon   = wData.coord?.lon;
  if (!lat || !lon) throw new Error(`OWM: no coords for ${cityName}`);

  const airRes = await axios.get(
    `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${env.OPENWEATHER_API_KEY}`,
    { timeout: 8000 }
  );
  const aData = airRes.data?.list?.[0];
  const comp  = aData?.components || {};
  const pm25  = comp.pm2_5 ?? null;
  const pm10  = comp.pm10  ?? null;
  const finalAqi = calculateEpaAqi(pm25, pm10) ?? ([0, 25, 65, 120, 175, 250][aData?.main?.aqi] || 50);

  return {
    isLive: true,
    provider: 'OpenWeatherMap (Fallback)',
    lastUpdated: aData?.dt ? new Date(aData.dt * 1000).toISOString() : new Date().toISOString(),
    location: { name: wData.name || cityName, country: wData.sys?.country || 'IN', lat, lng: lon },
    aqi: finalAqi,
    aqiCategory: aqiCategory(finalAqi),
    aqiScale: 'US EPA AQI (0-500)',
    pollutants: { pm2_5: pm25, pm10, no2: comp.no2 ?? null, so2: comp.so2 ?? null, co: comp.co ?? null, o3: comp.o3 ?? null },
    weather: {
      temp:        wData.main?.temp       != null ? Math.round(wData.main.temp * 10) / 10 : null,
      feels_like:  wData.main?.feels_like != null ? Math.round(wData.main.feels_like * 10) / 10 : null,
      humidity:    wData.main?.humidity   ?? null,
      pressure:    wData.main?.pressure   ?? null,
      windSpeed:   wData.wind?.speed      ?? null,
      clouds:      wData.clouds?.all      ?? null,
      condition:   wData.weather?.[0]?.main        || 'Clear',
      description: wData.weather?.[0]?.description || '',
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// History / Forecast  — Open-Meteo 5-day hourly (primary), OWM fallback
// ─────────────────────────────────────────────────────────────────────────────
const fetchPollutionHistoryOrForecast = async (lat, lon) => {
  // Primary: Open-Meteo hourly air quality forecast
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=us_aqi,pm2_5,pm10&timezone=Asia%2FKolkata&forecast_days=5`;
    const res    = await axios.get(url, { timeout: 10000 });
    const hourly = res.data?.hourly;
    if (!hourly?.time?.length) throw new Error('empty hourly response');

    const dailyMap = {};
    for (let i = 0; i < hourly.time.length; i++) {
      const dateStr = hourly.time[i].split('T')[0];
      if (!dailyMap[dateStr]) dailyMap[dateStr] = { aqi: [], pm2_5: [], pm10: [] };
      if (hourly.us_aqi[i] != null) dailyMap[dateStr].aqi.push(hourly.us_aqi[i]);
      if (hourly.pm2_5[i]  != null) dailyMap[dateStr].pm2_5.push(hourly.pm2_5[i]);
      if (hourly.pm10[i]   != null) dailyMap[dateStr].pm10.push(hourly.pm10[i]);
    }
    const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

    return Object.entries(dailyMap).map(([date, vals]) => ({
      date,
      aqi:   avg(vals.aqi),
      pm2_5: vals.pm2_5.length ? Math.round(avg(vals.pm2_5) * 10) / 10 : null,
      pm10:  vals.pm10.length  ? Math.round(avg(vals.pm10)  * 10) / 10 : null,
    }));
  } catch (err) {
    console.warn('⚠️ Open-Meteo forecast failed, trying OWM:', err.message);
  }

  // Fallback: OpenWeatherMap air pollution forecast
  if (!env.OPENWEATHER_API_KEY) return [];
  try {
    const res  = await axios.get(
      `https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${env.OPENWEATHER_API_KEY}`,
      { timeout: 8000 }
    );
    const list = res.data?.list || [];
    const seenDays = new Set();
    const pts = [];
    for (const item of list) {
      const dateStr = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!seenDays.has(dateStr)) {
        seenDays.add(dateStr);
        const c = item.components || {};
        pts.push({
          date:  dateStr,
          aqi:   calculateEpaAqi(c.pm2_5, c.pm10) ?? ([0, 25, 65, 120, 175, 250][item.main?.aqi] || 50),
          pm2_5: c.pm2_5 ?? null,
          pm10:  c.pm10  ?? null,
        });
      }
    }
    return pts;
  } catch (err) {
    console.warn('⚠️ OWM forecast fallback also failed:', err.message);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Public exports
// ─────────────────────────────────────────────────────────────────────────────

/**
 * getLiveTelemetry — primary entry point.
 * Open-Meteo/CAMS first; falls back to OpenWeatherMap on error.
 */
exports.getLiveTelemetry = async (cityName, coords = null) => {
  try {
    const data = await fetchFromOpenMeteo(cityName, coords);
    console.log(`✅ [Open-Meteo] ${data.location.name}: AQI=${data.aqi} (${data.aqiCategory}), Temp=${data.weather.temp}°C, Hum=${data.weather.humidity}%`);
    return data;
  } catch (err) {
    console.warn(`⚠️ Open-Meteo failed for "${cityName}": ${err.message} — falling back to OpenWeatherMap`);
    const data = await fetchFromOpenWeatherLive(cityName, coords);
    console.log(`✅ [OWM Fallback] ${data.location.name}: AQI=${data.aqi}, Temp=${data.weather.temp}°C`);
    return data;
  }
};

/** getAqiAndWeather — backwards-compatible shim for cron job */
exports.getAqiAndWeather = async (cityName, coords = null) => {
  const t = await exports.getLiveTelemetry(cityName, coords);
  return { aqi: t.aqi, weather: t.weather, provider: t.provider, lastUpdated: t.lastUpdated };
};

exports.fetchPollutionHistoryOrForecast = fetchPollutionHistoryOrForecast;