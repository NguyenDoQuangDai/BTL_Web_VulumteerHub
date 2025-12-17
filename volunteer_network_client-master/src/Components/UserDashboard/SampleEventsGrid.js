import React from 'react';
import EventCard from './EventCard';
import { sampleEvents } from './sampleData';

const SampleEventsGrid = () => {
  return (
    <div className="mt-4">
      <h5 className="mb-3">Sự kiện mẫu</h5>
      <div className="row">
        {sampleEvents.map((evt) => (
          <div key={evt.id} className="col-12 col-sm-6 col-md-4 mb-4">
            <EventCard evt={evt} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SampleEventsGrid;
