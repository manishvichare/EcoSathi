// src/controllers/chatController.js
// Handles POST /api/chat

const aiClient = require('../services/aiClient');
const { supabase } = require('../config/db');

exports.handleChatMessage = async (req, res) => {
  try {
    const { message, cityContext } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    // Build rich city metrics context from DB
    let cityMetrics = null;
    if (cityContext) {
      try {
        const { data: city } = await supabase
          .from('cities')
          .select('id, name')
          .ilike('name', cityContext)
          .maybeSingle();

        if (city) {
          const { data: todayData } = await supabase
            .from('environment_data')
            .select('aqi, health_score, green_cover_percent, co2_absorbed_per_year, o2_deficit')
            .eq('city_id', city.id)
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (todayData) {
            cityMetrics = {
              cityName: city.name,
              aqi: todayData.aqi,
              healthScore: todayData.health_score,
              greenCoverPercent: todayData.green_cover_percent,
              co2AbsorbedPerYear: todayData.co2_absorbed_per_year,
              o2Deficit: todayData.o2_deficit,
            };
          }
        }
      } catch (dbErr) {
        console.warn('ℹ️ DB lookup skipped for chat context:', dbErr.message);
      }
    }

    // Send to Python AI service with rich context (dict or string city name)
    let replyText = '';
    try {
      const aiRes = await aiClient.chat({
        message,
        cityContext: cityMetrics || cityContext || 'General',
      });
      replyText = aiRes.reply;
    } catch (aiErr) {
      console.warn('⚠️ AI service call failed:', aiErr.message);
      // AI service is down — provide a helpful general fallback
      replyText = `I'm EcoSathi Assistant! The AI engine is temporarily busy. Here's what I can tell you about ${cityContext || 'your city'}:\n\n`;
      
      const lower = message.toLowerCase();
      if (lower.includes('aqi') || lower.includes('air') || lower.includes('pollution')) {
        const aqiVal = cityMetrics?.aqi ?? 'currently being monitored';
        replyText += `The Air Quality Index (AQI) in ${cityContext || 'your city'} is ${aqiVal}. To improve air quality, consider planting native trees and reducing vehicular emissions. You can track real-time AQI on the EcoSathi Dashboard.`;
      } else if (lower.includes('tree') || lower.includes('green') || lower.includes('plant')) {
        const gc = cityMetrics?.greenCoverPercent ?? 'significant';
        replyText += `${cityContext || 'Your city'} has ~${gc}% green cover. Join planting tasks on the EcoSathi Leaderboard to earn Eco Points!`;
      } else if (lower.includes('complaint') || lower.includes('report') || lower.includes('dump')) {
        replyText += `You can submit photo evidence of pollution or illegal dumping on the Complaints page. Our AI analyses severity and notifies municipal authorities.`;
      } else if (lower.includes('eco point') || lower.includes('task') || lower.includes('leaderboard')) {
        replyText += `Eco Points are earned by completing verified Daily Eco Action Tasks like planting a tree, cycling to work, or reporting pollution. Each requires photo proof reviewed by a moderator.`;
      } else {
        replyText = `I'm EcoSathi Assistant — I can answer questions about anything! My AI engine is temporarily busy, but please try again in a moment. I can help with environmental topics, science, technology, history, and much more.`;
      }
    }

    res.status(200).json({
      success: true,
      reply: replyText,
      cityContext: cityContext || 'General',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
