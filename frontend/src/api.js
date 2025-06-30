/**
 * API Client for EntraID Change Detection System
 * 
 * This module handles all communication with the backend API including:
 * - Authentication
 * - Error handling
 * - Request/response formatting
 * 
 * Configuration is provided via environment variables at build time.
 */

// Get configuration from environment or use defaults
// Note: process.env values are replaced at build time by React
const API_BASE_URL = process.env.REACT_APP_API_URL || '';
const ADMIN_USER = process.env.REACT_APP_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.REACT_APP_ADMIN_PASS || 'admin';

// Create base64 encoded auth header
const authHeader = 'Basic ' + btoa(`${ADMIN_USER}:${ADMIN_PASS}`);

// Default headers for all API requests
const defaultHeaders = {
  'Authorization': authHeader,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(message, status, response, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
    this.details = details;
  }
}

/**
 * Generic API request handler with comprehensive error handling
 * 
 * @param {string} path - API endpoint path (e.g., '/snapshots')
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Parsed JSON response
 * @throws {ApiError} - On any API error
 */
async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}/api${path}`;
  
  // Log request in development
  if (process.env.NODE_ENV === 'development') {
    console.debug(`API Request: ${options.method || 'GET'} ${url}`);
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    // Handle successful responses
    if (response.ok) {
      const data = await response.json();
      
      if (process.env.NODE_ENV === 'development') {
        console.debug('API Response:', data);
      }
      
      return data;
    }

    // Handle error responses
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorDetails = {};
    
    try {
      // Try to parse error response as JSON
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      errorDetails = {
        error: errorData.error,
        details: errorData.details
      };
    } catch {
      // If not JSON, try to get text
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      } catch {
        // Use default error message
      }
    }
    
    // Special handling for common errors
    if (response.status === 401) {
      throw new ApiError(
        'Authentication failed. Please check your credentials.',
        response.status,
        response,
        errorDetails
      );
    } else if (response.status === 404) {
      throw new ApiError(
        'Resource not found',
        response.status,
        response,
        errorDetails
      );
    } else if (response.status >= 500) {
      throw new ApiError(
        'Server error. Please try again later.',
        response.status,
        response,
        errorDetails
      );
    }
    
    throw new ApiError(errorMessage, response.status, response, errorDetails);
    
  } catch (error) {
    // Handle network errors
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Connection refused or network error
    if (error.message === 'Failed to fetch') {
      throw new ApiError(
        'Cannot connect to backend server. Please ensure the backend is running on port 5000.',
        0,
        null,
        { 
          originalError: error.message,
          suggestion: 'Check if backend container is running: docker-compose ps'
        }
      );
    }
    
    // Other unexpected errors
    throw new ApiError(
      error.message || 'An unexpected error occurred',
      0,
      null,
      { originalError: error }
    );
  }
}

/**
 * API client with all available endpoints
 */
export const Api = {
  /**
   * Get list of all snapshots
   * @returns {Promise<Array>} Array of snapshot objects with id and timestamp
   */
  async getSnapshots() {
    try {
      return await apiRequest('/snapshots');
    } catch (error) {
      console.error('Failed to fetch snapshots:', error);
      throw error;
    }
  },
  
  /**
   * Get detailed information about a specific snapshot
   * @param {number} id - Snapshot ID
   * @returns {Promise<Object>} Snapshot details including changes and explanations
   */
  async getSnapshot(id) {
    if (!id && id !== 0) {
      throw new Error('Snapshot ID is required');
    }
    
    try {
      return await apiRequest(`/snapshots/${id}`);
    } catch (error) {
      console.error(`Failed to fetch snapshot ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Health check endpoint
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      return await apiRequest('/health');
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },
  
  /**
   * Get API information (no auth required)
   * Useful for debugging connection issues
   * @returns {Promise<Object>} API information
   */
  async getInfo() {
    try {
      // Don't send auth header for info endpoint
      const response = await fetch(`${API_BASE_URL}/api/info`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get API info:', error);
      throw new ApiError(
        'Cannot reach API. Backend may not be running.',
        0,
        null,
        { checkBackend: true }
      );
    }
  }
};

// Export error class for use in components
export { ApiError };

// For debugging in development
if (process.env.NODE_ENV === 'development') {
  window.DEBUG_API = {
    API_BASE_URL,
    ADMIN_USER,
    testConnection: async () => {
      try {
        const info = await Api.getInfo();
        console.log('API Info:', info);
        const health = await Api.healthCheck();
        console.log('Health Check:', health);
        return { success: true, info, health };
      } catch (error) {
        console.error('Connection test failed:', error);
        return { success: false, error };
      }
    }
  };
  console.log('API Debug available at window.DEBUG_API');
}