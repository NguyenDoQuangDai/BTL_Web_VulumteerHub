import React, { useEffect, useState, useRef } from 'react';
import EventCard from './EventCard';
import { useAuth } from '../../contexts/AuthContext';
import UsersTasks from './UsersTasks';
import './UserDashboard.css';
import PreLoader from '../PreLoader/PreLoader';
import { registrationService, eventService, userService } from '../../services/apiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faCamera, faTimes } from '@fortawesome/free-solid-svg-icons';

const UserDashboard = () => {
  // Set state for user registrations:
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createdEvents, setCreatedEvents] = useState([]);
  
  // Edit Profile State
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editFirstname, setEditFirstname] = useState('');
  const [editLastname, setEditLastname] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const fileInputRef = useRef(null);

  // Auth context
  const { user, isAuthenticated, updateUser } = useAuth();
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
      if (user) {
          setCurrentUser(user);
          // Fetch latest user data
          const fetchUserData = async () => {
              try {
                  const userData = await userService.getUser(user.id);
                  setCurrentUser(prev => ({ ...prev, ...userData }));
                  // Optionally update global auth context if needed, but local state is safer for now
                  // updateUser(userData); 
              } catch (e) {
                  console.error("Failed to fetch latest user data", e);
              }
          };
          fetchUserData();
      }
  }, [user]);

  const handleEditClick = () => {
    setEditFirstname(currentUser.firstname || '');
    setEditLastname(currentUser.lastname || '');
    setEditAvatar(currentUser.avatar || '');
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

  const handleSaveProfile = async () => {
    try {
        const updateData = {
            firstname: editFirstname,
            lastname: editLastname,
            avatar: editAvatar
        };

        const updatedUser = await userService.updateUser(currentUser.id, updateData);
        
        // Map backend response to frontend user object structure if needed
        const userForContext = {
            ...currentUser,
            ...updatedUser,
            fullName: `${updatedUser.firstname} ${updatedUser.lastname}`.trim()
        };

        updateUser(userForContext);
        setCurrentUser(userForContext);
        setShowEditProfile(false);
    } catch (err) {
        console.error("Failed to update profile", err);
        alert("Failed to update profile. Please try again.");
    }
  };

  // Fetch user's registrations from API:
  useEffect(() => {
    const fetchUserRegistrations = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const registrations = await registrationService.getUserRegistrations();
        // Filter only approved registrations
        const approvedRegistrations = registrations.filter(reg => reg.status === 'APPROVED' || reg.status === 'COMPLETED');
        setUserRegistrations(approvedRegistrations);
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

  // Load created events from API
  useEffect(() => {
    const loadCreatedEvents = async () => {
      if (!currentUser || !currentUser.id) return;
      try {
        // Fetch events where ownerId matches current user
        // Pass ownerId as the 6th argument (page, size, status, search, sort, ownerId)
        const response = await eventService.getEvents(0, 100, null, null, null, currentUser.id);
        
        let myEvents = [];
        if (response && response.events) {
            myEvents = response.events;
        }

        setCreatedEvents(myEvents);
      } catch (err) {
        console.error("Error loading created events:", err);
      }
    };

    loadCreatedEvents();
  }, [currentUser]);

  // Handle registration cancellation
  const handleCancelRegistration = async (eventId) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy đăng ký sự kiện này?')) {
        try {
            await registrationService.cancelRegistration(eventId);
            // Remove from local state immediately for better UX
            setUserRegistrations(prev => prev.filter(reg => reg.eventId !== eventId));
        } catch (err) {
            console.error("Failed to cancel registration", err);
            alert("Không thể hủy đăng ký. Vui lòng thử lại sau.");
        }
    }
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Trang cá nhân</h4>
      </div>

      {/* User Profile Section */}
      {currentUser && (
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
            src={currentUser.avatar || "https://i.imgur.com/HeIi0wU.png"} 
            alt="User Avatar" 
            className="user-avatar"
            onError={(e) => {e.target.onerror = null; e.target.src="https://i.imgur.com/HeIi0wU.png"}}
          />
          <div className="user-info">
            <h4 className="mb-1">
              {currentUser.lastname && currentUser.firstname 
                ? `${currentUser.lastname} ${currentUser.firstname}` 
                : (currentUser.fullName || currentUser.username)}
            </h4>
            <span className="user-username d-block mb-4">@{currentUser.username}</span>
            
            <div className="row">
              <div className="col-md-6">
                <div className="user-details-grid">
                  {/* <div className="detail-item">
                    <span className="detail-label">ID:</span>
                    <span className="detail-value">#{currentUser.id || currentUser._id || '---'}</span>
                  </div> */}
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{currentUser.email || '---'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ngày tham gia:</span>
                    <span className="detail-value">
                      {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}
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
                    <span className={`badge ${
                      (currentUser.role === 'ADMIN' || currentUser.role === 'Quản trị viên') 
                        ? 'badge-danger' 
                        : 'badge-primary'
                    } status-badge`}>
                      {currentUser.role || 'Tình nguyện viên'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Created Events Section */}
      <h5 className='mb-4'>
        Sự kiện đã tạo ({createdEvents.length})
      </h5>
      <div className='row mb-5'>
        {createdEvents.length > 0 ? (
          createdEvents.map(evt => (
            <div key={evt.id} className="col-12 col-sm-6 col-md-4 mb-4">
              <EventCard evt={evt} />
            </div>
          ))
        ) : (
          <div className="col-12 text-center">
            <div className="alert alert-light border">
              <h5>Chưa có sự kiện nào</h5>
              <p>Bạn chưa tạo sự kiện tình nguyện nào.</p>
              <a href="/events" className="btn btn-outline-primary">
                Tạo sự kiện mới
              </a>
            </div>
          </div>
        )}
      </div>
      <hr />

      <h5 className='mb-4'>
        Sự kiện đã đăng ký ({userRegistrations.length})
      </h5>
      <div className='row'>
        {userRegistrations.length > 0 ? (
          userRegistrations.map(reg => (
            <div key={reg.id} className="col-12 col-sm-6 col-md-4 mb-4">
              {reg.event ? (
                  <EventCard evt={reg.event} />
              ) : (
                  <UsersTasks
                    registration={reg}
                    onCancel={handleCancelRegistration}
                  />
              )}
            </div>
          ))
        ) : (
          <div className="col-12 text-center">
            <div className="alert alert-light border">
              <h5>Chưa đăng ký sự kiện nào</h5>
              <p>Bạn chưa đăng ký tham gia sự kiện tình nguyện nào.</p>
              <a href="/events" className="btn btn-outline-primary">
                Tìm sự kiện
              </a>
            </div>
          </div>
        )}
      </div>
      
      {/* Removed duplicate userRegistrations list */}
      
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

            <div className="form-row">
              <div className="form-group col-md-6">
                <label>Họ</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={editLastname} 
                  onChange={(e) => setEditLastname(e.target.value)}
                  placeholder="Nhập họ"
                />
              </div>
              <div className="form-group col-md-6">
                <label>Tên</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={editFirstname} 
                  onChange={(e) => setEditFirstname(e.target.value)}
                  placeholder="Nhập tên"
                />
              </div>
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
