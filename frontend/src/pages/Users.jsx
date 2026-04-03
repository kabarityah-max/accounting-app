import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
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
      await api.post('/users', { name, email, password });
      toast.success('User created successfully');
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

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;

    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user');
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#F8FAFB' }}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8" style={{ color: '#163C6C' }}>Users</h1>

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
                style={{ borderColor: '#E5E7EB', focusOutline: 'none' }}
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
                      <th className="px-6 py-3 text-left text-sm font-semibold" style={{ color: '#163C6C' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-blue-50 transition" style={{ borderBottomColor: '#E5E7EB' }}>
                        <td className="px-6 py-4 text-sm" style={{ color: '#1F2937' }}>{user.name}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#1F2937' }}>{user.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#1A80AA' }}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleDelete(user.id)}
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
      </div>
    </div>
  );
}
