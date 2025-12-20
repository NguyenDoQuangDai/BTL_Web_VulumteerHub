import React, { useEffect, useRef, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import {
  faMapMarkerAlt,
  faPlay,
  faStop,
  faHourglassHalf,
  faUser,
  faFileAlt,
  faImage,
} from '@fortawesome/free-solid-svg-icons';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { registrationService, eventService } from '../../services/apiService';

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

const EventCard = ({ evt }) => {
  const history = useHistory();
  const { user: authUser } = useAuth();
  // Ensure user has a role for testing purposes (Default to 'Quản trị viên' if missing)
  const user = authUser ? { ...authUser, role: authUser.role || 'Quản trị viên' } : null;

  const isOwner = user && (
    (evt.username && user.username === evt.username) ||
    (evt.owner && user.username === evt.owner) ||
    (evt.ownerId && user.id === evt.ownerId)
  );
  const isAdmin = user && (user.role === 'Quản trị viên' || user.role === 'ADMIN');
  const isManager = user && (user.role === 'Quản lý sự kiện' || user.role === 'EVENT_MANAGER');

  // Edit: Only owner can edit
  // Delete: Owner or Admin can delete
  const canEdit = isOwner;
  const canDelete = isOwner || isAdmin;

  const readInterested = () => {
    try {
      const raw = localStorage.getItem('interestedEvents');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  };

  const writeInterested = (set) => {
    try {
      localStorage.setItem('interestedEvents', JSON.stringify(Array.from(set)));
    } catch {}
  };

  // Registration persistence (frontend-only)
  const readRegistered = () => {
    try {
      const raw = localStorage.getItem('registeredEvents');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  };

  const writeRegistered = (set) => {
    try {
      localStorage.setItem('registeredEvents', JSON.stringify(Array.from(set)));
    } catch {}
  };

  const [interested, setInterested] = useState(() => readInterested().has(evt.id));
  const [registered, setRegistered] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [loadingReg, setLoadingReg] = useState(false);

  const initialInterestedRef = useRef(interested);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
    name: evt.name || '',
    description: evt.description || '',
    location: evt.location || '',
    dateDeadline: evt.dateDeadline || '',
    startDate: evt.startDate || '',
    endDate: evt.endDate || '',
    images: evt.images || (evt.image || evt.imageUrl ? [evt.image || evt.imageUrl] : []),
  });

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
              
              const myReg = myRegs.find(r => r.eventId === evt.id);
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
  }, [evt.id, user]);

  const handleRegister = async (e) => {
    e.stopPropagation();
    if (registered) {
      setShowConfirm(true);
    } else {
      try {
          setLoadingReg(true);
          const reg = await registrationService.registerForEvent(evt.id);
          setRegistered(true);
          setRegistrationId(reg.id);
          setRegistrationStatus('PENDING');
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
            setRegistrationStatus(null);
            setShowConfirm(false);
        }
    } catch (e) {
        alert("Failed to unregister: " + e.message);
    } finally {
        setLoadingReg(false);
    }
  };

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






  const safeDate = (value) => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const clampCount = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    return n;
  };

  const now = new Date();
  const deadlinePassed = (() => {
    const d = safeDate(evt.dateDeadline);
    return d ? d < now : false;
  })();

  const startPassed = (() => {
    const d = safeDate(evt.startDate);
    return d ? d < now : false;
  })();

  const registerDisabled = !registered && deadlinePassed;
  const cancelDisabled = registered && startPassed;
  const hasUnsavedChanges = () => {
    return (
      editForm.name !== (evt.name || '') ||
      editForm.description !== (evt.description || '') ||
      editForm.location !== (evt.location || '') ||
      editForm.dateDeadline !== (evt.dateDeadline || '') ||
      editForm.startDate !== (evt.startDate || '') ||
      editForm.endDate !== (evt.endDate || '') ||
      JSON.stringify(editForm.images) !== JSON.stringify(evt.images || (evt.image ? [evt.image] : []))
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
      await import('../../services/apiService').then(({ eventService }) =>
        eventService.updateEvent(evt.id, {
          name: editForm.name,
          description: editForm.description,
          location: editForm.location,
          dateDeadline: new Date(editForm.dateDeadline).toISOString(),
          startDate: new Date(editForm.startDate).toISOString(),
          endDate: new Date(editForm.endDate).toISOString(),
        })
      );
      setShowEditForm(false);
      window.location.reload(); // reload để cập nhật danh sách
    } catch (e) {
      alert('Không thể cập nhật sự kiện: ' + (e.message || e));
    }
  };

  useEffect(() => {
    if (showConfirm) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [showConfirm]);

  const toggleInterested = () => {
    const s = readInterested();
    if (s.has(evt.id)) {
      s.delete(evt.id);
      setInterested(false);
    } else {
      s.add(evt.id);
      setInterested(true);
    }
    writeInterested(s);
  };

  const baseRegisteredCount = clampCount(
    evt.registeredCount ?? evt.joinedCount ?? evt.participantCount ?? evt.participantsCount ?? 0
  );
  const baseInterestedCount = clampCount(
    evt.interestedCount ?? evt.followerCount ?? evt.followCount ?? evt.likeCount ?? 0
  );

  const adjustedRegisteredCount = baseRegisteredCount;
  const adjustedInterestedCount = Math.max(
    0,
    baseInterestedCount + (interested && !initialInterestedRef.current ? 1 : 0) + (!interested && initialInterestedRef.current ? -1 : 0)
  );

  return (
    <>
    <div className="card h-100 event-card" onClick={() => history.push(`/event/${evt.id}`)} style={{ cursor: 'pointer' }}>
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex flex-column text-muted small">
            <span className="mb-1">Đã tạo: {formatDateTime(evt.createdAt || evt.createdDate)}</span>
            <span className="mr-3"><strong>{adjustedRegisteredCount}</strong> đã tham gia</span>
          </div>
          <div className="d-flex justify-content-end align-items-center">
            {canEdit && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary mr-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditForm(true);
                }}
              >
                Sửa
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
              >
                Xóa
              </button>
            )}
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="card-title mb-0 event-title" title={evt.name}>{evt.name}</h5>
          <span className={statusClass(evt.status)}>{evt.status}</span>
        </div>

        <div className="desc-line mb-2 flex-grow-1" style={{ minHeight: 48 }}>
          <FontAwesomeIcon icon={faFileAlt} className="mr-1 desc-icon" />
          <span className="text-muted">
            {evt.description 
              ? (evt.description.length > 120 ? `${evt.description.slice(0, 120)}…` : evt.description)
              : <i style={{ opacity: 0.6 }}>Chưa có mô tả cho sự kiện này</i>
            }
          </span>
        </div>

        <div className="mt-auto">
          <ul className="list-unstyled small mb-3">
            <li className="location-line">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 location-icon" />
              <strong>Địa điểm:</strong> {evt.location || '-'}
            </li>
            <li className="start-line">
              <FontAwesomeIcon icon={faPlay} className="mr-1 start-icon" />
              <strong>Bắt đầu:</strong> {formatDateTime(evt.startDate)}
            </li>
            <li className="end-line">
              <FontAwesomeIcon icon={faStop} className="mr-1 end-icon" />
              <strong>Kết thúc:</strong> {formatDateTime(evt.endDate)}
            </li>
            <li className="deadline-line">
              <FontAwesomeIcon icon={faHourglassHalf} className="mr-1 deadline-icon" />
              <strong>Hạn đăng ký:</strong> {formatDateTime(evt.dateDeadline)}
            </li>
            <li className="owner-line">
              <FontAwesomeIcon icon={faUser} className="mr-1 owner-icon" />
              <strong>Tạo bởi:</strong> {evt.username || evt.owner || evt.ownerId}
            </li>
          </ul>

          <div className="d-flex justify-content-center align-items-center w-100">
            <button
              type="button"
              className={`btn btn-sm w-100 ${
                registrationStatus === 'REJECTED' ? 'btn-secondary' :
                registered ? 'btn-outline-danger' : 
                (evt.status !== 'APPROVED') ? 'btn-secondary' : 'btn-primary'
              }`}
              onClick={handleRegister}
              disabled={loadingReg || registrationStatus === 'REJECTED' || (!registered && evt.status !== 'APPROVED')}
            >
              {loadingReg ? 'Đang xử lý...' : 
               registrationStatus === 'REJECTED' ? 'Đã bị từ chối' :
               (registered ? 'Hủy đăng ký' : 
                (evt.status !== 'APPROVED' ? 'Không thể đăng ký' : 'Đăng ký tham gia')
               )}
            </button>
          </div>
        </div>
      </div>

      {showConfirm && createPortal(
        <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="text-right mb-2">
              <button type="button" className="btn btn-sm btn-outline-secondary close-btn" onClick={() => setShowConfirm(false)}>×</button>
            </div>
            <p className="mb-3">
              Bạn muốn hủy đăng ký{' '}
              <span className="event-title">{evt.name}</span>?
            </p>
            <div className="d-flex justify-content-between">
              <button className="btn btn-light" onClick={() => setShowConfirm(false)}>Không</button>
              <button
                className="btn btn-danger"
                onClick={confirmUnregister}
              >
                Có
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showUnsavedConfirm && createPortal(
        <div className="confirm-overlay" onClick={() => setShowUnsavedConfirm(false)}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
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

      {showEditForm && createPortal(
        <div className="confirm-overlay" onClick={handleEditClose}>
          <div className="confirm-card" style={{ width: '100%', maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
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

              <div className="form-group">
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
              </div>

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
                    value={editForm.dateDeadline ? editForm.dateDeadline.slice(0, 16) : ''}
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
                    value={editForm.startDate ? editForm.startDate.slice(0, 16) : ''}
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
                    value={editForm.endDate ? editForm.endDate.slice(0, 16) : ''}
                    onChange={handleEditFormChange}
                    required
                  />
                </div>
              </div>

              <div className="text-right mt-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary mr-2"
                  onClick={handleEditClose}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveChanges}
                  disabled={!hasUnsavedChanges()}
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {showDeleteConfirm && createPortal(
        <div className="confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="text-right mb-2">
              <button type="button" className="btn btn-sm btn-outline-secondary close-btn" onClick={() => setShowDeleteConfirm(false)}>×</button>
            </div>
            <p className="mb-3">Xóa sự kiện <span className="event-title">{evt.name}</span>?</p>
            <div className="d-flex justify-content-between">
              <button className="btn btn-light" onClick={() => setShowDeleteConfirm(false)}>Giữ</button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  try {
                    await import('../../services/apiService').then(({ eventService }) =>
                      eventService.deleteEvent(evt.id)
                    );
                    setShowDeleteConfirm(false);
                    window.location.reload();
                  } catch (e) {
                    alert('Không thể xóa sự kiện: ' + (e.message || e));
                  }
                }}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
    </>
  );
};

export default EventCard;
