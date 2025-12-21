import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrash, 
  faCheck, 
  faTimes, 
  faTrashAlt, 
  faFileExport,
  faSearch,
  faFileCsv,
  faFileCode,
  faDownload,
  faSync
} from '@fortawesome/free-solid-svg-icons';
import { adminService, eventService } from '../../services/apiService';
import './ManageEvents.css';

const ManageEvents = () => {
  const history = useHistory();
  
  const statusClass = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'status-badge approved';
      case 'PENDING':
        return 'status-badge pending';
      case 'REJECTED':
        return 'status-badge rejected';
      case 'COMPLETED':
        return 'status-badge completed';
      case 'DRAFT':
      default:
        return 'status-badge draft';
    }
  };

  const [eventList, setEventList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const events = await adminService.getAllEvents();
      console.log("Loaded events:", events);
      const mappedEvents = events.map(event => ({
        _id: event.id,
        name: event.name,
        createdBy: event.ownerName || 'Unknown',
        date: event.createdAt || event.startDate, // Use createdAt for "Ngày tạo"
        location: event.location,
        status: event.status,
        participants: event.registeredCount || 0,
        slots: 100 // Default slots as it's not in DTO yet
      }));
      setEventList(mappedEvents);
    } catch (error) {
      console.error("Failed to load events", error);
    } finally {
      setLoading(false);
    }
  };
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredEvents = eventList.filter((e) => {
    const name = e.name || '';
    const location = e.location || '';
    
    const matchesSearch = searchText === '' || 
      name.toLowerCase().includes(searchText.toLowerCase()) ||
      location.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === '' || e.status === statusFilter;
    return matchesSearch && matchesStatus && e.status !== 'DRAFT';
  });

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (filteredEvents.length === 0) return new Set();
      if (prev.size > 0) return new Set();
      return new Set(filteredEvents.map((e) => e._id));
    });
  };

  const approveEvent = async (_id) => {
    try {
      await adminService.approveEvent(_id);
      // Reload events to get the updated status from server
      loadEvents();
    } catch (error) {
      console.error("Failed to approve event", error);
      alert("Failed to approve event");
    }
  };

  const rejectEvent = async (_id) => {
    try {
      await adminService.rejectEvent(_id);
      // Reload events to get the updated status from server
      loadEvents();
    } catch (error) {
      console.error("Failed to reject event", error);
      alert("Failed to reject event");
    }
  };

  const deleteEvent = async (_id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await eventService.deleteEvent(_id);
      setEventList((list) => list.filter((e) => e._id !== _id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(_id);
        return next;
      });
    } catch (error) {
      console.error("Failed to delete event", error);
      alert("Failed to delete event");
    }
  };

  const bulkApprove = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      try {
        await adminService.approveEvent(id);
      } catch (error) {
        console.error(`Failed to approve event ${id}`, error);
      }
    }
    loadEvents();
    setSelectedIds(new Set());
  };

  const bulkReject = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      try {
        await adminService.rejectEvent(id);
      } catch (error) {
        console.error(`Failed to reject event ${id}`, error);
      }
    }
    loadEvents();
    setSelectedIds(new Set());
  };

  const bulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} events?`)) return;
    
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      try {
        await eventService.deleteEvent(id);
      } catch (error) {
        console.error(`Failed to delete event ${id}`, error);
      }
    }
    loadEvents();
    setSelectedIds(new Set());
  };

  const handleRowClick = (eventId) => {
    history.push(`/event/${eventId}`);
  };

  const selectionHasNonApprovable = eventList.some(
    (e) => selectedIds.has(e._id) && ['APPROVED', 'COMPLETED', 'REJECTED'].includes(e.status)
  );

  const exportData = () => {
    if (selectedIds.size === 0) return;
    setShowExportDialog(true);
  };

  const exportCSV = () => {
    const selectedEvents = eventList.filter((e) => selectedIds.has(e._id));
    const csv = [
      ['#', 'Tên sự kiện', 'Tạo bởi', 'Ngày tạo', 'Địa điểm', 'Trạng thái'],
      ...selectedEvents.map((e) => [e._id, e.name, e.createdBy, e.date, e.location, e.status]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `events_export_${Date.now()}.csv`;
    link.click();
    setShowExportDialog(false);
  };

  const exportJSON = () => {
    const selectedEvents = eventList.filter((e) => selectedIds.has(e._id));
    const json = JSON.stringify(selectedEvents, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `events_export_${Date.now()}.json`;
    link.click();
    setShowExportDialog(false);
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='manage-events-wrapper'>
      <div className='manage-events-card'>
        <div className='manage-events-header'>
          <div>
            <h5 className='mb-1 font-weight-bold'>Danh sách sự kiện</h5>
            <p className='text-muted mb-0 small'>Quản lý, duyệt và theo dõi các sự kiện tình nguyện</p>
          </div>
          <div className='d-flex align-items-center'>
            <div className='text-muted font-weight-bold mr-3'>
              Tổng số: {filteredEvents.length}
            </div>
            <button className='btn btn-outline-primary btn-sm' onClick={loadEvents} title="Làm mới dữ liệu">
              <FontAwesomeIcon icon={faSync} />
            </button>
          </div>
        </div>
        
        <div className='manage-events-filters'>
          <div className='flex-grow-1'>
            <div className="input-group">
              <div className="input-group-prepend">
                <span className="input-group-text bg-white border-right-0">
                  <FontAwesomeIcon icon={faSearch} className="text-muted" />
                </span>
              </div>
              <input
                type='text'
                className='form-control border-left-0'
                placeholder='Tìm kiếm theo tên sự kiện hoặc địa điểm...'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>
          <div style={{ minWidth: '200px' }}>
            <select
              className='form-control'
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value=''>Tất cả trạng thái</option>
              <option value='DRAFT'>DRAFT</option>
              <option value='PENDING'>PENDING</option>
              <option value='APPROVED'>APPROVED</option>
              <option value='REJECTED'>REJECTED</option>
              <option value='COMPLETED'>COMPLETED</option>
            </select>
          </div>
        </div>
        
        <div className='table-responsive'>
          <table className='table table-hover manage-events-table mb-0'>
            <thead>
              <tr>
                <th scope='col' style={{ width: '50px' }}>
                  <div className="custom-control custom-checkbox">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="selectAllEvents"
                      onChange={toggleSelectAll}
                      checked={selectedIds.size > 0 && selectedIds.size === filteredEvents.length}
                    />
                    <label className="custom-control-label" htmlFor="selectAllEvents"></label>
                  </div>
                </th>
                <th scope='col' style={{ width: '50px' }}>#</th>
                <th scope='col'>Tên sự kiện</th>
                <th scope='col'>Tạo bởi</th>
                <th scope='col'>Ngày tạo</th>
                <th scope='col'>Địa điểm</th>
                <th scope='col'>Trạng thái</th>
                <th scope='col' className='text-right'>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <div className="text-muted">
                      <FontAwesomeIcon icon={faSearch} size="3x" className="mb-3 opacity-50" />
                      <p>Không tìm thấy sự kiện nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt, idx) => (
                  <tr key={evt._id}>
                    <td>
                      <div className="custom-control custom-checkbox">
                        <input
                          type="checkbox"
                          className="custom-control-input"
                          id={`event-${evt._id}`}
                          checked={selectedIds.has(evt._id)}
                          onChange={() => toggleSelect(evt._id)}
                        />
                        <label className="custom-control-label" htmlFor={`event-${evt._id}`}></label>
                      </div>
                    </td>
                    <td 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => handleRowClick(evt._id)}
                    >
                      {idx + 1}
                    </td>
                    <td 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => handleRowClick(evt._id)}
                    >
                      <div className="font-weight-bold">{evt.name}</div>
                      {/* <small className="text-muted">Slots: {evt.participants}/{evt.slots}</small> */}
                    </td>
                    <td>{evt.createdBy}</td>
                    <td>{evt.date ? new Date(evt.date).toLocaleDateString('vi-VN') : '-'}</td>
                    <td>{evt.location}</td>
                    <td>
                      <span className={statusClass(evt.status)}>
                        {evt.status}
                      </span>
                    </td>
                    <td className='text-right'>
                      {!['APPROVED', 'COMPLETED', 'REJECTED'].includes(evt.status) && (
                        <>
                          <button
                            className='btn btn-outline-success btn-sm action-btn'
                            onClick={() => approveEvent(evt._id)}
                            title='Duyệt'
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </button>
                          <button
                            className='btn btn-outline-warning btn-sm action-btn'
                            onClick={() => rejectEvent(evt._id)}
                            title='Từ chối'
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </>
                      )}
                      <button 
                        className='btn btn-outline-danger btn-sm action-btn' 
                        onClick={() => deleteEvent(evt._id)}
                        title='Xóa'
                      >
                        <FontAwesomeIcon icon={faTrashAlt} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showExportDialog &&
        ReactDOM.createPortal(
          <div className='confirm-overlay' onClick={() => setShowExportDialog(false)}>
            <div className='confirm-card' onClick={(e) => e.stopPropagation()}>
              <div className='text-right mb-2'>
                <button
                  type='button'
                  className='btn btn-sm btn-outline-secondary close-btn'
                  onClick={() => setShowExportDialog(false)}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <h5 className='mb-3 text-center'>Chọn định dạng xuất dữ liệu</h5>
              <div className='d-flex justify-content-around mt-4'>
                <button className='btn btn-outline-primary' onClick={exportCSV}>
                  <FontAwesomeIcon icon={faFileCsv} className="mr-2" /> CSV
                </button>
                <button className='btn btn-outline-primary' onClick={exportJSON}>
                  <FontAwesomeIcon icon={faFileCode} className="mr-2" /> JSON
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {selectedIds.size > 0 &&
        ReactDOM.createPortal(
          <div className='bulk-actions-bar'>
            <div className='d-flex align-items-center'>
              <span className='mr-3 font-weight-bold'>
                {selectedIds.size} sự kiện đã chọn
              </span>
            </div>
            <div className='d-flex gap-2'>
              <button className='btn btn-primary btn-sm mr-2' onClick={exportData}>
                <FontAwesomeIcon icon={faDownload} className="mr-1" /> Xuất dữ liệu
              </button>
              <button
                className='btn btn-success btn-sm mr-2'
                onClick={bulkApprove}
              >
                <FontAwesomeIcon icon={faCheck} className="mr-1" /> Duyệt
              </button>
              <button
                className='btn btn-warning btn-sm mr-2'
                onClick={bulkReject}
              >
                <FontAwesomeIcon icon={faTimes} className="mr-1" /> Từ chối
              </button>
              <button
                className='btn btn-danger btn-sm'
                onClick={bulkDelete}
              >
                <FontAwesomeIcon icon={faTrash} className="mr-1" /> Xóa
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ManageEvents;
