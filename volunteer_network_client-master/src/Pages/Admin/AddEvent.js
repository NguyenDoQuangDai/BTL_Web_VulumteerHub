import React from 'react';
import AdminSidebar from '../../Components/AdminPanel/AdminSidebar';
import '../../Components/AdminPanel/AdminSidebar.css';
import logo from '../../assets/logos/logo.png';
import { Link } from 'react-router-dom';
import Event from '../../Components/AdminPanel/Event';

const AdminEvent = () => {
  // Add Event form View
  return (
    <div className='container-fluid'>
      <div className='row bg-white py-3'>
        <div className='col-md-2'>
          <Link to='/'>
            <img className='w-75 text-center' src={logo} alt='' />
          </Link>
        </div>
        <div className='col-md-10 d-flex align-items-center'>
          <h5>Add Event</h5>
        </div>
      </div>
      <div className='row bg-white'>
        <div className='col-md-2 admin-sidebar' >
          <AdminSidebar />
        </div>
        <div
          className='col-md-10'
          style={{ backgroundColor: '#F4F7FC' }}
        >
          <Event/>
        </div>
      </div>
    </div>
    
  );
};

export default AdminEvent;
