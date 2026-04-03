import { useState, useEffect } from 'react';
import api from '../api';
import { useCurrency } from '../context/CurrencyContext';

export default function Reports() {
  const [tab, setTab] = useState('trial-balance');
  const [periods, setPeriods] = useState([]);
  const [periodId, setPeriodId] = useState('');
  const [data, setData] = useState(null);
  const { currency, formatAmount } = useCurrency();

  useEffect(() => {
    api.get('/periods').then((res) => setPeriods(res.data));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (periodId) params.set('periodId', periodId);
    params.set('currency', currency);

    api.get(`/reports/${tab}?${params}`).then((res) => setData(res.data));
  }, [tab, periodId, currency]);

  const exportPdf = () => {
    const params = new URLSearchParams();
    if (periodId) params.set('periodId', periodId);
    params.set('currency', currency);
    window.open(`/api/reports/export-pdf/${tab}?${params}`, '_blank');
  };

  const tabs = [
    { id: 'trial-balance', label: 'Trial Balance' },
    { id: 'income-statement', label: 'Income Statement' },
    { id: 'balance-sheet', label: 'Balance Sheet' },
    { id: 'general-ledger', label: 'General Ledger' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Financial Reports</h1>
        <div className="flex items-center gap-3">
          <select value={periodId} onChange={(e) => setPeriodId(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
            <option value="">All Periods</option>
            {periods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {tab !== 'general-ledger' && (
            <button onClick={exportPdf} className="bg-red-600 text-white px-4 py-1.5 rounded hover:bg-red-700 text-sm">
              Export PDF
            </button>
          )}
        </div>
      </div>

      <div className="flex space-x-1 mb-6 bg-slate-100 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setData(null); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === t.id ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!data ? (
        <div className="text-center text-slate-500 py-8">Loading...</div>
      ) : tab === 'trial-balance' ? (
        <TrialBalance data={data} formatAmount={formatAmount} />
      ) : tab === 'income-statement' ? (
        <IncomeStatement data={data} formatAmount={formatAmount} />
      ) : tab === 'balance-sheet' ? (
        <BalanceSheet data={data} formatAmount={formatAmount} />
      ) : (
        <GeneralLedger data={data} formatAmount={formatAmount} />
      )}
    </div>
  );
}

function TrialBalance({ data, formatAmount }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left p-3 text-slate-600">Account</th>
            <th className="text-right p-3 text-slate-600">Debit ({data.currency})</th>
            <th className="text-right p-3 text-slate-600">Credit ({data.currency})</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r) => (
            <tr key={r.code} className="border-t hover:bg-slate-50">
              <td className="p-3">{r.code} - {r.name}</td>
              <td className="p-3 text-right font-mono">{r.debit > 0 ? formatAmount(r.debit) : '-'}</td>
              <td className="p-3 text-right font-mono">{r.credit > 0 ? formatAmount(r.credit) : '-'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-100 font-bold">
          <tr>
            <td className="p-3">Total</td>
            <td className="p-3 text-right font-mono">{formatAmount(data.totalDebit)}</td>
            <td className="p-3 text-right font-mono">{formatAmount(data.totalCredit)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function IncomeStatement({ data, formatAmount }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h3 className="font-bold text-lg text-slate-800 mb-3">Revenue</h3>
        {data.revenue.map((r) => (
          <div key={r.code} className="flex justify-between py-1 px-2">
            <span>{r.code} - {r.name}</span>
            <span className="font-mono">{formatAmount(r.amount)}</span>
          </div>
        ))}
        <div className="flex justify-between py-2 px-2 border-t font-bold text-emerald-600">
          <span>Total Revenue</span>
          <span className="font-mono">{formatAmount(data.totalRevenue)}</span>
        </div>
      </div>
      <div>
        <h3 className="font-bold text-lg text-slate-800 mb-3">Expenses</h3>
        {data.expenses.map((e) => (
          <div key={e.code} className="flex justify-between py-1 px-2">
            <span>{e.code} - {e.name}</span>
            <span className="font-mono">{formatAmount(e.amount)}</span>
          </div>
        ))}
        <div className="flex justify-between py-2 px-2 border-t font-bold text-red-600">
          <span>Total Expenses</span>
          <span className="font-mono">{formatAmount(data.totalExpenses)}</span>
        </div>
      </div>
      <div className={`flex justify-between py-3 px-2 border-t-2 text-xl font-bold ${data.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
        <span>Net {data.netProfit >= 0 ? 'Profit' : 'Loss'}</span>
        <span className="font-mono">{formatAmount(Math.abs(data.netProfit))}</span>
      </div>
    </div>
  );
}

function BalanceSheet({ data, formatAmount }) {
  const Section = ({ title, items, total, color }) => (
    <div className="mb-6">
      <h3 className={`font-bold text-lg mb-3 ${color}`}>{title}</h3>
      {items.map((i) => (
        <div key={i.code} className="flex justify-between py-1 px-2">
          <span>{i.code} - {i.name}</span>
          <span className="font-mono">{formatAmount(i.amount)}</span>
        </div>
      ))}
      <div className={`flex justify-between py-2 px-2 border-t font-bold ${color}`}>
        <span>Total {title}</span>
        <span className="font-mono">{formatAmount(total)}</span>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Section title="Assets" items={data.assets} total={data.totalAssets} color="text-blue-700" />
      <Section title="Liabilities" items={data.liabilities} total={data.totalLiabilities} color="text-red-700" />
      <Section title="Equity" items={data.equity} total={data.totalEquity - data.netProfit} color="text-purple-700" />
      <div className="flex justify-between py-1 px-2">
        <span>Retained Earnings (Net Profit)</span>
        <span className="font-mono">{formatAmount(data.netProfit)}</span>
      </div>
      <div className="flex justify-between py-2 px-2 border-t font-bold text-purple-700">
        <span>Total Equity + Retained Earnings</span>
        <span className="font-mono">{formatAmount(data.totalEquity)}</span>
      </div>
    </div>
  );
}

function GeneralLedger({ data, formatAmount }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left p-3 text-slate-600">Date</th>
            <th className="text-left p-3 text-slate-600">Description</th>
            <th className="text-left p-3 text-slate-600">Account</th>
            <th className="text-right p-3 text-slate-600">Debit</th>
            <th className="text-right p-3 text-slate-600">Credit</th>
            <th className="text-right p-3 text-slate-600">Balance</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r, i) => (
            <tr key={i} className="border-t hover:bg-slate-50">
              <td className="p-3">{new Date(r.date).toLocaleDateString()}</td>
              <td className="p-3">{r.description}</td>
              <td className="p-3">{r.accountCode} - {r.accountName}</td>
              <td className="p-3 text-right font-mono">{r.debit > 0 ? formatAmount(r.debit) : '-'}</td>
              <td className="p-3 text-right font-mono">{r.credit > 0 ? formatAmount(r.credit) : '-'}</td>
              <td className="p-3 text-right font-mono font-bold">{formatAmount(r.balance)}</td>
            </tr>
          ))}
          {data.rows.length === 0 && (
            <tr><td colSpan={6} className="p-4 text-center text-slate-400">No entries found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
