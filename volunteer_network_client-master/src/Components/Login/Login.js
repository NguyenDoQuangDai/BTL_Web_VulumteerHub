import React, { useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import './Login.css';
// logo replaced with public file at /volumteerhub_logo_final.png
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/apiService';

// ============================================================================================

const Login = () => {
  // Handle New User:
  const [newUser, setNewUser] = useState(false);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    username: '',
    password: '',
  });

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Auth context
  const { login, error, clearError } = useAuth();

  // Redirecting to home/ taskRegistration Component if signed In successfully
  const history = useHistory();
  const location = useLocation();

  const { from } = location.state || {
    from: { pathname: '/' },
  };


  // =========================================================

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) {
      clearError();
    }
  };

  // Handle user registration
  const handleRegister = async () => {
    try {
      setIsLoading(true);
      
      // Create user
      await userService.createUser({
        firstname: formData.firstname,
        lastname: formData.lastname,
        username: formData.username,
        password: formData.password
      });
      
      // After successful registration, login automatically
      await login(formData.username, formData.password);
      history.replace(from);
      
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user login
  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await login(formData.username, formData.password);
      history.replace(from);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // When form submitted:
  const handleUserSubmit = (e) => {
    e.preventDefault();
    
    if (newUser) {
      if (formData.firstname && formData.lastname && formData.username && formData.password) {
        handleRegister();
      }
    } else {
      if (formData.username && formData.password) {
        handleLogin();
      }
    }
  };

  return (
    <section className='container'>
      <div className="d-flex justify-content-center flex-column align-items-center my-5">
        <div className="row mb-2">
          <Link to='/'>
            <div className="col-md-12 text-center mb-3">
              <img className="w-25" src='/volumteerhub_logo_final.png' alt="VolumteerHub"/>
            </div>
          </Link>
        </div>
        <div className='row'>
          <div className='col-md-12'>
            {/* If not a new user then show login form, else registration form */}
            {!newUser ? (
              <form
                onSubmit={handleUserSubmit}
                className='login-form shadow bg-white rounded text-left p-3'
              >
                {/* Show error message */}
                {error && (
                  <p style={{ maxWidth: '400px' }} className='text-danger'>
                    {error}
                  </p>
                )}
                <h4 className='font-weight-bold mb-3'>Login</h4>
                
                <div className='form-group'>
                  <input 
                    className='form-control'
                    onChange={handleInputChange}
                    name='username'
                    type='text'
                    placeholder='Username'
                    value={formData.username}
                    required
                  />
                </div>
                
                <div className='form-group'>
                  <input 
                    className='form-control'
                    onChange={handleInputChange}
                    name='password'
                    type='password'
                    placeholder='Password'
                    value={formData.password}
                    required
                  />
                </div>
              
                <div className='form-group'>
                  <button
                    style={{ width: '100%' }}
                    className='btn btn-warning'
                    type='submit'
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Login'}
                  </button>
                </div>

                <div className='form-group text-center mt-3' id='formForget'>
                  <span>Don't have an account?</span>{' '}
                  <span
                    style={{ cursor: 'pointer', color: '#F9A51A' }}
                    onClick={() => setNewUser(true)}
                  >
                    Create an account
                  </span>
                </div>
              </form>
            ) : (
              <form
                onSubmit={handleUserSubmit}
                className='login-form shadow bg-white rounded text-left p-3'
              >
                {/* Show error message */}
                {error && (
                  <p style={{ maxWidth: '400px' }} className='text-danger'>
                    {error}
                  </p>
                )}
                <h4 className='font-weight-bold mb-3'>Create Account</h4>
                
                <div className='form-group'>
                  <input 
                    className='form-control'
                    onChange={handleInputChange}
                    name='firstname'
                    type='text'
                    placeholder='First Name'
                    value={formData.firstname}
                    required
                  />
                </div>
                
                <div className='form-group'>
                  <input 
                    className='form-control'
                    onChange={handleInputChange}
                    name='lastname'
                    type='text'
                    placeholder='Last Name'
                    value={formData.lastname}
                    required
                  />
                </div>
                
                <div className='form-group'>
                  <input 
                    className='form-control'
                    onChange={handleInputChange}
                    name='username'
                    type='text'
                    placeholder='Username'
                    value={formData.username}
                    required
                  />
                </div>
                
                <div className='form-group'>
                  <input 
                    className='form-control'
                    onChange={handleInputChange}
                    name='password'
                    type='password'
                    placeholder='Password (min 6 characters)'
                    value={formData.password}
                    minLength="6"
                    required
                  />
                </div>

                <div className='form-group'>
                  <button
                    style={{ width: '100%' }}
                    className='btn btn-primary'
                    type='submit'
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Sign Up'}
                  </button>
                </div>

                <div className='form-group text-center mt-2' id='formForget'>
                  <span>Already have an account?</span>{' '}
                  <span
                    style={{ cursor: 'pointer', color: '#F9A51A' }}
                    onClick={() => setNewUser(false)}
                  >
                    Login
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
