import React from 'react';
import { Link } from 'react-router-dom';
import './AdminSidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faPlus,
  faSignOutAlt,
  faUsers,
  faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';

const Sidebar = () => {
  // Sidebar Navigation for Admin Dashboard
  return (
    <div className='sidebar d-flex flex-column justify-content-between py-5 px-4'>
      <ul className='list-unstyled'>
        <li>
          <Link to='/home' className='text-dark'>
            <FontAwesomeIcon icon={faHome} /> <span>Home</span>
          </Link>
        </li>
        <li>
          <Link to='/admin/dashboard' className='text-dark'>
            <FontAwesomeIcon icon={faUsers} /> <span>Volunteer List</span>
          </Link>
        </li>
        <li>
          <Link to='/admin/events' className='text-dark'>
            <FontAwesomeIcon icon={faCalendarAlt} /> <span>Quản lý sự kiện</span>
          </Link>
        </li>
        <li>
          <Link to='/admin/addEvent' className='text-dark'>
            <FontAwesomeIcon icon={faPlus} /> <span>Add Event</span>
          </Link>
        </li>
        <li>
          <Link to='/admin/users' className='text-dark'>
            <FontAwesomeIcon icon={faUsers} /> <span>Quản lý người dùng</span>
          </Link>
        </li>
        <li>
          <Link to='/' className='text-dark'>
            <FontAwesomeIcon icon={faSignOutAlt} /> <span>Logout</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
