import React, { useState, useEffect } from 'react';
import EventCard from './EventCard';
import { eventService } from '../../services/apiService';

const SampleEventsGrid = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await eventService.getEvents(0, 20);
        setEvents(res.events || []);
      } catch (err) {
        setError('Không thể tải danh sách sự kiện');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) return <div>Đang tải sự kiện...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  return (
    <div className="mt-4">
      <div className="row">
        {events.length === 0 ? (
          <div className="col-12 text-center">Không có sự kiện nào.</div>
        ) : (
          events.map((evt) => (
            <div key={evt.id} className="col-12 col-sm-6 col-md-4 mb-4">
              <EventCard evt={evt} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SampleEventsGrid;
