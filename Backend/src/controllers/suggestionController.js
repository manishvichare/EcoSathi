// src/controllers/suggestionController.js
// Handles GET /api/suggestions/:city

const { supabase } = require('../config/db');
const aiClient = require('../services/aiClient');

exports.getSuggestions = async (req, res) => {
  try {
    const { city: cityName } = req.params;

    let aqi = 75;
    let greenCover = 22;
    let healthScore = 70;

    if (cityName) {
      try {
        const { data: city } = await supabase
          .from('cities')
          .select('id')
          .ilike('name', cityName)
          .maybeSingle();

        if (city) {
          const { data: todayData } = await supabase
            .from('environment_data')
            .select('aqi, green_cover_percent, health_score')
            .eq('city_id', city.id)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (todayData) {
            aqi = todayData.aqi || 75;
            greenCover = todayData.green_cover_percent || 22;
            healthScore = todayData.health_score || 70;
          }
        }
      } catch (dbErr) {
        console.warn('ℹ️ DB lookup skipped for suggestions:', dbErr.message);
      }
    }

    let suggestions = [];

    // Try live AI microservice first
    try {
      const aiRes = await aiClient.getDailySuggestion({ city: cityName, aqi, greenCoverPercent: greenCover, healthScore });
      if (aiRes && aiRes.tips && Array.isArray(aiRes.tips) && aiRes.tips.length > 0) {
        suggestions = aiRes.tips.map((tip, idx) => ({
          id: `ai-s${idx + 1}`,
          title: `🌱 AI Recommendation #${idx + 1}`,
          category: 'AI Urban Insight',
          impact: idx === 0 ? 'High' : 'Medium',
          description: tip,
        }));
      }
    } catch (aiErr) {
      console.warn('ℹ️ AI suggestion service fallback active:', aiErr.message);
    }

    // Contextual fallback if AI service is offline or returned empty list
    if (suggestions.length === 0) {
      suggestions = [
        {
          id: 's1',
          title: '🌱 Plant Native Urban Saplings',
          category: 'Greenery',
          impact: 'High',
          description: `Boost ${cityName}'s forest canopy by planting Neem, Peepal, or Banyan trees to combat the current ${greenCover}% green cover level.`,
        },
        {
          id: 's2',
          title: '🚲 Opt for Micro-Mobility & Cycling',
          category: 'Air Quality',
          impact: 'Medium',
          description: `With an AQI of ${aqi}, replacing 2 short vehicle trips daily with cycling reduces local PM2.5 emissions by up to 14%.`,
        },
        {
          id: 's3',
          title: '💧 Install Rainwater Harvesting Units',
          category: 'Water & Conservation',
          impact: 'High',
          description: `Capture monsoon runoff across urban rooftops to replenish groundwater tables and prevent localized flooding.`,
        },
        {
          id: 's4',
          title: '⚡ Transition to Solar Rooftops',
          category: 'Energy',
          impact: 'High',
          description: `Reduce coal-powered grid demand. A 3kW rooftop solar setup cuts ~3.5 metric tons of CO₂ emissions annually.`,
        },
      ];
    }

    res.status(200).json({
      success: true,
      city: cityName,
      count: suggestions.length,
      suggestions,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
