import React from 'react';

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const errorHandler = (error) => {
      if (error.message?.includes('fetch')) {
        setHasError(true);
      }
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('fetch')) {
        setHasError(true);
      }
    });

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', errorHandler);
    };
  }, []);

  if (hasError) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="alert alert-danger text-center">
              <h4>⚠️ Backend Connection Error</h4>
              <p>Unable to connect to the backend server.</p>
              <hr />
              <p className="mb-0">
                <strong>Please ensure:</strong>
                <br />
                1. The backend Spring Boot application is running on port 8080
                <br />
                2. Check the backend logs for any errors
                <br />
                3. Verify the database connection
              </p>
              <button 
                className="btn btn-primary mt-3"
                onClick={() => window.location.reload()}
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ErrorBoundary;