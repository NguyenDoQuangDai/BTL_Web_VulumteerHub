import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const ManageEvents = () => {
  const [eventList, setEventList] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('http://localhost:8080/api/events', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: searchText,
          status: statusFilter,
          pageable: { page: 0, size: 10, sort: ['createdAt,desc'] },
        },
      });

      const events = response.data._embedded?.events || [];
      setEventList(
        events.map(e => ({
          _id: e.id,
          name: e.name,
          createdBy: e.username,
          date: e.startDate,
          location: e.location,
          status: e.status,
          participants: e.registeredCount,
          slots: e.slots || 0,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [searchText, statusFilter]);

  const approveEvent = async (_id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8080/api/admin/events/${_id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEventList(list =>
        list.map(e =>
          e._id === _id ? { ...e, status: 'APPROVED' } : e
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const rejectEvent = async (_id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8080/api/admin/events/${_id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEventList(list =>
        list.map(e =>
          e._id === _id ? { ...e, status: 'REJECTED' } : e
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

const deleteEvent = async (_id) => {
  try {
    const token = localStorage.getItem('token');
    await axios.delete(
      `http://localhost:8080/api/events/${_id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setEventList(list => list.filter(e => e._id !== _id));
  } catch (err) {
    console.error(err.response?.status, err.response?.data);
  }
};


  const filteredEvents = eventList.filter(e => {
    const matchSearch =
      searchText === '' ||
      e.name.toLowerCase().includes(searchText.toLowerCase()) ||
      e.location.toLowerCase().includes(searchText.toLowerCase());

    const matchStatus =
      statusFilter === '' || e.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const statusClass = status => {
    switch (status) {
      case 'APPROVED':
        return 'badge badge-success';
      case 'PENDING':
        return 'badge badge-warning';
      case 'REJECTED':
        return 'badge badge-danger';
      case 'COMPLETED':
        return 'badge badge-secondary';
      default:
        return 'badge badge-info';
    }
  };

  const toggleSelect = id => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      if (prev.size > 0) return new Set();
      return new Set(filteredEvents.map(e => e._id));
    });
  };

  const bulkApprove = () => {
    setEventList(list =>
      list.map(e =>
        selectedIds.has(e._id)
          ? { ...e, status: 'APPROVED' }
          : e
      )
    );
    setSelectedIds(new Set());
  };

  const bulkReject = () => {
    setEventList(list =>
      list.map(e =>
        selectedIds.has(e._id)
          ? { ...e, status: 'REJECTED' }
          : e
      )
    );
    setSelectedIds(new Set());
  };

  const bulkDelete = () => {
    setEventList(list =>
      list.filter(e => !selectedIds.has(e._id))
    );
    setSelectedIds(new Set());
  };

  return (
    <div className="manage-events-wrapper p-4 bg-white rounded shadow-sm">
      <h5>Danh sách sự kiện</h5>

      <div className="d-flex gap-3 my-3">
        <input
          className="form-control"
          placeholder="Tìm kiếm..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />

        <select
          className="form-control"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>
      </div>

      <table className="table table-hover">
        <thead>
          <tr>
            <th>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={toggleSelectAll}
              >
                {selectedIds.size ? 'Bỏ chọn' : 'Chọn tất cả'}
              </button>
            </th>
            <th>#</th>
            <th>Tên</th>
            <th>Người tạo</th>
            <th>Địa điểm</th>
            <th>Trạng thái</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredEvents.map((e, i) => (
            <tr key={e._id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.has(e._id)}
                  onChange={() => toggleSelect(e._id)}
                />
              </td>
              <td>{i + 1}</td>
              <td>{e.name}</td>
              <td>{e.createdBy}</td>
              <td>{e.location}</td>
              <td>
                <span className={statusClass(e.status)}>
                  {e.status}
                </span>
              </td>
              <td className="text-right">
                {e.status === 'PENDING' && (
                  <>
                    <button
                      className="btn btn-sm btn-success mr-2"
                      onClick={() => approveEvent(e._id)}
                    >
                      <FontAwesomeIcon icon={faCheck} /> Duyệt
                    </button>
                    <button
                      className="btn btn-sm btn-warning mr-2"
                      onClick={() => rejectEvent(e._id)}
                    >
                      <FontAwesomeIcon icon={faTimes} /> Từ chối
                    </button>
                  </>
                )}
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => deleteEvent(e._id)}
                >
                  <FontAwesomeIcon icon={faTrashAlt} /> Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedIds.size > 0 &&
        ReactDOM.createPortal(
          <div className="fixed-bottom bg-white p-3 shadow d-flex justify-content-between">
            <span>{selectedIds.size} sự kiện đã chọn</span>
            <div>
              <button className="btn btn-success mr-2" onClick={bulkApprove}>
                Duyệt
              </button>
              <button className="btn btn-warning mr-2" onClick={bulkReject}>
                Từ chối
              </button>
              <button className="btn btn-danger" onClick={bulkDelete}>
                Xóa
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ManageEvents;
