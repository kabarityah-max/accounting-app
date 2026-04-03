import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { currency, toggleCurrency } = useCurrency();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold text-emerald-400">AccountingApp</Link>
            <Link to="/" className="hover:text-emerald-300 px-2 py-1 text-sm">Dashboard</Link>
            <Link to="/transactions" className="hover:text-emerald-300 px-2 py-1 text-sm">Transactions</Link>
            {isAdmin && (
              <>
                <Link to="/users" className="hover:text-emerald-300 px-2 py-1 text-sm">Users</Link>
                <Link to="/salaries" className="hover:text-emerald-300 px-2 py-1 text-sm">Salaries</Link>
                <Link to="/employees" className="hover:text-emerald-300 px-2 py-1 text-sm">Employees</Link>
                <Link to="/accounts" className="hover:text-emerald-300 px-2 py-1 text-sm">Accounts</Link>
                <Link to="/periods" className="hover:text-emerald-300 px-2 py-1 text-sm">Periods</Link>
                <Link to="/reports" className="hover:text-emerald-300 px-2 py-1 text-sm">Reports</Link>
              </>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleCurrency}
              className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm font-mono"
            >
              {currency}
            </button>
            <span className="text-sm text-slate-300">{user.name}</span>
            <span className="text-xs bg-emerald-600 px-2 py-0.5 rounded">{user.role}</span>
            <button onClick={handleLogout} className="text-sm hover:text-red-300">Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
}
