import api from './api';

/**
 * Chat Service
 *
 * Handles all EcoSathi AI Assistant API communication.
 * Backend endpoint: POST /api/chat  { message, cityContext } → { reply }
 */

/**
 * Send a chat message and get the assistant's reply.
 * @param {string} message
 * @param {string} cityContext
 * @returns {Promise<object>} { reply }
 */
export async function sendMessage(message, cityContext) {
  try {
    const response = await api.post('/chat', { message, cityContext });
    if (response && response.data && response.data.reply) {
      return response.data;
    }
    throw new Error('Received incomplete response from AI Assistant service.');
  } catch (apiError) {
    console.error('AI Chat Assistant service request failed:', apiError.message);
    const errorMessage = apiError.response?.data?.message || 
      'The EcoSathi AI service is currently unavailable. Please check your network or try again shortly.';
    throw new Error(errorMessage);
  }
}