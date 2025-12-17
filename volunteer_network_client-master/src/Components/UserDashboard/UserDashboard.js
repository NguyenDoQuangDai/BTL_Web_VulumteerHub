import React, { useEffect, useState } from 'react';
import CreateEventForm from './CreateEventForm';
import EventCard from './EventCard';
import { sampleEvents } from './sampleData';
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [interestedIds, setInterestedIds] = useState(new Set());
  
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

  // Load registered events from localStorage (frontend-only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('registeredEvents');
      const ids = raw ? new Set(JSON.parse(raw)) : new Set();
      setRegisteredIds(ids);
    } catch {
      setRegisteredIds(new Set());
    }
  }, []);

  // Load interested events from localStorage (frontend-only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('interestedEvents');
      const ids = raw ? new Set(JSON.parse(raw)) : new Set();
      setInterestedIds(ids);
    } catch {
      setInterestedIds(new Set());
    }
  }, []);

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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>My Volunteer Dashboard</h4>
        {user && (
          <span className="badge badge-info">
            Welcome, {user.username}
          </span>
        )}
      </div>
      <div className="mb-3">
        <button className="btn btn-success" onClick={() => setShowCreateForm(true)}>
          Tạo sự kiện
        </button>
      </div>
      <h5 className='mb-4'>
        You've registered for {registeredIds.size} event{registeredIds.size !== 1 ? 's' : ''}
      </h5>
      <div className='row'>
        {registeredIds.size > 0 ? (
          sampleEvents
            .filter(evt => registeredIds.has(evt.id))
            .map(evt => (
              <div key={evt.id} className="col-12 col-sm-6 col-md-4 mb-4">
                <EventCard evt={evt} />
              </div>
            ))
        ) : (
          <div className="col-12 text-center">
            <div className="alert alert-info">
              <h5>No registrations found</h5>
              <p>You haven't registered for any volunteer events yet.</p>
              <a href="/events" className="btn btn-primary">
                Browse Available Events
              </a>
            </div>
          </div>
        )}
      </div>

      <h5 className='mt-4 mb-3'>
        You're interested in {interestedIds.size} event{interestedIds.size !== 1 ? 's' : ''}
      </h5>
      <div className='row'>
        {interestedIds.size > 0 ? (
          sampleEvents
            .filter(evt => interestedIds.has(evt.id))
            .map(evt => (
              <div key={evt.id} className="col-12 col-sm-6 col-md-4 mb-4">
                <EventCard evt={evt} />
              </div>
            ))
        ) : (
          <div className="col-12 text-center">
            <div className="alert alert-info">
              <h5>No interested events</h5>
              <p>Mark events as interested from the Events tab.</p>
              <a href="/events" className="btn btn-primary">
                Go to Events
              </a>
            </div>
          </div>
        )}
      </div>
      
      {showCreateForm && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateForm(false)}
        >
          <div
            className="modal-content-wrapper"
            onClick={(e) => e.stopPropagation()}
          >
            <CreateEventForm
              onClose={() => setShowCreateForm(false)}
              onCreated={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

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

      {/* Sample grid moved to Events tab (/events) */}
    </div>
  );
};

export default UserDashboard;
