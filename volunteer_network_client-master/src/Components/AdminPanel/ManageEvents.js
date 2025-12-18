import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faCheck, faTimes, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

const ManageEvents = () => {
  const sampleEvents = [
    { _id: 'e1', name: 'Hiến máu nhân đạo', createdBy: 'Nguyễn Văn A', date: '2025-01-12', location: 'Hà Nội', status: 'DRAFT', participants: 42, slots: 80 },
    { _id: 'e2', name: 'Dọn rác bãi biển', createdBy: 'Trần Thị B', date: '2025-02-03', location: 'Đà Nẵng', status: 'PENDING', participants: 25, slots: 50 },
    { _id: 'e3', name: 'Trồng cây phủ xanh', createdBy: 'Phạm Văn C', date: '2025-02-20', location: 'TP.HCM', status: 'APPROVED', participants: 60, slots: 100 },
    { _id: 'e4', name: 'Gây quỹ từ thiện', createdBy: 'Lê Thị D', date: '2025-03-05', location: 'Huế', status: 'COMPLETED', participants: 120, slots: 120 },
    { _id: 'e5', name: 'Hỗ trợ vùng lũ', createdBy: 'Hoàng Văn E', date: '2025-01-28', location: 'Quảng Trị', status: 'REJECTED', participants: 18, slots: 40 },
    { _id: 'e6', name: 'Tư vấn nghề nghiệp', createdBy: 'Vũ Thị F', date: '2025-02-15', location: 'Hải Phòng', status: 'PENDING', participants: 35, slots: 60 },
    { _id: 'e7', name: 'Dạy học miền núi', createdBy: 'Đỗ Văn G', date: '2025-03-10', location: 'Cao Bằng', status: 'DRAFT', participants: 12, slots: 25 },
    { _id: 'e8', name: 'Chăm sóc thú cưng', createdBy: 'Phan Thị H', date: '2025-01-22', location: 'Cần Thơ', status: 'COMPLETED', participants: 40, slots: 40 },
    { _id: 'e9', name: 'Tiếp sức mùa thi', createdBy: 'Bùi Văn I', date: '2025-06-01', location: 'Hà Nội', status: 'PENDING', participants: 0, slots: 200 },
    { _id: 'e10', name: 'Hỗ trợ bệnh viện', createdBy: 'Đặng Thị K', date: '2025-04-18', location: 'TP.HCM', status: 'APPROVED', participants: 55, slots: 90 },
  ];

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

  const [eventList, setEventList] = useState(sampleEvents);
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
    const matchesSearch = searchText === '' || 
      e.name.toLowerCase().includes(searchText.toLowerCase()) ||
      e.location.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === '' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (filteredEvents.length === 0) return new Set();
      if (prev.size > 0) return new Set();
      return new Set(filteredEvents.map((e) => e._id));
    });
  };

  const approveEvent = (_id) => {
    setEventList((list) => list.map((e) => (e._id === _id ? { ...e, status: 'APPROVED' } : e)));
  };

  const rejectEvent = (_id) => {
    setEventList((list) => list.map((e) => (e._id === _id ? { ...e, status: 'REJECTED' } : e)));
  };

  const deleteEvent = (_id) => {
    setEventList((list) => list.filter((e) => e._id !== _id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(_id);
      return next;
    });
  };

  const bulkApprove = () => {
    setEventList((list) => list.map((e) => {
      if (selectedIds.has(e._id) && !['APPROVED', 'COMPLETED', 'REJECTED'].includes(e.status)) {
        return { ...e, status: 'APPROVED' };
      }
      return e;
    }));
    setSelectedIds(new Set());
  };

  const bulkReject = () => {
    setEventList((list) => list.map((e) => {
      if (selectedIds.has(e._id) && !['APPROVED', 'COMPLETED', 'REJECTED'].includes(e.status)) {
        return { ...e, status: 'REJECTED' };
      }
      return e;
    }));
    setSelectedIds(new Set());
  };

  const bulkDelete = () => {
    setEventList((list) => list.filter((e) => !selectedIds.has(e._id)));
    setSelectedIds(new Set());
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

  return (
    <div className='manage-events-wrapper' style={{ padding: '24px' }}>
      <style>{`
        .manage-events-table thead,
        .manage-events-table th {
          position: static !important;
        }
      `}</style>
      <div className='bg-white rounded p-3 shadow-sm'>
        <div className='d-flex justify-content-between align-items-center mb-3'>
          <h5 className='mb-0'>Danh sách sự kiện</h5>
        </div>
        
        <div className='d-flex gap-3 mb-3'>
          <div className='flex-grow-1'>
            <input
              type='text'
              className='form-control'
              placeholder='Tìm kiếm theo tên sự kiện hoặc địa điểm...'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
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
          <table className='table table-borderless table-hover manage-events-table mb-0'>
            <thead className='thead-light'>
              <tr>
                <th className='text-secondary text-left' scope='col' style={{ width: '120px' }}>
                  <button
                    className='btn btn-sm btn-outline-primary'
                    onClick={toggleSelectAll}
                  >
                    {selectedIds.size > 0 ? 'Bỏ chọn' : 'Chọn tất cả'}
                  </button>
                </th>
                <th className='text-secondary text-left' scope='col' style={{ width: '50px' }}>#</th>
                <th className='text-secondary' scope='col'>Tên sự kiện</th>
                <th className='text-secondary' scope='col'>Tạo bởi</th>
                <th className='text-secondary' scope='col'>Ngày tạo</th>
                <th className='text-secondary' scope='col'>Địa điểm</th>
                <th className='text-secondary' scope='col'>Trạng thái</th>
                <th className='text-secondary text-right' scope='col' style={{ paddingRight: '16px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((evt, idx) => (
                <tr key={evt._id}>
                  <td>
                    <input
                      type='checkbox'
                      checked={selectedIds.has(evt._id)}
                      onChange={() => toggleSelect(evt._id)}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </td>
                  <td>{idx + 1}</td>
                  <td>{evt.name}</td>
                  <td>{evt.createdBy}</td>
                  <td>{evt.date}</td>
                  <td>{evt.location}</td>
                  <td>
                    <span className={statusClass(evt.status)}>
                      {evt.status}
                    </span>
                  </td>
                  <td className='text-right' style={{ paddingRight: '16px' }}>
                    {!['APPROVED', 'COMPLETED', 'REJECTED'].includes(evt.status) && (
                      <>
                        <button
                          className='btn btn-outline-success btn-sm mr-2'
                          onClick={() => approveEvent(evt._id)}
                          title='Duyệt sự kiện'
                        >
                          <FontAwesomeIcon icon={faCheck} className="mr-1" /> Duyệt
                        </button>
                        <button
                          className='btn btn-outline-warning btn-sm mr-2'
                          onClick={() => rejectEvent(evt._id)}
                          title='Từ chối sự kiện'
                        >
                          <FontAwesomeIcon icon={faTimes} className="mr-1" /> Từ chối
                        </button>
                      </>
                    )}
                    <button className='btn btn-outline-danger btn-sm' onClick={() => deleteEvent(evt._id)}>
                      <FontAwesomeIcon icon={faTrashAlt} className="mr-1" /> Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showExportDialog &&
        ReactDOM.createPortal(
          <div
            className='confirm-overlay'
            onClick={() => setShowExportDialog(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
          >
            <div
              className='confirm-card bg-white p-4 rounded'
              onClick={(e) => e.stopPropagation()}
              style={{ minWidth: '350px', maxWidth: '500px' }}
            >
              <div className='text-right mb-2'>
                <button
                  type='button'
                  className='btn btn-sm btn-outline-secondary close-btn'
                  onClick={() => setShowExportDialog(false)}
                >
                  ×
                </button>
              </div>
              <p className='mb-3 text-center'>Chọn định dạng xuất dữ liệu:</p>
              <div className='d-flex justify-content-around'>
                <button className='btn btn-primary' onClick={exportCSV}>CSV</button>
                <button className='btn btn-primary' onClick={exportJSON}>JSON</button>
              </div>
            </div>
          </div>,
          document.body
        )}

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
              zIndex: 1000,
              borderTop: '1px solid #dee2e6',
            }}
          >
            <div className='d-flex align-items-center'>
              <span className='mr-3'>
                <strong>{selectedIds.size}</strong> sự kiện đã chọn
              </span>
            </div>
            <div className='d-flex gap-2'>
              <button className='btn btn-primary btn-sm mr-2' onClick={exportData}>Xuất dữ liệu</button>
              <button
                className='btn btn-success btn-sm mr-2'
                onClick={bulkApprove}
                title='Duyệt các sự kiện đã chọn'
              >
                <FontAwesomeIcon icon={faCheck} className="mr-1" /> Duyệt
              </button>
              <button
                className='btn btn-warning btn-sm mr-2'
                onClick={bulkReject}
                title='Từ chối các sự kiện đã chọn'
              >
                <FontAwesomeIcon icon={faTimes} className="mr-1" /> Từ chối
              </button>
              <button className='btn btn-danger btn-sm' onClick={bulkDelete}>
                <FontAwesomeIcon icon={faTrashAlt} className="mr-1" /> Xóa
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ManageEvents;
