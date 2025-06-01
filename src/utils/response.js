import { STATUS_CODES } from './httpStatusCodes.js'

/**
 * Sends a standardized JSON error response.
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @returns {Response}
 */
export const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  })
}

/**
 * Sends a standardized JSON success response.
 * @param {Response} res - Express response object
 * @param {string} message - Success message
 * @param {Object|null} [data=null] - Optional response data
 * @param {number} [statusCode=200] - HTTP status code
 * @returns {Response}
 */
export const sendSuccess = (res, message, data = null, statusCode = STATUS_CODES.OK) => {
  const payload = {
    success: true,
    message,
  }
  if (data !== null) {
    payload.data = data
  }
  return res.status(statusCode).json(payload)
}
