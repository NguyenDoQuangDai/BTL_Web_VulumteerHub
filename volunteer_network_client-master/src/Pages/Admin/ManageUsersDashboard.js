import React, { useEffect, useState } from 'react';
import ManageUsers from '../../Components/AdminPanel/ManageUsers';
import AdminSidebar from '../../Components/AdminPanel/AdminSidebar';
import Unauthorized from '../../Components/Unauthorized/Unauthorized';
import '../../Components/AdminPanel/AdminSidebar.css';
// logo replaced with public file at /volumteerhub_logo_final.png
import { Link } from 'react-router-dom';
import { adminService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

const ManageUsersDashboard = () => {
  const [hasAdminAccess, setHasAdminAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  // Test admin access on component mount
  useEffect(() => {
    const testAdminAccess = async () => {
      if (!isAuthenticated) {
        setHasAdminAccess(false);
        setLoading(false);
        return;
      }

      try {
        // Try to call an admin endpoint to test access
        console.log('Testing admin access...');
        const testResult = await adminService.testAccess();
        console.log('Admin test result:', testResult);
        
        const debugResult = await adminService.debugAccess();
        console.log('Admin debug result:', debugResult);
        
        setHasAdminAccess(true);
      } catch (error) {
        console.error('Admin access test failed:', error);
        if (error.message.includes('FORBIDDEN') || error.message.includes('Access denied')) {
          setHasAdminAccess(false);
        } else {
          // Other errors (network, etc.) - assume access might be OK
          setHasAdminAccess(true);
        }
      } finally {
        setLoading(false);
      }
    };

    testAdminAccess();
  }, [isAuthenticated]);

  // Show loading
  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <h4>Checking admin access...</h4>
      </div>
    );
  }

  // Show unauthorized page if no admin access
  if (!hasAdminAccess) {
    return <Unauthorized />;
  }

  // Admin Manage Users View
  return (
    <div className='container-fluid'>
      <div className='row bg-white py-3'>
        <div className='col-md-2'>
          <Link to='/'>
            <img className='w-75 text-center' src='/volumteerhub_logo_final.png' alt='VolumteerHub' />
          </Link>
        </div>
        <div className='col-md-10 d-flex align-items-center'>
          <h5>Quản lý người dùng</h5>
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
          <ManageUsers />
        </div>
      </div>
    </div>
    
  );
};

export default ManageUsersDashboard;
