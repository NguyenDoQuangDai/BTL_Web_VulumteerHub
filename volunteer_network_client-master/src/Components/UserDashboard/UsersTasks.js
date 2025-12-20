import React, { useState } from 'react';

const UsersTasks = ({ registration, onCancel }) => {
  const [cancelling, setCancelling] = useState(false);
  
  // Handle registration cancellation
  const handleCancel = async () => {
    setCancelling(true);
    try {
      // Pass eventId to onCancel
      onCancel(registration.eventId);
    } catch (error) {
      console.error('Error cancelling registration:', error);
      setCancelling(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className='col-md-6'>
      <div className='card mb-3'>
        <div className='card-body'>
          <div className='d-flex justify-content-between align-items-start'>
            <div className="flex-grow-1">
              {/* Event details */}
              <h5 className="card-title text-primary">
                {registration.event?.name || 'Event Name Not Available'}
              </h5>
              
              {registration.event?.description && (
                <p className="text-muted mb-2">
                  {registration.event.description.length > 100
                    ? `${registration.event.description.substring(0, 100)}...`
                    : registration.event.description}
                </p>
              )}
              
              <div className="row mb-2">
                <div className="col-6">
                  <small className="text-muted">
                    <strong>Registered:</strong><br/>
                    {registration.registrationDate 
                      ? formatDate(registration.registrationDate)
                      : 'N/A'}
                  </small>
                </div>
                <div className="col-6">
                  <small className="text-muted">
                    <strong>Event Date:</strong><br/>
                    {registration.event?.startDate 
                      ? formatDate(registration.event.startDate)
                      : 'N/A'}
                  </small>
                </div>
              </div>
              
              {registration.message && (
                <div className="mb-2">
                  <small className="text-muted">
                    <strong>Your Message:</strong><br/>
                    <em>"{registration.message}"</em>
                  </small>
                </div>
              )}
              
              <div className="mb-2">
                <span className={`badge ${
                  registration.status === 'APPROVED' ? 'badge-success' :
                  registration.status === 'PENDING' ? 'badge-warning' :
                  registration.status === 'REJECTED' ? 'badge-danger' :
                  registration.status === 'COMPLETED' ? 'badge-info' :
                  'badge-secondary'
                }`}>
                  Status: {registration.status || 'PENDING'}
                </span>
              </div>
            </div>

            <div className="ml-3">
              <button
                onClick={handleCancel}
                className='btn btn-sm btn-outline-danger'
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersTasks;
