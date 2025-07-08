/**
 * API Client for EntraID Change Detection System
 * -- Updated for session-based (cookie) authentication --
 */

// Use a relative URL for API requests. This works with the proxy in development
// and is correct for production when frontend and backend are served from the same domain.
const API_BASE_URL = ''; 

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
 * Generic API request handler with comprehensive error handling.
 * It now includes credentials (cookies) with every request.
 * * @param {string} path - API endpoint path (e.g., '/snapshots')
 * @param {Object} options - Fetch options
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the request
 * @returns {Promise<any>} - Parsed JSON response
 * @throws {ApiError} - On any API error
 */
async function apiRequest(path, options = {}, signal) {
    const url = `${API_BASE_URL}/api${path}`;
    
    if (process.env.NODE_ENV === 'development') {
        console.debug(`API Request: ${options.method || 'GET'} ${url}`);
    }
    
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers,
            },
            // --- CHANGE: This tells the browser to send cookies with the request ---
            credentials: 'include',
            signal: signal, // Pass the abort signal to fetch
        });

        if (response.ok) {
            // For 204 No Content, there's no body to parse
            if (response.status === 204) {
                return null;
            }
            const data = await response.json();
            if (process.env.NODE_ENV === 'development') {
                console.debug('API Response:', data);
            }
            return data;
        }

        // Handle error responses
        let errorBody = {};
        try {
            errorBody = await response.json();
        } catch { /* Ignore if response is not JSON */ }

        const errorMessage = errorBody.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new ApiError(errorMessage, response.status, response, errorBody);
        
    } catch (error) {
        if (error instanceof ApiError || error.name === 'AbortError') {
            throw error;
        }
        
        if (error.message === 'Failed to fetch') {
            throw new ApiError('Cannot connect to backend server.', 0);
        }
        
        throw new ApiError(error.message || 'An unexpected error occurred', 0);
    }
}

/**
 * API client with all available endpoints
 */
export const Api = {
    /**
     * --- NEW: Login function ---
     * @param {string} username
     * @param {string} password
     * @returns {Promise<Object>} Login response message
     */
    async login(username, password) {
        return apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
    },

    /**
     * --- NEW: Logout function ---
     * @returns {Promise<Object>} Logout response message
     */
    async logout() {
        return apiRequest('/logout', {
            method: 'POST',
        });
    },

    /**
     * --- NEW: Check authentication status ---
     * We check status by trying to access a protected route.
     * @returns {Promise<{isLoggedIn: boolean, user: string | null}>}
     */
    async checkAuthStatus() {
        try {
            // The /snapshots endpoint is protected. If this succeeds, we are logged in.
            // We only need the status, not the data, so we can abort it quickly if needed.
            await apiRequest('/snapshots', { method: 'HEAD' }); // HEAD is lighter than GET
            // Note: A more robust way would be a dedicated /api/me endpoint.
            // For now, this is a simple and effective check.
            return { isLoggedIn: true };
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                return { isLoggedIn: false };
            }
            // For other errors (e.g., server down), we also consider the user not logged in.
            return { isLoggedIn: false };
        }
    },

    /**
     * Get list of all snapshots
     */
    async getSnapshots() {
        return apiRequest('/snapshots');
    },
    
    /**
     * Get detailed information about a specific snapshot
     * @param {number} id - Snapshot ID
     * @param {AbortSignal} signal - AbortSignal to cancel the request
     */
    async getSnapshot(id, signal) {
        if (!id && id !== 0) {
            throw new Error('Snapshot ID is required');
        }
        return apiRequest(`/snapshots/${id}`, {}, signal);
    },
};

// Export error class for use in components
export { ApiError };
