import api from './api';

/**
 * Suggestion Service
 * Fetches AI eco guidance and suggestions for a city.
 */

export async function getCitySuggestions(cityName = 'Pune') {
  try {
    const response = await api.get(`/suggestions/${encodeURIComponent(cityName)}`);
    return response.data;
  } catch (error) {
    console.warn(`Failed to fetch suggestions for ${cityName}, returning fallback:`, error.message);
    return {
      success: true,
      city: cityName,
      suggestions: [
        {
          id: 's1',
          title: '🌱 Plant Native Urban Saplings',
          category: 'Greenery',
          impact: 'High',
          description: `Boost ${cityName}'s forest canopy by planting native trees to combat air pollution and soil erosion.`,
        },
        {
          id: 's2',
          title: '🚲 Opt for Micro-Mobility & Cycling',
          category: 'Air Quality',
          impact: 'Medium',
          description: `Replacing short vehicle trips daily with cycling reduces local vehicular exhaust emissions.`,
        },
      ],
    };
  }
}
