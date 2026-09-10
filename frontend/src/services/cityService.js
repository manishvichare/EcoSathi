import api from './api';

/**
 * City Service
 *
 * Fetches city and environmental metrics from the Backend API.
 */

/**
 * Fetch FAST AQI-only data for a city (~1–2 s)
 * @param {string} cityName
 * @returns {Promise<object>}
 */
export async function getCityAqi(cityName) {
  try {
    const response = await api.get(`/environment/${encodeURIComponent(cityName)}/aqi`);
    return response.data;
  } catch (error) {
    console.warn(`Failed to fetch AQI for ${cityName}:`, error.message);
    throw error;
  }
}

/**
 * Fetch full environmental data for a city (AQI + green cover + health score, ~2–4 s)
 * @param {string} cityName
 * @returns {Promise<object>} Environmental data object
 */
export async function getCityEnvironment(cityName) {
  try {
    const response = await api.get(`/environment/${encodeURIComponent(cityName)}/today`);
    return response.data;
  } catch (error) {
    console.warn(`Failed to fetch environment data for ${cityName}:`, error.message);
    throw error;
  }
}

/**
 * Fetch historical environmental data for a city
 * @param {string} cityName
 * @param {string} range
 * @returns {Promise<object>}
 */
export async function getCityHistory(cityName, range = '30d') {
  try {
    const response = await api.get(`/environment/${encodeURIComponent(cityName)}/history`, {
      params: { range },
    });
    return response.data;
  } catch (error) {
    console.warn(`Failed to fetch history for ${cityName}:`, error.message);
    return { history: [] };
  }
}
