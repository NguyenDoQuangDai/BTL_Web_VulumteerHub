import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComments,
  faUsers,
  faBell,
  faFileAlt,
  faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';
import './EventChannelDashboard.css';

const EventChannelSidebar = ({ activeTab, setActiveTab, eventStatus }) => {
  const shouldShowTabs = eventStatus === 'APPROVED' || eventStatus === 'COMPLETED';

  return (
    <div className='event-sidebar d-flex flex-column justify-content-between py-5 px-4'>
      <ul className='list-unstyled'>
        <li className={activeTab === 'details' ? 'active' : ''}>
          <button 
            className='sidebar-link text-dark'
            onClick={() => setActiveTab('details')}
          >
            <FontAwesomeIcon icon={faFileAlt} /> <span>Chi tiết</span>
          </button>
        </li>
        {shouldShowTabs && (
          <>
            <li className={activeTab === 'discussion' ? 'active' : ''}>
              <button 
                className='sidebar-link text-dark'
                onClick={() => setActiveTab('discussion')}
              >
                <FontAwesomeIcon icon={faComments} /> <span>Thảo luận</span>
              </button>
            </li>
            <li className={activeTab === 'members' ? 'active' : ''}>
              <button 
                className='sidebar-link text-dark'
                onClick={() => setActiveTab('members')}
              >
                <FontAwesomeIcon icon={faUsers} /> <span>Tình nguyện viên</span>
              </button>
            </li>
            <li className={activeTab === 'notifications' ? 'active' : ''}>
              <button 
                className='sidebar-link text-dark'
                onClick={() => setActiveTab('notifications')}
              >
                <FontAwesomeIcon icon={faBell} /> <span>Theo dõi</span>
              </button>
            </li>
            <li className={activeTab === 'schedule' ? 'active' : ''}>
              <button 
                className='sidebar-link text-dark'
                onClick={() => setActiveTab('schedule')}
              >
                <FontAwesomeIcon icon={faCalendarAlt} /> <span>Lịch trình</span>
              </button>
            </li>
          </>
        )}
      </ul>
    </div>
  );
};

export default EventChannelSidebar;
