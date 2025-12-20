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
import { postService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const Forum = () => {
    const [allPosts, setAllPosts] = useState([]);
    const [activeMenuPostId, setActiveMenuPostId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const { user } = useAuth();
    const history = useHistory();

    useEffect(() => {
        loadPosts();
    }, []);

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

    const mapPost = (post) => {
        return {
            id: post.id,
            eventId: post.eventId,
            eventName: post.eventName || `Sự kiện #${post.eventId}`,
            user: post.authorName || post.authorUsername || 'Unknown',
            username: post.authorUsername,
            role: post.authorRole || 'Thành viên',
            avatar: post.authorAvatar,
            time: formatTime(post.createdAt),
            content: post.content,
            likes: post.likes || 0,
            liked: post.liked,
            comments: post.commentsCount || 0,
            shares: 0, // Not implemented in backend yet
            isPinned: post.pinned,
            isJoined: false, // Not implemented in backend yet
            editHistory: [] // Not implemented in backend yet
        };
    };

    const loadPosts = async () => {
        try {
            setLoading(true);
            // Initial load: 5 posts
            const response = await postService.getAllPosts(0, 5);
            
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

            const formattedPosts = rawPosts.map(mapPost);
            
            // Sort: Pinned first, then newest (by ID)
            formattedPosts.sort((a, b) => {
                if (a.isPinned === b.isPinned) {
                   return b.id - a.id;
                }
                return a.isPinned ? -1 : 1;
            });

            setAllPosts(formattedPosts);
            setPage(1);
            setHasMore(rawPosts.length >= 5);
        } catch (e) {
            console.error("Error loading forum posts", e);
        } finally {
            setLoading(false);
        }
    };

    const loadMorePosts = async () => {
        setLoadingMore(true);
        try {
            // Subsequent loads: 3 posts
            const response = await postService.getAllPosts(page, 3);
            
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

            const formattedPosts = rawPosts.map(mapPost);
            
            setAllPosts(prevPosts => {
                // Filter duplicates
                const existingIds = new Set(prevPosts.map(p => p.id));
                const newPosts = formattedPosts.filter(p => !existingIds.has(p.id));
                
                const combined = [...prevPosts, ...newPosts];
                // Re-sort
                return combined.sort((a, b) => {
                    if (a.isPinned === b.isPinned) {
                       return b.id - a.id;
                    }
                    return a.isPinned ? -1 : 1;
                });
            });

            setPage(prev => prev + 1);
            if (rawPosts.length < 3) setHasMore(false);

        } catch (e) {
            console.error("Failed to load more posts", e);
        } finally {
            setLoadingMore(false);
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi });
        } catch (e) {
            return dateString;
        }
    };

    const handleLike = async (post) => {
        try {
            if (post.liked) {
                await postService.unlikePost(post.id);
            } else {
                await postService.likePost(post.id);
            }
            
            // Optimistic update
            setAllPosts(prevPosts => prevPosts.map(p => {
                if (p.id === post.id) {
                    return {
                        ...p,
                        liked: !p.liked,
                        likes: p.liked ? p.likes - 1 : p.likes + 1
                    };
                }
                return p;
            }));
        } catch (e) {
            console.error("Failed to toggle like", e);
        }
    };

    const handleShare = (post) => {
        const link = `${window.location.origin}/event/${post.eventId}`;
        navigator.clipboard.writeText(link).then(() => {
            alert('Đã sao chép liên kết sự kiện: ' + link);
        });
    };

    const handleDeletePost = async (post) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
            try {
                await postService.deletePost(post.id);
                setAllPosts(prevPosts => prevPosts.filter(p => p.id !== post.id));
            } catch (e) {
                console.error("Failed to delete post", e);
                alert('Không thể xóa bài viết. Vui lòng thử lại sau.');
            }
        }
        setActiveMenuPostId(null);
    };

    const handlePinPost = async (post) => {
        try {
            await postService.updatePost(post.id, { pinned: !post.isPinned });
            setAllPosts(prevPosts => prevPosts.map(p => {
                if (p.id === post.id) {
                    return {
                        ...p,
                        isPinned: !p.isPinned
                    };
                }
                return p;
            }));
        } catch (e) {
            console.error("Failed to pin/unpin post", e);
        }
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
                {loadingMore && (
                    <div className="text-center py-3">
                        <div className="spinner-border text-primary spinner-border-sm" role="status">
                            <span className="sr-only">Loading...</span>
                        </div>
                        <span className="ml-2 text-muted small">Đang tải thêm...</span>
                    </div>
                )}
            </div>
        </>
    );
};

export default Forum;
