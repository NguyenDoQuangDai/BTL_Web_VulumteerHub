import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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
} from '@fortawesome/free-solid-svg-icons';
import { createPortal } from 'react-dom';
import EventChannelDashboard from '../EventChannel/EventChannelDashboard';

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
  const [registered, setRegistered] = useState(() => readRegistered().has(evt.id));
  const initialInterestedRef = useRef(interested);
  const initialRegisteredRef = useRef(registered);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [showChannel, setShowChannel] = useState(false);
  const [editForm, setEditForm] = useState({
    name: evt.name || '',
    description: evt.description || '',
    location: evt.location || '',
    dateDeadline: evt.dateDeadline || '',
    startDate: evt.startDate || '',
    endDate: evt.endDate || '',
  });






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
      editForm.endDate !== (evt.endDate || '')
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

  const handleSaveChanges = () => {
    // TODO: integrate edit API
    setShowEditForm(false);
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

  const adjustedRegisteredCount = Math.max(
    0,
    baseRegisteredCount + (registered && !initialRegisteredRef.current ? 1 : 0) + (!registered && initialRegisteredRef.current ? -1 : 0)
  );
  const adjustedInterestedCount = Math.max(
    0,
    baseInterestedCount + (interested && !initialInterestedRef.current ? 1 : 0) + (!interested && initialInterestedRef.current ? -1 : 0)
  );

  return (
    <>
    <div className="card h-100 event-card" onClick={() => setShowChannel(true)} style={{ cursor: 'pointer' }}>
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex flex-column text-muted small">
            <span className="mr-3"><strong>{adjustedRegisteredCount}</strong> đã tham gia</span>
            <span><strong>{adjustedInterestedCount}</strong> đã quan tâm</span>
          </div>
          <div className="d-flex justify-content-end align-items-center">
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
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="card-title mb-0 event-title" title={evt.name}>{evt.name}</h5>
          <span className={statusClass(evt.status)}>{evt.status}</span>
        </div>

        {evt.description && (
          <div className="desc-line mb-2" style={{ minHeight: 48 }}>
            <FontAwesomeIcon icon={faFileAlt} className="mr-1 desc-icon" />
            <span className="text-muted">
              {evt.description.length > 120 ? `${evt.description.slice(0, 120)}…` : evt.description}
            </span>
          </div>
        )}

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
            <strong>Owner:</strong> {evt.ownerId?.slice(0, 8)}…
          </li>
        </ul>

        <div className="mt-auto d-flex justify-content-start align-items-center">
          <div className="d-flex align-items-center">
            <Link
              to={`/events/${evt.id}`}
              className="btn btn-outline-primary btn-sm"
              onClick={(e) => e.stopPropagation()}
            >
              Chi tiết
            </Link>
            <button
              type="button"
              className={`btn btn-sm cancel-btn ml-2 ${registered ? '' : 'cancelled'} ${registerDisabled || cancelDisabled ? 'disabled-action' : ''}`}
              disabled={registerDisabled || cancelDisabled}
              onClick={(e) => {
                e.stopPropagation();
                if (registerDisabled || cancelDisabled) return;
                if (registered) {
                  setShowConfirm(true);
                } else {
                  const s = readRegistered();
                  s.add(evt.id);
                  writeRegistered(s);
                  setRegistered(true);
                }
              }}
            >
              {registered ? 'Hủy đăng ký' : 'Đăng ký'}
            </button>
            <button
              type="button"
              className={`btn btn-sm interest-btn ${interested ? 'interested' : ''} ml-2`}
              onClick={(e) => {
                e.stopPropagation();
                toggleInterested();
              }}
            >
              <FontAwesomeIcon
                icon={interested ? faHeartSolid : faHeartRegular}
                className="mr-1 interest-heart"
              />
              {interested ? 'Đang quan tâm' : 'Quan tâm'}
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
                onClick={() => {
                  const s = readRegistered();
                  s.delete(evt.id);
                  writeRegistered(s);
                  setRegistered(false);
                  setShowConfirm(false);
                }}
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
                />
              </div>

              <div className="form-group">
                <label className="field-label">
                  <FontAwesomeIcon icon={faFileAlt} className="mr-2" />
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
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                  Địa điểm
                </label>
                <input
                  type="text"
                  name="location"
                  className="form-control"
                  value={editForm.location}
                  onChange={handleEditFormChange}
                />
              </div>

              <div className="form-group">
                <label className="field-label">
                  <FontAwesomeIcon icon={faPlay} className="mr-2" />
                  Ngày bắt đầu *
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  className="form-control"
                  value={editForm.startDate ? editForm.startDate.slice(0, 16) : ''}
                  onChange={handleEditFormChange}
                />
              </div>

              <div className="form-group">
                <label className="field-label">
                  <FontAwesomeIcon icon={faStop} className="mr-2" />
                  Ngày kết thúc *
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  className="form-control"
                  value={editForm.endDate ? editForm.endDate.slice(0, 16) : ''}
                  onChange={handleEditFormChange}
                />
              </div>

              <div className="form-group">
                <label className="field-label">
                  <FontAwesomeIcon icon={faHourglassHalf} className="mr-2" />
                  Hạn đăng ký *
                </label>
                <input
                  type="datetime-local"
                  name="dateDeadline"
                  className="form-control"
                  value={editForm.dateDeadline ? editForm.dateDeadline.slice(0, 16) : ''}
                  onChange={handleEditFormChange}
                />
              </div>

              <div className="text-right">
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
                onClick={() => {
                  // TODO: integrate delete API
                  setShowDeleteConfirm(false);
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

    {showChannel && createPortal(
      <EventChannelDashboard 
        event={evt} 
        onClose={() => setShowChannel(false)} 
      />,
      document.body
    )}
    </>
  );
};

export default EventCard;
