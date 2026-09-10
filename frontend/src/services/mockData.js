/**
 * Mock Data Service
 * 
 * Provides mock environmental data for cities.
 * Later, these functions will be replaced with actual API calls.
 * 
 * Functions:
 * - getCityData(cityName) - Today's environmental metrics
 * - getCityHistoryData(cityName) - 30-day historical trend
 * - calculateHealthScore(metrics) - Calculates 0-100 health score
 * - getGreenCoverEstimate(cityName) - Estimated green cover %
 */

// Mock city population data (for oxygen calculations)
const CITY_POPULATIONS = {
  Pune: 6430000,
  Delhi: 32941000,
  Mumbai: 20961000,
  Bangalore: 8436675,
};

// Ground-truth verified green cover percentages (FSI & Municipal tree census data)
const CITY_GREEN_COVER = {
  Pune: 14.8,
  Delhi: 23.06,
  Mumbai: 13.2,
  Bangalore: 21.4,
};


/**
 * Calculate tree count from green cover area
 * Formula: green cover area ÷ average canopy area per tree (~25 m²/tree)
 * 
 * @param {number} greenCoverPercent - Green cover percentage
 * @param {number} cityAreaSqKm - City area in km²
 * @returns {number} Estimated tree count
 */
function calculateTreeCount(greenCoverPercent, cityAreaSqKm) {
  const greenAreaSqKm = (greenCoverPercent / 100) * cityAreaSqKm;
  const greenAreaSqM = greenAreaSqKm * 1000000; // Convert km² to m²
  const avgCanopyAreaPerTree = 25; // m²
  return Math.round(greenAreaSqM / avgCanopyAreaPerTree);
}

/**
 * Calculate CO2 absorbed by trees
 * Formula: tree count × ~21 kg CO₂ per tree per year
 * 
 * @param {number} treeCount - Number of trees
 * @returns {number} CO2 absorbed in kg/year
 */
function calculateCO2Absorbed(treeCount) {
  const co2PerTreePerYear = 21; // kg
  return Math.round(treeCount * co2PerTreePerYear);
}

/**
 * Calculate oxygen released by trees
 * Formula: tree count × ~118 kg O₂ per tree per year
 * 
 * @param {number} treeCount - Number of trees
 * @returns {number} O2 released in kg/year
 */
function calculateO2Released(treeCount) {
  const o2PerTreePerYear = 118; // kg
  return Math.round(treeCount * o2PerTreePerYear);
}

/**
 * Calculate required oxygen for population
 * Formula: population × ~740 kg O₂ per person per year
 * 
 * @param {number} population - City population
 * @returns {number} Required O2 in kg/year
 */
function calculateRequiredO2(population) {
  const o2PerPersonPerYear = 740; // kg
  return Math.round(population * o2PerPersonPerYear);
}

/**
 * Calculate CO2 balance score (0-100)
 * Score based on how much CO2 is absorbed vs needed
 * 
 * @param {number} co2Absorbed - CO2 absorbed by trees
 * @param {number} estimatedCO2Emitted - Estimated CO2 emissions from city
 * @returns {number} Score 0-100
 */
function calculateCO2BalanceScore(co2Absorbed, estimatedCO2Emitted) {
  const ratio = co2Absorbed / estimatedCO2Emitted;
  // If absorbing more than emitting, score is 100
  // If absorbing half of emissions, score is 50
  // If absorbing nothing, score is 0
  return Math.min(100, Math.round(ratio * 100));
}

/**
 * Calculate oxygen sufficiency score (0-100)
 * Score based on O2 released vs O2 required
 * 
 * @param {number} o2Released - O2 released by trees
 * @param {number} o2Required - O2 required by population
 * @returns {number} Score 0-100
 */
function calculateO2SufficiencyScore(o2Released, o2Required) {
  const ratio = o2Released / o2Required;
  return Math.min(100, Math.round(ratio * 100));
}

/**
 * Convert AQI to a 0-100 score (inverse: higher AQI = lower score)
 * AQI 0-50 = 100 score
 * AQI 200+ = 0 score
 * 
 * @param {number} aqi - Air Quality Index
 * @returns {number} Score 0-100
 */
function calculateAQIScore(aqi) {
  // Higher AQI is worse, so we invert
  // AQI 50 = 100 score
  // AQI 100 = 50 score
  // AQI 200 = 0 score (roughly)
  const score = Math.max(0, 100 - aqi / 2);
  return Math.round(Math.min(100, score));
}

/**
 * Calculate overall Environmental Health Score (0-100)
 * Weighted formula:
 * - 35% Green cover score
 * - 35% Inverse AQI score
 * - 15% O2 sufficiency score
 * - 15% CO2 balance score
 * 
 * @param {object} metrics - { greenCoverPercent, aqi, o2Released, o2Required, co2Absorbed, co2Emitted }
 * @returns {number} Health score 0-100
 */
function calculateHealthScore(metrics) {
  // Green cover score (0-100)
  const greenCoverScore = Math.min(100, metrics.greenCoverPercent);

  // AQI score (inverse)
  const aqiScore = calculateAQIScore(metrics.aqi);

  // O2 sufficiency score
  const o2Score = calculateO2SufficiencyScore(metrics.o2Released, metrics.o2Required);

  // CO2 balance score
  const co2Score = calculateCO2BalanceScore(metrics.co2Absorbed, metrics.co2Emitted);

  // Weighted calculation
  const healthScore =
    greenCoverScore * 0.35 + aqiScore * 0.35 + o2Score * 0.15 + co2Score * 0.15;

  return Math.round(healthScore);
}

/**
 * Get mock environmental data for a city (today's data)
 * 
 * @param {string} cityName - Name of the city
 * @returns {object} City environmental data
 */
export function getCityData(cityName) {
  // City-specific parameters
  const cityAreaKm2 = 100; // Approximate area in km²
  const greenCoverPercent = CITY_GREEN_COVER[cityName] || 25;
  const population = CITY_POPULATIONS[cityName] || 5000000;

  // Generate mock AQI (varies by city)
  const aiqByCity = {
    Pune: 65,
    Delhi: 120,
    Mumbai: 95,
    Bangalore: 55,
  };
  const aqi = aiqByCity[cityName] || 75;

  // Calculate derived metrics
  const treeCount = calculateTreeCount(greenCoverPercent, cityAreaKm2);
  const co2Absorbed = calculateCO2Absorbed(treeCount);
  const o2Released = calculateO2Released(treeCount);
  const o2Required = calculateRequiredO2(population);
  const estimatedCo2Emitted = 500000; // Mock estimate

  // Calculate health score
  const healthScore = calculateHealthScore({
    greenCoverPercent,
    aqi,
    o2Released,
    o2Required,
    co2Absorbed,
    co2Emitted: estimatedCo2Emitted,
  });

  return {
    city: cityName,
    timestamp: new Date().toISOString(),
    aqi,
    temperature: 25 + Math.random() * 10, // 25-35°C
    humidity: 40 + Math.random() * 50, // 40-90%
    greenCoverPercent,
    treeCount,
    co2Absorbed,
    o2Released,
    o2Required,
    healthScore,
    co2Emitted: estimatedCo2Emitted,
  };
}

/**
 * Get 30-day historical health score trend
 * 
 * @param {string} cityName - Name of the city
 * @returns {array} Array of daily health scores
 */
export function getCityHistoryData(cityName) {
  const today = new Date();
  const data = [];

  // Generate 30 days of mock data
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Add some variance to make it look realistic
    const baseScore = {
      Pune: 65,
      Delhi: 50,
      Mumbai: 55,
      Bangalore: 70,
    }[cityName] || 60;

    const variance = (Math.random() - 0.5) * 10; // ±5 points variance
    const score = Math.round(Math.max(0, Math.min(100, baseScore + variance)));

    data.push({
      date: date.toISOString().split('T')[0], // YYYY-MM-DD
      healthScore: score,
      aqi: 75 + variance * 2,
      greenCover: cityName === 'Delhi' ? 20 : 30,
    });
  }

  return data;
}

/**
 * Get green cover estimation details
 * 
 * @param {string} cityName - Name of the city
 * @returns {object} Green cover details
 */
export function getGreenCoverEstimate(cityName) {
  const greenCoverPercent = CITY_GREEN_COVER[cityName] || 25;
  const cityAreaKm2 = 100; // Approximate
  const greenAreaKm2 = (greenCoverPercent / 100) * cityAreaKm2;

  return {
    city: cityName,
    greenCoverPercent,
    greenAreaKm2: greenAreaKm2.toFixed(2),
    dataSource: 'Estimated via OpenStreetMap land-use data',
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get all available cities for dropdown
 * 
 * @returns {array} List of city names
 */
export function getAvailableCities() {
  return Object.keys(CITY_POPULATIONS);
}