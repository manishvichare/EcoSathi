// src/services/aiClient.js
// Wraps all calls from the Node backend to Person C's Python FastAPI
// AI service. Endpoints match section 5 of the architecture doc exactly.

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const env = require('../config/env');

// Render's Blueprint provides the AI service as an internal "host:port".
// Keep normal http(s) URLs unchanged for local development and other hosts.
const aiServiceUrl = /^https?:\/\//i.test(env.AI_SERVICE_URL)
  ? env.AI_SERVICE_URL
  : `http://${env.AI_SERVICE_URL}`;

const aiApi = axios.create({
  baseURL: aiServiceUrl,
  timeout: 90000, // vision/LLM calls can take 15-30s on hosted models
});

/**
 * POST /analyze-complaint
 * { imagePath, description, category } -> { is_valid, matches_category, severity, category, summary, rejection_reason }
 */
exports.analyzeComplaint = async ({ imagePath, description, category }) => {
  const form = new FormData();
  if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
    const response = await axios.get(imagePath, { responseType: 'stream' });
    form.append('image', response.data);
  } else if (imagePath) {
    form.append('image', fs.createReadStream(imagePath));
  }
  form.append('description', description || '');
  form.append('category', category || 'other');

  const { data } = await aiApi.post('/analyze-complaint', form, {
    headers: form.getHeaders(),
  });

  return data;
};

/**
 * POST /generate-notice
 * { complaintData } -> { notice_text }
 */
exports.generateNotice = async ({ description, category, severity, cityName, location }) => {
  const { data } = await aiApi.post('/generate-notice', {
    description,
    category,
    severity,
    city: cityName,
    location,
  });

  return data; // { notice_text }
};

/**
 * POST /daily-suggestion
 * { cityMetrics } -> { tips: [...] }
 */
exports.getDailySuggestion = async (cityMetrics) => {
  const { data } = await aiApi.post('/daily-suggestion', { cityMetrics });
  return data; // { tips: [...] }
};

/**
 * POST /predict-trend
 * { historicalData } -> { predictedScore, trend }
 */
exports.predictTrend = async (historicalData) => {
  const { data } = await aiApi.post('/predict-trend', { historicalData });
  return data; // { predictedScore, trend }
};

/**
 * POST /chat
 * { message, cityContext } -> { reply }
 * Backing endpoint for POST /api/chat, which just proxies to this.
 */
exports.chat = async ({ message, cityContext }) => {
  const { data } = await aiApi.post('/chat', { message, cityContext });
  return data; // { reply }
};
