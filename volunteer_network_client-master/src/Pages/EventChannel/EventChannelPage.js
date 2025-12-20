import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import EventChannelDashboard from '../../Components/EventChannel/EventChannelDashboard';
import Header from '../../Components/Header/Header';
import Footer from '../../Components/Footer/Footer';
import { eventService } from '../../services/apiService';

const EventChannelPage = () => {
  const { id } = useParams();
  const history = useHistory();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const data = await eventService.getEvent(id);
        setEvent(data);
      } catch (err) {
        console.error("Error loading event", err);
        setError("Không thể tải thông tin sự kiện");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  if (loading) {
    return (
        <>
            <Header />
            <div className="container mt-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-2">Đang tải sự kiện...</p>
            </div>
            <Footer />
        </>
    );
  }

  if (error || !event) {
    return (
        <>
            <Header />
            <div className="container mt-5 text-center">
                <p className="text-danger">{error || "Sự kiện không tồn tại"}</p>
                <button className="btn btn-primary" onClick={() => history.push('/events')}>
                    Quay lại danh sách
                </button>
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
