import React, { useEffect, useState, useRef } from 'react';
import EventCard from './EventCard';
import { sampleEvents } from './sampleData';
import { useAuth } from '../../contexts/AuthContext';
import UsersTasks from './UsersTasks';
import './UserDashboard.css';
import PreLoader from '../PreLoader/PreLoader';
import { registrationService } from '../../services/apiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faCamera, faTimes } from '@fortawesome/free-solid-svg-icons';

const UserDashboard = () => {
  // Set state for user registrations:
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [interestedIds, setInterestedIds] = useState(new Set());
  const [createdEvents, setCreatedEvents] = useState([]);
  
  // Edit Profile State
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const fileInputRef = useRef(null);

  // Auth context
  const { user, isAuthenticated, updateUser } = useAuth();

  const handleEditClick = () => {
    setEditName(user.fullName || user.username || '');
    setEditAvatar(user.avatar || '');
    setShowEditProfile(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    const updatedUser = {
      ...user,
      fullName: editName,
      avatar: editAvatar
    };
    updateUser(updatedUser);
    setShowEditProfile(false);
  };

  // Fetch user's registrations from API:
  useEffect(() => {
    const fetchUserRegistrations = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const registrations = await registrationService.getUserRegistrations();
        setUserRegistrations(registrations);
        setError(null);
      } catch (err) {
        console.error('Error fetching user registrations:', err);
        setError('Failed to load your registrations');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRegistrations();
  }, [isAuthenticated]);

  // Load registered events from localStorage (frontend-only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('registeredEvents');
      const ids = raw ? new Set(JSON.parse(raw)) : new Set();
      setRegisteredIds(ids);
    } catch {
      setRegisteredIds(new Set());
    }
  }, []);

  // Load interested events from localStorage (frontend-only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('interestedEvents');
      const ids = raw ? new Set(JSON.parse(raw)) : new Set();
      setInterestedIds(ids);
    } catch {
      setInterestedIds(new Set());
    }
  }, []);

  // Load created events from localStorage
  useEffect(() => {
    const loadCreatedEvents = () => {
      if (!user) return;
      try {
        const storedMockEvents = localStorage.getItem('mockEvents');
        if (storedMockEvents) {
          const parsedMockEvents = JSON.parse(storedMockEvents);
          // Filter events created by current user
          const myEvents = parsedMockEvents.filter(evt => 
            evt.owner === user.username || evt.username === user.username
          );
          setCreatedEvents(myEvents);
        } else {
          setCreatedEvents([]);
        }
      } catch (err) {
        console.error("Error parsing mockEvents:", err);
      }
    };

    loadCreatedEvents();

    // Listen for storage changes (cross-tab or manual dispatch)
    const handleStorageChange = () => loadCreatedEvents();
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  // Handle registration cancellation
  const handleCancelRegistration = (registrationId) => {
    // Remove from local state immediately for better UX
    setUserRegistrations(prev => prev.filter(reg => reg.id !== registrationId));
  };

  if (!isAuthenticated) {
    return (
      <div className='container mt-5'>
        <div className="text-center">
          <h4>Please log in to view your dashboard</h4>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='container mt-5'>
        <PreLoader visibility="block" />
      </div>
    );
  }



  return (
    <div className='container mt-5'>
      {/* User Profile Section */}
      {user && (
        <div className="user-profile-card position-relative">
          <button 
            className="btn btn-light btn-sm position-absolute" 
            style={{ top: '20px', right: '20px', borderRadius: '50%', width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
            onClick={handleEditClick}
            title="Chỉnh sửa hồ sơ"
          >
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <img 
            src={user.avatar || "https://i.imgur.com/HeIi0wU.png"} 
            alt="User Avatar" 
            className="user-avatar"
            onError={(e) => {e.target.onerror = null; e.target.src="https://i.imgur.com/HeIi0wU.png"}}
          />
          <div className="user-info">
            <h4 className="mb-1">{user.fullName || user.username}</h4>
            <span className="user-username d-block mb-4">@{user.username}</span>
            
            <div className="row">
              <div className="col-md-6">
                <div className="user-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">ID:</span>
                    <span className="detail-value">#{user.id || user._id || '---'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{user.email || '---'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ngày tham gia:</span>
                    <span className="detail-value">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6 border-left-md">
                <div className="user-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Trạng thái:</span>
                    <span className="badge badge-success status-badge">Active</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Vai trò:</span>
                    <span className="user-role-badge">
                      {user.role || 'Tình nguyện viên'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>My Volunteer Dashboard</h4>
      </div>

      {/* Created Events Section */}
      {createdEvents.length > 0 && (
        <>
          <h5 className='mb-4'>
            Sự kiện đã tạo ({createdEvents.length})
          </h5>
          <div className='row mb-5'>
            {createdEvents.map(evt => (
              <div key={evt.id} className="col-12 col-sm-6 col-md-4 mb-4">
                <EventCard evt={evt} />
              </div>
            ))}
          </div>
          <hr />
        </>
      )}

      <h5 className='mb-4'>
        You've registered for {registeredIds.size} event{registeredIds.size !== 1 ? 's' : ''}
      </h5>
      <div className='row'>
        {registeredIds.size > 0 ? (
          sampleEvents
            .filter(evt => registeredIds.has(evt.id))
            .map(evt => (
              <div key={evt.id} className="col-12 col-sm-6 col-md-4 mb-4">
                <EventCard evt={evt} />
              </div>
            ))
        ) : (
          <div className="col-12 text-center">
            <div className="alert alert-info">
              <h5>No registrations found</h5>
              <p>You haven't registered for any volunteer events yet.</p>
              <a href="/events" className="btn btn-primary">
                Browse Available Events
              </a>
            </div>
          </div>
        )}
      </div>

      <h5 className='mt-4 mb-3'>
        You're interested in {interestedIds.size} event{interestedIds.size !== 1 ? 's' : ''}
      </h5>
      <div className='row'>
        {interestedIds.size > 0 ? (
          sampleEvents
            .filter(evt => interestedIds.has(evt.id))
            .map(evt => (
              <div key={evt.id} className="col-12 col-sm-6 col-md-4 mb-4">
                <EventCard evt={evt} />
              </div>
            ))
        ) : (
          <div className="col-12 text-center">
            <div className="alert alert-info">
              <h5>No interested events</h5>
              <p>Mark events as interested from the Events tab.</p>
              <a href="/events" className="btn btn-primary">
                Go to Events
              </a>
            </div>
          </div>
        )}
      </div>
      
      <div className='row'>
        {userRegistrations.length > 0 ? (
          userRegistrations.map((registration) => (
            <UsersTasks
              key={registration.id}
              registration={registration}
              onCancel={handleCancelRegistration}
            />
          ))
        ) : (
          <div className="col-12 text-center">
            <div className="alert alert-info">
              <h5>No registrations found</h5>
              <p>You haven't registered for any volunteer events yet.</p>
              <a href="/" className="btn btn-primary">
                Browse Available Events
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Sample grid moved to Events tab (/events) */}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="modal-overlay" onClick={() => setShowEditProfile(false)}>
          <div className="confirm-card" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0">Chỉnh sửa hồ sơ</h5>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowEditProfile(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="form-group text-center mb-4">
              <div className="position-relative d-inline-block">
                <img 
                  src={editAvatar || "https://i.imgur.com/HeIi0wU.png"} 
                  alt="Preview" 
                  className="rounded-circle"
                  style={{ width: '120px', height: '120px', objectFit: 'cover', border: '4px solid #f4f7fc' }}
                  onError={(e) => {e.target.onerror = null; e.target.src="https://i.imgur.com/HeIi0wU.png"}}
                />
                <button 
                  className="btn btn-primary btn-sm position-absolute"
                  style={{ bottom: '0', right: '0', borderRadius: '50%', width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => fileInputRef.current.click()}
                >
                  <FontAwesomeIcon icon={faCamera} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Họ và tên</label>
              <input 
                type="text" 
                className="form-control" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nhập họ và tên của bạn"
              />
            </div>

            <div className="text-right mt-4">
              <button className="btn btn-light mr-2" onClick={() => setShowEditProfile(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveProfile}>Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
