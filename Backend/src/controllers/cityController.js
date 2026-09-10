// src/controllers/cityController.js
// Handles: GET /api/cities/:name

const { supabase } = require('../config/db');

// GET /api/cities/:name
exports.getCityByName = async (req, res) => {
  try {
    const { name } = req.params;

    // case-insensitive match using ilike, e.g. "pune" matches "Pune"
    const { data: city, error } = await supabase
      .from('cities')
      .select('*')
      .ilike('name', name)
      .maybeSingle();

    if (error) throw error;

    if (!city) {
      return res.status(404).json({ success: false, message: `City '${name}' not found` });
    }

    res.status(200).json({ success: true, city });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// (Optional helper, not in the API contract but handy for dropdowns/testing)
// GET /api/cities
exports.getAllCities = async (req, res) => {
  try {
    const { data: cities, error } = await supabase
      .from('cities')
      .select('id, name, state, population, area_sq_km');

    if (error) throw error;

    res.status(200).json({ success: true, count: cities.length, cities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};