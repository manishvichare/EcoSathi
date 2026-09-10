import { AQI_CATEGORIES, HEALTH_STATUS } from './constants';

/**
 * Format a number to 2 decimal places
 * @param {number} value - The number to format
 * @returns {string} Formatted number with 2 decimals
 */
export const formatNumber = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return parseFloat(value).toFixed(2);
};

/**
 * Format a number with commas (e.g., 1,234,567)
 * @param {number} value - The number to format
 * @returns {string} Formatted number with commas
 */
export const formatNumberWithCommas = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return Math.round(value).toLocaleString('en-IN');
};

/**
 * Format a date to readable format (e.g., "15 Jan 2024")
 * @param {string | Date} date - The date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format a date and time (e.g., "15 Jan 2024, 2:30 PM")
 * @param {string | Date} date - The date to format
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format time to HH:MM format (e.g., "14:30")
 * @param {string | Date} date - The date/time to format
 * @returns {string} Formatted time
 */
export const formatTime = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/**
 * Get the health status object based on score
 * @param {number} score - Health score (0-100)
 * @returns {object} Status object with label, color, etc.
 */
export const getHealthStatus = (score) => {
  if (score === null || score === undefined) return HEALTH_STATUS.LOW;
  
  for (const [key, status] of Object.entries(HEALTH_STATUS)) {
    const [min, max] = status.range;
    if (score >= min && score <= max) {
      return status;
    }
  }
  return HEALTH_STATUS.EXCELLENT;
};

/**
 * Get the AQI category based on AQI value
 * @param {number} aqi - AQI value
 * @returns {object} AQI category object with label, color, etc.
 */
export const getAQICategory = (aqi) => {
  if (aqi === null || aqi === undefined) return AQI_CATEGORIES.GOOD;
  
  for (const [key, category] of Object.entries(AQI_CATEGORIES)) {
    const [min, max] = category.range;
    if (aqi >= min && aqi <= max) {
      return category;
    }
  }
  return AQI_CATEGORIES.SEVERE;
};

/**
 * Format temperature with unit (e.g., "28°C" or "82°F")
 * @param {number} temp - Temperature value
 * @param {string} unit - 'C' or 'F'
 * @returns {string} Formatted temperature
 */
export const formatTemperature = (temp, unit = 'C') => {
  if (temp === null || temp === undefined) return 'N/A';
  return `${Math.round(temp)}°${unit}`;
};

/**
 * Format percentage (e.g., "45.5%")
 * @param {number} value - Percentage value (0-100)
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return `${parseFloat(value).toFixed(1)}%`;
};

/**
 * Format large numbers with units (e.g., "1.2K", "1.5M")
 * @param {number} value - The value to format
 * @returns {string} Formatted value with unit
 */
export const formatCompactNumber = (value) => {
  if (value === null || value === undefined) return 'N/A';
  
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return Math.round(value).toString();
};

/**
 * Format tree/plant count with label
 * @param {number} count - Number of trees
 * @returns {string} Formatted tree count
 */
export const formatTreeCount = (count) => {
  if (count === null || count === undefined) return 'N/A';
  return `${formatCompactNumber(count)} trees`;
};

/**
 * Format CO2 in kg or tons
 * @param {number} kg - CO2 in kilograms
 * @returns {string} Formatted CO2
 */
export const formatCO2 = (kg) => {
  if (kg === null || kg === undefined) return 'N/A';
  
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(2)} tons`;
  }
  return `${Math.round(kg)} kg`;
};

/**
 * Format oxygen in kg
 * @param {number} kg - Oxygen in kilograms
 * @returns {string} Formatted oxygen
 */
export const formatOxygen = (kg) => {
  if (kg === null || kg === undefined) return 'N/A';
  return `${Math.round(kg)} kg`;
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Capitalize first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string | Date} date - The date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';
  
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now - d) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return formatDate(date);
};

/**
 * Format severity level with badge styling
 * @param {string} severity - Severity level (LOW, MEDIUM, HIGH, CRITICAL)
 * @returns {object} Object with label, color, icon
 */
export const formatSeverity = (severity) => {
  const severityMap = {
    LOW: { label: 'Low', color: '#3b82f6', icon: '⚠️' },
    MEDIUM: { label: 'Medium', color: '#f59e0b', icon: '🔸' },
    HIGH: { label: 'High', color: '#f97316', icon: '🔴' },
    CRITICAL: { label: 'Critical', color: '#ef4444', icon: '🚨' },
  };
  return severityMap[severity?.toUpperCase()] || severityMap.LOW;
};