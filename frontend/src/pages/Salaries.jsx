import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

export default function Salaries() {
  const [payments, setPayments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    periodId: '',
    amount: '',
    currency: 'JOD',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const load = () => {
    api.get('/salaries').then((res) => setPayments(res.data));
    api.get('/employees').then((res) => setEmployees(res.data));
    api.get('/periods').then((res) => setPeriods(res.data));
  };

  useEffect(() => { load(); }, []);

  const handleEmployeeChange = (empId) => {
    const emp = employees.find((e) => e.id === parseInt(empId));
    setForm({
      ...form,
      employeeId: empId,
      amount: emp ? emp.baseSalary : '',
      currency: emp ? emp.currency : 'JOD',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/salaries', {
        ...form,
        employeeId: parseInt(form.employeeId),
        periodId: form.periodId ? parseInt(form.periodId) : null,
        amount: parseFloat(form.amount),
      });
      toast.success('Salary paid');
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error paying salary');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Salary Payments</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm">
          {showForm ? 'Cancel' : '+ Pay Salary'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Employee</label>
            <select value={form.employeeId} onChange={(e) => handleEmployeeChange(e.target.value)} className="w-full border rounded px-3 py-2" required>
              <option value="">Select employee</option>
              {employees.filter((e) => e.active).map((e) => <option key={e.id} value={e.id}>{e.name} - {e.position}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Period</label>
            <select value={form.periodId} onChange={(e) => setForm({ ...form, periodId: e.target.value })} className="w-full border rounded px-3 py-2">
              <option value="">-- None --</option>
              {periods.filter((p) => !p.isClosed).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
            <input type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border rounded px-3 py-2" />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">Pay Salary</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-slate-600">Date</th>
              <th className="text-left p-3 text-slate-600">Employee</th>
              <th className="text-right p-3 text-slate-600">Amount</th>
              <th className="text-left p-3 text-slate-600">Currency</th>
              <th className="text-left p-3 text-slate-600">Period</th>
              <th className="text-left p-3 text-slate-600">Notes</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t hover:bg-slate-50">
                <td className="p-3">{new Date(p.paymentDate).toLocaleDateString()}</td>
                <td className="p-3">{p.employee?.name}</td>
                <td className="p-3 text-right font-mono">{parseFloat(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="p-3">{p.currency}</td>
                <td className="p-3">{p.period?.name || '-'}</td>
                <td className="p-3 text-slate-500">{p.notes || '-'}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-slate-400">No salary payments yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
