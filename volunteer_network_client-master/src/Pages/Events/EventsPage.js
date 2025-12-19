import React, { useState } from 'react';
import Header from '../../Components/Header/Header';
import Footer from '../../Components/Footer/Footer';
import SampleEventsGrid from '../../Components/UserDashboard/SampleEventsGrid';
import CreateEventForm from '../../Components/UserDashboard/CreateEventForm';
import { useAuth } from '../../contexts/AuthContext';

const EventsPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Header />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Danh sách sự kiện</h2>
          {isAuthenticated && (
            <button className="btn btn-success" onClick={() => setShowCreateForm(true)}>
              Tạo sự kiện
            </button>
          )}
        </div>
        <SampleEventsGrid />
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
      
      <Footer />
    </>
  );
};

export default EventsPage;
