// src/controllers/comparisonController.js
// Handles: GET /api/compare?cities=a,b
// Compares verified environmental telemetry across cities.

const { supabase } = require('../config/db');
const aqiWeatherService = require('../services/aqiWeatherService');
const healthScoreService = require('../services/healthScoreService');
const co2OxygenCalcService = require('../services/co2OxygenCalcService');
const greenCoverService = require('../services/greenCoverService');

// GET /api/compare?cities=Pune,Mumbai
exports.compareCities = async (req, res) => {
  try {
    const citiesParam = req.query.cities;

    if (!citiesParam) {
      return res.status(400).json({ success: false, message: 'Provide ?cities=City1,City2' });
    }

    const cityNames = citiesParam.split(',').map((c) => c.trim()).filter(Boolean);

    if (cityNames.length < 2) {
      return res.status(400).json({ success: false, message: 'Provide at least 2 cities to compare' });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const results = await Promise.all(
      cityNames.map(async (name) => {
        try {
          const { data: city } = await supabase
            .from('cities')
            .select('id, name, population, area_sq_km, center_lat, center_lng')
            .ilike('name', name)
            .maybeSingle();

          // Try to get today's record from DB first
          let todayData = null;
          if (city?.id) {
            const { data } = await supabase
              .from('environment_data')
              .select('*')
              .eq('city_id', city.id)
              .gte('date', startOfToday.toISOString())
              .order('date', { ascending: false })
              .limit(1)
              .maybeSingle();
            todayData = data;
          }

          // If no fresh DB record today, fetch live telemetry directly
          if (!todayData) {
            const telemetry = await aqiWeatherService.getLiveTelemetry(city?.name || name);
            const gcData = await greenCoverService.getGreenCover(city || { name });
            const greenCoverPercent = gcData.greenCoverPercent;
            const estimatedTreeCount = gcData.estimatedTreeCount;

            const { co2AbsorbedPerYear, o2ReleasedPerYear, o2RequiredForPopulation } =
              co2OxygenCalcService.calculate({
                estimatedTreeCount,
                population,
              });

            const healthScore = healthScoreService.calculate({
              greenCoverPercent,
              aqi: telemetry.aqi,
              o2ReleasedPerYear,
              o2RequiredForPopulation,
              co2AbsorbedPerYear,
            });

            todayData = {
              aqi: telemetry.aqi,
              health_score: healthScore,
              green_cover_percent: greenCoverPercent,
              co2_absorbed_per_year: co2AbsorbedPerYear,
              o2_released_per_year: o2ReleasedPerYear,
              weather: telemetry.weather,
            };
          }

          const aqiVal = todayData.aqi;
          const greenVal = todayData.green_cover_percent;
          const healthVal = todayData.health_score;

          return {
            city: city?.name || name,
            name: city?.name || name,
            found: true,
            aqi: aqiVal,
            greenCover: greenVal,
            healthScore: healthVal,
            co2Balance: Math.min(100, Math.max(10, Math.round((todayData.co2_absorbed_per_year || 5000000) / 150000))),
            o2Balance: Math.min(100, Math.max(10, Math.round((todayData.o2_released_per_year || 20000000) / 500000))),
            data: todayData,
          };
        } catch (fetchErr) {
          return {
            city: name,
            name,
            found: false,
            message: `Could not retrieve live metrics: ${fetchErr.message}`,
          };
        }
      })
    );

    // Format output compatible with frontend compareService (both .cities and .results)
    res.status(200).json({
      success: true,
      compared: results.length,
      cities: results,
      results,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};