import React, { useState, useEffect } from 'react';
import { eventService, postService, registrationService, userService } from '../../services/apiService';
import { apiRequest, API_ENDPOINTS } from '../../config/api';
import ReactDOM from 'react-dom';
import EventChannelSidebar from './EventChannelSidebar';
import EditHistoryModal from './EditHistoryModal';
import CreatePostDialog from './CreatePostDialog';
import { useAuth } from '../../contexts/AuthContext';
import './EventChannelDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMapMarkerAlt,
  faPlay,
  faStop,
  faHourglassHalf,
  faUser,
  faFileAlt,
  faChevronLeft,
  faChevronRight,
  faPlus,
  faEdit,
  faTrashAlt,
  faCheck,
  faTimes,
  faThumbsUp,
  faBell,
  faComment,
  faShare,
  faImage,
  faPaperPlane,
  faEllipsisH,
  faGlobeAmericas,
  faThumbtack,
  faHistory,
  faSync,
  faHeart as faHeartSolid,
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
const statusClass = (status) => {
  switch (status) {
    case 'APPROVED':
      return 'badge badge-success';
    case 'PENDING':
      return 'badge badge-warning';
    case 'REJECTED':
      return 'badge badge-danger';
    case 'COMPLETED':
      return 'badge badge-secondary';
    case 'DRAFT':
    default:
      return 'badge badge-info';
  }
};

const formatDateTime = (iso) => {
  try {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
};

// Local storage helpers for comments persistence
const getSavedComments = (eventId, postId) => {
  try {
    const raw = localStorage.getItem(`post_comments_${eventId}_${postId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const saveComments = (eventId, postId, comments) => {
  try {
    localStorage.setItem(`post_comments_${eventId}_${postId}`, JSON.stringify(comments));
  } catch (e) {
    // ignore
  }
};

// Local storage helpers for per-post state (likes, shares)
const getSavedPostState = (eventId, postId) => {
  try {
    const raw = localStorage.getItem(`post_state_${eventId}_${postId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const savePostState = (eventId, postId, state) => {
  try {
    localStorage.setItem(`post_state_${eventId}_${postId}`, JSON.stringify(state));
  } catch (e) {
    // ignore
  }
};

const ImageCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className='event-image-placeholder mb-4'>
        <div className='text-center text-muted py-5'>
          <FontAwesomeIcon icon={faFileAlt} size='3x' className='mb-3' />
          <p>Chưa có hình ảnh</p>
        </div>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className='event-image-carousel mb-4 position-relative'>
      <img 
        src={images[currentIndex]} 
        alt={`Event image ${currentIndex + 1}`}
        className='w-100 rounded'
        style={{ maxHeight: '400px', objectFit: 'cover' }}
      />
      {images.length > 1 && (
        <>
          <button 
            className='carousel-arrow carousel-arrow-left'
            onClick={goToPrevious}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button 
            className='carousel-arrow carousel-arrow-right'
            onClick={goToNext}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
          <div className='carousel-indicators'>
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

const EventDetails = ({ event, user, onEventUpdate }) => {
  let eventImages = event.images || event.imageUrls || (event.imageUrl ? [event.imageUrl] : []);

  // Fallback to sample images if no images are provided
  if (!eventImages || eventImages.length === 0) {
    eventImages = [
      '/sample-images/1.webp',
      '/sample-images/2.webp',
      '/sample-images/3.jpg'
    ];
  }

  let isOwner = user && user.id && (
    (event.ownerId && String(user.id) === String(event.ownerId))
  );
  const isAdmin = user && (user.role === 'Quản trị viên' || user.role === 'ADMIN');

  const canEdit = isOwner;
  const canDelete = isOwner || isAdmin;

  const [registered, setRegistered] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [loadingReg, setLoadingReg] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    name: event.name || '',
    description: event.description || '',
    location: event.location || '',
    dateDeadline: event.dateDeadline || '',
    startDate: event.startDate || '',
    endDate: event.endDate || '',
    images: event.images || (event.image || event.imageUrl ? [event.image || event.imageUrl] : []),
  });
  const [submitting, setSubmitting] = useState(false);

  const [creatorName, setCreatorName] = useState(null);

  useEffect(() => {
    const fetchCreatorName = async () => {
      if (event.ownerId) {
        try {
          const data = await apiRequest(API_ENDPOINTS.USERS.GET(event.ownerId));
          setCreatorName(`${data.firstname} ${data.lastname}`);
        } catch (error) {
          console.error('Error fetching creator name:', error);
        }
      }
    };

    fetchCreatorName();
  }, [event.ownerId]);

  useEffect(() => {
      const checkRegistration = async () => {
          if (!user) return;
          try {
              const regs = await registrationService.getUserRegistrations();
              let myRegs = [];
              if (regs._embedded && regs._embedded.registrations) {
                  myRegs = regs._embedded.registrations;
              } else if (regs.content) {
                  myRegs = regs.content;
              }
              
              const myReg = myRegs.find(r => r.eventId === event.id);
              if (myReg) {
                  setRegistered(true);
                  setRegistrationId(myReg.id);
                  setRegistrationStatus(myReg.status);
              } else {
                  setRegistered(false);
                  setRegistrationId(null);
                  setRegistrationStatus(null);
              }
          } catch (e) {
              console.error("Failed to check registration", e);
          }
      };
      checkRegistration();
  }, [event.id, user]);

  
  useEffect(() => {
      setEditForm({
        name: event.name || '',
        description: event.description || '',
        location: event.location || '',
        dateDeadline: event.dateDeadline || '',
        startDate: event.startDate || '',
        endDate: event.endDate || '',
        images: event.images || (event.image || event.imageUrl ? [event.image || event.imageUrl] : []),
      });
  }, [event]);

  const handleSubmitForApproval = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn gửi sự kiện này để xét duyệt?')) {
      return;
    }

    try {
      setSubmitting(true);
      await eventService.submitEvent(event.id);
      
      // Refresh event data
      if (onEventUpdate) {
        const updated = await eventService.getEvent(event.id);
        onEventUpdate(updated);
      }
      
      alert('Đã gửi sự kiện để xét duyệt thành công!');
    } catch (error) {
      console.error("Failed to submit event for approval", error);
      alert("Không thể gửi sự kiện để xét duyệt: " + (error.message || error));
    } finally {
      setSubmitting(false);
    }
  };
/*
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      Promise.all(files.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }))
      .then(results => {
        setEditForm(prev => ({ ...prev, images: [...(prev.images || []), ...results] }));
      });
    }
  };

  const removeImage = (index) => {
    setEditForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };
*/
  const hasUnsavedChanges = () => {
    return (
      editForm.name !== (event.name || '') ||
      editForm.description !== (event.description || '') ||
      editForm.location !== (event.location || '') ||
      editForm.dateDeadline !== (event.dateDeadline || '') ||
      editForm.startDate !== (event.startDate || '') ||
      editForm.endDate !== (event.endDate || '') ||
      JSON.stringify(editForm.images) !== JSON.stringify(event.images || (event.image || event.imageUrl ? [event.image || event.imageUrl] : []))
    );
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClose = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedConfirm(true);
    } else {
      setShowEditForm(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      await eventService.updateEvent(event.id, editForm);
      if (onEventUpdate) {
          const updated = await eventService.getEvent(event.id);
          onEventUpdate(updated);
      }
      setShowEditForm(false);
    } catch (e) {
      console.error("Failed to update event", e);
      alert("Failed to update event: " + e.message);
    }
  };

  const handleRegister = async () => {
    if (registered) {
      setShowConfirm(true);
    } else {
      try {
          setLoadingReg(true);
          const reg = await registrationService.registerForEvent(event.id);
          setRegistered(true);
          setRegistrationId(reg.id);
          if (onEventUpdate) {
               const updated = await eventService.getEvent(event.id);
               onEventUpdate(updated);
          }
      } catch (e) {
          alert("Failed to register: " + e.message);
      } finally {
          setLoadingReg(false);
      }
    }
  };

  const confirmUnregister = async () => {
    try {
        setLoadingReg(true);
        if (registrationId) {
            await registrationService.deleteRegistration(registrationId);
            setRegistered(false);
            setRegistrationId(null);
            setShowConfirm(false);
             if (onEventUpdate) {
               const updated = await eventService.getEvent(event.id);
               onEventUpdate(updated);
            }
        }
    } catch (e) {
        alert("Failed to unregister: " + e.message);
    } finally {
        setLoadingReg(false);
    }
  };

  const handleDeleteEvent = async () => {
      if(window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) {
          try {
              await eventService.deleteEvent(event.id);
              alert('Đã xóa sự kiện');
              // Redirect or close modal? 
              // Since this is a modal/dashboard, we probably want to close it.
              // But we don't have onClose prop here easily accessible unless we pass it.
              // Assuming parent handles it or we reload.
              window.location.reload(); 
          } catch (e) {
              alert("Failed to delete event: " + e.message);
          }
      }
  };

  // Compute deadline / started flags for conditional button rendering
  const now = new Date();
  const isPastDeadline = event && event.dateDeadline ? new Date(event.dateDeadline) < now : false;
  const hasStarted = event && event.startDate ? new Date(event.startDate) <= now : false;
  const hasEnded = event && event.endDate ? new Date(event.endDate) < now : false;

  return (
    <div className='p-4 bg-white rounded shadow-sm position-relative'>
      <ImageCarousel images={eventImages} />
      
      <div className='mb-4'>
        <div className='d-flex justify-content-between align-items-start mb-2'>
          <h4 className='mb-0'>{event.name}</h4>
          <span className={statusClass(event.status)}>{event.status}</span>
        </div>
        
        {/* Debug Info - Remove after fixing */}
        {/* <div className="alert alert-info small mb-3">
          <strong>Debug Info:</strong><br/>
          Status: {event.status}<br/>
          Owner ID: {event.ownerId}<br/>
          User ID: {user?.id}<br/>
          Is Owner: {isOwner ? 'Yes' : 'No'}<br/>
          Should Show Submit: {(isOwner && event.status === 'DRAFT') ? 'Yes' : 'No'}
        </div> */}

        {/* Action Buttons */}
        <div className="d-flex mt-3 justify-content-between align-items-center">
            <div>
                {/* Terminal states: ended/started have priority for all users */}
                {hasEnded ? (
                  <span className="text-muted small">Sự kiện đã kết thúc</span>
                ) : hasStarted ? (
                  <span className="text-muted small">Sự kiện đã bắt đầu</span>
                ) : (
                  // Not started and not ended -> normal flow
                  isOwner && event.status === 'DRAFT' ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-warning mr-2"
                      onClick={handleSubmitForApproval}
                      disabled={submitting}
                    >
                      {submitting ? 'Đang gửi...' : 'Gửi xét duyệt'}
                    </button>
                  ) : !isOwner ? (
                    (() => {
                      // If already registered -> allow cancel anytime before start/end
                      if (registered) {
                        return (
                          <button
                            type="button"
                            className={`btn btn-sm mr-2 ${registrationStatus === 'REJECTED' ? 'btn-secondary' : 'btn-outline-danger'}`}
                            onClick={handleRegister}
                            disabled={loadingReg || registrationStatus === 'REJECTED' || event.status === 'DRAFT'}
                          >
                            {loadingReg ? 'Đang xử lý...' : 'Hủy đăng ký'}
                          </button>
                        );
                      }

                      // Not registered: if past deadline show message, else show register
                      if (isPastDeadline) {
                        return <span className="text-muted small">Hết hạn đăng ký</span>;
                      }

                      return (
                        <button
                          type="button"
                          className={`btn btn-sm mr-2 ${registrationStatus === 'REJECTED' ? 'btn-secondary' : 'btn-primary'}`}
                          onClick={handleRegister}
                          disabled={loadingReg || registrationStatus === 'REJECTED' || event.status === 'DRAFT'}
                        >
                          {loadingReg ? 'Đang xử lý...' : registrationStatus === 'REJECTED' ? 'Đã bị từ chối' : 'Đăng ký tham gia'}
                        </button>
                      );
                    })()
                  ) : (
                    <div className="text-muted small"></div>
                  )
                )}
            </div>
            <div>
                {canEdit && event.status === 'DRAFT' && (
                    <button 
                        className="btn btn-sm btn-outline-secondary mr-2"
                        onClick={() => setShowEditForm(true)}
                    >
                        <FontAwesomeIcon icon={faEdit} className="mr-1" /> Sửa
                    </button>
                )}
                {canDelete && (
                    <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={handleDeleteEvent}
                    >
                        <FontAwesomeIcon icon={faTrashAlt} className="mr-1" /> Xóa
                    </button>
                )}
            </div>
        </div>
      </div>

      {event.description && (
        <div className='mb-4'>
          <h6 className='text-muted mb-2'>
            <FontAwesomeIcon icon={faFileAlt} className='mr-2' />
            Mô tả
          </h6>
          <p className='mb-0'>{event.description}</p>
        </div>
      )}

      <div className='mb-4'>
        <h6 className='text-muted mb-3'>Thông tin chi tiết</h6>
        <ul className='list-unstyled'>
          <li className='mb-2'>
            <FontAwesomeIcon icon={faMapMarkerAlt} className='mr-2 text-primary' />
            <strong>Địa điểm:</strong> {event.location || '-'}
          </li>
          <li className='mb-2'>
            <FontAwesomeIcon icon={faPlay} className='mr-2 text-success' />
            <strong>Bắt đầu:</strong> {formatDateTime(event.startDate)}
          </li>
          <li className='mb-2'>
            <FontAwesomeIcon icon={faStop} className='mr-2 text-danger' />
            <strong>Kết thúc:</strong> {formatDateTime(event.endDate)}
          </li>
          <li className='mb-2'>
            <FontAwesomeIcon icon={faHourglassHalf} className='mr-2 text-warning' />
            <strong>Hạn đăng ký:</strong> {formatDateTime(event.dateDeadline)}
          </li>
          <li className='mb-2'>
            <FontAwesomeIcon icon={faUser} className='mr-2 text-info' />
            <strong>Tạo bởi:</strong> {creatorName || event.username || event.ownerId}
          </li>
        </ul>
      </div>

      <div className='mb-4'>
        <h6 className='text-muted mb-2'>Thống kê</h6>
        <div className='d-flex gap-3'>
          <div className='p-3 bg-light rounded'>
            <div className='h5 mb-0 text-primary'>{event.registeredCount || 0}</div>
            <small className='text-muted'>Đã tham gia</small>
          </div>
        </div>
      </div>

      {/* Unregister Confirmation Modal */}
      {showConfirm && (
          ReactDOM.createPortal(
            <div className="modal-backdrop d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000 }}>
              <div className="bg-white rounded shadow p-4" style={{ maxWidth: '400px' }}>
                <h5 className="mb-3">Xác nhận hủy đăng ký</h5>
                <p>Bạn có chắc chắn muốn hủy đăng ký tham gia sự kiện này không?</p>
                <div className="d-flex justify-content-end">
                  <button className="btn btn-secondary mr-2" onClick={() => setShowConfirm(false)}>Không</button>
                  <button className="btn btn-danger" onClick={confirmUnregister}>Có, hủy đăng ký</button>
                </div>
              </div>
            </div>,
            document.body
          )
      )}

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedConfirm && ReactDOM.createPortal(
        <div className="modal-backdrop d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000 }}>
          <div className="bg-white rounded shadow p-4" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="text-right mb-2">
              <button type="button" className="btn btn-sm btn-outline-secondary close-btn" onClick={() => setShowUnsavedConfirm(false)}>×</button>
            </div>
            <p className="mb-3">Bạn có thay đổi chưa lưu, lưu thay đổi?</p>
            <div className="d-flex justify-content-between">
              <button className="btn btn-light" onClick={() => {
                setShowUnsavedConfirm(false);
                setShowEditForm(false);
              }}>Hủy</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  handleSaveChanges();
                  setShowUnsavedConfirm(false);
                }}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Form Modal */}
      {showEditForm && ReactDOM.createPortal(
        <div className="modal-backdrop d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000 }} onClick={handleEditClose}>
          <div className="bg-white rounded shadow p-4" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Sửa sự kiện</h5>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleEditClose}>
                Đóng
              </button>
            </div>

            <form>
              <div className="form-group">
                <label className="field-label event-title">Tên sự kiện *</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="field-label location-line">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 location-icon" />
                  Địa điểm
                </label>
                <input
                  type="text"
                  name="location"
                  className="form-control"
                  placeholder="Ví dụ: Nhà văn hóa X, Quận 1"
                  value={editForm.location}
                  onChange={handleEditFormChange}
                />
              </div>

              <div className="form-group">
                <label className="field-label desc-line">
                  <FontAwesomeIcon icon={faFileAlt} className="mr-1 desc-icon" />
                  Mô tả
                </label>
                <textarea
                  name="description"
                  className="form-control"
                  rows="3"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                />
              </div>

              {/*<div className="form-group">
                <label className="field-label">
                  <FontAwesomeIcon icon={faImage} className="mr-1" />
                  Hình ảnh
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="form-control-file"
                  onChange={handleImageChange}
                />
                <div className="d-flex flex-wrap mt-2">
                  {editForm.images && editForm.images.map((img, index) => (
                    <div key={index} className="position-relative mr-2 mb-2">
                      <img 
                        src={img} 
                        alt={`Preview ${index}`} 
                        style={{ height: '100px', width: '100px', objectFit: 'cover', borderRadius: '4px' }} 
                      />
                      <button
                        type="button"
                        className="btn btn-danger btn-sm position-absolute"
                        style={{ top: 0, right: 0, padding: '0px 5px', fontSize: '12px', lineHeight: '1.2' }}
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>*/}

              <div className="form-row">
                <div className="form-group col-md-4">
                  <label className="field-label deadline-line">
                    <FontAwesomeIcon icon={faHourglassHalf} className="mr-1 deadline-icon" />
                    Hạn đăng ký *
                  </label>
                  <input
                    type="datetime-local"
                    name="dateDeadline"
                    className="form-control"
                    value={editForm.dateDeadline ? new Date(editForm.dateDeadline).toISOString().slice(0, 16) : ''}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="form-group col-md-4">
                  <label className="field-label start-line">
                    <FontAwesomeIcon icon={faPlay} className="mr-1 start-icon" />
                    Bắt đầu *
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    className="form-control"
                    value={editForm.startDate ? new Date(editForm.startDate).toISOString().slice(0, 16) : ''}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
                <div className="form-group col-md-4">
                  <label className="field-label end-line">
                    <FontAwesomeIcon icon={faStop} className="mr-1 end-icon" />
                    Kết thúc *
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    className="form-control"
                    value={editForm.endDate ? new Date(editForm.endDate).toISOString().slice(0, 16) : ''}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
              </div>

              <div className="text-right mt-4">
                <button
                  type="button"
                  className="btn btn-secondary mr-2"
                  onClick={handleEditClose}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveChanges}
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const MembersList = ({ event, user }) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Determine if the current user has management permissions
  const canManage = user && (user.role === 'ADMIN' || event.ownerId === user.id || event.username === user.username);

  useEffect(() => {
    if (event && event.id) {
      fetchMembers();
    }
  }, [event]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await registrationService.getRegistrationsByEvent(event.id);
      const mappedMembers = data.map(reg => ({
        id: reg.id,
        userId: reg.userId,
        name: reg.fullName || reg.username,
        email: reg.username, // Assuming username is email or similar
        username: reg.username,
        role: mapRole(reg.role),
        status: reg.status,
        joinedAt: reg.createdAt
      }));
      setMembers(mappedMembers);
    } catch (error) {
      console.error("Failed to fetch members", error);
    } finally {
      setLoading(false);
    }
  };

  const mapRole = (role) => {
      if (role === 'ADMIN') return 'Quản trị viên';
      if (role === 'EVENT_MANAGER') return 'Quản lý sự kiện';
      return 'Tình nguyện viên';
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = (member.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
                          (member.email || '').toLowerCase().includes(searchText.toLowerCase()) ||
                          (member.username || '').toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter ? member.status === statusFilter : true;
    const matchesRole = roleFilter ? member.role === roleFilter : true;
    return matchesSearch && matchesStatus && matchesRole;
  }).sort((a, b) => {
      // 1. Current user first
      if (user && a.username === user.username) return -1;
      if (user && b.username === user.username) return 1;

      // 2. Event Managers (Quản trị viên or Quản lý sự kiện) second
      const isAManager = a.role === 'Quản trị viên' || a.role === 'Quản lý sự kiện';
      const isBManager = b.role === 'Quản trị viên' || b.role === 'Quản lý sự kiện';
      if (isAManager && !isBManager) return -1;
      if (!isAManager && isBManager) return 1;

      // 3. Others
      return 0;
  });

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (filteredMembers.length === 0) return new Set();
      if (prev.size > 0) return new Set();
      return new Set(filteredMembers.map((u) => u.id));
    });
  };

  const getStatusBadge = (status) => {
      switch (status) {
          case 'APPROVED': return 'badge-success';
          case 'PENDING': return 'badge-warning';
          case 'REJECTED': return 'badge-danger';
          case 'CANCELED': return 'badge-secondary';
          case 'COMPLETED': return 'badge-info';
          default: return 'badge-secondary';
      }
  };

  const getStatusLabel = (status) => {
      switch (status) {
          case 'APPROVED': return 'Đã duyệt';
          case 'PENDING': return 'Chờ duyệt';
          case 'REJECTED': return 'Từ chối';
          case 'CANCELED': return 'Đã hủy';
          case 'COMPLETED': return 'Hoàn thành';
          default: return status;
      }
  };

  const handleApprove = async (id) => {
    try {
      await registrationService.approveRegistration(id);
      fetchMembers();
    } catch (error) {
      console.error("Failed to approve", error);
      alert("Failed to approve: " + error.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await registrationService.rejectRegistration(id);
      fetchMembers();
    } catch (error) {
      console.error("Failed to reject", error);
      alert("Failed to reject: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đăng ký này?")) return;
    try {
      await registrationService.deleteRegistration(id);
      fetchMembers();
    } catch (error) {
      console.error("Failed to delete", error);
      alert("Failed to delete: " + error.message);
    }
  };

  const handleBulkApprove = async () => {
    try {
      const idsToApprove = Array.from(selectedIds).filter(id => {
        const member = members.find(m => m.id === id);
        return member && member.status === 'PENDING';
      });

      if (idsToApprove.length === 0) {
        alert("Không có thành viên nào hợp lệ để duyệt (chỉ duyệt các thành viên đang chờ duyệt).");
        return;
      }

      await Promise.all(idsToApprove.map(id => registrationService.approveRegistration(id)));
      setSelectedIds(new Set());
      fetchMembers();
    } catch (error) {
      console.error("Failed to bulk approve", error);
      alert("Some operations failed");
    }
  };

  const handleBulkReject = async () => {
    try {
      const idsToReject = Array.from(selectedIds).filter(id => {
        const member = members.find(m => m.id === id);
        return member && member.status === 'PENDING';
      });

      if (idsToReject.length === 0) {
        alert("Không có thành viên nào hợp lệ để từ chối (chỉ từ chối các thành viên đang chờ duyệt).");
        return;
      }

      await Promise.all(idsToReject.map(id => registrationService.rejectRegistration(id)));
      setSelectedIds(new Set());
      fetchMembers();
    } catch (error) {
      console.error("Failed to bulk reject", error);
      alert("Some operations failed");
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy ${selectedIds.size} đăng ký này?`)) return;
    try {
      await Promise.all(Array.from(selectedIds).map(id => registrationService.deleteRegistration(id)));
      setSelectedIds(new Set());
      fetchMembers();
    } catch (error) {
      console.error("Failed to bulk delete", error);
      alert("Some operations failed");
    }
  };

  return (
    <div className='p-4'>
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <h5 className='font-weight-bold'>Danh sách tình nguyện viên ({filteredMembers.length})</h5>
        <button className="btn btn-sm btn-outline-primary" onClick={fetchMembers}>
            <FontAwesomeIcon icon={faSync} className={loading ? "fa-spin" : ""} /> Làm mới
        </button>
      </div>
      <div className='bg-white rounded shadow-sm p-3'>
        <div className='d-flex mb-3'>
            <div className='flex-grow-1 mr-2'>
              <input
                type='text'
                className='form-control'
                placeholder='Tìm kiếm theo tên, email hoặc username...'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div style={{ minWidth: '200px' }} className="mr-2">
              <select
                className='form-control'
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value=''>Tất cả trạng thái</option>
                <option value='APPROVED'>Đã duyệt</option>
                <option value='PENDING'>Chờ duyệt</option>
                <option value='REJECTED'>Từ chối</option>
                <option value='COMPLETED'>Hoàn thành</option>
              </select>
            </div>
            <div style={{ minWidth: '200px' }}>
              <select
                className='form-control'
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value=''>Tất cả vai trò</option>
                <option value='Quản trị viên'>Quản trị viên</option>
                <option value='Tình nguyện viên'>Tình nguyện viên</option>
              </select>
            </div>
        </div>

        {/* Bulk Actions - Only visible if user can manage and items are selected */}
        {canManage && selectedIds.size > 0 && (
            <div className="mb-3 p-2 bg-light rounded d-flex align-items-center">
                <span className="mr-3 font-weight-bold text-primary">Đã chọn: {selectedIds.size}</span>
                <button className="btn btn-sm btn-success mr-2" onClick={handleBulkApprove}>
                    <FontAwesomeIcon icon={faCheck} className="mr-1" /> Duyệt
                </button>
                <button className="btn btn-sm btn-warning mr-2" onClick={handleBulkReject}>
                    <FontAwesomeIcon icon={faTimes} className="mr-1" /> Từ chối
                </button>
                <button className="btn btn-sm btn-danger" onClick={handleBulkDelete}>
                    <FontAwesomeIcon icon={faTrashAlt} className="mr-1" /> Xóa
                </button>
            </div>
        )}

        {loading ? (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        ) : (
        <div className="table-responsive">
            <table className="table table-borderless table-hover">
                <thead className="thead-light">
                    <tr>
                        {canManage && (
                            <th className="text-secondary text-left" scope="col" style={{ width: '120px' }}>
                                <button
                                    className='btn btn-sm btn-outline-primary'
                                    onClick={toggleSelectAll}
                                >
                                    {selectedIds.size > 0 ? 'Bỏ chọn' : 'Chọn tất cả'}
                                </button>
                            </th>
                        )}
                        <th className="text-secondary text-left" scope="col">#</th>
                        <th className="text-secondary" scope="col">Họ và tên</th>
                        <th className="text-secondary" scope="col">Email</th>
                        <th className="text-secondary" scope="col">Tên đăng nhập</th>
                        <th className="text-secondary" scope="col">Trạng thái</th>
                        <th className="text-secondary" scope="col">Vai trò</th>
                        {canManage && <th className="text-secondary text-center" scope="col">Hành động</th>}
                    </tr>
                </thead>
                <tbody>
                    {filteredMembers.length === 0 ? (
                        <tr>
                            <td colSpan={canManage ? "8" : "7"} className="text-center py-4 text-muted">
                                Không tìm thấy thành viên nào
                            </td>
                        </tr>
                    ) : (
                    filteredMembers.map((member, index) => (
                        <tr key={member.id} className={user && member.username === user.username ? "table-primary" : ""}>
                            {canManage && (
                                <td>
                                    <input
                                        type='checkbox'
                                        checked={selectedIds.has(member.id)}
                                        onChange={() => toggleSelect(member.id)}
                                        style={{ transform: 'scale(1.5)' }}
                                    />
                                </td>
                            )}
                            <td>{index + 1}</td>
                            <td>
                                <div className="font-weight-bold">{member.name}</div>
                                <small className="text-muted">Tham gia: {new Date(member.joinedAt).toLocaleDateString()}</small>
                            </td>
                            <td>{member.email}</td>
                            <td>{member.username}</td>
                            <td>
                                <span className={`badge ${getStatusBadge(member.status)} p-2`}>
                                    {getStatusLabel(member.status)}
                                </span>
                            </td>
                            <td>
                                <span className={`badge ${member.role === 'Quản trị viên' ? 'badge-primary' : 'badge-light'} p-2`}>
                                    {member.role}
                                </span>
                            </td>
                            {canManage && (
                                <td className="text-center">
                                    <div className="btn-group">
                                        {member.status === 'PENDING' && (
                                            <>
                                                <button 
                                                    className="btn btn-sm btn-success" 
                                                    title="Duyệt"
                                                    onClick={() => handleApprove(member.id)}
                                                >
                                                    <FontAwesomeIcon icon={faCheck} />
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-warning" 
                                                    title="Từ chối"
                                                    onClick={() => handleReject(member.id)}
                                                >
                                                    <FontAwesomeIcon icon={faTimes} />
                                                </button>
                                            </>
                                        )}
                                        <button 
                                            className="btn btn-sm btn-danger" 
                                            title="Xóa"
                                            onClick={() => handleDelete(member.id)}
                                        >
                                            <FontAwesomeIcon icon={faTrashAlt} />
                                        </button>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))
                    )}
                </tbody>
            </table>
        </div>
        )}
      </div>
    </div>
  );
};


const getRoleLevel = (role) => {
    if (!role) return 0;
    const r = role.toUpperCase();
    if (r === 'QUẢN TRỊ VIÊN' || r === 'ADMIN') return 3;
    if (r === 'QUẢN LÝ SỰ KIỆN' || r === 'EVENT_MANAGER') return 2;
    return 1;
};

const getRoleBadgeClass = (role) => {
    if (!role) return 'badge-secondary';
    const r = role.toUpperCase();
    if (r === 'QUẢN TRỊ VIÊN' || r === 'ADMIN') return 'badge-danger';
    if (r === 'QUẢN LÝ SỰ KIỆN' || r === 'EVENT_MANAGER') return 'badge-warning text-dark';
    return 'badge-secondary';
};

const DiscussionTab = ({ event, user }) => {
  const [replyingTo, setReplyingTo] = useState(null);
  const [activeMenuPostId, setActiveMenuPostId] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [viewingHistoryPostId, setViewingHistoryPostId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Registration state for current user on this event (used to gate interactions)
  const [registeredForEvent, setRegisteredForEvent] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [checkingReg, setCheckingReg] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadRegistration = async () => {
      setCheckingReg(true);
      try {
        if (!user) {
          setRegisteredForEvent(false);
          setRegistrationStatus(null);
          return;
        }
        const regs = await registrationService.getUserRegistrations();
        let myRegs = [];
        if (regs && regs._embedded && regs._embedded.registrations) myRegs = regs._embedded.registrations;
        else if (regs && regs.content) myRegs = regs.content;
        const myReg = myRegs.find(r => r.eventId === event.id);
        if (!cancelled) {
          if (myReg) {
            setRegisteredForEvent(true);
            setRegistrationStatus(myReg.status);
          } else {
            setRegisteredForEvent(false);
            setRegistrationStatus(null);
          }
        }
      } catch (err) {
        console.error('Failed to load registration for discussion tab', err);
        if (!cancelled) {
          setRegisteredForEvent(false);
          setRegistrationStatus(null);
        }
      } finally {
        if (!cancelled) setCheckingReg(false);
      }
    };
    loadRegistration();
    return () => { cancelled = true; };
  }, [event.id, user]);

  // Who can interact in discussion: Admins and event owner bypass registration; regular users must be registered+APPROVED
  const isOwnerLocal = !!(user && event && (
    (event.ownerId && user.id == event.ownerId) ||
    (event.username && user.username === event.username) ||
    (event.owner && user.username === event.owner)
  ));
  const isAdminLocal = !!(user && (user.role === 'Quản trị viên' || user.role === 'ADMIN'));
  const canInteract = isAdminLocal || isOwnerLocal || (registeredForEvent && registrationStatus === 'APPROVED');

  const ensureCanInteract = (actionName = 'thao tác này') => {
    if (canInteract) return true;
    if (checkingReg) {
      alert('Đang kiểm tra quyền. Vui lòng thử lại sau.');
      return false;
    }
    alert('Bạn phải đăng ký và được duyệt để ' + actionName + '.');
    return false;
  };

  const handleCreatePost = async (content, mediaUrls) => {
    try {
      const postData = {
        content: content,
        eventId: event.id,
        type: 'DISCUSSION',
        mediaUrls: mediaUrls // Array of temp file names
      };
      const newPostResponse = await postService.createPost(event.id, postData);
      
      if (newPostResponse && newPostResponse.id) {
         const mappedPost = mapPost(newPostResponse);
         setPosts(prev => {
             const newPosts = [mappedPost, ...prev];
             return newPosts.sort((a, b) => {
                if (a.isPinned === b.isPinned) return b.id - a.id;
                return a.isPinned ? -1 : 1;
             });
         });
      } else {
         loadPosts();
      }
    } catch (error) {
      console.error("Failed to create post", error);
      throw error; // Re-throw to let dialog handle it
    }
  };

  // Permission logic
  const isOwner = !!(user && event && (
    (event.ownerId && user.id == event.ownerId) ||
    (event.username && user.username === event.username) ||
    (event.owner && user.username === event.owner)
  ));
  const isManager = !!(user && (user.role === 'Quản lý sự kiện' || user.role === 'EVENT_MANAGER' || isOwner));
  const isAdmin = !!(user && (user.role === 'Quản trị viên' || user.role === 'ADMIN'));
  const canManagePosts = isManager || isAdmin;

  useEffect(() => {
      // Debug logs removed for production
  }, [user, event, isOwner, isManager, isAdmin, canManagePosts]);

  useEffect(() => {
    loadPosts();
  }, [event.id]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100) {
        if (!loading && !loadingMore && hasMore) {
          loadMorePosts();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, loadingMore, hasMore, page]);

  const mapPost = (p) => {
      // Handle user/author mapping
      let displayUser = 'Unknown';
      if (p.authorName) displayUser = p.authorName;
      else if (p.username) displayUser = p.username;
      else if (p.user && typeof p.user === 'object') displayUser = p.user.fullName || p.user.username || p.user.name;
      else if (p.user) displayUser = p.user;
      
      // Handle role mapping
      let displayRole = p.role || 'Thành viên';
      if (p.author && p.author.role) displayRole = p.author.role;

      // Handle media
      let media = [];
      if (p.mediaUrls && Array.isArray(p.mediaUrls)) {
          media = p.mediaUrls;
      } else if (p.images && Array.isArray(p.images)) {
          media = p.images;
      }

      return {
        ...p,
        id: p.id,
        user: displayUser,
        role: displayRole,
        time: p.createdAt ? formatDateTime(p.createdAt) : (p.time || 'Just now'),
        content: p.content || '',
        likes: p.likes || 0,
        comments: p.commentsCount || p.comments || 0,
        shares: p.shares || 0,
        liked: p.liked || false,
        isPinned: p.pinned || p.isPinned || false,
        commentsList: [],
        commentsLoaded: false,
        showComments: false,
        editHistory: p.editHistory || [],
        media: media
      };
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      // Initial load: 5 posts
      const response = await postService.getPostsByEvent(event.id, 0, 5, 'DISCUSSION');
      
      let rawPosts = [];
      if (Array.isArray(response)) {
        rawPosts = response;
      } else if (response.content) {
        rawPosts = response.content;
      } else if (response._embedded && response._embedded.posts) {
        rawPosts = response._embedded.posts;
      } else if (response.posts) {
        rawPosts = response.posts;
      }

      let mappedPosts = rawPosts.map(mapPost);

      // Merge any locally saved comments into the loaded posts so they persist across reloads
      mappedPosts = mappedPosts.map(p => {
        try {
          const saved = getSavedComments(event.id, p.id) || [];
          const postState = getSavedPostState(event.id, p.id) || {};
          const merged = { ...p };
          if (saved && saved.length > 0) {
            merged.commentsList = saved;
            merged.commentsLoaded = true;
            merged.showComments = true;
          }
          if (postState) {
            if (typeof postState.liked !== 'undefined') merged.liked = postState.liked;
            if (typeof postState.likes !== 'undefined') merged.likes = postState.likes;
            if (typeof postState.shares !== 'undefined') merged.shares = postState.shares;
          }
          return merged;
        } catch (e) {
          // ignore
        }
        return p;
      });
      
      // Sort: Pinned first, then newest (by ID)
      mappedPosts.sort((a, b) => {
          if (a.isPinned === b.isPinned) {
             return b.id - a.id;
          }
          return a.isPinned ? -1 : 1;
      });
      
      setPosts(mappedPosts);
      setPage(1); // Next page for size 3 logic
      setHasMore(rawPosts.length >= 5);
    } catch (error) {
      console.error("Failed to load posts", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    setLoadingMore(true);
    try {
      // Subsequent loads: 3 posts
      const response = await postService.getPostsByEvent(event.id, page, 3, 'DISCUSSION');
      
      let rawPosts = [];
      if (Array.isArray(response)) {
        rawPosts = response;
      } else if (response.content) {
        rawPosts = response.content;
      } else if (response._embedded && response._embedded.posts) {
        rawPosts = response._embedded.posts;
      } else if (response.posts) {
        rawPosts = response.posts;
      }

      if (rawPosts.length === 0) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      let mappedPosts = rawPosts.map(mapPost);

      // Merge locally saved comments and post state into newly loaded posts so they display immediately
      mappedPosts = mappedPosts.map(p => {
        try {
          const saved = getSavedComments(event.id, p.id) || [];
          const postState = getSavedPostState(event.id, p.id) || {};
          const merged = { ...p };
          if (saved && saved.length > 0) {
            merged.commentsList = saved;
            merged.commentsLoaded = true;
            merged.showComments = true;
          }
          if (postState) {
            if (typeof postState.liked !== 'undefined') merged.liked = postState.liked;
            if (typeof postState.likes !== 'undefined') merged.likes = postState.likes;
            if (typeof postState.shares !== 'undefined') merged.shares = postState.shares;
          }
          return merged;
        } catch (e) {
          // ignore
        }
        return p;
      });
      
      setPosts(prevPosts => {
        // Filter duplicates
        const existingIds = new Set(prevPosts.map(p => p.id));
        const newPosts = mappedPosts.filter(p => !existingIds.has(p.id));
        
        if (newPosts.length === 0 && rawPosts.length > 0) {
           // If we got posts but all were duplicates, we might need to fetch the next page immediately
           // But for now, let's just increment page and let user scroll again or auto-trigger?
           // Auto-triggering is safer to avoid "stuck" state.
           // However, simple increment is enough for now.
        }
        
        const combined = [...prevPosts, ...newPosts];
        // Re-sort to ensure pinned stay on top if new pinned posts appear (unlikely but possible)
        return combined.sort((a, b) => {
            if (a.isPinned === b.isPinned) {
               return b.id - a.id;
            }
            return a.isPinned ? -1 : 1;
        });
      });

      setPage(prev => prev + 1);
      // If we got less than requested, maybe no more? 
      // But since we are doing overlap logic, we might get 3 items where 2 are dupes.
      // So we only stop if rawPosts is empty or very small? 
      // Standard Pageable returns empty content when out of bounds.
      if (rawPosts.length < 3) setHasMore(false);

    } catch (error) {
      console.error("Failed to load more posts", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const [newPostContent, setNewPostContent] = useState('');

  const handlePost = async () => {
    if (!ensureCanInteract('đăng bài')) return;
    if (!newPostContent.trim()) return;
    
    try {
      const postData = {
        content: newPostContent,
        eventId: event.id,
        type: 'DISCUSSION'
      };
      const newPostResponse = await postService.createPost(event.id, postData);
      setNewPostContent('');
      
      // Optimistically add or use response
      if (newPostResponse && newPostResponse.id) {
         const mappedPost = {
            ...newPostResponse,
            user: newPostResponse.authorName || (user ? (user.name || user.username) : 'Tôi'),
            role: newPostResponse.role || (user ? user.role : 'Thành viên'),
            time: 'Vừa xong',
            likes: 0,
            comments: 0,
            shares: 0,
            liked: false,
            isPinned: false,
            commentsList: [],
            editHistory: []
         };
         setPosts(prev => {
             const newPosts = [mappedPost, ...prev];
             return newPosts.sort((a, b) => {
                if (a.isPinned === b.isPinned) return b.id - a.id;
                return a.isPinned ? -1 : 1;
             });
         });
      } else {
         loadPosts();
      }
    } catch (error) {
      console.error("Failed to create post", error);
      alert("Không thể đăng bài viết");
    }
  };

  const handleDeletePost = async (postId) => {
      if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
          try {
            await postService.deletePost(postId);
            setPosts(posts.filter(p => p.id !== postId));
          } catch (error) {
            console.error("Failed to delete post", error);
            alert("Không thể xóa bài viết");
          }
      }
      setActiveMenuPostId(null);
  };

  const handleEditPost = (post) => {
      setEditingPostId(post.id);
      setEditContent(post.content);
      setActiveMenuPostId(null);
  };

  const handleSaveEdit = async (postId) => {
      try {
        await postService.updatePost(postId, { content: editContent });
        setPosts(posts.map(p => {
            if (p.id === postId) {
                const historyEntry = {
                    content: p.content,
                    time: new Date().toLocaleString('vi-VN')
                };
                return { 
                    ...p, 
                    content: editContent,
                    editHistory: [historyEntry, ...(p.editHistory || [])]
                };
            }
            return p;
        }));
        setEditingPostId(null);
        setEditContent('');
      } catch (error) {
        console.error("Failed to update post", error);
        alert("Không thể cập nhật bài viết");
      }
  };

   const handleCancelEdit = () => {
      setEditingPostId(null);
      setEditContent('');
  };

  const handlePinPost = async (postId) => {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      
      try {
        await postService.updatePost(postId, { pinned: !post.isPinned });
        setPosts(posts.map(p => {
            if (p.id === postId) {
                return { ...p, isPinned: !p.isPinned };
            }
            return p;
        }));
        setActiveMenuPostId(null);
      } catch (error) {
        console.error("Failed to pin post", error);
        alert("Không thể ghim bài viết");
      }
  };

  const sortedPosts = posts; // Already sorted

  const handleLike = async (postId) => {
    if (!ensureCanInteract('thích bài viết')) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Optimistic update
    const originalPosts = [...posts];
    const newLiked = !post.liked;
    const newLikes = newLiked ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1);

    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          liked: newLiked,
          likes: newLikes
        };
      }
      return p;
    }));
      // Persist like state locally (no backend calls)
      try {
        const affected = (posts.find(p => p.id === postId)) || {};
        const state = {
          liked: newLiked,
          likes: newLikes,
          shares: affected.shares || 0
        };
        savePostState(event.id, postId, state);
      } catch (e) {
        console.error('Failed to save post like state locally', e);
      }
  };

  const handleShare = (postId) => {
    const link = `${window.location.origin}/event/${event.id}/post/${postId}`;
    navigator.clipboard.writeText(link).then(() => {
        alert('Đã sao chép liên kết bài viết: ' + link);
    });
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const newShares = (post.shares || 0) + 1;
        // persist shares
        try {
          const state = getSavedPostState(event.id, postId) || {};
          state.shares = newShares;
          savePostState(event.id, postId, state);
        } catch (e) {
          console.error('Failed to save post share state locally', e);
        }

        return {
          ...post,
          shares: newShares
        };
      }
      return post;
    }));
  };

  const toggleComments = async (postId) => {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.commentsLoaded) {
          setPosts(posts.map(p => {
              if (p.id === postId) {
                  return { ...p, showComments: !p.showComments };
              }
              return p;
          }));
          return;
      }

      try {
          // Load comments from localStorage only (do not call backend)
          const saved = getSavedComments(event.id, postId) || [];
          setPosts(posts.map(p => {
            if (p.id === postId) {
              return {
                ...p,
                commentsList: saved,
                commentsLoaded: true,
                showComments: true
              };
            }
            return p;
          }));
      } catch (error) {
          console.error("Failed to load local comments", error);
      }
  };

  const handleComment = async (postId, commentContent) => {
      if (!ensureCanInteract('bình luận')) return;
      if (!commentContent.trim()) return;
      
      try {
          const parentId = replyingTo && replyingTo.postId === postId ? replyingTo.commentId : null;

          // Create a local comment object without calling backend
          const generatedId = `local_${Date.now()}_${Math.floor(Math.random()*1000)}`;
          const authorName = user ? (user.name || user.username) : 'Tôi';
          const newCommentObj = {
            id: generatedId,
            authorName,
            content: commentContent,
            createdAt: new Date().toISOString(),
            replies: []
          };

          const mappedComment = {
            id: newCommentObj.id,
            user: newCommentObj.authorName || authorName,
            content: newCommentObj.content,
            time: new Date(newCommentObj.createdAt).toLocaleString('vi-VN'),
            liked: false,
            likes: 0,
            replies: []
          };

          // Update UI state and persist locally
          setPosts(posts.map(post => {
            if (post.id === postId) {
              if (parentId) {
                 const updatedComments = (post.commentsList || []).map(c => {
                   if (c.id === parentId) {
                     return { ...c, replies: [...(c.replies || []), mappedComment] };
                   }
                   if (c.replies && c.replies.some(r => r.id === parentId)) {
                     return { ...c, replies: [...c.replies, mappedComment] };
                   }
                   return c;
                 });
                 // persist reply in localStorage
                 const saved = getSavedComments(event.id, postId) || [];
                 const savedUpdated = saved.map(c => {
                 if (String(c.id) === String(parentId)) {
                   return { ...c, replies: [...(c.replies || []), mappedComment] };
                 }
                 if (c.replies && c.replies.some(r => String(r.id) === String(parentId))) {
                   return { ...c, replies: [...c.replies, mappedComment] };
                 }
                 return c;
                 });
                 saveComments(event.id, postId, savedUpdated);

                 return {
                   ...post,
                   comments: (post.comments || 0) + 1,
                   commentsList: updatedComments
                 };
              } else {
                const newList = [...(post.commentsList || []), mappedComment];
                // persist new comment locally
                const saved = getSavedComments(event.id, postId) || [];
                const savedList = [...saved, mappedComment];
                saveComments(event.id, postId, savedList);

                return {
                  ...post,
                  comments: (post.comments || 0) + 1,
                  commentsList: newList,
                  showComments: true
                };
              }
            }
            return post;
          }));

          setReplyingTo(null);
          const input = document.getElementById(`comment-box-${postId}`);
          if (input) {
              input.value = '';
              input.placeholder = "Viết bình luận...";
          }
      } catch (error) {
          console.error("Failed to post local comment", error);
          alert("Không thể gửi bình luận");
      }
  };

    const handleCommentLike = (postId, commentId, isReply = false, parentCommentId = null) => {
      if (!ensureCanInteract('thích bình luận')) return;
      const newPosts = posts.map(post => {
        if (post.id === postId && post.commentsList) {
          return {
            ...post,
            commentsList: post.commentsList.map(comment => {
              if (!isReply && comment.id === commentId) {
                const newLiked = !comment.liked;
                return { 
                  ...comment, 
                  liked: newLiked,
                  likes: newLiked ? (comment.likes || 0) + 1 : (comment.likes || 0) - 1
                };
              } else if (isReply && comment.id === parentCommentId && comment.replies) {
                return {
                  ...comment,
                  replies: comment.replies.map(reply => {
                    if (reply.id === commentId) {
                      const newLiked = !reply.liked;
                      return {
                        ...reply,
                        liked: newLiked,
                        likes: newLiked ? (reply.likes || 0) + 1 : (reply.likes || 0) - 1
                      };
                    }
                    return reply;
                  })
                };
              }
              return comment;
            })
          };
        }
        return post;
      });
      setPosts(newPosts);
      const affected = newPosts.find(p => p.id === postId);
      if (affected && affected.commentsList) {
      saveComments(event.id, postId, affected.commentsList);
      }
    };

  const handleCommentReply = (postId, commentId, username) => {
      setReplyingTo({ postId, commentId, username });
      const input = document.getElementById(`comment-box-${postId}`);
      if (input) {
          input.focus();
          input.placeholder = `Phản hồi ${username}...`;
      }
  };

  return (
    <div className="p-4" style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Create Post Box */}
      <div className="bg-white rounded shadow-sm p-3 mb-4">
        <div className="d-flex mb-3">
          <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mr-2" style={{ width: '40px', height: '40px' }}>
             <FontAwesomeIcon icon={faUser} className="text-secondary" />
          </div>
          <input 
            type="text" 
            className="form-control rounded-pill bg-light border-0" 
            placeholder="Bạn đang nghĩ gì?"
            onClick={() => { if (ensureCanInteract('đăng bài')) setShowCreateDialog(true); }}
            readOnly
            style={{ cursor: 'pointer' }}
          />
        </div>
        <div className="border-top pt-2">
            <button 
              className="btn btn-light btn-sm text-secondary font-weight-bold w-100"
              onClick={() => { if (ensureCanInteract('đăng bài')) setShowCreateDialog(true); }}
            >
                <FontAwesomeIcon icon={faImage} className="text-success mr-2" />
                Ảnh/Video
            </button>
        </div>
      </div>

      {/* Create Post Dialog */}
      <CreatePostDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreatePost}
        user={user}
      />

      {/* Posts Feed */}
      {loading && <div className="text-center py-3"><div className="spinner-border text-primary" role="status"><span className="sr-only">Loading...</span></div></div>}
      {!loading && sortedPosts.length === 0 && (
          <div className="text-center py-5 text-muted">
              <FontAwesomeIcon icon={faComment} size="3x" className="mb-3 text-light" />
              <p>Chưa có bài viết nào. Hãy là người đầu tiên đăng bài!</p>
          </div>
      )}
      {sortedPosts.map(post => (
        <div key={post.id} className={`bg-white rounded shadow-sm mb-3 ${post.isPinned ? 'border border-primary' : ''}`}>
            <div className="p-3">
                {post.isPinned && (
                    <div className="text-primary small font-weight-bold mb-2">
                        <FontAwesomeIcon icon={faThumbtack} className="mr-1" /> Đã ghim
                    </div>
                )}
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex">
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mr-2" style={{ width: '40px', height: '40px' }}>
                            <FontAwesomeIcon icon={faUser} className="text-secondary" />
                        </div>
                        <div>
                            <div className="d-flex align-items-center">
                                <div className="font-weight-bold text-dark mr-2" style={{ lineHeight: '1.2' }}>{post.user}</div>
                                {post.role && <span className="badge badge-light text-secondary border mr-2" style={{fontSize: '0.7rem'}}>{post.role}</span>}
                                <span className={`badge ${post.isJoined ? 'badge-success' : 'badge-secondary'} font-weight-normal`} style={{fontSize: '0.65rem'}}>
                                    {post.isJoined ? 'Đã tham gia' : 'Chưa tham gia'}
                                </span>
                            </div>
                            <div className="small text-muted">
                                {post.time} · <FontAwesomeIcon icon={faGlobeAmericas} size="xs" />
                                {post.editHistory && post.editHistory.length > 0 && (
                                    <span className="ml-1 text-muted font-italic" style={{ cursor: 'pointer' }} onClick={() => setViewingHistoryPostId(post.id)}>
                                        · Đã chỉnh sửa
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="position-relative">
                        <button 
                            className="btn btn-link text-secondary p-0"
                            onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                        >
                            <FontAwesomeIcon icon={faEllipsisH} />
                        </button>
                        {activeMenuPostId === post.id && (
                            <div className="position-absolute bg-white shadow-sm rounded border py-1" style={{ right: 0, top: '100%', zIndex: 100, minWidth: '180px' }}>
                                {canManagePosts && (
                                    <button 
                                        className="dropdown-item small" 
                                        onClick={() => handlePinPost(post.id)}
                                    >
                                        <FontAwesomeIcon icon={faThumbtack} className="mr-2" /> {post.isPinned ? 'Bỏ ghim' : 'Ghim bài viết'}
                                    </button>
                                )}
                                {post.editHistory && post.editHistory.length > 0 && (
                                    <button 
                                        className="dropdown-item small" 
                                        onClick={() => {
                                            setViewingHistoryPostId(post.id);
                                            setActiveMenuPostId(null);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faHistory} className="mr-2" /> Xem lịch sử chỉnh sửa
                                    </button>
                                )}
                                {(user && (user.id == post.authorId || (post.username && user.username === post.username))) && (
                                    <button 
                                        className="dropdown-item small" 
                                        onClick={() => handleEditPost(post)}
                                    >
                                        <FontAwesomeIcon icon={faEdit} className="mr-2" /> Sửa bài viết
                                    </button>
                                )}
                                {(user && (user.id == post.authorId || (post.username && user.username === post.username) || canManagePosts)) && (
                                    <button 
                                        className="dropdown-item text-danger small" 
                                        onClick={() => handleDeletePost(post.id)}
                                    >
                                        <FontAwesomeIcon icon={faTrashAlt} className="mr-2" /> Xóa bài viết
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="mb-2">
                    {editingPostId === post.id ? (
                        <div>
                            <textarea 
                                className="form-control mb-2" 
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows="3"
                            />
                            <div className="d-flex justify-content-end">
                                <button className="btn btn-sm btn-secondary mr-2" onClick={handleCancelEdit}>Hủy</button>
                                <button className="btn btn-sm btn-primary" onClick={() => handleSaveEdit(post.id)}>Lưu</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="mb-2" style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>
                            {post.media && post.media.length > 0 && (
                                <div className="row no-gutters">
                                    {post.media.map((url, idx) => (
                                        <div key={idx} className={`col-${post.media.length === 1 ? '12' : '6'} p-1`}>
                                            <img 
                                                src={url.startsWith('http') ? url : `${url}`} 
                                                alt="Post media" 
                                                className="img-fluid rounded" 
                                                style={{ maxHeight: '300px', width: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            
            {/* Stats */}
            <div className="px-3 py-2 border-top border-bottom d-flex justify-content-between text-muted small">
                <div>
                    <FontAwesomeIcon icon={faThumbsUp} className="text-primary mr-1" />
                    {post.likes}
                </div>
                <div>
                    <span className="mr-2">{post.comments} bình luận</span>
                    <span>{post.shares} chia sẻ</span>
                </div>
            </div>

            {/* Actions */}
            <div className="d-flex justify-content-between p-1">
                <button 
                    className={`btn btn-light flex-grow-1 ${post.liked ? 'text-primary' : 'text-secondary'}`}
                    onClick={() => handleLike(post.id)}
                >
                    <FontAwesomeIcon icon={faThumbsUp} className="mr-2" /> Thích
                </button>
                <button 
                    className="btn btn-light flex-grow-1 text-secondary"
                    onClick={() => {
                        if (!post.showComments) toggleComments(post.id);
                        const commentBox = document.getElementById(`comment-box-${post.id}`);
                        if (commentBox) commentBox.focus();
                    }}
                >
                    <FontAwesomeIcon icon={faComment} className="mr-2" /> Bình luận
                </button>
                <button 
                    className="btn btn-light flex-grow-1 text-secondary"
                    onClick={() => handleShare(post.id)}
                >
                    <FontAwesomeIcon icon={faShare} className="mr-2" /> Chia sẻ
                </button>
            </div>
            
            {/* Comment Section */}
            <div className="p-3 border-top">
                {post.comments > 0 && !post.showComments && (
                    <button 
                        className="btn btn-link text-muted p-0 mb-2"
                        onClick={() => toggleComments(post.id)}
                    >
                        Xem {post.comments} bình luận
                    </button>
                )}
                {post.showComments && post.commentsList && post.commentsList.map(comment => (
                    <div key={comment.id}>
                        <div className="d-flex mb-2">
                            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mr-2" style={{ width: '32px', height: '32px', minWidth: '32px' }}>
                                <FontAwesomeIcon icon={faUser} className="text-secondary small" />
                            </div>
                            <div>
                                <div className="bg-light rounded p-2">
                                    <div className="font-weight-bold small">{comment.user}</div>
                                    <div className="small">{comment.content}</div>
                                </div>
                                <div className="d-flex small mt-1 ml-1">
                                    <button 
                                        className={`btn btn-link p-0 mr-2 small font-weight-bold ${comment.liked ? 'text-primary' : 'text-secondary'}`} 
                                        style={{ fontSize: '0.8rem' }}
                                        onClick={() => handleCommentLike(post.id, comment.id)}
                                    >
                                        Thích {comment.likes > 0 && `(${comment.likes})`}
                                    </button>
                                    <button 
                                        className="btn btn-link p-0 mr-2 text-secondary small font-weight-bold" 
                                        style={{ fontSize: '0.8rem' }}
                                        onClick={() => handleCommentReply(post.id, comment.id, comment.user)}
                                    >
                                        Phản hồi
                                    </button>
                                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>{comment.time}</span>
                                </div>
                            </div>
                        </div>
                        {/* Replies */}
                        {comment.replies && comment.replies.map(reply => (
                            <div key={reply.id} className="d-flex mb-2 ml-5">
                                <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mr-2" style={{ width: '24px', height: '24px', minWidth: '24px' }}>
                                    <FontAwesomeIcon icon={faUser} className="text-secondary small" style={{ fontSize: '0.7rem' }} />
                                </div>
                                <div>
                                    <div className="bg-light rounded p-2">
                                        <div className="font-weight-bold small">{reply.user}</div>
                                        <div className="small">{reply.content}</div>
                                    </div>
                                    <div className="d-flex small mt-1 ml-1">
                                        <button 
                                            className={`btn btn-link p-0 mr-2 small font-weight-bold ${reply.liked ? 'text-primary' : 'text-secondary'}`} 
                                            style={{ fontSize: '0.8rem' }}
                                            onClick={() => handleCommentLike(post.id, reply.id, true, comment.id)}
                                        >
                                            Thích {reply.likes > 0 && `(${reply.likes})`}
                                        </button>
                                        <button 
                                            className="btn btn-link p-0 mr-2 text-secondary small font-weight-bold" 
                                            style={{ fontSize: '0.8rem' }}
                                            onClick={() => handleCommentReply(post.id, comment.id, reply.user)}
                                        >
                                            Phản hồi
                                        </button>
                                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>{reply.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
                <div className="d-flex mt-2 align-items-center">
                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mr-2" style={{ width: '32px', height: '32px', minWidth: '32px' }}>
                        <FontAwesomeIcon icon={faUser} className="text-secondary small" />
                    </div>
                    <div className="flex-grow-1 position-relative">
                        <input 
                            id={`comment-box-${post.id}`}
                            type="text" 
                            className="form-control rounded-pill bg-light border-0 small pr-5" 
                            placeholder="Viết bình luận..."
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleComment(post.id, e.target.value);
                                    e.target.value = '';
                                }
                            }}
                        />
                        <button 
                            className="btn btn-link text-primary position-absolute"
                            style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', padding: 0, zIndex: 10 }}
                            onClick={() => {
                                const input = document.getElementById(`comment-box-${post.id}`);
                                if (input) {
                                    handleComment(post.id, input.value);
                                    input.value = '';
                                }
                            }}
                        >
                            <FontAwesomeIcon icon={faPaperPlane} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      ))}
      {loadingMore && (
          <div className="text-center py-3">
              <div className="spinner-border text-primary spinner-border-sm" role="status">
                  <span className="sr-only">Loading...</span>
              </div>
              <span className="ml-2 text-muted small">Đang tải thêm...</span>
          </div>
      )}
      {/* Edit History Modal */}
      <EditHistoryModal 
          isOpen={!!viewingHistoryPostId}
          onClose={() => setViewingHistoryPostId(null)}
          history={posts.find(p => p.id === viewingHistoryPostId)?.editHistory || []}
      />
    </div>
  );
};

const NotificationsTab = ({ event, user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Permission: Only Managers/Admins can create announcements
  const canCreate = user && (user.role === 'ADMIN' || user.role === 'Quản trị viên' || user.username === event.username || user.id === event.ownerId);

  useEffect(() => {
    loadPosts();
  }, [event.id]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await postService.getPostsByEvent(event.id, 0, 20, 'ANNOUNCEMENT');
      let rawPosts = [];
      if (Array.isArray(response)) rawPosts = response;
      else if (response.content) rawPosts = response.content;
      else if (response._embedded && response._embedded.posts) rawPosts = response._embedded.posts;
      
      setPosts(rawPosts);
    } catch (error) {
      console.error("Failed to load announcements", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newContent.trim()) return;
    try {
      await postService.createPost(event.id, {
        content: newContent,
        type: 'ANNOUNCEMENT'
      });
      setNewContent('');
      setIsCreating(false);
      loadPosts();
    } catch (error) {
      alert("Failed to create announcement");
    }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Bạn có chắc chắn muốn xóa thông báo này?")) return;
      try {
          await postService.deletePost(id);
          loadPosts();
      } catch(e) {
          alert("Failed to delete");
      }
  }

  return (
    <div className='p-4 bg-white rounded shadow-sm'>
        <div className='mb-4'>
            <div className="d-flex justify-content-between align-items-center">
                <h6 className='text-muted mb-0'>
                    <FontAwesomeIcon icon={faBell} className="mr-2" />
                    Bảng tin theo dõi
                </h6>
                {canCreate && (
                    <button 
                        className={`btn btn-sm ${isCreating ? 'btn-outline-danger' : 'btn-outline-primary'}`}
                        onClick={() => setIsCreating(!isCreating)}
                    >
                        {isCreating ? 'Hủy' : 'Tạo thông báo'}
                    </button>
                )}
            </div>
        </div>

        {isCreating && (
            <div className="mb-4 p-3 bg-light rounded">
                <h6 className="text-muted mb-2 small font-weight-bold">Tạo thông báo mới</h6>
                <div className="form-group mb-3">
                    <textarea 
                        className="form-control border-0 shadow-sm" 
                        rows="3"
                        placeholder="Nhập nội dung..." 
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        autoFocus
                        style={{ resize: 'none' }}
                    />
                </div>
                <div className="d-flex justify-content-end">
                    <button 
                        className="btn btn-sm btn-primary px-3" 
                        onClick={handleCreate}
                        disabled={!newContent.trim()}
                    >
                        Đăng
                    </button>
                </div>
            </div>
        )}

        {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
        ) : posts.length === 0 ? (
            <div className="text-center text-muted py-5">
                <FontAwesomeIcon icon={faBell} size="2x" className="mb-3 text-secondary" style={{ opacity: 0.3 }} />
                <p className="mb-0">Chưa có thông báo nào</p>
            </div>
        ) : (
            <div>
                {posts.map((item) => (
                    <div key={item.id} className="mb-3 pb-3 border-bottom">
                        <div className="d-flex align-items-center mb-2 justify-content-between">
                            <div className="d-flex align-items-center">
                                <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mr-2" style={{ width: '36px', height: '36px' }}>
                                    <FontAwesomeIcon icon={faUser} className="text-secondary" />
                                </div>
                                <div>
                                    <div className="font-weight-bold small">
                                        {item.authorName || item.authorId}
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <span className="badge badge-danger mr-2" style={{fontSize: '0.7rem'}}>
                                            {item.authorRole || 'Quản trị viên'}
                                        </span>
                                        <small className="text-muted">{formatDateTime(item.createdAt)}</small>
                                    </div>
                                </div>
                            </div>
                            {canCreate && (
                                <button 
                                    className="btn btn-link text-danger p-0"
                                    onClick={() => handleDelete(item.id)}
                                    title="Xóa"
                                >
                                    <FontAwesomeIcon icon={faTrashAlt} size="sm" />
                                </button>
                            )}
                        </div>
                        <p className="mb-0 text-dark mt-2 pl-1" style={{ whiteSpace: 'pre-wrap' }}>
                            {item.content}
                        </p>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

const EventChannelDashboard = ({ event, onClose }) => {
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [members, setMembers] = useState(event.members || []);
    const [eventDetail, setEventDetail] = useState(event);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    
    const { user: authUser, isAuthenticated } = useAuth();
    
    // Fetch current user from /users/myself
    useEffect(() => {
        if (isAuthenticated) {
            const fetchUserData = async () => {
                try {
                    const userData = await userService.getMyself();
                    setCurrentUser(userData);
                } catch (e) {
                    console.error("Failed to fetch user data", e);
                    // Fallback to authUser if API fails
                    setCurrentUser(authUser);
                }
            };
            fetchUserData();
        }
    }, [isAuthenticated, authUser]);
    
    useEffect(() => {
        if (event && event.id) {
          setLoading(true);
          setError(null);
          eventService.getEvent(event.id)
            .then((data) => setEventDetail(data))
            .catch(() => setError('Không thể tải chi tiết sự kiện'))
            .finally(() => setLoading(false));
        }
    }, [event]);
    
    const handleEndEvent = () => setShowEndConfirm(true);
    const handleConfirmEndEvent = async () => {
      try {
        await eventService.updateEvent(event.id, { status: 'COMPLETED' });
        setEventDetail(prev => ({ ...prev, status: 'COMPLETED' }));
        setMembers(members.map(m => ({ ...m, status: 'COMPLETED' })));
        setShowEndConfirm(false);
      } catch (e) {
        alert('Không thể kết thúc sự kiện: ' + (e.message || e));
      }
    };
    const handleCancelEndEvent = () => setShowEndConfirm(false);
  
  // Ensure user has a role for testing purposes (Default to 'Quản trị viên' if missing)
  const user = currentUser ? { ...currentUser, role: currentUser.role || 'Quản trị viên' } : null;
  
  const [activeTab, setActiveTab] = useState('details');

  // Restrict access to Discussion, Members, Notifications when event is DRAFT or PENDING
  const isRestrictedTabs = eventDetail && (eventDetail.status === 'DRAFT' || eventDetail.status === 'PENDING');

  // Wrapper used by sidebar to safely change tabs
  const handleSetActiveTab = (tab) => {
    if (isRestrictedTabs && tab !== 'details') return; // ignore attempts to open restricted tabs
    setActiveTab(tab);
  };

  const renderContent = () => {
    if (loading) return <div>Đang tải chi tiết sự kiện...</div>;
    if (error) return <div className="text-danger">{error}</div>;

    // enforce fallback to details when tabs are restricted
    const currentTab = (isRestrictedTabs && activeTab !== 'details') ? 'details' : activeTab;

    switch (currentTab) {
      case 'details':
        return (
          <div className="d-flex flex-column" style={{ minHeight: '100%' }}>
            <EventDetails event={eventDetail} user={user} onEventUpdate={setEventDetail} />
            {(user && user.username === eventDetail.username && eventDetail.status === 'APPROVED') && (
            <div className="text-center py-4 my-auto">
              <button className="btn btn-danger" onClick={handleEndEvent}>
                Kết thúc sự kiện
              </button>
            </div>
            )}
            {showEndConfirm && (
              <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Xác nhận kết thúc sự kiện</h5>
                      <button type="button" className="close" onClick={handleCancelEndEvent}>&times;</button>
                    </div>
                    <div className="modal-body">
                      <p>Bạn có chắc chắn muốn kết thúc sự kiện này? Tất cả thành viên sẽ được đánh dấu hoàn thành.</p>
                    </div>
                    <div className="modal-footer">
                      <button className="btn btn-secondary" onClick={handleCancelEndEvent}>Hủy</button>
                      <button className="btn btn-danger" onClick={handleConfirmEndEvent}>Xác nhận</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'discussion':
        return <DiscussionTab event={eventDetail} user={user} />;
      case 'members':
        return <MembersList event={eventDetail} user={user} />;
      case 'notifications':
        return <NotificationsTab event={eventDetail} user={user} />;
      default:
        return null;
    }
  };

  return (
    <div className='event-channel-container'>
      <div className='event-channel-header'>
        <div className='d-flex justify-content-between align-items-center'>
          <h5 className='mb-0'>Kênh sự kiện: {event.name}</h5>
          <button 
            className='btn btn-sm btn-outline-secondary' 
            onClick={onClose}
          >
            × Đóng
          </button>
        </div>
      </div>
      <div className='event-channel-body'>
        <div className='event-channel-sidebar'>
          <EventChannelSidebar 
            activeTab={activeTab} 
            setActiveTab={handleSetActiveTab} 
            eventStatus={eventDetail.status}
          />
        </div>
        <div className='event-channel-content'>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default EventChannelDashboard;
