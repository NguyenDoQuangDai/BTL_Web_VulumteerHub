import React, { useEffect, useState } from 'react';
import Header from '../Header/Header';
import { Link, useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUser, 
    faGlobeAmericas, 
    faComment, 
    faThumbsUp, 
    faShare, 
    faThumbtack, 
    faEllipsisH, 
    faHistory,
    faTrashAlt,
    faEdit
} from '@fortawesome/free-solid-svg-icons';
import forumData from '../../fakeData/forumData';
import tasksData from '../../fakeData/tasksData';
import { useAuth } from '../../contexts/AuthContext';

const Forum = () => {
    const [allPosts, setAllPosts] = useState([]);
    const [activeMenuPostId, setActiveMenuPostId] = useState(null);
    const { user } = useAuth();
    const history = useHistory();

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = () => {
        try {
            let forumPosts = JSON.parse(localStorage.getItem('forum_posts') || '{}');
            
            if (Object.keys(forumPosts).length === 0) {
                forumPosts = forumData;
                localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
            }

            const mockEvents = JSON.parse(localStorage.getItem('mockEvents') || '[]');
            const eventMap = {};
            mockEvents.forEach(e => {
                eventMap[e.id] = e.name;
            });
            tasksData.forEach(t => {
                eventMap[t.taskId] = t.task;
            });

            let flattenedPosts = [];
            Object.keys(forumPosts).forEach(eventId => {
                const posts = forumPosts[eventId];
                const eventName = eventMap[eventId] || `Sự kiện #${eventId}`;
                
                const postsWithEventInfo = posts.map(post => ({
                    ...post,
                    eventId,
                    eventName
                }));
                
                flattenedPosts = [...flattenedPosts, ...postsWithEventInfo];
            });

            flattenedPosts.sort((a, b) => b.id - a.id);
            setAllPosts(flattenedPosts);
        } catch (e) {
            console.error("Error loading forum posts", e);
        }
    };

    const updatePostInStorage = (eventId, postId, updateFn) => {
        try {
            const forumPosts = JSON.parse(localStorage.getItem('forum_posts') || '{}');
            if (forumPosts[eventId]) {
                forumPosts[eventId] = forumPosts[eventId].map(p => {
                    if (p.id === postId) {
                        return updateFn(p);
                    }
                    return p;
                });
                localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
                loadPosts(); // Reload to update UI
            }
        } catch (e) {
            console.error("Failed to update post", e);
        }
    };

    const handleLike = (post) => {
        updatePostInStorage(post.eventId, post.id, (p) => ({
            ...p,
            liked: !p.liked,
            likes: p.liked ? p.likes - 1 : p.likes + 1
        }));
    };

    const handleShare = (post) => {
        const link = `${window.location.origin}/event/${post.eventId}`;
        navigator.clipboard.writeText(link).then(() => {
            alert('Đã sao chép liên kết sự kiện: ' + link);
        });
        
        updatePostInStorage(post.eventId, post.id, (p) => ({
            ...p,
            shares: p.shares + 1
        }));
    };

    const handleDeletePost = (post) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
            try {
                const forumPosts = JSON.parse(localStorage.getItem('forum_posts') || '{}');
                if (forumPosts[post.eventId]) {
                    forumPosts[post.eventId] = forumPosts[post.eventId].filter(p => p.id !== post.id);
                    localStorage.setItem('forum_posts', JSON.stringify(forumPosts));
                    loadPosts();
                }
            } catch (e) {
                console.error("Failed to delete post", e);
            }
        }
        setActiveMenuPostId(null);
    };

    const handlePinPost = (post) => {
        updatePostInStorage(post.eventId, post.id, (p) => ({
            ...p,
            isPinned: !p.isPinned
        }));
        setActiveMenuPostId(null);
    };

    const getRoleLevel = (role) => {
        if (!role) return 0;
        const r = role.toUpperCase();
        if (r === 'QUẢN TRỊ VIÊN' || r === 'ADMIN') return 3;
        if (r === 'QUẢN LÝ SỰ KIỆN' || r === 'EVENT_MANAGER') return 2;
        return 1;
    };

    return (
        <>
            <Header />
            <div className="container mt-4" style={{ maxWidth: '700px' }}>
                <h2 className="mb-4 text-center">Diễn đàn cộng đồng</h2>
                
                {allPosts.length === 0 ? (
                    <div className="text-center text-muted py-5">
                        <p>Chưa có bài viết nào.</p>
                    </div>
                ) : (
                    <div className="forum-feed">
                        {allPosts.map(post => (
                            <div key={`${post.eventId}-${post.id}`} className={`bg-white rounded shadow-sm mb-3 ${post.isPinned ? 'border border-primary' : ''}`}>
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
                                                    <span className="mx-2">•</span>
                                                    <Link to={`/event/${post.eventId}`} className="text-primary font-weight-bold">
                                                        {post.eventName}
                                                    </Link>
                                                    {post.editHistory && post.editHistory.length > 0 && (
                                                        <span className="ml-1 text-muted font-italic">
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
                                                            onClick={() => handlePinPost(post)}
                                                        >
                                                            <FontAwesomeIcon icon={faThumbtack} className="mr-2" /> {post.isPinned ? 'Bỏ ghim' : 'Ghim bài viết'}
                                                        </button>
                                                    )}
                                                    {(user && (user.username === post.username || getRoleLevel(user.role) > getRoleLevel(post.role))) && (
                                                        <button 
                                                            className="dropdown-item text-danger small" 
                                                            onClick={() => handleDeletePost(post)}
                                                        >
                                                            <FontAwesomeIcon icon={faTrashAlt} className="mr-2" /> Xóa bài viết
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="mb-2">
                                        <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>
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
                                        onClick={() => handleLike(post)}
                                    >
                                        <FontAwesomeIcon icon={faThumbsUp} className="mr-2" /> Thích
                                    </button>
                                    <button 
                                        className="btn btn-light flex-grow-1 text-secondary"
                                        onClick={() => history.push(`/event/${post.eventId}`)}
                                    >
                                        <FontAwesomeIcon icon={faComment} className="mr-2" /> Bình luận
                                    </button>
                                    <button 
                                        className="btn btn-light flex-grow-1 text-secondary"
                                        onClick={() => handleShare(post)}
                                    >
                                        <FontAwesomeIcon icon={faShare} className="mr-2" /> Chia sẻ
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default Forum;
