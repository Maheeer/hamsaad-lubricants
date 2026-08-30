import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getAllUsers, createUser, toggleUserAccess, resetUserPassword } from '../../utils/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', role: ''
  });

  const fetchUsers = async () => {
    try {
      const res = await getAllUsers();
      setUsers(res.data.users);
    } catch (err) {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createUser(form);
      toast.success(`${form.role} account created successfully.`);
      setShowCreate(false);
      setForm({ full_name: '', email: '', password: '', role: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user.');
    }
  };

  const handleToggle = async (user) => {
    try {
      await toggleUserAccess(user.id);
      toast.success(`${user.full_name} ${user.is_active ? 'disabled' : 'enabled'}.`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await resetUserPassword(selectedUser.id, { new_password: newPassword });
      toast.success('Password reset successfully.');
      setShowReset(false);
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  const roleColor = {
    admin: '#1F3864', manager: '#2E75B6',
    storekeeper: '#1E7E34', cashier: '#E67E22'
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div>
      <div className="flex-between mb-2">
        <h1 className="page-title" style={{ marginBottom: 0 }}>Staff Users</h1>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          + Add User
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Access Code</th>
              <th>Last Login</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: '600' }}>{u.full_name}</td>
                <td>{u.email}</td>
                <td>
                  <span style={{
                    background: roleColor[u.role] || '#666',
                    color: '#fff', padding: '3px 10px',
                    borderRadius: '12px', fontSize: '11px', fontWeight: '600'
                  }}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '13px', color: '#2E75B6' }}>
                  {u.access_code}
                </td>
                <td style={{ fontSize: '12px', color: '#666' }}>
                  {u.last_login
                    ? new Date(u.last_login).toLocaleString('en-GB')
                    : 'Never'}
                </td>
                <td>
                  <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {u.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button
                      className={u.is_active ? 'btn-danger' : 'btn-success'}
                      style={{ fontSize: '11px', padding: '5px 10px' }}
                      onClick={() => handleToggle(u)}>
                      {u.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn-outline"
                      style={{ fontSize: '11px', padding: '5px 10px' }}
                      onClick={() => { setSelectedUser(u); setShowReset(true); }}>
                      Reset PW
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">Add New Staff User</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Full Name *</label>
                <input value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Enter full name" required />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="Enter email address" required />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  required>
                  <option value="">Select Role</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="storekeeper">Storekeeper</option>
                  <option value="cashier">Cashier</option>
                </select>
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input type="password" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 6 characters" required />
              </div>
              <div className="flex gap-2 mt-2" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline"
                  onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showReset && selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">Reset Password</h2>
            <p style={{ color: '#666', marginBottom: '16px' }}>
              Resetting password for <strong>{selectedUser.full_name}</strong>
            </p>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>New Password *</label>
                <input type="password" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters" required />
              </div>
              <div className="flex gap-2 mt-2" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline"
                  onClick={() => setShowReset(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;