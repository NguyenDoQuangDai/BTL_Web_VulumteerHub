import React from 'react';
import './Header.css';
import { Link, useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCog, faChartLine } from '@fortawesome/free-solid-svg-icons';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const history = useHistory();

  const handleSignOut = () => {
    logout();
    history.push('/');
  };

  return (
    <nav className='navbar navbar-expand-lg navbar-light bg-light'>
      <div className='container'>
        <Link to='/' className='navbar-brand' href='#'>
          <img src='/volumteerhub_logo_final.png' alt='VolumteerHub' />
        </Link>
        <button
          className='navbar-toggler'
          type='button'
          data-toggle='collapse'
          data-target='#navbarNavAltMarkup'
          aria-controls='navbarNavAltMarkup'
          aria-expanded='false'
          aria-label='Toggle navigation'
        >
          <span className='navbar-toggler-icon'></span>
        </button>
        <div className='collapse navbar-collapse' id='navbarNavAltMarkup'>
          <div className='navbar-nav justify-content-between nav-link ml-auto align-items-md-center'>
            <Link to='/home' className='nav-link active'>
              Home
            </Link>
            
            {/* Dashboard link - hiển thị cho người dùng đã đăng nhập */}
            {isAuthenticated && (
              <Link to='/dashboard' className='nav-link'>
                <FontAwesomeIcon icon={faChartLine} className="mr-1" />
                Dashboard
              </Link>
            )}
            
            <Link to='/events' className='nav-link'>
              Events
            </Link>
<<<<<<< HEAD
            {/* Forum tab removed */}
            {/* If user logged in show User Dashboard */}
=======
            <Link to='/forum' className='nav-link'>
              Forum
            </Link>
            
>>>>>>> 0dcca80fbfe6dd1712e3480b7cddd56324e3ddff
            {isAuthenticated && (
              <Link to='/userDashboard' className='nav-link'>
                <button type='button' className='btn btn-info w-100'>
                  My Profile
                </button>
              </Link>
            )}

            {!isAuthenticated ? (
              <Link to='/login' className='nav-link'>
                <button type='button' className='btn btn-primary w-100'>
                  Login
                </button>
              </Link>
            ) : (
              <div className="d-flex align-items-center">
                {user && (
                  <span className="navbar-text mr-3">
                    Hello, {user.username}
                  </span>
                )}
                <button
                  onClick={handleSignOut}
                  type='button'
                  className='btn btn-danger'
                >
                  Sign Out
                </button>
              </div>
            )}
            
            {user && (user.role === 'ADMIN' || user.role === 'Admin') && (
              <Link to='/admin/events' className='nav-link'>
                <button type='button' className='btn btn-dark w-100'>
                  Admin
                </button>
              </Link>
            )}
            
            <Link to='/notifications' className='nav-link' title="Thông báo">
              <FontAwesomeIcon icon={faBell} size="lg" className="text-secondary" />
            </Link>
            <Link to='/settings' className='nav-link' title="Cài đặt">
              <FontAwesomeIcon icon={faCog} size="lg" className="text-secondary" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
