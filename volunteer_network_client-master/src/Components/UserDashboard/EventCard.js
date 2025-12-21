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
import { apiRequest, API_ENDPOINTS } from '../../config/api';

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

// --- Date helpers copied/adjusted from CreateEventForm ---
const parseToTimestamp = (val) => {
  if (!val) return NaN;
  const s = String(val).trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (!m) return NaN;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;
  const year = parseInt(m[3], 10);
  const hour = parseInt(m[4] || '0', 10);
  const minute = parseInt(m[5] || '0', 10);
  const d = new Date(year, month, day, hour, minute, 0, 0);
  return d.getTime();
};

const toIso = (val) => {
  const ts = parseToTimestamp(val);
  if (isNaN(ts)) return null;
  return new Date(ts).toISOString();
};

const formatFromDatetimeLocal = (dtLocal) => {
  if (!dtLocal) return '';
  const m = String(dtLocal).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return '';
  const y = m[1], mo = m[2], d = m[3], h = m[4], mi = m[5];
  return `${d}/${mo}/${y} ${h}:${mi}`;
};

const formatDateInput = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 12); // ddmmyyyyhhmm
  const parts = [];
  if (digits.length <= 2) return digits;
  parts.push(digits.slice(0, 2));
  if (digits.length <= 4) return `${parts[0]}/${digits.slice(2)}`;
  parts.push(digits.slice(2, 4));
  if (digits.length <= 8) return `${parts[0]}/${parts[1]}/${digits.slice(4)}`;
  parts.push(digits.slice(4, 8));
  if (digits.length <= 10) return `${parts[0]}/${parts[1]}/${parts[2]} ${digits.slice(8)}`;
  return `${parts[0]}/${parts[1]}/${parts[2]} ${digits.slice(8,10)}:${digits.slice(10,12)}`;
};

const isoToDisplay = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const restrictDateInput = (e) => {
  if (e.ctrlKey || e.metaKey) return;
  const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];
  if (allowedKeys.includes(e.key)) return;
  if (/^[0-9]$/.test(e.key)) return;
  e.preventDefault();
};

const openPicker = (ref) => {
  if (!ref || !ref.current) return;
  const el = ref.current;
  try {
    if (typeof el.showPicker === 'function') {
      el.showPicker();
      return;
    }
  } catch (e) {}
  const prev = { display: el.style.display, position: el.style.position, left: el.style.left, width: el.style.width, height: el.style.height, opacity: el.style.opacity };
  el.style.display = 'block';
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  el.style.width = '1px';
  el.style.height = '1px';
  el.style.opacity = '0';
  el.focus();
  el.click();
  setTimeout(() => {
    el.style.display = prev.display || 'none';
    el.style.position = prev.position || '';
    el.style.left = prev.left || '';
    el.style.width = prev.width || '';
    el.style.height = prev.height || '';
    el.style.opacity = prev.opacity || '';
  }, 800);
};
// --- end helpers ---

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
  const deadlinePickerRefEdit = useRef(null);
  const startPickerRefEdit = useRef(null);
  const endPickerRefEdit = useRef(null);

  const [editForm, setEditForm] = useState({
    name: evt.name || '',
    description: evt.description || '',
    location: evt.location || '',
    dateDeadline: isoToDisplay(evt.dateDeadline || evt.dateDeadline),
    startDate: isoToDisplay(evt.startDate || evt.startDate),
    endDate: isoToDisplay(evt.endDate || evt.endDate),
    images: evt.images || (evt.image || evt.imageUrl ? [evt.image || evt.imageUrl] : []),
  });

  // Keep edit form in sync with evt (reset when evt changes)
  useEffect(() => {
    setEditForm({
      name: evt.name || '',
      description: evt.description || '',
      location: evt.location || '',
      dateDeadline: isoToDisplay(evt.dateDeadline || evt.dateDeadline),
      startDate: isoToDisplay(evt.startDate || evt.startDate),
      endDate: isoToDisplay(evt.endDate || evt.endDate),
      images: evt.images || (evt.image || evt.imageUrl ? [evt.image || evt.imageUrl] : []),
    });
  }, [evt]);

  const resetEditFormToEvt = () => {
    setEditForm({
      name: evt.name || '',
      description: evt.description || '',
      location: evt.location || '',
      dateDeadline: isoToDisplay(evt.dateDeadline || evt.dateDeadline),
      startDate: isoToDisplay(evt.startDate || evt.startDate),
      endDate: isoToDisplay(evt.endDate || evt.endDate),
      images: evt.images || (evt.image || evt.imageUrl ? [evt.image || evt.imageUrl] : []),
    });
    setEditError(null);
  };

  const [creatorName, setCreatorName] = useState(null);
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    const fetchCreatorName = async () => {
      if (evt.ownerId) {
        try {
          const data = await apiRequest(API_ENDPOINTS.USERS.GET(evt.ownerId));
          setCreatorName(`${data.firstname} ${data.lastname}`);
        } catch (error) {
          console.error('Error fetching creator name:', error);
        }
      }
    };

    fetchCreatorName();
  }, [evt.ownerId]);

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
      editForm.dateDeadline !== (isoToDisplay(evt.dateDeadline || evt.dateDeadline) || '') ||
      editForm.startDate !== (isoToDisplay(evt.startDate || evt.startDate) || '') ||
      editForm.endDate !== (isoToDisplay(evt.endDate || evt.endDate) || '') ||
      JSON.stringify(editForm.images) !== JSON.stringify(evt.images || (evt.image ? [evt.image] : []))
    );
  };

  const handlePickerChangeEdit = (pickerName, value) => {
    const formatted = formatFromDatetimeLocal(value);
    setEditForm((prev) => ({ ...prev, [pickerName]: formatted }));
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    const input = e.target;

    if (name === 'dateDeadline' || name === 'startDate' || name === 'endDate') {
      const cursorPos = input.selectionStart;
      const digits = value.replace(/\D/g, '').slice(0, 12);
      const formatted = formatDateInput(digits);

      let digitCountBeforeCursor = 0;
      for (let i = 0; i < cursorPos; i++) {
        if (/\d/.test(value[i])) digitCountBeforeCursor++;
      }

      let newCursorPos = 0;
      let digitsPlaced = 0;
      const len = formatted.length;
      for (let i = 0; i < len; i++) {
        if (/\d/.test(formatted[i])) {
          digitsPlaced++;
          if (digitsPlaced > digitCountBeforeCursor) break;
        }
        newCursorPos = i + 1;
      }

      setEditForm((prev) => ({ ...prev, [name]: formatted }));

      setTimeout(() => {
        input.focus();
        input.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePasteDateEdit = (e, name) => {
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const formatted = formatDateInput(pasted);
    setEditForm(prev => ({ ...prev, [name]: formatted }));
    e.preventDefault();
  };

  const handleEditClose = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedConfirm(true);
    } else {
      resetEditFormToEvt();
      setShowEditForm(false);
    }
  };

  const validateEdit = () => {
    if (!editForm.name || !editForm.dateDeadline || !editForm.startDate || !editForm.endDate) {
      return 'Vui lòng nhập đầy đủ các trường bắt buộc.';
    }

    const dd = parseToTimestamp(editForm.dateDeadline);
    const sd = parseToTimestamp(editForm.startDate);
    const ed = parseToTimestamp(editForm.endDate);
    const now = Date.now();

    if (isNaN(dd) || isNaN(sd) || isNaN(ed)) {
      return 'Định dạng ngày/giờ không hợp lệ.';
    }

    if (dd <= now) {
      return 'Hạn đăng ký phải lớn hơn thời gian hiện tại.';
    }

    if (sd > ed) {
      return 'Thời gian bắt đầu phải trước hoặc bằng thời gian kết thúc.';
    }

    if (dd > sd) {
      return 'Hạn đăng ký phải trước hoặc bằng thời gian bắt đầu.';
    }

    return null;
  };

  const handleSaveChanges = async () => {
    const v = validateEdit();
    if (v) {
      setEditError(v);
      return;
    }
    setEditError(null);

    try {
      await import('../../services/apiService').then(({ eventService }) =>
        eventService.updateEvent(evt.id, {
          name: editForm.name,
          description: editForm.description,
          location: editForm.location,
          dateDeadline: toIso(editForm.dateDeadline),
          startDate: toIso(editForm.startDate),
          endDate: toIso(editForm.endDate),
        })
      );
      setShowEditForm(false);
      window.location.reload();
    } catch (e) {
      setEditError('Không thể cập nhật sự kiện: ' + (e.message || e));
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
                  resetEditFormToEvt();
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
              <strong>Tạo bởi:</strong> {creatorName || evt.username || evt.owner || evt.ownerId}
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
                resetEditFormToEvt();
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
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1" onClick={handleEditClose}>
          <div className="modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Sửa sự kiện</h5>
                <button type="button" className="btn-close" onClick={handleEditClose}></button>
              </div>
              <div className="modal-body">
                {editError && <div className="alert alert-danger">{editError}</div>}
                <div className="card mb-0" style={{ boxShadow: 'none', transform: 'none' }}>
                  <div className="card-body">
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

                      <div className="form-row">
                        <div className="form-group col-md-4">
                          <label className="field-label deadline-line">
                            <FontAwesomeIcon icon={faHourglassHalf} className="mr-1 deadline-icon" />
                            Hạn đăng ký *
                          </label>
                          <div className="input-group">
                            <input
                              type="text"
                              name="dateDeadline"
                              className="form-control"
                              placeholder="dd/mm/yyyy hh:mm"
                              value={editForm.dateDeadline}
                              onChange={handleEditFormChange}
                              onKeyDown={restrictDateInput}
                              onPaste={(e) => handlePasteDateEdit(e, 'dateDeadline')}
                              required
                            />
                            <div className="input-group-append">
                              <button type="button" className="btn btn-outline-secondary" onClick={() => openPicker(deadlinePickerRefEdit)}>
                                📅
                              </button>
                            </div>
                            <input
                              type="datetime-local"
                              ref={deadlinePickerRefEdit}
                              className="datetime-overlay"
                              onChange={(e) => handlePickerChangeEdit('dateDeadline', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="form-group col-md-4">
                          <label className="field-label start-line">
                            <FontAwesomeIcon icon={faPlay} className="mr-1 start-icon" />
                            Bắt đầu *
                          </label>
                          <div className="input-group">
                            <input
                              type="text"
                              name="startDate"
                              className="form-control"
                              placeholder="dd/mm/yyyy hh:mm"
                              value={editForm.startDate}
                              onChange={handleEditFormChange}
                              onKeyDown={restrictDateInput}
                              onPaste={(e) => handlePasteDateEdit(e, 'startDate')}
                              required
                            />
                            <div className="input-group-append">
                              <button type="button" className="btn btn-outline-secondary" onClick={() => openPicker(startPickerRefEdit)}>
                                📅
                              </button>
                            </div>
                            <input
                              type="datetime-local"
                              ref={startPickerRefEdit}
                              className="datetime-overlay"
                              onChange={(e) => handlePickerChangeEdit('startDate', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="form-group col-md-4">
                          <label className="field-label end-line">
                            <FontAwesomeIcon icon={faStop} className="mr-1 end-icon" />
                            Kết thúc *
                          </label>
                          <div className="input-group">
                            <input
                              type="text"
                              name="endDate"
                              className="form-control"
                              placeholder="dd/mm/yyyy hh:mm"
                              value={editForm.endDate}
                              onChange={handleEditFormChange}
                              onKeyDown={restrictDateInput}
                              onPaste={(e) => handlePasteDateEdit(e, 'endDate')}
                              required
                            />
                            <div className="input-group-append">
                              <button type="button" className="btn btn-outline-secondary" onClick={() => openPicker(endPickerRefEdit)}>
                                📅
                              </button>
                            </div>
                            <input
                              type="datetime-local"
                              ref={endPickerRefEdit}
                              className="datetime-overlay"
                              onChange={(e) => handlePickerChangeEdit('endDate', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleEditClose}>
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
            </div>
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
