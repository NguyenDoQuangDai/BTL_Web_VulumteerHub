import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import EventChannelDashboard from '../../Components/EventChannel/EventChannelDashboard';
import Header from '../../Components/Header/Header';
import Footer from '../../Components/Footer/Footer';

const EventChannelPage = () => {
  const { id } = useParams();
  const history = useHistory();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    // Try to find event in mockEvents (localStorage)
    try {
      const mockEvents = JSON.parse(localStorage.getItem('mockEvents') || '[]');
      const foundEvent = mockEvents.find(e => e.id === id || e._id === id);
      
      if (foundEvent) {
        setEvent(foundEvent);
      } else {
        // Fallback to checking if it's one of the hardcoded events in EventCard/Tasks if needed
        // For now, just redirect if not found
        // alert('Event not found');
        // history.push('/events');
      }
    } catch (e) {
      console.error("Error loading event", e);
    }
  }, [id, history]);

  if (!event) {
    return (
        <>
            <Header />
            <div className="container mt-5 text-center">
                <p>Đang tải sự kiện hoặc sự kiện không tồn tại...</p>
            </div>
            <Footer />
        </>
    );
  }

  return (
    <>
      <Header />
      <div style={{ minHeight: '80vh', backgroundColor: '#f0f2f5' }}>
        <EventChannelDashboard 
            event={event} 
            onClose={() => history.push('/events')} 
        />
      </div>
      <Footer />
    </>
  );
};

export default EventChannelPage;
