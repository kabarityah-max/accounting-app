import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import toast from 'react-hot-toast';

const TYPES = ['SALE', 'PURCHASE', 'SERVICE_SALE', 'SERVICE_PURCHASE'];

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  description: '',
  type: 'SALE',
  currency: 'JOD',
  exchangeRate: '0.71',
  amount: '',
  counterparty: '',
  periodId: '',
  notes: '',
  debitAccountId: '',
  creditAccountId: '',
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const { currency: displayCurrency, formatAmount } = useCurrency();

  const [form, setForm] = useState({ ...emptyForm, type: searchParams.get('type') || 'SALE' });

  const load = () => {
    api.get('/transactions').then((res) => setTransactions(res.data));
    api.get('/periods').then((res) => setPeriods(res.data));
    api.get('/accounts').then((res) => setAccounts(res.data));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ ...emptyForm, type: searchParams.get('type') || 'SALE' });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (t) => {
    const debitEntry = t.journalEntries?.find((e) => parseFloat(e.debitAmount) > 0);
    const creditEntry = t.journalEntries?.find((e) => parseFloat(e.creditAmount) > 0);
    const amount = debitEntry ? parseFloat(debitEntry.debitAmount) : creditEntry ? parseFloat(creditEntry.creditAmount) : '';

    setForm({
      date: new Date(t.date).toISOString().split('T')[0],
      description: t.description,
      type: t.type,
      currency: t.currency,
      exchangeRate: String(t.exchangeRate),
      amount: String(amount),
      counterparty: '',
      periodId: t.periodId ? String(t.periodId) : '',
      notes: debitEntry?.note || creditEntry?.note || '',
      debitAccountId: debitEntry ? String(debitEntry.accountId) : '',
      creditAccountId: creditEntry ? String(creditEntry.accountId) : '',
    });
    setEditingId(t.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.debitAccountId && !form.creditAccountId) {
      toast.error('Select at least a debit or credit account');
      return;
    }
    const payload = {
      ...form,
      exchangeRate: parseFloat(form.exchangeRate),
      amount: parseFloat(form.amount),
      periodId: form.periodId ? parseInt(form.periodId) : null,
      debitAccountId: form.debitAccountId ? parseInt(form.debitAccountId) : null,
      creditAccountId: form.creditAccountId ? parseInt(form.creditAccountId) : null,
    };
    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}`, payload);
        toast.success('Transaction updated');
      } else {
        await api.post('/transactions', payload);
        toast.success('Transaction created');
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error saving transaction');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Transaction deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error deleting transaction');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Transactions</h1>
        <button onClick={() => { showForm ? resetForm() : setShowForm(true); }} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 text-sm">
          {showForm ? 'Cancel' : '+ New Transaction'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border rounded px-3 py-2">
              {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Counterparty</label>
            <input type="text" value={form.counterparty} onChange={(e) => setForm({ ...form, counterparty: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Vendor / Customer" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
            <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full border rounded px-3 py-2">
              <option value="JOD">JOD</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Debit Account</label>
            <select value={form.debitAccountId} onChange={(e) => setForm({ ...form, debitAccountId: e.target.value })} className="w-full border rounded px-3 py-2">
              <option value="">-- None (no debit) --</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Credit Account</label>
            <select value={form.creditAccountId} onChange={(e) => setForm({ ...form, creditAccountId: e.target.value })} className="w-full border rounded px-3 py-2">
              <option value="">-- None (no credit) --</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Exchange Rate (1 USD = ? JOD)</label>
            <input type="number" step="0.0001" value={form.exchangeRate} onChange={(e) => setForm({ ...form, exchangeRate: e.target.value })} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
            <select value={form.periodId} onChange={(e) => setForm({ ...form, periodId: e.target.value })} className="w-full border rounded px-3 py-2">
              <option value="">-- None --</option>
              {periods.map((p) => <option key={p.id} value={p.id}>{p.name}{p.isClosed ? ' (Closed)' : ''}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border rounded px-3 py-2" rows={2} />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700">
              {editingId ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-slate-600">Date</th>
              <th className="text-left p-3 text-slate-600">Description</th>
              <th className="text-left p-3 text-slate-600">Type</th>
              <th className="text-left p-3 text-slate-600">Debit Account</th>
              <th className="text-left p-3 text-slate-600">Credit Account</th>
              <th className="text-right p-3 text-slate-600">Amount</th>
              <th className="text-left p-3 text-slate-600">Period</th>
              {isAdmin && <th className="text-left p-3 text-slate-600">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => {
              const debitEntry = t.journalEntries?.find((e) => parseFloat(e.debitAmount) > 0);
              const creditEntry = t.journalEntries?.find((e) => parseFloat(e.creditAmount) > 0);
              const amount = debitEntry ? parseFloat(debitEntry.debitAmount) : creditEntry ? parseFloat(creditEntry.creditAmount) : 0;

              return (
                <tr key={t.id} className="border-t hover:bg-slate-50">
                  <td className="p-3">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="p-3">{t.description}</td>
                  <td className="p-3"><span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{t.type.replace(/_/g, ' ')}</span></td>
                  <td className="p-3 text-sm">{debitEntry ? `${debitEntry.account.code} - ${debitEntry.account.name}` : '-'}</td>
                  <td className="p-3 text-sm">{creditEntry ? `${creditEntry.account.code} - ${creditEntry.account.name}` : '-'}</td>
                  <td className="p-3 text-right font-mono">{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-slate-500">{t.period?.name || '-'}</td>
                  {isAdmin && (
                    <td className="p-3 space-x-2">
                      <button onClick={() => startEdit(t)} className="text-blue-600 hover:underline text-xs">Edit</button>
                      <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                    </td>
                  )}
                </tr>
              );
            })}
            {transactions.length === 0 && (
              <tr><td colSpan={isAdmin ? 8 : 7} className="p-4 text-center text-slate-400">No transactions yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
