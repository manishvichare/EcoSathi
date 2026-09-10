/**
 * Geocoding & Reverse Geocoding Service for EcoSathi
 * 
 * Translates latitude & longitude coordinates to human-readable street addresses,
 * landmarks, and city names.
 * Uses OpenStreetMap Nominatim API with BigDataCloud as a reliable fallback.
 */

// Supported cities in EcoSathi
const SUPPORTED_CITIES = ['Pune', 'Mumbai', 'Delhi', 'Bangalore'];

/**
 * Matches detected city string to supported cities in EcoSathi
 */
export function matchSupportedCity(cityString = '') {
  if (!cityString) return null;
  const lower = cityString.toLowerCase();
  for (const city of SUPPORTED_CITIES) {
    if (lower.includes(city.toLowerCase())) {
      return city;
    }
  }
  // Common aliases
  if (lower.includes('bengaluru')) return 'Bangalore';
  if (lower.includes('bombay')) return 'Mumbai';
  if (lower.includes('new delhi')) return 'Delhi';
  return null;
}

/**
 * Reverse geocodes coordinates (lat, lng) to a human-readable address.
 * 
 * @param {number} lat Latitude
 * @param {number} lng Longitude
 * @returns {Promise<{
 *   success: boolean,
 *   address: string,
 *   fullAddress: string,
 *   city: string | null,
 *   suburb: string | null,
 *   road: string | null,
 *   lat: number,
 *   lng: number
 * }>}
 */
export async function reverseGeocode(lat, lng) {
  const numericLat = parseFloat(lat);
  const numericLng = parseFloat(lng);

  if (isNaN(numericLat) || isNaN(numericLng)) {
    throw new Error('Invalid coordinates provided');
  }

  // 1. Primary Attempt: OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${numericLat}&lon=${numericLng}&accept-language=en`;
    const res = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      // Build concise, readable address
      const landmark = addr.amenity || addr.building || addr.shop || addr.tourism || addr.leisure || '';
      const road = addr.road || addr.pedestrian || addr.street || '';
      const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.subdistrict || '';
      const city = addr.city || addr.town || addr.village || addr.county || '';
      const state = addr.state || '';

      const parts = [landmark, road, suburb, city].filter(Boolean);
      const conciseAddress = parts.length > 0 ? parts.join(', ') : (data.display_name?.split(',').slice(0, 3).join(', ') || '');

      const matchedCity = matchSupportedCity(city) || matchSupportedCity(state) || matchSupportedCity(data.display_name);

      return {
        success: true,
        address: conciseAddress || `Location near ${numericLat.toFixed(4)}, ${numericLng.toFixed(4)}`,
        fullAddress: data.display_name || conciseAddress,
        city: matchedCity || city,
        suburb,
        road,
        lat: numericLat,
        lng: numericLng,
        source: 'nominatim',
      };
    }
  } catch (nominatimErr) {
    console.warn('Nominatim reverse geocode failed, falling back to BigDataCloud:', nominatimErr.message);
  }

  // 2. Secondary Fallback: BigDataCloud Client Reverse Geocode
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${numericLat}&longitude=${numericLng}&localityLanguage=en`;
    const res = await fetch(bdcUrl);
    if (res.ok) {
      const bdcData = await res.json();
      const locality = bdcData.locality || '';
      const city = bdcData.city || bdcData.principalSubdivision || '';
      const parts = [locality, city].filter(Boolean);
      const address = parts.length > 0 ? parts.join(', ') : `${numericLat.toFixed(4)}, ${numericLng.toFixed(4)}`;
      const matchedCity = matchSupportedCity(city) || matchSupportedCity(bdcData.principalSubdivision);

      return {
        success: true,
        address,
        fullAddress: `${address}, ${bdcData.principalSubdivision || ''}, ${bdcData.countryName || ''}`.replace(/^,\s*|,\s*$/g, ''),
        city: matchedCity || city,
        suburb: locality,
        road: '',
        lat: numericLat,
        lng: numericLng,
        source: 'bigdatacloud',
      };
    }
  } catch (bdcErr) {
    console.warn('BigDataCloud reverse geocode fallback failed:', bdcErr.message);
  }

  // 3. Fallback if both offline
  return {
    success: false,
    address: `GPS: ${numericLat.toFixed(4)}, ${numericLng.toFixed(4)}`,
    fullAddress: `Coordinates ${numericLat.toFixed(6)}, ${numericLng.toFixed(6)}`,
    city: null,
    suburb: null,
    road: null,
    lat: numericLat,
    lng: numericLng,
    source: 'offline',
  };
}

/**
 * Searches for places or landmarks by name to get coordinates
 * 
 * @param {string} query Search query (e.g. "FC Road, Pune")
 * @returns {Promise<Array<{ lat: number, lng: number, displayName: string, city: string }>>}
 */
export async function searchAddress(query) {
  if (!query || query.trim().length < 3) return [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=en`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) return [];
    const results = await res.json();

    return results.map((item) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
      city: matchSupportedCity(item.display_name),
    }));
  } catch (err) {
    console.warn('Location search error:', err.message);
    return [];
  }
}
