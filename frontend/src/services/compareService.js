import api from './api';

/**
 * Compare Service
 *
 * Handles all city comparison API communication with the Backend.
 * Endpoint:
 * - GET /api/compare?cities=a,b → { cities: [{ city, aqi, greenCover, healthScore, co2Balance, o2Balance }] }
 */

const AVAILABLE_COMPARISON_CITIES = [
  'Pune',
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Ratnagiri',
  'Hyderabad',
  'Chennai',
  'Kolkata',
];

/**
 * List of cities available to select in the comparison UI.
 * @returns {string[]}
 */
export function getAvailableCities() {
  return AVAILABLE_COMPARISON_CITIES;
}

/**
 * Fetch comparison metrics for two or more cities.
 * @param {string[]} cities
 * @returns {Promise<object>} { cities: [{ city, aqi, greenCover, healthScore, co2Balance, o2Balance }] }
 */
export async function compareCities(cities) {
  try {
    const response = await api.get('/compare', { params: { cities: cities.join(',') } });
    return response.data;
  } catch (apiError) {
    console.error('Failed to load city comparison data:', apiError.message);
    throw new Error(`Live city comparison data is temporarily unavailable: ${apiError.message}`);
  }
}