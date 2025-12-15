// API Configuration  
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://localhost:8080/api' 
  : '/api';

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
  },
  
  // Events (Tasks)
  EVENTS: {
    LIST: `${API_BASE_URL}/events`,
    GET: (id) => `${API_BASE_URL}/events/${id}`,
    CREATE: `${API_BASE_URL}/events`,
    UPDATE: (id) => `${API_BASE_URL}/events/${id}`,
    DELETE: (id) => `${API_BASE_URL}/events/${id}`,
    SUBMIT: (id) => `${API_BASE_URL}/events/${id}/submit`,
  },
  
  // Registrations
  REGISTRATIONS: {
    LIST: `${API_BASE_URL}/registrations`,
    CREATE: `${API_BASE_URL}/registrations`,
    GET: (id) => `${API_BASE_URL}/registrations/${id}`,
  },
  
  // Users
  USERS: {
    LIST: `${API_BASE_URL}/users`,
    GET: (id) => `${API_BASE_URL}/users/${id}`,
    CREATE: `${API_BASE_URL}/users`,
  },
  
  // Admin
  ADMIN: {
    APPROVE_EVENT: (id) => `${API_BASE_URL}/admin/events/${id}/approve`,
    REJECT_EVENT: (id) => `${API_BASE_URL}/admin/events/${id}/reject`,
    GET_ALL_EVENTS: `${API_BASE_URL}/admin/events`,
    GET_ALL_REGISTRATIONS: `${API_BASE_URL}/admin/registrations`,
  }
};

// HTTP request helper function
export const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle specific HTTP status codes
      if (response.status === 403) {
        throw new Error('FORBIDDEN: You do not have permission to access this resource');
      }
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED: Please login to continue');
      }
      
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    // Handle no content responses
    if (response.status === 204) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

export default API_BASE_URL;