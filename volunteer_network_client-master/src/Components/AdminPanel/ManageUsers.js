import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrash, 
  faLock, 
  faLockOpen, 
  faFileExport, 
  faTimes, 
  faCheck,
  faSearch,
  faFileCsv,
  faFileCode,
  faDownload,
  faSync
} from '@fortawesome/free-solid-svg-icons';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import PreLoader from '../PreLoader/PreLoader';
import { userService } from '../../services/apiService';
import './ManageUsers.css';
// ==============================================================================

const ManageUsers = () => {
  // Removed sampleUsers

  // This is table showed in the Admin Dashboard with List of users
  // Set List of Users:
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers();
      let users = [];
      if (response._embedded && response._embedded.users) {
        users = response._embedded.users;
      } else if (response.content) {
        users = response.content;
      } else if (Array.isArray(response)) {
        users = response;
      }

      const mappedUsers = users.map(u => {
        let role = u.role || (Array.isArray(u.roles) ? u.roles[0] : 'USER');
        role = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
        
        return {
          _id: u.id,
          name: u.fullName || `${u.lastname} ${u.firstname}`,
          email: u.email || 'N/A',
          username: u.username,
          isActive: u.isActive ?? true,
          role: role
        };
      });
      setUserList(mappedUsers);
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoading(false);
    }
  };
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showRoleConfirm, setShowRoleConfirm] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
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
      // u.email.toLowerCase().includes(searchText.toLowerCase()) ||
      u.username.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === '' ||
      (statusFilter === 'active' && u.isActive) ||
      (statusFilter === 'locked' && !u.isActive);
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
  const toggleLockUser = async (_id) => {
    const user = userList.find(u => u._id === _id);
    if (!user) return;

    try {
      if (user.isActive) {
        // User is currently active, so deactivate them
        await userService.deactivateUser(_id);
      } else {
        // User is currently locked, so activate them
        await userService.activateUser(_id);
      }
      
      setUserList(
        userList.map((u) =>
          u._id === _id ? { ...u, isActive: !u.isActive } : u
        )
      );
    } catch (error) {
      console.error("Failed to toggle user lock status", error);
      alert("Failed to update user status");
    }
  };

  const bulkLock = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      try {
        await userService.deactivateUser(id);
      } catch (error) {
        console.error(`Failed to lock user ${id}`, error);
      }
    }
    loadUsers();
    setSelectedIds(new Set());
  };

  const bulkUnlock = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      try {
        await userService.activateUser(id);
      } catch (error) {
        console.error(`Failed to unlock user ${id}`, error);
      }
    }
    loadUsers();
    setSelectedIds(new Set());
  };

  const updateUserRole = async (_id, role) => {
    try {
      setLoading(true);
      await userService.setUserRole(_id, role.toUpperCase());
      setUserList((list) => list.map((u) => (u._id === _id ? { ...u, role } : u)));
    } catch (error) {
      console.error("Failed to update user role", error);
      alert("Không thể cập nhật vai trò người dùng. Vui lòng thử lại.");
      // Reload to revert changes
      await loadUsers();
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChangeRequest = (_id, newRole) => {
    const user = userList.find(u => u._id === _id);
    if (user && user.role !== newRole) {
      setPendingRoleChange({ _id, newRole, name: user.name, oldRole: user.role });
      setShowRoleConfirm(true);
    }
  };

  const confirmRoleChange = async () => {
    if (pendingRoleChange) {
      await updateUserRole(pendingRoleChange._id, pendingRoleChange.newRole);
      setPendingRoleChange(null);
      setShowRoleConfirm(false);
    }
  };

  const cancelRoleChange = () => {
    setPendingRoleChange(null);
    setShowRoleConfirm(false);
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
      ['#', 'Name', 'Username', 'Status'],
      ...selectedUsers.map((u) => [
        u._id,
        u.name,
        // u.email,
        u.username,
        u.isActive ? 'Hoạt động' : 'Đã khóa',
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

  const deleteUserAdmin = (_id) => {
    setUserList(userList.filter((u) => u._id !== _id));
  };

  let serialNo = 1;

  return (
    <>
      <PreLoader visibility={preLoaderVisibility} />

      <div className='manage-users-wrapper'>
        <div className='manage-users-card'>
          <div className='manage-users-header'>
            <div>
              <h5 className='mb-1 font-weight-bold'>Danh sách người dùng</h5>
              <p className='text-muted mb-0 small'>Quản lý tài khoản và phân quyền người dùng</p>
            </div>
            <div className='d-flex align-items-center'>
              <div className='text-muted font-weight-bold mr-3'>
                Tổng số: {filteredUsers.length}
              </div>
              <button className='btn btn-outline-primary btn-sm' onClick={loadUsers} title="Làm mới dữ liệu">
                <FontAwesomeIcon icon={faSync} />
              </button>
            </div>
          </div>

          <div className='manage-users-filters'>
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
                  placeholder='Tìm kiếm theo họ, tên, username...'
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
                <option value='Admin'>Admin</option>
              </select>
            </div>
          </div>

          <div className='table-responsive'>
            <table className='table table-hover manage-users-table mb-0'>
              <thead>
                <tr>
                  <th scope='col' style={{ width: '50px' }}>
                    <div className="custom-control custom-checkbox">
                      <input
                        type="checkbox"
                        className="custom-control-input"
                        id="selectAll"
                        checked={selectedIds.size === filteredUsers.length && filteredUsers.length > 0}
                        onChange={toggleSelectAll}
                      />
                      <label className="custom-control-label" htmlFor="selectAll"></label>
                    </div>
                  </th>
                  <th scope='col'>#</th>
                  <th scope='col'>Họ và tên</th>
                  {/* <th scope='col'>Email</th> */}
                  <th scope='col'>Username</th>
                  <th scope='col'>Trạng thái</th>
                  <th scope='col'>Vai trò</th>
                  <th scope='col' className="text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((userItem, index) => (
                    <tr key={userItem._id}>
                      <td>
                        <div className="custom-control custom-checkbox">
                          <input
                            type="checkbox"
                            className="custom-control-input"
                            id={`user-${userItem._id}`}
                            checked={selectedIds.has(userItem._id)}
                            onChange={() => toggleSelect(userItem._id)}
                          />
                          <label className="custom-control-label" htmlFor={`user-${userItem._id}`}></label>
                        </div>
                      </td>
                      <td>{index + 1}</td>
                      <td>
                        <div className="font-weight-bold">{userItem.name}</div>
                      </td>
                      {/* <td>{userItem.email}</td> */}
                      <td>{userItem.username}</td>
                      <td>
                        <span className={`user-status-badge ${userItem.isActive ? 'active' : 'locked'}`}>
                          {userItem.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td>
                        <select
                          className={`form-control form-control-sm role-select ${userItem.role ? userItem.role.toLowerCase() : ''}`}
                          value={userItem.role}
                          onChange={(e) => handleRoleChangeRequest(userItem._id, e.target.value)}
                          style={{ width: '100px' }}
                        >
                          <option value='User'>User</option>
                          <option value='Admin'>Admin</option>
                        </select>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => toggleLockUser(userItem._id)}
                          className={`btn btn-sm action-btn ${userItem.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                          title={userItem.isActive ? 'Khóa' : 'Mở khóa'}
                        >
                          <FontAwesomeIcon icon={userItem.isActive ? faLock : faLockOpen} />
                        </button>
                        <button
                          onClick={() => deleteUserAdmin(userItem._id)}
                          className='btn btn-outline-danger btn-sm action-btn'
                          title="Xóa"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan='7' className='text-center py-5'>
                      <div className="text-muted">
                        <FontAwesomeIcon icon={faSearch} size="3x" className="mb-3 opacity-50" />
                        <p>Không tìm thấy người dùng nào phù hợp.</p>
                      </div>
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
                {selectedIds.size} người dùng đã chọn
              </span>
            </div>
            <div className='d-flex gap-2'>
              <button className='btn btn-primary btn-sm mr-2' onClick={exportData}>
                <FontAwesomeIcon icon={faDownload} className="mr-1" /> Xuất dữ liệu
              </button>
              <button className='btn btn-warning btn-sm mr-2' onClick={bulkLock}>
                <FontAwesomeIcon icon={faLock} className="mr-1" /> Khóa
              </button>
              <button className='btn btn-success btn-sm mr-2' onClick={bulkUnlock}>
                <FontAwesomeIcon icon={faLockOpen} className="mr-1" /> Mở khóa
              </button>
              <button className='btn btn-danger btn-sm' onClick={bulkDelete}>
                <FontAwesomeIcon icon={faTrash} className="mr-1" /> Xóa
              </button>
            </div>
          </div>,
          document.body
        )}

      {showRoleConfirm && pendingRoleChange && ReactDOM.createPortal(
        <div className="confirm-overlay" onClick={cancelRoleChange}>
          <div className="confirm-card" onClick={e => e.stopPropagation()}>
            <h5 className="mb-3">Xác nhận thay đổi vai trò</h5>
            <p>
              Bạn có chắc chắn muốn thay đổi vai trò của <strong>{pendingRoleChange.name}</strong> từ 
              <span className="badge badge-secondary mx-1">{pendingRoleChange.oldRole}</span> sang 
              <span className="badge badge-primary mx-1">{pendingRoleChange.newRole}</span>?
            </p>
            <div className="d-flex justify-content-end mt-4">
              <button className="btn btn-light mr-2" onClick={cancelRoleChange}>Hủy</button>
              <button className="btn btn-primary" onClick={confirmRoleChange}>Xác nhận</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ManageUsers;
