import React from 'react';
import { Link } from 'react-router-dom';

const TaskItem = (props) => {
  // Receive props from Tasks component - using backend event structure
  const { id, name, description, startDate, endDate } = props.task;
  
  // Generate random colors for cards (replacing faker)
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className='col-md-3 mb-4'>
      {/* Dynamically route when user clicked on task and ask for Registration */}
      <Link to={`/events/${id}`}>
        <div className='card h-100 task-image'>
          <div
            className='card-body h-100 rounded text-light text-center d-flex flex-column justify-content-center'
            style={{ backgroundColor: randomColor, minHeight: '200px' }}
          >
            <h6 className="card-title font-weight-bold mb-3">{name}</h6>
            {description && (
              <p className="card-text small mb-3" style={{ fontSize: '0.9rem' }}>
                {description.length > 80 
                  ? `${description.substring(0, 80)}...` 
                  : description
                }
              </p>
            )}
            <div className="mt-auto">
              {startDate && (
                <small className="text-light">
                  Starts: {formatDate(startDate)}
                </small>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default TaskItem;
