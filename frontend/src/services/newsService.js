import api from './api';

/**
 * News Service
 * Fetches environmental news & community movement updates.
 */

export async function getEcoNews() {
  try {
    const response = await api.get('/news');
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch news from backend, returning fallback:', error.message);
    return {
      success: true,
      articles: [
        {
          id: 'news-1',
          title: 'Urban Forestry Drive Reaches 50,000 Tree Target',
          summary: 'Citizens and local authorities join hands to expand urban tree canopy across key sectors.',
          category: 'Community',
          source: 'EcoSathi Green Times',
          date: new Date().toISOString(),
          url: '#',
        },
        {
          id: 'news-2',
          title: 'Real-Time AQI Sensors Activated in Industrial Corridors',
          summary: 'Hyper-local air monitoring deployed to track emissions and protect public health.',
          category: 'Technology',
          source: 'Climate Action Watch',
          date: new Date(Date.now() - 86400000).toISOString(),
          url: '#',
        },
      ],
    };
  }
}
