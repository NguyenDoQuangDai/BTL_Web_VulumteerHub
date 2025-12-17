import React from 'react';
import Header from '../../Components/Header/Header';
import Footer from '../../Components/Footer/Footer';
import SampleEventsGrid from '../../Components/UserDashboard/SampleEventsGrid';

const EventsPage = () => {
  return (
    <>
      <Header />
      <div className="container mt-4">
        <SampleEventsGrid />
      </div>
      <Footer />
    </>
  );
};

export default EventsPage;
