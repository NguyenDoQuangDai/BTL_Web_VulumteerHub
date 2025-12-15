import React, { useEffect, useState } from 'react';
import TaskItem from '../TaskItem/TaskItem';
import './Tasks.css';
import PreLoader from '../PreLoader/PreLoader';
import { eventService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Tasks = () => {
  // Set data using hook:
  const [tasksData, setTasksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Auth context
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Get data from API and set the data:
  useEffect(() => {
    const fetchEvents = async () => {
      // Only fetch if user is authenticated
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await eventService.getEvents(0, 20, 'APPROVED'); // Only get approved events
        setTasksData(response.events);
        setError(null);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try logging in again.');
        setTasksData([]);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchEvents();
    }
  }, [isAuthenticated, authLoading]);

  // Show loading while checking auth or fetching data
  if (authLoading || loading) {
    return (
      <div className='container tasks-area'>
        <div className='row my-5'>
          <PreLoader visibility="block" />
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className='container tasks-area'>
        <div className='row my-5'>
          <div className="col-12 text-center">
            <div className="alert alert-info">
              <h5>🔐 Login Required</h5>
              <p>Please log in to view available volunteer events.</p>
              <Link to="/login" className="btn btn-primary">
                Login / Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container tasks-area'>
        <div className='row my-5'>
          <div className="col-12 text-center">
            <div className="alert alert-danger">
              <p>{error}</p>
              <Link to="/login" className="btn btn-outline-primary">
                Try Login Again
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container tasks-area'>
      <div className='row my-5'>
        {/* Send the tasksData as props to TaskItem Component */}
        {tasksData.length > 0 ? (
          tasksData.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))
        ) : (
          <div className="col-12 text-center">
            <div className="alert alert-info">
              <p>No volunteer events available at the moment.</p>
              <p className="mb-0">Check back later for new opportunities!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
