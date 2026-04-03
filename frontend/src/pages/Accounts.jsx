import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
const BALANCES = ['DEBIT', 'CREDIT'];

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', type: 'ASSET', normalBalance: 'DEBIT' });

  const load = () => api.get('/accounts').then((res) => setAccounts(res.data));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/accounts', form);
      toast.success('Account created');
      setShowForm(false);
      setForm({ code: '', name: '', type: 'ASSET', normalBalance: 'DEBIT' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error creating account');
    }
  };

  const typeColors = {
    ASSET: 'bg-blue-100 text-blue-700',
    LIABILITY: 'bg-red-100 text-red-700',
    EQUITY: 'bg-purple-100 text-purple-700',
    REVENUE: 'bg-green-100 text-green-700',
    EXPENSE: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Chart of Accounts</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 text-sm">
          {showForm ? 'Cancel' : '+ Add Account'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
            <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full border rounded px-3 py-2" required placeholder="e.g. 6000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border rounded px-3 py-2">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Normal Balance</label>
            <select value={form.normalBalance} onChange={(e) => setForm({ ...form, normalBalance: e.target.value })} className="w-full border rounded px-3 py-2">
              {BALANCES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700">Create Account</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-slate-600">Code</th>
              <th className="text-left p-3 text-slate-600">Name</th>
              <th className="text-left p-3 text-slate-600">Type</th>
              <th className="text-left p-3 text-slate-600">Normal Balance</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-t hover:bg-slate-50">
                <td className="p-3 font-mono">{a.code}</td>
                <td className="p-3">{a.name}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${typeColors[a.type]}`}>{a.type}</span></td>
                <td className="p-3">{a.normalBalance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
