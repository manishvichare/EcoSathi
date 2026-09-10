// src/utils/seedData.js
// Seeds default cities and initial environment data into Supabase on startup.

const { supabase } = require('../config/db');

const DEFAULT_CITIES = [
  {
    name: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    population: 3124458,
    area_sq_km: 331.2,
    center_lat: 18.5204,
    center_lng: 73.8567,
    initialData: {
      aqi: 72,
      weather: { temp: 28, humidity: 62, condition: 'Partly Cloudy' },
      green_cover_percent: 24.5,
      estimated_tree_count: 450000,
      co2_absorbed_per_year: 9900000,
      o2_released_per_year: 53100000,
      o2_required_for_population: 856000000,
      o2_deficit: true,
      health_score: 78,
    },
  },
  {
    name: 'Delhi',
    state: 'Delhi',
    country: 'India',
    population: 16787941,
    area_sq_km: 1484,
    center_lat: 28.6139,
    center_lng: 77.2090,
    initialData: {
      aqi: 185,
      weather: { temp: 34, humidity: 45, condition: 'Hazy' },
      green_cover_percent: 12.8,
      estimated_tree_count: 820000,
      co2_absorbed_per_year: 18040000,
      o2_released_per_year: 96760000,
      o2_required_for_population: 4600000000,
      o2_deficit: true,
      health_score: 42,
    },
  },
  {
    name: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    population: 12442373,
    area_sq_km: 603.4,
    center_lat: 19.0760,
    center_lng: 72.8777,
    initialData: {
      aqi: 110,
      weather: { temp: 31, humidity: 78, condition: 'Humid' },
      green_cover_percent: 18.2,
      estimated_tree_count: 610000,
      co2_absorbed_per_year: 13420000,
      o2_released_per_year: 71980000,
      o2_required_for_population: 3410000000,
      o2_deficit: true,
      health_score: 61,
    },
  },
  {
    name: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    population: 8443675,
    area_sq_km: 709,
    center_lat: 12.9716,
    center_lng: 77.5946,
    initialData: {
      aqi: 65,
      weather: { temp: 26, humidity: 55, condition: 'Pleasant' },
      green_cover_percent: 28.4,
      estimated_tree_count: 780000,
      co2_absorbed_per_year: 17160000,
      o2_released_per_year: 92040000,
      o2_required_for_population: 2310000000,
      o2_deficit: true,
      health_score: 84,
    },
  },
];

const seedInitialData = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const cityInfo of DEFAULT_CITIES) {
      const { initialData, ...cityData } = cityInfo;

      // Upsert city (insert if not exists, skip if already present by name)
      const { data: city, error: cityErr } = await supabase
        .from('cities')
        .upsert(cityData, { onConflict: 'name', ignoreDuplicates: false })
        .select('id, name')
        .single();

      if (cityErr) {
        // City likely already exists — fetch it
        const { data: existingCity } = await supabase
          .from('cities')
          .select('id, name')
          .eq('name', cityData.name)
          .single();

        if (!existingCity) {
          console.error(`⚠️ Could not upsert or find city: ${cityData.name}`);
          continue;
        }

        // Upsert today's environment data
        await supabase
          .from('environment_data')
          .upsert(
            {
              city_id: existingCity.id,
              date: new Date().toISOString(),
              ...initialData,
              weather: initialData.weather,
              green_cover_source: 'estimated via OSM land-use data',
            },
            { onConflict: 'city_id,date' }
          );

        continue;
      }

      // Upsert today's environment data for the upserted city
      await supabase
        .from('environment_data')
        .upsert(
          {
            city_id: city.id,
            date: new Date().toISOString(),
            ...initialData,
            weather: initialData.weather,
            green_cover_source: 'estimated via OSM land-use data',
          },
          { onConflict: 'city_id,date' }
        );

      console.log(`🌱 Seeded city: ${city.name}`);
    }

    console.log('✅ Seeded default cities and environmental data.');
  } catch (err) {
    console.error('⚠️ Error seeding initial data:', err.message);
  }
};

module.exports = seedInitialData;
