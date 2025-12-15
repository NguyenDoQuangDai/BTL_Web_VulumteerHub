import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UsersTasks from './UsersTasks';
import './UserDashboard.css';
import PreLoader from '../PreLoader/PreLoader';
import { registrationService } from '../../services/apiService';

const UserDashboard = () => {
  // Set state for user registrations:
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Auth context
  const { user, isAuthenticated } = useAuth();

  // Fetch user's registrations from API:
  useEffect(() => {
    const fetchUserRegistrations = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const registrations = await registrationService.getUserRegistrations();
        setUserRegistrations(registrations);
        setError(null);
      } catch (err) {
        console.error('Error fetching user registrations:', err);
        setError('Failed to load your registrations');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRegistrations();
  }, [isAuthenticated]);

  // Handle registration cancellation
  const handleCancelRegistration = (registrationId) => {
    // Remove from local state immediately for better UX
    setUserRegistrations(prev => prev.filter(reg => reg.id !== registrationId));
  };

  if (!isAuthenticated) {
    return (
      <div className='container mt-5'>
        <div className="text-center">
          <h4>Please log in to view your dashboard</h4>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='container mt-5'>
        <PreLoader visibility="block" />
      </div>
    );
  }



  return (
    <div className='container mt-5'>
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4>My Volunteer Dashboard</h4>
            {user && (
              <span className="badge badge-info">
                Welcome, {user.username}
              </span>
            )}
          </div>
          
          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}
          
          <h5 className='mb-4'>
            You've registered for {userRegistrations.length} event{userRegistrations.length !== 1 ? 's' : ''}
          </h5>
        </div>
      </div>
      
      <div className='row'>
        {userRegistrations.length > 0 ? (
          userRegistrations.map((registration) => (
            <UsersTasks
              key={registration.id}
              registration={registration}
              onCancel={handleCancelRegistration}
            />
          ))
        ) : (
          <div className="col-12 text-center">
            <div className="alert alert-info">
              <h5>No registrations found</h5>
              <p>You haven't registered for any volunteer events yet.</p>
              <a href="/" className="btn btn-primary">
                Browse Available Events
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
