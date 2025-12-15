import { useHistory } from 'react-router-dom';

// Utility to handle unauthorized access
export const handleUnauthorizedAccess = (error, history) => {
  if (error.message.includes('FORBIDDEN') || error.message.includes('403')) {
    // Redirect to unauthorized page
    history.push('/unauthorized');
    return true;
  }
  
  if (error.message.includes('UNAUTHORIZED') || error.message.includes('401')) {
    // Redirect to login
    history.push('/login');
    return true;
  }
  
  return false;
};

// Hook to handle API errors with automatic redirects
export const useErrorHandler = () => {
  const history = useHistory();
  
  const handleApiError = (error) => {
    const handled = handleUnauthorizedAccess(error, history);
    
    if (!handled) {
      // Handle other errors (show toast, etc.)
      console.error('API Error:', error);
    }
    
    return handled;
  };
  
  return { handleApiError };
};

// Example usage in components:
/*
const MyComponent = () => {
  const { handleApiError } = useErrorHandler();
  
  const callAdminAPI = async () => {
    try {
      await adminService.getAllEvents();
    } catch (error) {
      const handled = handleApiError(error);
      if (!handled) {
        setError('Failed to load data');
      }
    }
  };
};
*/