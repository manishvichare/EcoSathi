// src/jobs/dailyFetchJob.js
// node-cron job: once a day, for every City in the DB, fetch fresh AQI +
// weather + green cover data, run the section-6 formulas, and save the
// result as today's environment_data row.
//
// Call startDailyFetchJob() once from server.js after the DB connects.

const cron = require('node-cron');
const { supabase } = require('../config/db');

const aqiWeatherService = require('../services/aqiWeatherService');
const greenCoverService = require('../services/greenCoverService');
const co2OxygenCalcService = require('../services/co2OxygenCalcService');
const healthScoreService = require('../services/healthScoreService');

// Does the actual fetch-and-save for a single city row
const fetchAndStoreForCity = async (city) => {
  try {
    // 1. External data
    const { aqi, weather } = await aqiWeatherService.getAqiAndWeather(city.name);
    const { greenCoverPercent, estimatedTreeCount } = await greenCoverService.getGreenCover(city);

    // 2. Derived calculations (section 6 formulas)
    const { co2AbsorbedPerYear, o2ReleasedPerYear, o2RequiredForPopulation, o2Deficit } =
      co2OxygenCalcService.calculate({
        estimatedTreeCount,
        population: city.population,
      });

    const healthScore = healthScoreService.calculate({
      greenCoverPercent,
      aqi,
      o2ReleasedPerYear,
      o2RequiredForPopulation,
      co2AbsorbedPerYear,
    });

    // 3. Upsert today's environment_data row (one per city per day)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { error } = await supabase
      .from('environment_data')
      .upsert(
        {
          city_id: city.id,
          date: new Date().toISOString(),
          aqi,
          weather,
          green_cover_percent: greenCoverPercent,
          estimated_tree_count: estimatedTreeCount,
          co2_absorbed_per_year: co2AbsorbedPerYear,
          o2_released_per_year: o2ReleasedPerYear,
          o2_required_for_population: o2RequiredForPopulation,
          o2_deficit: o2Deficit,
          health_score: healthScore,
        },
        { onConflict: 'city_id,date' }
      );

    if (error) throw error;

    console.log(`✅ Environment data updated for ${city.name}`);
  } catch (err) {
    console.error(`⚠️  Failed to fetch/store data for ${city.name}: ${err.message}`);
  }
};

// Runs the fetch for every city in the DB, one after another
const runDailyFetch = async () => {
  console.log('🌱 Running daily environment fetch job...');

  const { data: cities, error } = await supabase
    .from('cities')
    .select('id, name, population, area_sq_km, center_lat, center_lng');

  if (error) {
    console.error('⚠️  Could not fetch cities for daily job:', error.message);
    return;
  }

  for (const city of cities) {
    await fetchAndStoreForCity(city);
  }

  console.log('🌱 Daily environment fetch job complete.');
};

// Schedules the job to run once a day at 2:00 AM server time.
const startDailyFetchJob = () => {
  cron.schedule('0 2 * * *', runDailyFetch);
  console.log('⏰ Daily environment fetch job scheduled (2:00 AM daily)');
};

module.exports = { startDailyFetchJob, runDailyFetch };