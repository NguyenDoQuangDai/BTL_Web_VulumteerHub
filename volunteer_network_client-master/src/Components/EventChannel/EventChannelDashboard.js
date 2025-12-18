import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import EventChannelSidebar from './EventChannelSidebar';
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
} from '@fortawesome/free-solid-svg-icons';

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

const EventDetails = ({ event }) => {
  let eventImages = event.images || event.imageUrls || (event.imageUrl ? [event.imageUrl] : []);

  // Fallback to sample images if no images are provided
  if (!eventImages || eventImages.length === 0) {
    eventImages = [
      '/sample-images/1.webp',
      '/sample-images/2.webp',
      '/sample-images/3.jpg'
    ];
  }

  return (
    <div className='p-4 bg-white rounded shadow-sm'>
      <ImageCarousel images={eventImages} />
      
      <div className='mb-4'>
        <div className='d-flex justify-content-between align-items-start mb-2'>
          <h4 className='mb-0'>{event.name}</h4>
          <span className={statusClass(event.status)}>{event.status}</span>
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
            <strong>Owner ID:</strong> {event.ownerId}
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

const DiscussionTab = ({ event }) => {
  const [replyingTo, setReplyingTo] = useState(null);
  const [posts, setPosts] = useState([
    {
      id: 1,
      user: 'Nguyễn Văn A',
      role: 'Quản trị viên',
      time: '2 giờ trước',
      content: 'Chào mọi người! Ngày mai chúng ta sẽ tập trung tại sảnh chính lúc 7:00 sáng nhé. Mọi người nhớ mặc áo đồng phục.',
      likes: 12,
      comments: 3,
      shares: 0,
      liked: true
    },
    {
      id: 2,
      user: 'Trần Thị B',
      role: 'Tình nguyện viên',
      time: '5 giờ trước',
      content: 'Mình có thể đến muộn khoảng 15 phút được không ạ? Xe bus chuyến sớm nhất 6:30 mới chạy.',
      likes: 2,
      comments: 5,
      shares: 0,
      liked: false
    }
  ]);

  const [newPostContent, setNewPostContent] = useState('');

  const handlePost = () => {
    if (!newPostContent.trim()) return;
    const newPost = {
      id: Date.now(),
      user: 'Tôi', // Current user placeholder
      role: 'Thành viên',
      time: 'Vừa xong',
      content: newPostContent,
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false,
      commentsList: []
    };
    setPosts([newPost, ...posts]);
    setNewPostContent('');
  };

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
      {posts.map(post => (
        <div key={post.id} className="bg-white rounded shadow-sm mb-3">
            <div className="p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex">
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center mr-2" style={{ width: '40px', height: '40px' }}>
                            <FontAwesomeIcon icon={faUser} className="text-secondary" />
                        </div>
                        <div>
                            <div className="font-weight-bold text-dark" style={{ lineHeight: '1.2' }}>{post.user}</div>
                            <div className="small text-muted">
                                {post.time} · <FontAwesomeIcon icon={faGlobeAmericas} size="xs" />
                            </div>
                        </div>
                    </div>
                    <button className="btn btn-link text-secondary p-0">
                        <FontAwesomeIcon icon={faEllipsisH} />
                    </button>
                </div>
                <div className="mb-2">
                    {post.content}
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
    </div>
  );
};

const EventChannelDashboard = ({ event, onClose }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [followItems, setFollowItems] = useState([]);
  const [isCreatingFollow, setIsCreatingFollow] = useState(false);
  const [followText, setFollowText] = useState('');

  const handleAddFollowItem = () => {
    if (followText.trim()) {
      setFollowItems([{ id: Date.now(), content: followText, time: new Date().toLocaleString('vi-VN') }, ...followItems]);
      setFollowText('');
      setIsCreatingFollow(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'details':
        return <EventDetails event={event} />;
      case 'discussion':
        return <DiscussionTab event={event} />;
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
                    <button 
                        className={`btn btn-sm ${isCreatingFollow ? 'btn-outline-danger' : 'btn-outline-primary'}`}
                        onClick={() => setIsCreatingFollow(!isCreatingFollow)}
                    >
                        {isCreatingFollow ? 'Hủy' : 'Tạo thông báo'}
                    </button>
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
                            <div className="d-flex align-items-center mb-2">
                                <span className="badge badge-info mr-2">Mới</span>
                                <small className="text-muted">{item.time}</small>
                            </div>
                            <p className="mb-0 text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                                {item.content}
                            </p>
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
