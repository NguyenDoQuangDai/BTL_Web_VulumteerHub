import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faUser,
  faLock,
  faCog,
} from '@fortawesome/free-solid-svg-icons';
import './settings.css';

const SettingsSidebar = ({ activeTab, setActiveTab }) => {
  return (
    <div className='settings-sidebar d-flex flex-column py-5 px-4'>
      <h5 className='mb-4 text-muted'>Cài đặt</h5>
      <ul className='list-unstyled'>
        <li className={activeTab === 'notifications' ? 'active' : ''}>
          <button 
            className='sidebar-link text-dark'
            onClick={() => setActiveTab('notifications')}
          >
            <FontAwesomeIcon icon={faBell} /> <span>Thông báo đẩy</span>
          </button>
        </li>
        <li className={activeTab === 'account' ? 'active' : ''}>
          <button 
            className='sidebar-link text-dark'
            onClick={() => setActiveTab('account')}
          >
            <FontAwesomeIcon icon={faUser} /> <span>Tài khoản</span>
          </button>
        </li>
        <li className={activeTab === 'general' ? 'active' : ''}>
          <button 
            className='sidebar-link text-dark'
            onClick={() => setActiveTab('general')}
          >
            <FontAwesomeIcon icon={faCog} /> <span>Chung</span>
          </button>
        </li>
      </ul>
    </div>
  );
};

export default SettingsSidebar;
