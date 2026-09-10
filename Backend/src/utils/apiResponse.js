/**
 * apiResponse.js
 * Standardized response helpers for the EcoSathi backend.
 *
 * Every endpoint in the API contract (section 5 of the architecture doc)
 * should return one of these two shapes, so Person A's frontend can rely
 * on a single contract instead of guessing per-route:
 *
 *   Success: { success: true,  message, data }
 *   Error:   { success: false, message, errors }
 *
 * Usage in a controller:
 *   const { ApiResponse, ApiError } = require('../utils/apiResponse');
 *
 *   exports.getCityToday = async (req, res, next) => {
 *     try {
 *       const data = await environmentService.getToday(req.params.city);
 *       if (!data) throw new ApiError(404, 'No data for this city yet');
 *       return ApiResponse.ok(res, data);
 *     } catch (err) {
 *       next(err); // caught by middlewares/errorHandler.js
 *     }
 *   };
 */

/**
 * Throwable error carrying an HTTP status code.
 * Meant to be caught by a central errorHandler middleware.
 */
class ApiError extends Error {
  constructor(statusCode, message = 'Something went wrong', errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    Error.captureStackTrace?.(this, ApiError);
  }
}

function sendSuccess(res, { statusCode = 200, message = 'Success', data = null } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function sendError(res, { statusCode = 500, message = 'Something went wrong', errors = [] } = {}) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

// Named shortcuts covering the status codes this API actually uses.
const ApiResponse = {
  ok: (res, data, message) =>
    sendSuccess(res, { statusCode: 200, message: message || 'OK', data }),

  created: (res, data, message) =>
    sendSuccess(res, { statusCode: 201, message: message || 'Created', data }),

  badRequest: (res, message, errors) =>
    sendError(res, { statusCode: 400, message: message || 'Bad request', errors }),

  unauthorized: (res, message) =>
    sendError(res, { statusCode: 401, message: message || 'Unauthorized' }),

  forbidden: (res, message) =>
    sendError(res, { statusCode: 403, message: message || 'Forbidden' }),

  notFound: (res, message) =>
    sendError(res, { statusCode: 404, message: message || 'Not found' }),

  serverError: (res, message, errors) =>
    sendError(res, { statusCode: 500, message: message || 'Internal server error', errors }),
};

module.exports = {
  ApiError,
  ApiResponse,
  sendSuccess,
  sendError,
};