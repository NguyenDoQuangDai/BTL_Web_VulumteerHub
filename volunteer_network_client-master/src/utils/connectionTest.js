import { API_ENDPOINTS, apiRequest } from '../config/api';

export const testConnection = async () => {
  try {
    // Test basic connectivity to backend
    const response = await fetch('/api/events?page=0&size=1');
    if (response.ok) {
      return { success: true, message: 'Backend connection successful' };
    } else {
      return { success: false, message: `Backend responded with status: ${response.status}` };
    }
  } catch (error) {
    return { 
      success: false, 
      message: `Cannot connect to backend: ${error.message}` 
    };
  }
};

export const healthCheck = {
  // Check if backend is running
  checkBackend: async () => {
    try {
      const response = await fetch('/api/events', { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  },

  // Test authentication endpoint
  checkAuth: async () => {
    try {
      const response = await fetch('/api/auth/login', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test', password: 'test' })
      });
      // We expect 401 or 400, not network error
      return response.status === 401 || response.status === 400;
    } catch {
      return false;
    }
  }
};