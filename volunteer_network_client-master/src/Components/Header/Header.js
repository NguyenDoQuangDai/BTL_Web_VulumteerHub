import React from 'react';
import './Header.css';
import logo from '../../assets/logos/logo.png';
import { Link, useHistory } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
//=============================================================================

const Header = () => {
  // Auth context
  const { user, isAuthenticated, logout } = useAuth();
  const history = useHistory();

  // Handle sign out button
  const handleSignOut = () => {
    logout();
    history.push('/');
  };

  return (
    <nav className='navbar navbar-expand-lg navbar-light bg-light'>
      <div className='container'>
        <Link to='/' className='navbar-brand' href='#'>
          <img src={logo} alt='Volunteer-Network' />
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
          <div className='navbar-nav  justify-content-between nav-link ml-auto align-items-md-center'>
            {/* Home Navigation Click redirect to home */}
            <Link to='/home' className='nav-link active'>
              Home
            </Link>
            <Link to='/donation' className='nav-link' href='#'>
              Donation
            </Link>
            <Link to='/events' className='nav-link' href='#'>
              Events
            </Link>
            <Link to='/blog' className='nav-link' href='#'>
              Blog
            </Link>
            {/* If user logged in show User Dashboard */}
            {isAuthenticated && (
              <Link to='/userDashboard' className='nav-link'>
                <button type='button' className='btn btn-info w-100'>
                  My Dashboard
                </button>
              </Link>
            )}

            {/* If user is not logged in show Login/Register else show user name and Logout  */}
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
            {/* Redirect to Admin Dashboard */}
            <Link to='/admin/dashboard' className='nav-link'>
              <button type='button' className='btn btn-dark w-100'>
                Admin
              </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
