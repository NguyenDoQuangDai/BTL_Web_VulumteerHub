import React, { useState, useEffect } from 'react';
import EventCard from './EventCard';
import { sampleEvents } from './sampleData';

const SampleEventsGrid = () => {
  const [events, setEvents] = useState(sampleEvents);

  useEffect(() => {
    const loadEvents = () => {
      try {
        const storedEvents = localStorage.getItem('mockEvents');
        if (storedEvents) {
          const parsedEvents = JSON.parse(storedEvents);
          setEvents([...parsedEvents, ...sampleEvents]);
        }
      } catch (error) {
        console.error('Error loading mock events:', error);
      }
    };
    loadEvents();
    
    // Listen for storage changes to update in real-time if multiple tabs
    window.addEventListener('storage', loadEvents);
    return () => window.removeEventListener('storage', loadEvents);
  }, []);

  return (
    <div className="mt-4">
      <h5 className="mb-3">Sự kiện mẫu</h5>
      <div className="row">
        {events.map((evt) => (
          <div key={evt.id} className="col-12 col-sm-6 col-md-4 mb-4">
            <EventCard evt={evt} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SampleEventsGrid;
