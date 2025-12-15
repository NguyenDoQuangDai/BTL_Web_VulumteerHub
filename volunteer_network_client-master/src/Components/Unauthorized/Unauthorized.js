import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 text-center">
          <div className="card shadow-lg">
            <div className="card-body p-5">
              <div className="mb-4">
                <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '4rem' }}></i>
              </div>
              
              <h2 className="text-danger mb-3">Access Denied</h2>
              <h4 className="text-muted mb-4">403 - Forbidden</h4>
              
              <p className="lead mb-4">
                You don't have permission to access this resource.
              </p>
              
              <div className="alert alert-warning" role="alert">
                <strong>Admin privileges required!</strong><br/>
                This section is only available to administrators.
              </div>
              
              <div className="mt-4">
                <Link to="/" className="btn btn-primary btn-lg me-3">
                  <i className="fas fa-home me-2"></i>
                  Go Home
                </Link>
                
                <Link to="/login" className="btn btn-outline-secondary btn-lg">
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Login as Admin
                </Link>
              </div>
              
              <div className="mt-4">
                <small className="text-muted">
                  If you believe this is an error, please contact your system administrator.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;