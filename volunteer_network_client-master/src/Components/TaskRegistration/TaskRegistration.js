import React, { useState, useEffect } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import '../Login/Login.css';
// logo replaced with public file at /volumteerhub_logo_final.png
import { useAuth } from '../../contexts/AuthContext';
import { eventService, registrationService } from '../../services/apiService';

// ============================================================================================

const TaskRegister = () => {
  // Receive user clicked event id using useParams hook:
  const { id } = useParams();

  // Set state
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [formData, setFormData] = useState({
    message: ''
  });

  // Get the single event user clicked from API:
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const eventData = await eventService.getEvent(id);
        setEvent(eventData);
        setError(null);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  // Auth context
  const { user } = useAuth();

  // Handle redirected to user dashboard
  let history = useHistory();

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // When user registers, send the data to server and redirect user to UserDashboard
  const onSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setRegistering(true);
      
      // Register for the event
      await registrationService.registerForEvent(id, formData.message);
      
      // Redirect to user dashboard
      history.push('/userDashboard');
      
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <section className='container'>
        <div className='d-flex justify-content-center flex-column align-items-center my-5'>
          <div>Loading event details...</div>
        </div>
      </section>
    );
  }

  if (error || !event) {
    return (
      <section className='container'>
        <div className='d-flex justify-content-center flex-column align-items-center my-5'>
          <div className="text-danger">{error || 'Event not found'}</div>
          <Link to="/" className="btn btn-primary mt-3">Go Back Home</Link>
        </div>
      </section>
    );
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <section className='container'>
      <div className='d-flex justify-content-center flex-column align-items-center my-5'>
        <div className='row mb-2'>
          <Link to='/'>
            <div className='col-md-12 text-center mb-3'>
              <img className='w-25' src='/volumteerhub_logo_final.png' alt='VolumteerHub' />
            </div>
          </Link>
        </div>
        <div className='row'>
          <div className='col-md-12'>
            <form
              onSubmit={onSubmit}
              className='login-form shadow bg-white rounded text-left p-3'
            >
              <h4 className='font-weight-bold mb-3'>Register as a Volunteer</h4>
              
              {/* Show error message */}
              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}

              {/* Event Details */}
              <div className='mb-4 p-3 bg-light rounded'>
                <h5 className="text-primary">{event.name}</h5>
                {event.description && (
                  <p className="mb-2">{event.description}</p>
                )}
                <div className="row">
                  <div className="col-md-6">
                    <small className="text-muted">
                      <strong>Start Date:</strong><br/>
                      {formatDate(event.startDate)}
                    </small>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted">
                      <strong>End Date:</strong><br/>
                      {formatDate(event.endDate)}
                    </small>
                  </div>
                </div>
                {event.dateDeadline && (
                  <div className="mt-2">
                    <small className="text-warning">
                      <strong>Registration Deadline:</strong> {formatDate(event.dateDeadline)}
                    </small>
                  </div>
                )}
              </div>

              {/* Registration Form */}
              <div className='form-group'>
                <label htmlFor="username">Username</label>
                <input
                  className='form-control'
                  id="username"
                  name='username'
                  type='text'
                  value={user?.username || ''}
                  placeholder='Username'
                  readOnly
                />
              </div>
              
              <div className='form-group'>
                <label htmlFor="message">Message (Optional)</label>
                <textarea
                  className='form-control'
                  id="message"
                  name='message'
                  placeholder='Tell us why you want to volunteer for this event...'
                  rows='3'
                  value={formData.message}
                  onChange={handleInputChange}
                />
              </div>

              <div className='form-group'>
                <button
                  style={{ width: '100%' }}
                  className='btn btn-primary'
                  type='submit'
                  disabled={registering}
                >
                  {registering ? 'Registering...' : 'Register as Volunteer'}
                </button>
              </div>
              
              <div className="text-center mt-3">
                <Link to="/" className="btn btn-outline-secondary">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TaskRegister;
