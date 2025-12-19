import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import EventChannelSidebar from './EventChannelSidebar';
import EditHistoryModal from './EditHistoryModal';
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

const EventDetails = ({ event, user }) => {
  let eventImages = event.images || event.imageUrls || (event.imageUrl ? [event.imageUrl] : []);

  // Fallback to sample images if no images are provided
  if (!eventImages || eventImages.length === 0) {
    eventImages = [
      '/sample-images/1.webp',
      '/sample-images/2.webp',
      '/sample-images/3.jpg'
    ];
  }

  // Permission logic
  const isOwner = user && (
    (event.username && user.username === event.username) ||
    (event.owner && user.username === event.owner)
  );
  const isAdmin = user && (user.role === 'Quản trị viên' || user.role === 'ADMIN');
  const isManager = user && (user.role === 'Quản lý sự kiện' || user.role === 'EVENT_MANAGER');

  const canEdit = isOwner || isAdmin;
  const canDelete = isOwner || isAdmin;

  // Logic for Register/Interested (similar to EventCard)
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

  const [interested, setInterested] = useState(() => readInterested().has(event.id));
  const [registered, setRegistered] = useState(() => readRegistered().has(event.id));
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

  const handleSaveChanges = () => {
    try {
      const mockEvents = JSON.parse(localStorage.getItem('mockEvents') || '[]');
      const index = mockEvents.findIndex(e => e.id === event.id);
      if (index !== -1) {
        const updatedEvent = {
          ...mockEvents[index],
          ...editForm
        };
        mockEvents[index] = updatedEvent;
        localStorage.setItem('mockEvents', JSON.stringify(mockEvents));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      console.error("Failed to update local event", e);
    }
    setShowEditForm(false);
  };

  const toggleInterested = () => {
    const s = readInterested();
    if (s.has(event.id)) {
      s.delete(event.id);
      setInterested(false);
    } else {
      s.add(event.id);
      setInterested(true);
    }
    writeInterested(s);
  };

  const handleRegister = () => {
    if (registered) {
      setShowConfirm(true);
    } else {
      const s = readRegistered();
      s.add(event.id);
      writeRegistered(s);
      setRegistered(true);
    }
  };

  const confirmUnregister = () => {
    const s = readRegistered();
    s.delete(event.id);
    writeRegistered(s);
    setRegistered(false);
    setShowConfirm(false);
  };

  return (
    <div className='p-4 bg-white rounded shadow-sm position-relative'>
      <ImageCarousel images={eventImages} />
      
      <div className='mb-4'>
        <div className='d-flex justify-content-between align-items-start mb-2'>
          <h4 className='mb-0'>{event.name}</h4>
          <span className={statusClass(event.status)}>{event.status}</span>
        </div>
        
        {/* Action Buttons */}
        <div className="d-flex mt-3 justify-content-between align-items-center">
            <div>
                <button
                  type="button"
                  className={`btn btn-sm mr-2 ${registered ? 'btn-outline-danger' : 'btn-primary'}`}
                  onClick={handleRegister}
                >
                  {registered ? 'Hủy đăng ký' : 'Đăng ký tham gia'}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${interested ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={toggleInterested}
                >
                  <FontAwesomeIcon
                    icon={interested ? faHeartSolid : faHeartRegular}
                    className="mr-1"
                  />
                  {interested ? 'Đang quan tâm' : 'Quan tâm'}
                </button>
            </div>
            <div>
                {canEdit && (
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
                        onClick={() => {
                            if(window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) {
                                alert('Đã xóa sự kiện (Demo)');
                            }
                        }}
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
            <strong>Tạo bởi:</strong> {event.username || event.ownerId}
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
          <div className='p-3 bg-light rounded ml-3'>
            <div className='h5 mb-0 text-danger'>{event.interestedCount || 0}</div>
            <small className='text-muted'>Đã quan tâm</small>
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

const MembersList = () => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const members = [
    { id: 1, name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', username: 'nguyenvana', role: 'Quản trị viên', status: 'Active', joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() },
    { id: 2, name: 'Trần Thị B', email: 'tranthib@example.com', username: 'tranthib', role: 'Quản lý sự kiện', status: 'Active', joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString() },
    { id: 3, name: 'Lê Văn C', email: 'levanc@example.com', username: 'levanc', role: 'Tình nguyện viên', status: 'Pending', joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() },
    { id: 4, name: 'Phạm Thị D', email: 'phamthid@example.com', username: 'phamthid', role: 'Tình nguyện viên', status: 'Active', joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
    { id: 5, name: 'Hoàng Văn E', email: 'hoangvane@example.com', username: 'hoangvane', role: 'Quản lý sự kiện', status: 'Pending', joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
  ];

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchText.toLowerCase()) ||
                          member.email.toLowerCase().includes(searchText.toLowerCase()) ||
                          member.username.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter ? member.status === statusFilter : true;
    const matchesRole = roleFilter ? member.role === roleFilter : true;
    return matchesSearch && matchesStatus && matchesRole;
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

  return (
    <div className='p-4'>
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <h5 className='font-weight-bold'>Danh sách tình nguyện viên ({filteredMembers.length})</h5>
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
                <option value='Active'>Đã duyệt</option>
                <option value='Pending'>Chờ duyệt</option>
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
                <option value='Quản lý sự kiện'>Quản lý sự kiện</option>
                <option value='Tình nguyện viên'>Tình nguyện viên</option>
              </select>
            </div>
        </div>

        <div className="table-responsive">
            <table className="table table-borderless table-hover">
                <thead className="thead-light">
                    <tr>
                        <th className="text-secondary text-left" scope="col" style={{ width: '120px' }}>
                            <button
                                className='btn btn-sm btn-outline-primary'
                                onClick={toggleSelectAll}
                            >
                                {selectedIds.size > 0 ? 'Bỏ chọn' : 'Chọn tất cả'}
                            </button>
                        </th>
                        <th className="text-secondary text-left" scope="col">#</th>
                        <th className="text-secondary" scope="col">Họ và tên</th>
                        <th className="text-secondary" scope="col">Email</th>
                        <th className="text-secondary" scope="col">Tên đăng nhập</th>
                        <th className="text-secondary" scope="col">Trạng thái</th>
                        <th className="text-secondary" scope="col">Vai trò</th>
                        <th className="text-secondary text-center" scope="col">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredMembers.map((member, index) => (
                        <tr key={member.id}>
                            <td>
                                <input
                                    type='checkbox'
                                    checked={selectedIds.has(member.id)}
                                    onChange={() => toggleSelect(member.id)}
                                    style={{ width: '20px', height: '20px' }}
                                />
                            </td>
                            <td>{index + 1}</td>
                            <td>
                                <div className="d-flex align-items-center">
                                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mr-2" style={{ width: '30px', height: '30px' }}>
                                        <FontAwesomeIcon icon={faUser} className="text-secondary small" />
                                    </div>
                                    <span className="font-weight-bold">{member.name}</span>
                                </div>
                            </td>
                            <td>{member.email}</td>
                            <td>{member.username}</td>
                            <td>
                                <span className={`badge ${member.status === 'Active' ? 'badge-success' : 'badge-warning'} p-2`}>
                                    {member.status === 'Active' ? 'Đã duyệt' : 'Chờ duyệt'}
                                </span>
                            </td>
                            <td>{member.role}</td>
                            <td className="text-center">
                                {member.status === 'Pending' ? (
                                    <>
                                        <button className="btn btn-sm btn-outline-success mr-2">
                                            <FontAwesomeIcon icon={faCheck} className="mr-1" />
                                            Duyệt
                                        </button>
                                        <button className="btn btn-sm btn-outline-danger">
                                            <FontAwesomeIcon icon={faTimes} className="mr-1" />
                                            Từ chối
                                        </button>
                                    </>
                                ) : (
                                    <button className="btn btn-sm btn-outline-danger">
                                        <FontAwesomeIcon icon={faTrashAlt} className="mr-1" />
                                        Hủy đăng ký
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
      {selectedIds.size > 0 &&
        ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#fff',
              boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
              padding: '15px 30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10000,
              borderTop: '1px solid #dee2e6',
            }}
          >
            <div className='d-flex align-items-center'>
              <span className='mr-3'>
                <strong>{selectedIds.size}</strong> tình nguyện viên đã chọn
              </span>
            </div>
            <div className='d-flex gap-2'>
              <button 
                className='btn btn-success btn-sm mr-2'
                onClick={() => setSelectedIds(new Set())}
              >
                <FontAwesomeIcon icon={faCheck} className="mr-1" /> Duyệt
              </button>
              <button 
                className='btn btn-warning btn-sm mr-2'
                onClick={() => setSelectedIds(new Set())}
              >
                <FontAwesomeIcon icon={faTimes} className="mr-1" /> Từ chối
              </button>
              <button 
                className='btn btn-danger btn-sm'
                onClick={() => setSelectedIds(new Set())}
              >
                <FontAwesomeIcon icon={faTrashAlt} className="mr-1" /> Hủy đăng ký
              </button>
            </div>
          </div>,
          document.body
        )}
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

  const [posts, setPosts] = useState(() => {
    try {
      const allPosts = JSON.parse(localStorage.getItem('forum_posts') || '{}');
      if (allPosts[event.id]) {
        return allPosts[event.id];
      }
      // Default sample posts
      return [
        {
          id: 1,
          user: 'Nguyễn Văn A',
          username: 'nguyenvana',
          role: 'Quản trị viên',
          time: '2 giờ trước',
          content: 'Chào mọi người! Ngày mai chúng ta sẽ tập trung tại sảnh chính lúc 7:00 sáng nhé. Mọi người nhớ mặc áo đồng phục.',
          likes: 12,
          comments: 3,
          shares: 0,
          liked: true,
          isPinned: true,
          isJoined: true,
          editHistory: [
              { content: 'Chào mọi người! Ngày mai tập trung lúc 7h nhé.', time: '2 giờ trước' }
          ]
        },
        {
          id: 2,
          user: 'Trần Thị B',
          username: 'tranthib',
          role: 'Tình nguyện viên',
          time: '5 giờ trước',
          content: 'Mình có thể đến muộn khoảng 15 phút được không ạ? Xe bus chuyến sớm nhất 6:30 mới chạy.',
          likes: 2,
          comments: 5,
          shares: 0,
          liked: false,
          isPinned: false,
          isJoined: false,
          editHistory: []
        }
      ];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      const allPosts = JSON.parse(localStorage.getItem('forum_posts') || '{}');
      allPosts[event.id] = posts;
      localStorage.setItem('forum_posts', JSON.stringify(allPosts));
    } catch (e) {
      console.error("Failed to save posts", e);
    }
  }, [posts, event.id]);

  const [newPostContent, setNewPostContent] = useState('');

  const handlePost = () => {
    if (!newPostContent.trim()) return;
    const newPost = {
      id: Date.now(),
      user: user ? (user.name || user.username) : 'Khách',
      username: user ? user.username : 'guest',
      role: user ? (user.role || 'Thành viên') : 'Thành viên',
      time: 'Vừa xong',
      content: newPostContent,
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false,
      commentsList: [],
      isPinned: false,
      isJoined: true,
      editHistory: []
    };
    setPosts([newPost, ...posts]);
    setNewPostContent('');
  };

  const handleDeletePost = (postId) => {
      if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
          setPosts(posts.filter(p => p.id !== postId));
      }
      setActiveMenuPostId(null);
  };

  const handleEditPost = (post) => {
      setEditingPostId(post.id);
      setEditContent(post.content);
      setActiveMenuPostId(null);
  };

  const handleSaveEdit = (postId) => {
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
  };

   const handleCancelEdit = () => {
      setEditingPostId(null);
      setEditContent('');
  };

  const handlePinPost = (postId) => {
      setPosts(posts.map(p => {
          if (p.id === postId) {
              return { ...p, isPinned: !p.isPinned };
          }
          return p;
      }));
      setActiveMenuPostId(null);
  };

  const sortedPosts = [...posts].sort((a, b) => {
      if (a.isPinned === b.isPinned) return 0;
      return a.isPinned ? -1 : 1;
  });

  const handleLike = (postId) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  const handleShare = (postId) => {
    const link = `${window.location.origin}/event/${event.id}/post/${postId}`;
    navigator.clipboard.writeText(link).then(() => {
        alert('Đã sao chép liên kết bài viết: ' + link);
    });

    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          shares: post.shares + 1
        };
      }
      return post;
    }));
  };

  const handleComment = (postId, commentContent) => {
      if (!commentContent.trim()) return;
      
      setPosts(posts.map(post => {
          if (post.id === postId) {
              // Check if replying to a comment
              if (replyingTo && replyingTo.postId === postId) {
                  const newReply = {
                      id: Date.now(),
                      user: 'Tôi',
                      content: commentContent,
                      time: 'Vừa xong',
                      liked: false,
                      likes: 0
                  };
                  
                  return {
                      ...post,
                      comments: post.comments + 1,
                      commentsList: post.commentsList.map(comment => {
                          if (comment.id === replyingTo.commentId) {
                              return {
                                  ...comment,
                                  replies: [...(comment.replies || []), newReply]
                              };
                          }
                          // Check if replying to a reply (nested reply) - treat as reply to parent comment
                          if (comment.replies && comment.replies.some(r => r.id === replyingTo.commentId)) {
                              return {
                                  ...comment,
                                  replies: [...comment.replies, newReply]
                              };
                          }
                          return comment;
                      })
                  };
              }

              return {
                  ...post,
                  comments: post.comments + 1,
                  commentsList: [
                      ...(post.commentsList || []),
                      {
                          id: Date.now(),
                          user: 'Tôi',
                          content: commentContent,
                          time: 'Vừa xong',
                          liked: false,
                          likes: 0,
                          replies: []
                      }
                  ]
              };
          }
          return post;
      }));
      setReplyingTo(null);
      
      // Reset placeholder
      const input = document.getElementById(`comment-box-${postId}`);
      if (input) input.placeholder = "Viết bình luận...";
  };

  const handleCommentLike = (postId, commentId, isReply = false, parentCommentId = null) => {
      setPosts(posts.map(post => {
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
      }));
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
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handlePost()}
          />
        </div>
        <div className="border-top pt-2 d-flex justify-content-between align-items-center">
            <button className="btn btn-light btn-sm text-secondary font-weight-bold">
                <FontAwesomeIcon icon={faImage} className="text-success mr-2" />
                Ảnh/Video
            </button>
            <button 
                className="btn btn-primary btn-sm px-4 rounded-pill"
                onClick={handlePost}
                disabled={!newPostContent.trim()}
            >
                Đăng
            </button>
        </div>
      </div>

      {/* Posts Feed */}
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
                                {(user && (user.role === 'Quản trị viên' || user.role === 'Quản lý sự kiện' || user.role === 'ADMIN' || user.role === 'EVENT_MANAGER')) && (
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
                                {(user && (user.username === post.username)) && (
                                    <button 
                                        className="dropdown-item small" 
                                        onClick={() => handleEditPost(post)}
                                    >
                                        <FontAwesomeIcon icon={faEdit} className="mr-2" /> Sửa bài viết
                                    </button>
                                )}
                                {(user && (user.username === post.username || getRoleLevel(user.role) > getRoleLevel(post.role))) && (
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
                        post.content
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
                {post.commentsList && post.commentsList.map(comment => (
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
      {/* Edit History Modal */}
      <EditHistoryModal 
          isOpen={!!viewingHistoryPostId}
          onClose={() => setViewingHistoryPostId(null)}
          history={posts.find(p => p.id === viewingHistoryPostId)?.editHistory || []}
      />
    </div>
  );
};

const EventChannelDashboard = ({ event, onClose }) => {
  const { user: authUser } = useAuth();
  // Ensure user has a role for testing purposes (Default to 'Quản trị viên' if missing)
  const user = authUser ? { ...authUser, role: authUser.role || 'Quản trị viên' } : null;
  
  const [activeTab, setActiveTab] = useState('details');
  const [followItems, setFollowItems] = useState([]);
  const [isCreatingFollow, setIsCreatingFollow] = useState(false);
  const [followText, setFollowText] = useState('');
  const [editingFollowId, setEditingFollowId] = useState(null);
  const [editFollowContent, setEditFollowContent] = useState('');

  const handleAddFollowItem = () => {
    if (followText.trim()) {
      setFollowItems([{ 
        id: Date.now(), 
        content: followText, 
        time: new Date().toLocaleString('vi-VN'),
        user: user ? (user.name || user.username) : 'Admin',
        username: user ? user.username : 'admin',
        role: user ? (user.role || 'Quản trị viên') : 'Quản trị viên'
      }, ...followItems]);
      setFollowText('');
      setIsCreatingFollow(false);
    }
  };

  const handleDeleteFollowItem = (id) => {
      if (window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
          setFollowItems(followItems.filter(item => item.id !== id));
      }
  };

  const handleEditFollowItem = (item) => {
      setEditingFollowId(item.id);
      setEditFollowContent(item.content);
  };

  const handleSaveEditFollowItem = (id) => {
      setFollowItems(followItems.map(item => {
          if (item.id === id) {
              return { ...item, content: editFollowContent };
          }
          return item;
      }));
      setEditingFollowId(null);
      setEditFollowContent('');
  };

  const handleCancelEditFollowItem = () => {
      setEditingFollowId(null);
      setEditFollowContent('');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'details':
        return <EventDetails event={event} user={user} />;
      case 'discussion':
        return <DiscussionTab event={event} user={user} />;
      case 'members':
        return <MembersList />;
      case 'notifications':
        return (
          <div className='p-4 bg-white rounded shadow-sm'>
            <div className='mb-4'>
                <div className="d-flex justify-content-between align-items-center">
                    <h6 className='text-muted mb-0'>
                        <FontAwesomeIcon icon={faBell} className="mr-2" />
                        Bảng tin theo dõi
                    </h6>
                    {(user && getRoleLevel(user.role) >= 2) && (
                        <button 
                            className={`btn btn-sm ${isCreatingFollow ? 'btn-outline-danger' : 'btn-outline-primary'}`}
                            onClick={() => setIsCreatingFollow(!isCreatingFollow)}
                        >
                            {isCreatingFollow ? 'Hủy' : 'Tạo thông báo'}
                        </button>
                    )}
                </div>
            </div>

            {isCreatingFollow && (
                <div className="mb-4 p-3 bg-light rounded">
                    <h6 className="text-muted mb-2 small font-weight-bold">Tạo thông báo mới</h6>
                    <div className="form-group mb-3">
                        <textarea 
                            className="form-control border-0 shadow-sm" 
                            rows="3"
                            placeholder="Nhập nội dung..." 
                            value={followText}
                            onChange={(e) => setFollowText(e.target.value)}
                            autoFocus
                            style={{ resize: 'none' }}
                        />
                    </div>
                    <div className="d-flex justify-content-end">
                        <button 
                            className="btn btn-sm btn-primary px-3" 
                            onClick={handleAddFollowItem}
                            disabled={!followText.trim()}
                        >
                            Đăng
                        </button>
                    </div>
                </div>
            )}

            {followItems.length === 0 ? (
                <div className="text-center text-muted py-5">
                    <FontAwesomeIcon icon={faBell} size="2x" className="mb-3 text-secondary" style={{ opacity: 0.3 }} />
                    <p className="mb-0">Chưa có thông báo nào</p>
                </div>
            ) : (
                <div>
                    {followItems.map((item, index) => (
                        <div key={item.id} className={`mb-3 pb-3 ${index !== followItems.length - 1 ? 'border-bottom' : ''}`}>
                            <div className="d-flex align-items-center mb-2 justify-content-between">
                                <div className="d-flex align-items-center">
                                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mr-2" style={{ width: '36px', height: '36px' }}>
                                        <FontAwesomeIcon icon={faUser} className="text-secondary" />
                                    </div>
                                    <div>
                                        <div className="font-weight-bold small">
                                            {item.user} <span className="text-muted font-weight-normal">(@{item.username})</span>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            <span className={`badge ${getRoleBadgeClass(item.role)} mr-2`} style={{fontSize: '0.7rem'}}>{item.role}</span>
                                            <small className="text-muted">{item.time}</small>
                                        </div>
                                    </div>
                                </div>
                                {(user && getRoleLevel(user.role) >= 2) && (
                                    <div>
                                        <button 
                                            className="btn btn-link text-secondary p-0 mr-2"
                                            onClick={() => handleEditFollowItem(item)}
                                            title="Sửa"
                                        >
                                            <FontAwesomeIcon icon={faEdit} size="sm" />
                                        </button>
                                        <button 
                                            className="btn btn-link text-danger p-0"
                                            onClick={() => handleDeleteFollowItem(item.id)}
                                            title="Xóa"
                                        >
                                            <FontAwesomeIcon icon={faTrashAlt} size="sm" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            {editingFollowId === item.id ? (
                                <div className="mt-2">
                                    <textarea 
                                        className="form-control mb-2" 
                                        value={editFollowContent}
                                        onChange={(e) => setEditFollowContent(e.target.value)}
                                        rows="3"
                                    />
                                    <div className="d-flex justify-content-end">
                                        <button className="btn btn-sm btn-secondary mr-2" onClick={handleCancelEditFollowItem}>Hủy</button>
                                        <button className="btn btn-sm btn-primary" onClick={() => handleSaveEditFollowItem(item.id)}>Lưu</button>
                                    </div>
                                </div>
                            ) : (
                                <p className="mb-0 text-dark mt-2 pl-1" style={{ whiteSpace: 'pre-wrap' }}>
                                    {item.content}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
          </div>
        );
      case 'schedule':
        return (
          <div className='p-4'>
            <h6>Lịch trình</h6>
            <p className='text-muted'>Lịch trình sẽ được thêm ở đây.</p>
          </div>
        );
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
          <EventChannelSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        <div className='event-channel-content'>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default EventChannelDashboard;
