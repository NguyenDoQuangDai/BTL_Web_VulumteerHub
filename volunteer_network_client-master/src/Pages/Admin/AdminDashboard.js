import React, { useEffect, useState } from 'react';
import RegisteredDataTables from '../../Components/AdminPanel/RegisteredDataTables';
import AdminSidebar from '../../Components/AdminPanel/AdminSidebar';
import Unauthorized from '../../Components/Unauthorized/Unauthorized';
import '../../Components/AdminPanel/AdminSidebar.css';
import logo from '../../assets/logos/logo.png';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
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

  // Admin Volunteer Registration List View
  return (
    <div className='container-fluid'>
      <div className='row bg-white py-3'>
        <div className='col-md-custom-sidebar'>
          <Link to='/'>
            <img className='w-75 text-center' src={logo} alt='' />
          </Link>
        </div>
        <div className='col-md-custom-content d-flex align-items-center justify-content-between'>
          <h5>Volunteer Register List</h5>
          <Link to="/home" className="btn btn-outline-danger">
            Close
          </Link>
        </div>
      </div>
      <div className='row bg-white'>
        <div className='col-md-custom-sidebar admin-sidebar' >
          <AdminSidebar />
        </div>
        <div
          className='col-md-custom-content'
          style={{ backgroundColor: '#F4F7FC' }}
        >
          <RegisteredDataTables />
        </div>
      </div>
    </div>
    
  );
};

export default AdminDashboard;
