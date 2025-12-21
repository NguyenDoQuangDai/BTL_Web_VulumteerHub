import React, { useState } from 'react';
import './Home.css';
import '../UserDashboard/UserDashboard.css';
import EventCard from '../UserDashboard/EventCard';
import { sampleEvents } from '../UserDashboard/sampleData';

const Banner = () => {
  return (
    <section className='banner d-flex align-items-center text-center'>
      <div className='container container-search'>
      </div>
      <div className="brand-title">VolumteerHub</div>
    </section>
  );
};

const Home = () => {
  const [visibleCount, setVisibleCount] = useState(3);
  const visibleEvents = sampleEvents.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 3);
  };

  return (
    <div className="home-page">
      <Banner />
      <section className="featured-events container py-5">
        <h2 className="text-center mb-5 font-weight-bold">Sự kiện nổi bật</h2>
        <div className="row">
          {visibleEvents.map(evt => (
            <div key={evt.id} className="col-md-4 mb-4">
              <EventCard evt={evt} />
            </div>
          ))}
        </div>
        {visibleCount < sampleEvents.length && (
          <div className="text-center mt-4">
            <button className="btn btn-primary px-5 py-2" onClick={handleLoadMore}>
              Xem thêm
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
