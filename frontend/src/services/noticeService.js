import api from './api';

/**
 * Notice Service
 * Fetches AI-generated authority reports & action notices.
 */

export async function getCityNotices(cityName = 'Pune') {
  try {
    const response = await api.get(`/notices/${encodeURIComponent(cityName)}`);
    return response.data;
  } catch (error) {
    console.warn(`Failed to fetch notices for ${cityName}:`, error.message);
    return {
      success: false,
      city: cityName,
      notices: [],
    };
  }
}
