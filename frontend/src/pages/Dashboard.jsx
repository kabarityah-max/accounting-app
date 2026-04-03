import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useCurrency } from '../context/CurrencyContext';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const { currency, formatAmount } = useCurrency();

  useEffect(() => {
    api.get(`/reports/dashboard?currency=${currency}`).then((res) => setData(res.data));
  }, [currency]);

  if (!data) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  const cards = [
    { label: 'Total Revenue', value: data.totalRevenue, color: 'bg-emerald-500' },
    { label: 'Total Expenses', value: data.totalExpenses, color: 'bg-red-500' },
    { label: 'Net Profit', value: data.netProfit, color: data.netProfit >= 0 ? 'bg-blue-500' : 'bg-orange-500' },
    { label: 'Cash Balance', value: data.cashBalance, color: 'bg-purple-500' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className={`${card.color} text-white rounded-lg p-5 shadow`}>
            <p className="text-sm opacity-90">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{formatAmount(card.value)}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-8">
        <Link to="/transactions?type=SALE" className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 text-sm">
          + New Sale
        </Link>
        <Link to="/transactions?type=PURCHASE" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
          + New Purchase
        </Link>
        <Link to="/salaries" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm">
          Pay Salary
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-lg font-semibold p-4 border-b text-slate-800">Recent Transactions</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3 text-slate-600">Date</th>
              <th className="text-left p-3 text-slate-600">Description</th>
              <th className="text-left p-3 text-slate-600">Type</th>
              <th className="text-right p-3 text-slate-600">Amount</th>
              <th className="text-left p-3 text-slate-600">By</th>
            </tr>
          </thead>
          <tbody>
            {data.recentTransactions.map((t) => (
              <tr key={t.id} className="border-t hover:bg-slate-50">
                <td className="p-3">{new Date(t.date).toLocaleDateString()}</td>
                <td className="p-3">{t.description}</td>
                <td className="p-3">
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">{t.type}</span>
                </td>
                <td className="p-3 text-right font-mono">
                  {t.journalEntries?.[0] && formatAmount(parseFloat(t.journalEntries[0].debitAmount || t.journalEntries[0].creditAmount))}
                </td>
                <td className="p-3 text-slate-500">{t.user?.name}</td>
              </tr>
            ))}
            {data.recentTransactions.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-slate-400">No transactions yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
