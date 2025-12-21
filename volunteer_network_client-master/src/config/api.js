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
    CREATE: (eventId) => `${API_BASE_URL}/registrations/${eventId}/join`,
    GET: (id) => `${API_BASE_URL}/registrations/${id}`,
    APPROVE: (id) => `${API_BASE_URL}/registrations/${id}/approve`,
    REJECT: (id) => `${API_BASE_URL}/registrations/${id}/reject`,
    DELETE: (id) => `${API_BASE_URL}/registrations/${id}`,
  },
  
  // Users
  USERS: {
    LIST: `${API_BASE_URL}/users`,
    GET: (id) => `${API_BASE_URL}/users/${id}`,
    MYSELF: `${API_BASE_URL}/users/myself`,
    CREATE: `${API_BASE_URL}/users`,
    UPDATE: (id) => `${API_BASE_URL}/users/${id}`,
  },
  
  // Admin
  ADMIN: {
    TEST: `${API_BASE_URL}/admin/test`,
    DEBUG: `${API_BASE_URL}/admin/debug`,
    APPROVE_EVENT: (id) => `${API_BASE_URL}/admin/events/${id}/approve`,
    REJECT_EVENT: (id) => `${API_BASE_URL}/admin/events/${id}/reject`,
    GET_ALL_EVENTS: `${API_BASE_URL}/admin/events`,
    GET_ALL_REGISTRATIONS: `${API_BASE_URL}/admin/registrations`,
  },

  // Posts
  POSTS: {
    LIST_ALL: `${API_BASE_URL}/posts`,
    LIST_BY_EVENT: (eventId) => `${API_BASE_URL}/events/${eventId}/posts`,
    CREATE: (eventId) => `${API_BASE_URL}/events/${eventId}/posts`,
    GET: (id) => `${API_BASE_URL}/posts/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/posts/${id}`,
    DELETE: (id) => `${API_BASE_URL}/posts/${id}`,
    REACT: (id, type) => `${API_BASE_URL}/posts/${id}/reaction/${type}`,
  },

  // Comments
  COMMENTS: {
    LIST_BY_POST: (postId) => `${API_BASE_URL}/posts/${postId}/comments`,
    CREATE: (postId) => `${API_BASE_URL}/posts/${postId}/comments`,
    REPLY: (postId, commentId) => `${API_BASE_URL}/posts/${postId}/comments/${commentId}/reply`,
    DELETE: (commentId) => `${API_BASE_URL}/comments/${commentId}`,
  },

  // Dashboard
  DASHBOARD: {
    SUMMARY: `${API_BASE_URL}/dashboard/summary`,
    RECENT_APPROVED: `${API_BASE_URL}/dashboard/recent-approved`,
    WITH_NEW_POSTS: `${API_BASE_URL}/dashboard/with-new-posts`,
    TRENDING: `${API_BASE_URL}/dashboard/trending`,
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
      
      // Use backend error message first, fallback to generic messages
      const errorMessage = errorData.message || errorData.error;
      
      // Handle specific HTTP status codes with custom messages if no backend message
      if (response.status === 403) {
        throw new Error(errorMessage || 'You do not have permission to access this resource');
      }
      if (response.status === 401) {
        // For login page, show backend message (e.g., "Invalid username or password")
        // For other pages, show generic unauthorized message
        throw new Error(errorMessage || 'Please login to continue');
      }
      
      throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
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