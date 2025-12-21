import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFire,
  faBell,
  faUsers,
  faComments,
  faThumbsUp,
  faNewspaper,
  faClock,
  faArrowUp,
  faChartLine,
  faCalendarAlt,
  faUserCheck
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import './DashboardOverview.css';

const DashboardOverview = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    recentEvents: [],
    eventsWithNewPosts: [],
    trendingEvents: [],
    totalEvents: 0,
    totalUsers: 0,
    totalRegistrations: 0,
    activeEventsCount: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Sử dụng API mới để lấy tất cả dữ liệu dashboard
      const summary = await dashboardService.getSummary();
      
      setDashboardData({
        recentEvents: summary.recentEvents || [],
        eventsWithNewPosts: summary.eventsWithNewPosts || [],
        trendingEvents: summary.trendingEvents || [],
        totalEvents: summary.totalEvents || 0,
        totalUsers: summary.totalUsers || 0,
        totalRegistrations: summary.totalRegistrations || 0,
        activeEventsCount: summary.activeEventsCount || 0
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  // Destructure dashboard data
  const { 
    recentEvents, 
    eventsWithNewPosts, 
    trendingEvents,
    totalEvents,
    totalUsers,
    totalRegistrations,
    activeEventsCount
  } = dashboardData;

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        <strong>Lỗi!</strong> {error}
        <button className="btn btn-sm btn-outline-danger ml-3" onClick={loadDashboardData}>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-overview">
      <h4 className="mb-4">
        <FontAwesomeIcon icon={faChartLine} className="mr-2 text-primary" />
        Tổng quan hoạt động
      </h4>

      {/* Statistics Summary Row */}
      <div className="row mb-4">
        <div className="col-6 col-md-3 mb-3">
          <div className="stat-card stat-events">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faCalendarAlt} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{totalEvents}</div>
              <div className="stat-label">Tổng sự kiện</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3 mb-3">
          <div className="stat-card stat-active">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faFire} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{activeEventsCount}</div>
              <div className="stat-label">Đang hoạt động</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3 mb-3">
          <div className="stat-card stat-users">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{totalUsers}</div>
              <div className="stat-label">Thành viên</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3 mb-3">
          <div className="stat-card stat-registrations">
            <div className="stat-icon">
              <FontAwesomeIcon icon={faUserCheck} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{totalRegistrations}</div>
              <div className="stat-label">Lượt đăng ký</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Cột 1: Sự kiện liên quan */}
        <div className="col-lg-6 mb-4">
          {/* Mới công bố */}
          <div className="dashboard-card mb-4">
            <div className="card-header-custom">
              <FontAwesomeIcon icon={faBell} className="mr-2 text-success" />
              <span>Mới công bố</span>
              <span className="badge badge-success ml-2">{recentEvents.length}</span>
            </div>
            <div className="card-body-custom">
              {recentEvents.length === 0 ? (
                <p className="text-muted text-center py-3">Không có sự kiện mới</p>
              ) : (
                recentEvents.map(event => (
                  <Link 
                    key={event.id} 
                    to={`/event/${event.id}`}
                    className="event-item"
                  >
                    <div className="event-info">
                      <div className="event-name">{event.name}</div>
                      <div className="event-meta">
                        <FontAwesomeIcon icon={faClock} className="mr-1" />
                        {formatTimeAgo(event.approvedAt || event.createdAt)}
                      </div>
                    </div>
                    <div className="event-stats">
                      <span className="badge badge-light">
                        <FontAwesomeIcon icon={faUsers} className="mr-1" />
                        {event.registeredCount || 0}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Có tin bài mới */}
          <div className="dashboard-card">
            <div className="card-header-custom">
              <FontAwesomeIcon icon={faNewspaper} className="mr-2 text-info" />
              <span>Có tin bài mới</span>
              <span className="badge badge-info ml-2">{eventsWithNewPosts.length}</span>
            </div>
            <div className="card-body-custom">
              {eventsWithNewPosts.length === 0 ? (
                <p className="text-muted text-center py-3">Không có tin bài mới</p>
              ) : (
                eventsWithNewPosts.map(event => (
                  <Link 
                    key={event.id} 
                    to={`/event/${event.id}`}
                    className="event-item"
                  >
                    <div className="event-info">
                      <div className="event-name">{event.name}</div>
                      <div className="event-meta">
                        <FontAwesomeIcon icon={faNewspaper} className="mr-1" />
                        {event.recentPostsCount} bài viết mới
                      </div>
                    </div>
                    <div className="event-stats">
                      <span className="badge badge-info">
                        {formatTimeAgo(event.latestPostTime)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Cột 2: Sự kiện thu hút */}
        <div className="col-lg-6 mb-4">
          <div className="dashboard-card trending-card">
            <div className="card-header-custom">
              <FontAwesomeIcon icon={faFire} className="mr-2 text-danger" />
              <span>Sự kiện thu hút</span>
              <span className="badge badge-danger ml-2">Trending</span>
            </div>
            <div className="card-body-custom">
              {trendingEvents.length === 0 ? (
                <p className="text-muted text-center py-3">Chưa có dữ liệu</p>
              ) : (
                trendingEvents.map((event, index) => (
                  <Link 
                    key={event.id} 
                    to={`/event/${event.id}`}
                    className="event-item trending-item"
                  >
                    <div className="trending-rank">
                      #{index + 1}
                    </div>
                    <div className="event-info flex-grow-1">
                      <div className="event-name">{event.name}</div>
                      <div className="trending-metrics">
                        <span className="metric">
                          <FontAwesomeIcon icon={faUsers} className="text-primary mr-1" />
                          {event.registeredCount || 0}
                          <FontAwesomeIcon icon={faArrowUp} className="text-success ml-1" size="xs" />
                        </span>
                        <span className="metric">
                          <FontAwesomeIcon icon={faComments} className="text-info mr-1" />
                          {event.postsCount || 0}
                        </span>
                        <span className="metric">
                          <FontAwesomeIcon icon={faThumbsUp} className="text-warning mr-1" />
                          {event.likesCount || 0}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
