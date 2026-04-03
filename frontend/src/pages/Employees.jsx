import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', position: '', baseSalary: '', currency: 'JOD' });

  const load = () => api.get('/employees').then((res) => setEmployees(res.data));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/employees', { ...form, baseSalary: parseFloat(form.baseSalary) });
      toast.success('Employee added');
      setShowForm(false);
      setForm({ name: '', position: '', baseSalary: '', currency: 'JOD' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error adding employee');
    }
  };

  const toggleActive = async (emp) => {
    try {
      await api.put(`/employees/${emp.id}`, { active: !emp.active });
      toast.success(emp.active ? 'Employee deactivated' : 'Employee activated');
      load();
    } catch (err) {
      toast.error('Error updating employee');
    }
  };

  const handleDelete = async (emp) => {
    if (!confirm(`Delete ${emp.name}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/employees/${emp.id}`);
      toast.success('Employee deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error deleting employee');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Employees</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 text-sm">
          {showForm ? 'Cancel' : '+ Add Employee'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
            <input type="text" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Base Salary</label>
            <input type="number" step="0.01" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full border rounded px-3 py-2">
              <option value="JOD">JOD</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700">Add Employee</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-slate-600">Name</th>
              <th className="text-left p-3 text-slate-600">Position</th>
              <th className="text-right p-3 text-slate-600">Base Salary</th>
              <th className="text-left p-3 text-slate-600">Currency</th>
              <th className="text-left p-3 text-slate-600">Status</th>
              <th className="text-left p-3 text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id} className="border-t hover:bg-slate-50">
                <td className="p-3">{e.name}</td>
                <td className="p-3">{e.position}</td>
                <td className="p-3 text-right font-mono">{parseFloat(e.baseSalary).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="p-3">{e.currency}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${e.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {e.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3 space-x-3">
                  <button onClick={() => toggleActive(e)} className="text-sm text-blue-600 hover:underline">
                    {e.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleDelete(e)} className="text-sm text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-slate-400">No employees yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
