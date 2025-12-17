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
  faThumbsUp,
  faCommentDots,
  faPaperPlane,
  faShareAlt,
} from '@fortawesome/free-solid-svg-icons';
import { createPortal } from 'react-dom';

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

const formatRelative = (ts) => {
  try {
    if (!ts) return 'Vừa xong';
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 60) return 'Vừa xong';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} giờ trước`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay} ngày trước`;
    const diffMonth = Math.floor(diffDay / 30);
    if (diffMonth < 12) return `${diffMonth} tháng trước`;
    const diffYear = Math.floor(diffMonth / 12);
    return `${diffYear} năm trước`;
  } catch {
    return 'Vừa xong';
  }
};

const EventCard = ({ evt }) => {
  const sampleWall = {
    __default__: [
      {
        id: 'p1',
        author: 'Admin',
        content: 'Chào mừng bạn đến với sự kiện! Hãy chia sẻ thắc mắc hoặc xác nhận tham gia tại đây.',
        likes: 8,
        shares: 2,
        createdAt: Date.now() - 1000 * 60 * 5,
        comments: [
          { 
            id: 'c1', 
            author: 'Lan', 
            text: 'Rất mong chờ sự kiện này!', 
            createdAt: Date.now() - 1000 * 60 * 3, 
            likes: 2, 
            shares: 0,
            replies: [
              { id: 'c1-1', author: 'Admin', text: 'Cảm ơn Lan đã quan tâm!', createdAt: Date.now() - 1000 * 60 * 2, likes: 1, shares: 0, replies: [] },
            ],
          },
          { 
            id: 'c2', 
            author: 'Minh', 
            text: 'Cho mình hỏi về giờ tập trung?', 
            createdAt: Date.now() - 1000 * 60 * 2, 
            likes: 1, 
            shares: 0,
            replies: [],
          },
        ],
      },
      {
        id: 'p2',
        author: 'Tuấn',
        content: 'Mình có thể mang thêm dụng cụ dọn rác nếu cần.',
        likes: 3,
        shares: 1,
        createdAt: Date.now() - 1000 * 60 * 20,
        comments: [
          { id: 'c3', author: 'Admin', text: 'Cảm ơn Tuấn, mang găng tay và túi rác giúp nhé!', createdAt: Date.now() - 1000 * 60 * 15, likes: 3, shares: 0, replies: [] },
        ],
      },
    ],
  };

  const initialWall = sampleWall[evt.id] || sampleWall.__default__;

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

  const readWallPosts = (eventId) => {
    try {
      const raw = localStorage.getItem(`wall_${eventId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const writeWallPosts = (eventId, posts) => {
    try {
      localStorage.setItem(`wall_${eventId}`, JSON.stringify(posts));
    } catch {}
  };

  const [interested, setInterested] = useState(() => readInterested().has(evt.id));
  const [registered, setRegistered] = useState(() => readRegistered().has(evt.id));
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
  });
  const [showWall, setShowWall] = useState(false);
  const [activeTab, setActiveTab] = useState('discussion');
  const [wallPosts, setWallPosts] = useState(() => {
    const saved = readWallPosts(evt.id);
    return saved || initialWall.map((p) => ({ ...p, comments: [...p.comments] }));
  });
  const [newPost, setNewPost] = useState('');
  const [commentInputs, setCommentInputs] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [showReplyFor, setShowReplyFor] = useState(null);
  const commentRefs = useRef({});

  const sampleMembers = [
    { id: '1', name: 'Admin', role: 'Quản trị viên', joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 30 },
    { id: '2', name: 'Lan', role: 'Thành viên', joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 10 },
    { id: '3', name: 'Minh', role: 'Thành viên', joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 5 },
    { id: '4', name: 'Tuấn', role: 'Tình nguyện viên', joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 2 },
  ];

  const sampleNotifications = [
    { id: '1', text: 'Sự kiện sẽ bắt đầu sau 2 ngày', createdAt: Date.now() - 1000 * 60 * 60 * 3 },
    { id: '2', text: 'Có 5 thành viên mới tham gia sự kiện', createdAt: Date.now() - 1000 * 60 * 60 * 12 },
    { id: '3', text: 'Địa điểm tập trung đã được cập nhật', createdAt: Date.now() - 1000 * 60 * 60 * 24 },
  ];

  const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.username || user.name || 'Bạn';
      }
    } catch {}
    return 'Bạn';
  };
  const currentUsername = getCurrentUser();

  const safeDate = (value) => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
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

  return (
    <div className="card h-100 event-card" onClick={() => setShowWall(true)}>
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-end align-items-center mb-2">
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
                if (showWall) return;
                // prevent card click
                if (registerDisabled || cancelDisabled) return;
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

      {showWall && createPortal(
        <div className="wall-overlay" onClick={() => setShowWall(false)}>
          <div className="wall-card" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3 wall-header">
              <div>
                <h5 className="mb-1 event-title">Kênh sự kiện</h5>
                <div className="small text-muted">{evt.name}</div>
              </div>
              <button className="btn btn-light btn-sm wall-close" onClick={() => setShowWall(false)}>Đóng</button>
            </div>

            <div className="wall-tabs mb-3">
              <button
                className={`wall-tab ${activeTab === 'discussion' ? 'active' : ''}`}
                onClick={() => setActiveTab('discussion')}
              >
                Thảo luận
              </button>
              <button
                className={`wall-tab ${activeTab === 'members' ? 'active' : ''}`}
                onClick={() => setActiveTab('members')}
              >
                Thành viên
              </button>
              <button
                className={`wall-tab ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                Thông báo
              </button>
            </div>

            {activeTab === 'discussion' && (
              <>
            <div className="wall-composer mb-3">
              <div className="composer-username mb-2">{currentUsername}</div>
              <textarea
                className="form-control mb-2"
                rows="3"
                placeholder="Chia sẻ cập nhật hoặc đặt câu hỏi..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
              />
              <div className="text-right">
                <button
                  className="btn btn-primary"
                  disabled={!newPost.trim()}
                  onClick={() => {
                    if (!newPost.trim()) return;
                    const nowTs = Date.now();
                    const newEntry = {
                      id: `p-${nowTs}`,
                      author: currentUsername,
                      content: newPost.trim(),
                      likes: 0,
                      shares: 0,
                      createdAt: nowTs,
                      comments: [],
                    };
                    const updatedPosts = [newEntry, ...wallPosts];
                    setWallPosts(updatedPosts);
                    writeWallPosts(evt.id, updatedPosts);
                    setNewPost('');
                  }}
                >
                  <FontAwesomeIcon icon={faPaperPlane} className="mr-1" />
                  Post bài
                </button>
              </div>
            </div>

            <div className="wall-feed">
              {wallPosts.map((p) => (
                <div className="wall-post" key={p.id}>
                  <div className="d-flex justify-content-between mb-2">
                    <div className="font-weight-bold">{p.author}</div>
                    <span className="text-muted small">{formatRelative(p.createdAt)}</span>
                  </div>
                  <div className="mb-2">{p.content}</div>
                  <div className="d-flex align-items-center wall-actions mb-2">
                    <button
                      className="btn btn-sm btn-light mr-2"
                      onClick={() => {
                        setWallPosts((prev) => prev.map((item) => item.id === p.id ? { ...item, likes: item.likes + 1 } : item));
                      }}
                    >
                      <FontAwesomeIcon icon={faThumbsUp} className="mr-1" />
                      Like ({p.likes})
                    </button>
                    <button
                      className="btn btn-sm btn-light mr-2"
                      onClick={() => {
                        const input = commentRefs.current[p.id];
                        if (input) input.focus();
                      }}
                    >
                      <FontAwesomeIcon icon={faCommentDots} className="mr-1" />
                      Comment ({p.comments.length})
                    </button>
                    <button
                      className="btn btn-sm btn-light"
                      onClick={async () => {
                        setWallPosts((prev) => prev.map((item) => item.id === p.id ? { ...item, shares: (item.shares || 0) + 1 } : item));
                        const shareText = `Tham gia sự kiện: ${evt.name}`;
                        try {
                          if (navigator.share) {
                            await navigator.share({ title: evt.name, text: shareText, url: window.location.href });
                          } else if (navigator.clipboard) {
                            await navigator.clipboard.writeText(shareText);
                          }
                        } catch {}
                      }}
                    >
                      <FontAwesomeIcon icon={faShareAlt} className="mr-1" />
                      Share ({p.shares || 0})
                    </button>
                  </div>

                  <div className="wall-comments mb-2">
                    {p.comments.map((c) => {
                      const renderComment = (comment, depth = 0) => (
                        <div className="wall-comment" key={comment.id} style={{ marginLeft: `${depth * 20}px` }}>
                          <div className="comment-header mb-1">
                            <strong className="comment-author">{comment.author}</strong>
                            <span className="text-muted small">{formatRelative(comment.createdAt)}</span>
                          </div>
                          <div className="mb-2">{comment.text}</div>
                          <div className="d-flex align-items-center comment-actions">
                            <button
                              className="btn btn-sm btn-link p-0 mr-3"
                              onClick={() => {
                                const updateCommentLikes = (comments) => comments.map((item) => 
                                  item.id === comment.id 
                                    ? { ...item, likes: (item.likes || 0) + 1 }
                                    : { ...item, replies: updateCommentLikes(item.replies || []) }
                                );
                                setWallPosts((prev) => prev.map((item) => item.id === p.id ? {
                                  ...item,
                                  comments: updateCommentLikes(item.comments),
                                } : item));
                              }}
                            >
                              Like ({comment.likes || 0})
                            </button>
                            <button
                              className="btn btn-sm btn-link p-0 mr-3"
                              onClick={() => setShowReplyFor(showReplyFor === comment.id ? null : comment.id)}
                            >
                              Reply
                            </button>
                            <button
                              className="btn btn-sm btn-link p-0"
                              onClick={async () => {
                                const updateCommentShares = (comments) => comments.map((item) => 
                                  item.id === comment.id 
                                    ? { ...item, shares: (item.shares || 0) + 1 }
                                    : { ...item, replies: updateCommentShares(item.replies || []) }
                                );
                                setWallPosts((prev) => prev.map((item) => item.id === p.id ? {
                                  ...item,
                                  comments: updateCommentShares(item.comments),
                                } : item));
                                try {
                                  if (navigator.clipboard) {
                                    await navigator.clipboard.writeText(comment.text);
                                  }
                                } catch {}
                              }}
                            >
                              Share ({comment.shares || 0})
                            </button>
                          </div>
                          {showReplyFor === comment.id && (
                            <div className="input-group input-group-sm mt-2 reply-input-wrapper">
                              <input
                                type="text"
                                className="form-control reply-input"
                                placeholder="Trả lời..."
                                value={replyInputs[comment.id] || ''}
                                onChange={(e) => {
                                  const val = e?.target?.value || '';
                                  if (comment?.id) setReplyInputs((prev) => ({ ...prev, [comment.id]: val }));
                                }}
                              />
                              <div className="input-group-append">
                                <button
                                  className="btn btn-primary reply-submit"
                                  onClick={() => {
                                    const text = (replyInputs[comment.id] || '').trim();
                                    if (!text) return;
                                    const newReply = { 
                                      id: `c-${Date.now()}`, 
                                      author: currentUsername, 
                                      text, 
                                      createdAt: Date.now(), 
                                      likes: 0, 
                                      shares: 0,
                                      replies: [],
                                    };
                                    const addReply = (comments) => comments.map((item) => 
                                      item.id === comment.id 
                                        ? { ...item, replies: [...(item.replies || []), newReply] }
                                        : { ...item, replies: addReply(item.replies || []) }
                                    );
                                    setWallPosts((prev) => prev.map((item) => item.id === p.id ? {
                                      ...item,
                                      comments: addReply(item.comments),
                                    } : item));
                                    setReplyInputs((prev) => ({ ...prev, [comment.id]: '' }));
                                    setShowReplyFor(null);
                                  }}
                                >
                                  Gửi
                                </button>
                              </div>
                            </div>
                          )}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="comment-replies">
                              {comment.replies.map((reply) => renderComment(reply, depth + 1))}
                            </div>
                          )}
                        </div>
                      );
                      return renderComment(c);
                    })}
                  </div>

                  <div className="input-group input-group-sm">
                    <input
                      type="text"
                      className="form-control comment-input"
                      placeholder="Viết bình luận..."
                      value={commentInputs[p.id] || ''}
                      ref={(el) => { if (el && p?.id) commentRefs.current[p.id] = el; }}
                      onChange={(e) => {
                        const val = e?.target?.value || '';
                        if (p?.id) setCommentInputs((prev) => ({ ...prev, [p.id]: val }));
                      }}
                    />
                    <div className="input-group-append">
                      <button
                        className="btn btn-primary comment-submit"
                        onClick={() => {
                          const text = (commentInputs[p.id] || '').trim();
                          if (!text) return;
                          const updatedPosts = wallPosts.map((item) => item.id === p.id ? {
                            ...item,
                            comments: [...item.comments, { id: `c-${Date.now()}`, author: currentUsername, text, createdAt: Date.now(), likes: 0, shares: 0, replies: [] }],
                          } : item);
                          setWallPosts(updatedPosts);
                          writeWallPosts(evt.id, updatedPosts);
                          setCommentInputs((prev) => ({ ...prev, [p.id]: '' }));
                        }}
                      >
                        Gửi
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
              </>
            )}

            {activeTab === 'members' && (
              <div className="wall-feed">
                <h6 className="mb-3">Danh sách thành viên ({sampleMembers.length})</h6>
                {sampleMembers.map((member) => (
                  <div className="wall-post" key={member.id}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="font-weight-bold">{member.name}</div>
                        <div className="text-muted small">{member.role}</div>
                      </div>
                      <div className="text-muted small">
                        Tham gia {formatRelative(member.joinedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="wall-feed">
                <h6 className="mb-3">Thông báo mới nhất</h6>
                {sampleNotifications.map((notif) => (
                  <div className="wall-post" key={notif.id}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>{notif.text}</div>
                      <span className="text-muted small">{formatRelative(notif.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default EventCard;
