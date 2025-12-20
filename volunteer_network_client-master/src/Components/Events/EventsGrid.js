import React, { useState, useEffect } from 'react';
import EventCard from '../UserDashboard/EventCard';
import { eventService } from '../../services/apiService';

const EventsGrid = ({ searchQuery, status, sort }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    const fetchInitialEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        // Initial load: 6 events
        const res = await eventService.getEvents(0, 6, status, searchQuery, sort);
        setEvents(res.events || []);
        setTotalElements(res.totalElements || 0);
        setHasMore((res.events?.length || 0) < (res.totalElements || 0));
      } catch (err) {
        setError('Không thể tải danh sách sự kiện');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialEvents();
  }, [searchQuery, status, sort]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      // Calculate next page based on current count (assuming size 3 for subsequent loads)
      // Initial was 6 (2 pages of 3). So if we have 6, we want page 2.
      // If we have 9, we want page 3.
      const nextPage = Math.floor(events.length / 3);
      const res = await eventService.getEvents(nextPage, 3, status, searchQuery, sort);
      
      const newEvents = res.events || [];
      setEvents(prev => [...prev, ...newEvents]);
      setHasMore(events.length + newEvents.length < res.totalElements);
    } catch (err) {
      console.error("Error loading more events:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
  if (error) return <div className="text-danger text-center py-5">{error}</div>;

  return (
    <div className="mt-4">
      <div className="row">
        {events.length === 0 ? (
          <div className="col-12 text-center py-5">
            <p className="text-muted">Không tìm thấy sự kiện nào phù hợp.</p>
          </div>
        ) : (
          events.map((evt) => (
            <div key={evt.id} className="col-12 col-sm-6 col-md-4 mb-4">
              <EventCard evt={evt} />
            </div>
          ))
        )}
      </div>
      
      {hasMore && (
        <div className="text-center mt-4 mb-5">
          <button 
            className="btn btn-outline-primary" 
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>
                Đang tải...
              </>
            ) : (
              'Xem thêm'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default EventsGrid;
