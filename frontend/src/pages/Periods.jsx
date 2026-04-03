import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

export default function Periods() {
  const [periods, setPeriods] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '' });

  const load = () => api.get('/periods').then((res) => setPeriods(res.data));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/periods', form);
      toast.success('Period created');
      setShowForm(false);
      setForm({ name: '', startDate: '', endDate: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error creating period');
    }
  };

  const closePeriod = async (id) => {
    if (!confirm('Close this period? Transactions will be locked.')) return;
    try {
      await api.patch(`/periods/${id}/close`);
      toast.success('Period closed');
      load();
    } catch (err) {
      toast.error('Error closing period');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Financial Periods</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 text-sm">
          {showForm ? 'Cancel' : '+ New Period'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-3 py-2" required placeholder="e.g. Jan 2025" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full border rounded px-3 py-2" required />
          </div>
          <div className="md:col-span-3">
            <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700">Create Period</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-slate-600">Name</th>
              <th className="text-left p-3 text-slate-600">Start</th>
              <th className="text-left p-3 text-slate-600">End</th>
              <th className="text-left p-3 text-slate-600">Status</th>
              <th className="text-left p-3 text-slate-600">Created By</th>
              <th className="text-left p-3 text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.id} className="border-t hover:bg-slate-50">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">{new Date(p.startDate).toLocaleDateString()}</td>
                <td className="p-3">{new Date(p.endDate).toLocaleDateString()}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${p.isClosed ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {p.isClosed ? 'Closed' : 'Open'}
                  </span>
                </td>
                <td className="p-3 text-slate-500">{p.creator?.name}</td>
                <td className="p-3">
                  {!p.isClosed && (
                    <button onClick={() => closePeriod(p.id)} className="text-sm text-red-600 hover:underline">Close</button>
                  )}
                </td>
              </tr>
            ))}
            {periods.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-slate-400">No periods yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
