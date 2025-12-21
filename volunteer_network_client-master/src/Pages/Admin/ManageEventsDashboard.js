import React, { useEffect, useState } from 'react';
import AdminSidebar from '../../Components/AdminPanel/AdminSidebar';
import Unauthorized from '../../Components/Unauthorized/Unauthorized';
import ManageEvents from '../../Components/AdminPanel/ManageEvents';
import '../../Components/AdminPanel/AdminSidebar.css';
import logo from '../../assets/logos/logo.png';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

const ManageEventsDashboard = () => {
  const [hasAdminAccess, setHasAdminAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const testAdminAccess = async () => {
      if (!isAuthenticated) {
        setHasAdminAccess(false);
        setLoading(false);
        return;
      }

      try {
        await adminService.testAccess();
        await adminService.debugAccess();
        setHasAdminAccess(true);
      } catch (error) {
        if (error.message.includes('FORBIDDEN') || error.message.includes('Access denied')) {
          setHasAdminAccess(false);
        } else {
          setHasAdminAccess(true);
        }
      } finally {
        setLoading(false);
      }
    };

    testAdminAccess();
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <h4>Checking admin access...</h4>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return <Unauthorized />;
  }

  return (
    <div className='container-fluid'>
      <div className='row bg-white py-3'>
        <div className='col-md-custom-sidebar'>
          <Link to='/'>
            <img className='w-75 text-center' src={logo} alt='' />
          </Link>
        </div>
        <div className='col-md-custom-content d-flex align-items-center'>
          <h5>Quản lý sự kiện</h5>
        </div>
      </div>
      <div className='row bg-white'>
        <div className='col-md-custom-sidebar admin-sidebar'>
          <AdminSidebar />
        </div>
        <div className='col-md-custom-content' style={{ backgroundColor: '#F4F7FC' }}>
          <ManageEvents />
        </div>
      </div>
    </div>
  );
};

export default ManageEventsDashboard;
