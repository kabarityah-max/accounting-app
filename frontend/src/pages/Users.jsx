import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Direct user creation form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('EMPLOYEE');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  // Confirmation modals
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchInvitations();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      // Note: We'll fetch pending invitations from the users list for now
      // In a full implementation, you'd have a GET /api/invitations endpoint
      // For now, this shows the UI is ready for the feature
    } catch (err) {
      console.error('Failed to fetch invitations:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('All fields required');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/users', { name, email, password });

      // Show email delivery status
      if (response.data.emailSent) {
        toast.success(`User created. Welcome email sent to ${email}`);
      } else {
        toast.success(`User created but email failed to send: ${response.data.emailError || 'Unknown error'}`);
      }

      setName('');
      setEmail('');
      setPassword('');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail) {
      toast.error('Email is required');
      return;
    }

    setInviteSubmitting(true);
    try {
      await api.post('/invitations/send', {
        email: inviteEmail,
        role: inviteRole,
      });
      toast.success('Invitation sent successfully');
      setInviteEmail('');
      setInviteRole('EMPLOYEE');
      setShowInviteModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send invitation');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      toast.success('Role updated successfully');
      setEditingRole(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleChangeStatus = async (userId, newStatus) => {
    try {
      await api.patch(`/users/${userId}/status`, { status: newStatus });
      toast.success(`User ${newStatus.toLowerCase()}`);
      setEditingStatus(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await api.delete(`/users/${deleteConfirm}`);
      toast.success('User deleted');
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.error || 'Failed to delete user');
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#F8FAFB' }}>
      <div className="max-w-6xl mx-auto">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 className="text-4xl font-bold" style={{ color: '#163C6C' }}>Users</h1>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-6 py-2 rounded font-medium transition"
            style={{ backgroundColor: '#1A80AA', color: 'white' }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#163C6C')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#1A80AA')}
          >
            + Invite User
          </button>
        </div>

        {/* Add User Form */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8" style={{ borderTop: '4px solid #1A80AA' }}>
          <h2 className="text-2xl font-semibold mb-6" style={{ color: '#163C6C' }}>Add New User</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#163C6C' }}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none transition"
                style={{ borderColor: '#E5E7EB' }}
                onFocus={(e) => (e.target.style.borderColor = '#1A80AA')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#163C6C' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none transition"
                style={{ borderColor: '#E5E7EB' }}
                onFocus={(e) => (e.target.style.borderColor = '#1A80AA')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#163C6C' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none transition"
                style={{ borderColor: '#E5E7EB' }}
                onFocus={(e) => (e.target.style.borderColor = '#1A80AA')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="text-white px-6 py-2 rounded font-medium transition hover:opacity-90"
              style={{ backgroundColor: '#1A80AA' }}
            >
              {submitting ? 'Adding...' : 'Add User'}
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-semibold mb-6" style={{ color: '#163C6C' }}>Users List</h2>
            {loading ? (
              <p style={{ color: '#6B7280' }}>Loading...</p>
            ) : users.length === 0 ? (
              <p style={{ color: '#6B7280' }}>No users yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: '#F8FAFB', borderBottomColor: '#E5E7EB' }} className="border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: '#163C6C' }}>Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: '#163C6C' }}>Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: '#163C6C' }}>Role</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: '#163C6C' }}>Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: '#163C6C' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-blue-50 transition" style={{ borderBottomColor: '#E5E7EB' }}>
                        <td className="px-6 py-4 text-sm" style={{ color: '#1F2937' }}>{user.name}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#1F2937' }}>{user.email}</td>
                        <td className="px-6 py-4 text-sm">
                          {editingRole === user.id ? (
                            <select
                              value={editingRole === user.id ? user.role : ''}
                              onChange={(e) => handleChangeRole(user.id, e.target.value)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '4px',
                                border: '1px solid #D1D5DB',
                                backgroundColor: 'white',
                                color: '#1F2937',
                              }}
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="EMPLOYEE">EMPLOYEE</option>
                            </select>
                          ) : (
                            <span
                              onClick={() => setEditingRole(user.id)}
                              className="px-3 py-1 rounded-full text-xs font-semibold text-white cursor-pointer transition hover:opacity-80"
                              style={{ backgroundColor: '#1A80AA' }}
                            >
                              {user.role}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {editingStatus === user.id ? (
                            <select
                              value={editingStatus === user.id ? user.status : ''}
                              onChange={(e) => handleChangeStatus(user.id, e.target.value)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '4px',
                                border: '1px solid #D1D5DB',
                                backgroundColor: 'white',
                                color: '#1F2937',
                              }}
                            >
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="SUSPENDED">SUSPENDED</option>
                            </select>
                          ) : (
                            <span
                              onClick={() => setEditingStatus(user.id)}
                              className="px-3 py-1 rounded-full text-xs font-semibold text-white cursor-pointer transition hover:opacity-80"
                              style={{ backgroundColor: user.status === 'ACTIVE' ? '#10B981' : '#EF4444' }}
                            >
                              {user.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleDeleteClick(user.id)}
                            className="font-medium transition hover:opacity-70"
                            style={{ color: '#EF4444' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Invite User Modal */}
        {showInviteModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '8px', maxWidth: '400px', width: '90%' }}>
              <h2 style={{ marginBottom: '20px', color: '#163C6C', fontSize: '20px', fontWeight: '600' }}>Invite User</h2>
              <form onSubmit={handleInviteSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#163C6C' }}>Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                    }}
                    disabled={inviteSubmitting}
                    required
                  />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#163C6C' }}>Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px',
                      boxSizing: 'border-box',
                    }}
                    disabled={inviteSubmitting}
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '4px',
                      border: '1px solid #E5E7EB',
                      backgroundColor: 'white',
                      color: '#1F2937',
                      cursor: 'pointer',
                    }}
                    disabled={inviteSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '4px',
                      backgroundColor: '#1A80AA',
                      color: 'white',
                      cursor: 'pointer',
                      border: 'none',
                      opacity: inviteSubmitting ? 0.6 : 1,
                    }}
                    disabled={inviteSubmitting}
                  >
                    {inviteSubmitting ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', maxWidth: '400px' }}>
              <h2 style={{ marginBottom: '16px', color: '#163C6C' }}>Delete User?</h2>
              <p style={{ marginBottom: '24px', color: '#6B7280' }}>This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #E5E7EB', backgroundColor: 'white', color: '#1F2937', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  style={{ padding: '8px 16px', borderRadius: '4px', backgroundColor: '#EF4444', color: 'white', cursor: 'pointer', border: 'none' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
