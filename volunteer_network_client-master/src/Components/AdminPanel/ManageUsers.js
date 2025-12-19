import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import PreLoader from '../PreLoader/PreLoader';
// ==============================================================================

const ManageUsers = () => {
  // Sample user data
  const sampleUsers = [
    { _id: '1', name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', username: 'nguyenvana', isLocked: false, role: 'Admin' },
    { _id: '2', name: 'Trần Thị B', email: 'tranthib@example.com', username: 'tranthib', isLocked: false, role: 'Manager' },
    { _id: '3', name: 'Phạm Văn C', email: 'phamvanc@example.com', username: 'phamvanc', isLocked: true, role: 'User' },
    { _id: '4', name: 'Lê Thị D', email: 'lethid@example.com', username: 'lethid', isLocked: false, role: 'User' },
    { _id: '5', name: 'Hoàng Văn E', email: 'hoangvane@example.com', username: 'hoangvane', isLocked: false, role: 'Manager' },
    { _id: '6', name: 'Vũ Thị F', email: 'vuthif@example.com', username: 'vuthif', isLocked: false, role: 'User' },
    { _id: '7', name: 'Đỗ Văn G', email: 'dovang@example.com', username: 'dovang', isLocked: true, role: 'User' },
    { _id: '8', name: 'Phan Thị H', email: 'phanthih@example.com', username: 'phanthih', isLocked: false, role: 'Manager' },
    { _id: '9', name: 'Bùi Văn I', email: 'buivani@example.com', username: 'buivani', isLocked: false, role: 'User' },
    { _id: '10', name: 'Đặng Thị K', email: 'dangthik@example.com', username: 'dangthik', isLocked: false, role: 'User' },
    { _id: '11', name: 'Ngô Văn L', email: 'ngovanl@example.com', username: 'ngovanl', isLocked: false, role: 'Admin' },
    { _id: '12', name: 'Cao Thị M', email: 'caothim@example.com', username: 'caothim', isLocked: true, role: 'User' },
    { _id: '13', name: 'Trịnh Văn N', email: 'trinhvann@example.com', username: 'trinhvann', isLocked: false, role: 'User' },
    { _id: '14', name: 'Huỳnh Thị O', email: 'huynhthio@example.com', username: 'huynhthio', isLocked: false, role: 'Manager' },
    { _id: '15', name: 'La Văn P', email: 'lavanp@example.com', username: 'lavanp', isLocked: false, role: 'User' },
    { _id: '16', name: 'Dương Thị Q', email: 'duongthiq@example.com', username: 'duongthiq', isLocked: false, role: 'User' },
    { _id: '17', name: 'Tạ Văn R', email: 'tavanr@example.com', username: 'tavanr', isLocked: true, role: 'User' },
    { _id: '18', name: 'Kiều Thị S', email: 'kieuthis@example.com', username: 'kieuthis', isLocked: false, role: 'Manager' },
    { _id: '19', name: 'Phùng Văn T', email: 'phungvant@example.com', username: 'phungvant', isLocked: false, role: 'User' },
    { _id: '20', name: 'Mai Thị U', email: 'maithiu@example.com', username: 'maithiu', isLocked: false, role: 'User' },
  ];

  // This is table showed in the Admin Dashboard with List of users
  // Set List of Users:
  const [userList, setUserList] = useState(sampleUsers);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Auth context
  const { user, isAuthenticated } = useAuth();

  //PreLoader visibility
  const [preLoaderVisibility, setPreLoaderVisibility] = useState('none');

  const allSelected = userList.length > 0 && selectedIds.size === userList.length;

  const filteredUsers = userList.filter((u) => {
    const matchesSearch = searchText === '' ||
      u.name.toLowerCase().includes(searchText.toLowerCase()) ||
      u.email.toLowerCase().includes(searchText.toLowerCase()) ||
      u.username.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === '' ||
      (statusFilter === 'active' && !u.isLocked) ||
      (statusFilter === 'locked' && u.isLocked);
    const matchesRole = roleFilter === '' || u.role === roleFilter;
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
      if (filteredUsers.length === 0) return new Set();
      if (prev.size > 0) return new Set();
      return new Set(filteredUsers.map((u) => u._id));
    });
  };

  // Lock/Unlock user
  const toggleLockUser = (_id) => {
    setUserList(
      userList.map((u) =>
        u._id === _id ? { ...u, isLocked: !u.isLocked } : u
      )
    );
  };

  const bulkLock = () => {
    setUserList((list) => list.map((u) => (selectedIds.has(u._id) ? { ...u, isLocked: true } : u)));
    setSelectedIds(new Set());
  };

  const bulkUnlock = () => {
    setUserList((list) => list.map((u) => (selectedIds.has(u._id) ? { ...u, isLocked: false } : u)));
    setSelectedIds(new Set());
  };

  const updateUserRole = (_id, role) => {
    setUserList((list) => list.map((u) => (u._id === _id ? { ...u, role } : u)));
  };

  const bulkDelete = () => {
    setUserList((list) => list.filter((u) => !selectedIds.has(u._id)));
    setSelectedIds(new Set());
  };

  const exportData = () => {
    if (selectedIds.size === 0) return;
    setShowExportDialog(true);
  };

  const exportCSV = () => {
    const selectedUsers = userList.filter((u) => selectedIds.has(u._id));
    const csv = [
      ['#', 'Name', 'Email', 'Username', 'Status'],
      ...selectedUsers.map((u) => [
        u._id,
        u.name,
        u.email,
        u.username,
        u.isLocked ? 'Đã khóa' : 'Hoạt động',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${Date.now()}.csv`;
    link.click();
    setShowExportDialog(false);
  };

  const exportJSON = () => {
    const selectedUsers = userList.filter((u) => selectedIds.has(u._id));
    const json = JSON.stringify(selectedUsers, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${Date.now()}.json`;
    link.click();
    setShowExportDialog(false);
  };

  // Delete user when admin click on delete button and update the dashboard
  const deleteUserAdmin = (_id) => {
    setUserList(userList.filter((u) => u._id !== _id));
  };

  let serialNo = 1;

  return (
    <>
      <PreLoader visibility={preLoaderVisibility} />

      <div className='manage-users-wrapper' style={{ padding: '24px' }}>
        <div className='bg-white rounded p-3 shadow-sm'>
          <div className='d-flex justify-content-between align-items-center mb-3'>
            <h5 className='mb-0'>Danh sách người dùng</h5>
          </div>

          <div className='d-flex gap-3 mb-3' style={{ position: 'sticky', top: 0, zIndex: 1000, backgroundColor: 'white', padding: '10px 0' }}>
            <div className='flex-grow-1'>
              <input
                type='text'
                className='form-control'
                placeholder='Tìm kiếm theo tên, email hoặc username...'
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
                <option value='active'>Hoạt động</option>
                <option value='locked'>Đã khóa</option>
              </select>
            </div>
            <div style={{ minWidth: '200px' }}>
              <select
                className='form-control'
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value=''>Tất cả vai trò</option>
                <option value='User'>User</option>
                <option value='Manager'>Manager</option>
                <option value='Admin'>Admin</option>
              </select>
            </div>
          </div>

          <div className='table-responsive'>
            <table className='table table-borderless table-hover manage-users-table mb-0'>
          <thead className='thead-light' style={{ position: 'sticky', top: '60px', zIndex: 990 }}>
            <tr>
              <th className='text-secondary text-left' scope='col' style={{ width: '120px' }}>
                <button
                  className='btn btn-sm btn-outline-primary'
                  onClick={toggleSelectAll}
                >
                  {selectedIds.size > 0 ? 'Bỏ chọn' : 'Chọn tất cả'}
                </button>
              </th>
              <th className='text-secondary text-left' scope='col'>
                #
              </th>
              <th className='text-secondary' scope='col'>
                Name
              </th>
              <th className='text-secondary' scope='col'>
                Email
              </th>
              <th className='text-secondary' scope='col'>
                Username
              </th>
              <th className='text-secondary' scope='col'>
                Status
              </th>
              <th className='text-secondary' scope='col'>
                Vai trò
              </th>
              <th className='text-secondary' scope='col'>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((userItem) => (
                <tr key={userItem._id}>
                  <td>
                    <input
                      type='checkbox'
                      checked={selectedIds.has(userItem._id)}
                      onChange={() => toggleSelect(userItem._id)}
                      style={{ width: '20px', height: '20px' }}
                    />
                  </td>
                  <td>{serialNo++}</td>
                  <td>{userItem.name}</td>
                  <td>{userItem.email}</td>
                  <td>{userItem.username}</td>
                  <td>
                    <span className={`badge ${userItem.isLocked ? 'badge-danger' : 'badge-success'}`}>
                      {userItem.isLocked ? 'Đã khóa' : 'Hoạt động'}
                    </span>
                  </td>
                  <td>
                    <select
                      className='form-control form-control-sm'
                      value={userItem.role}
                      onChange={(e) => updateUserRole(userItem._id, e.target.value)}
                    >
                      <option value='User'>User</option>
                      <option value='Manager'>Manager</option>
                      <option value='Admin'>Admin</option>
                    </select>
                  </td>
                  <td>
                    <div className='d-flex justify-content-between align-items-center'>
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                        <button
                          onClick={() => toggleLockUser(userItem._id)}
                          className={`btn btn-sm ${userItem.isLocked ? 'btn-success' : 'btn-warning'}`}
                          title={userItem.isLocked ? 'Mở khóa' : 'Khóa'}
                          style={{ minWidth: '95px' }}
                        >
                          <FontAwesomeIcon icon={userItem.isLocked ? faLockOpen : faLock} size='xs' />
                          {' '}
                          {userItem.isLocked ? 'Mở khóa' : 'Khóa'}
                        </button>
                      </div>
                      <button
                        onClick={() => deleteUserAdmin(userItem._id)}
                        className='btn btn-danger btn-sm'
                      >
                        {' '}
                        <FontAwesomeIcon icon={faTrash} size='xs' />{' '}
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan='6' className='text-center'>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
          </div>
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
                <button className='btn btn-primary' onClick={exportCSV}>
                  CSV
                </button>
                <button className='btn btn-primary' onClick={exportJSON}>
                  JSON
                </button>
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
                <strong>{selectedIds.size}</strong> người dùng đã chọn
              </span>
            </div>
            <div className='d-flex gap-2'>
              <button className='btn btn-primary btn-sm mr-2' onClick={exportData}>
                Xuất dữ liệu
              </button>
              <button className='btn btn-warning btn-sm mr-2' onClick={bulkLock}>
                Khóa
              </button>
              <button className='btn btn-success btn-sm mr-2' onClick={bulkUnlock}>
                Mở khóa
              </button>
              <button className='btn btn-danger btn-sm' onClick={bulkDelete}>
                Xóa
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default ManageUsers;
