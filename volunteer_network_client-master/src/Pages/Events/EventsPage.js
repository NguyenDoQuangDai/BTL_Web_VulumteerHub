import React, { useState } from 'react';
import Header from '../../Components/Header/Header';
import Footer from '../../Components/Footer/Footer';
import EventsGrid from '../../Components/Events/EventsGrid';
import CreateEventForm from '../../Components/UserDashboard/CreateEventForm';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

const EventsPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('APPROVED');
  const [sortOrder, setSortOrder] = useState('createdAt,desc');
  const { isAuthenticated } = useAuth();

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      <Header />
      <div className="container mt-4 flex-grow-1">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Danh sách sự kiện</h2>
          {isAuthenticated && (
            <button className="btn btn-success" onClick={() => setShowCreateForm(true)}>
              Tạo sự kiện
            </button>
          )}
        </div>

        <div className="row mb-4">
          <div className="col-md-6 mb-2 mb-md-0">
            <div className="input-group">
              <div className="input-group-prepend">
                <span className="input-group-text bg-white border-right-0">
                  <FontAwesomeIcon icon={faSearch} className="text-muted" />
                </span>
              </div>
              <input
                type="text"
                className="form-control border-left-0"
                placeholder="Tìm kiếm sự kiện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-3 mb-2 mb-md-0">
            <select 
              className="form-control" 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="APPROVED">Đang diễn ra (Approved)</option>
              <option value="COMPLETED">Đã kết thúc (Completed)</option>
            </select>
          </div>
          <div className="col-md-3">
            <select 
              className="form-control" 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="createdAt,desc">Mới nhất</option>
              <option value="createdAt,asc">Cũ nhất</option>
            </select>
          </div>
        </div>

        <EventsGrid searchQuery={searchQuery} status={statusFilter} sort={sortOrder} />
      </div>
      
      {showCreateForm && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateForm(false)}
        >
          <div
            className="modal-content-wrapper"
            onClick={(e) => e.stopPropagation()}
          >
            <CreateEventForm
              onClose={() => setShowCreateForm(false)}
              onCreated={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default EventsPage;
