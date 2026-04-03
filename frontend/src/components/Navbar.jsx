import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { currency, toggleCurrency } = useCurrency();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-[#163C6C] text-white shadow-lg" style={{ backgroundColor: '#163C6C' }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold" style={{ color: '#1A80AA' }}>
            AccountingApp
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/" className="px-3 py-2 text-sm hover:bg-[#1A80AA] rounded transition">
              Dashboard
            </Link>
            <Link to="/transactions" className="px-3 py-2 text-sm hover:bg-[#1A80AA] rounded transition">
              Transactions
            </Link>

            {/* Admin Dropdown */}
            {isAdmin && (
              <div className="relative group">
                <button className="px-3 py-2 text-sm hover:bg-[#1A80AA] rounded transition">
                  Admin ▼
                </button>
                <div className="absolute left-0 mt-0 w-48 bg-[#25638C] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link to="/users" className="block px-4 py-2 text-sm hover:bg-[#1A80AA] first:rounded-t">
                    Users
                  </Link>
                  <Link to="/salaries" className="block px-4 py-2 text-sm hover:bg-[#1A80AA]">
                    Salaries
                  </Link>
                  <Link to="/employees" className="block px-4 py-2 text-sm hover:bg-[#1A80AA]">
                    Employees
                  </Link>
                  <Link to="/accounts" className="block px-4 py-2 text-sm hover:bg-[#1A80AA]">
                    Accounts
                  </Link>
                  <Link to="/periods" className="block px-4 py-2 text-sm hover:bg-[#1A80AA]">
                    Periods
                  </Link>
                  <Link to="/reports" className="block px-4 py-2 text-sm hover:bg-[#1A80AA] last:rounded-b">
                    Reports
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="px-3 py-2 text-sm hover:bg-[#1A80AA] rounded transition"
            >
              ☰ Menu
            </button>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleCurrency}
              className="px-3 py-1 rounded text-sm font-mono hover:bg-[#1A80AA] transition"
              style={{ backgroundColor: 'rgba(26, 128, 170, 0.3)' }}
            >
              {currency}
            </button>
            <span className="text-sm hidden sm:inline">{user.name}</span>
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#1A80AA' }}>
              {user.role}
            </span>
            <button onClick={handleLogout} className="text-sm hover:text-red-300 transition">
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-[#1A80AA]">
            <Link
              to="/"
              className="block px-3 py-2 text-sm hover:bg-[#1A80AA] rounded transition"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/transactions"
              className="block px-3 py-2 text-sm hover:bg-[#1A80AA] rounded transition"
              onClick={() => setMenuOpen(false)}
            >
              Transactions
            </Link>

            {isAdmin && (
              <>
                <div className="px-3 py-2 text-xs font-bold text-[#1A80AA]">ADMIN</div>
                <Link
                  to="/users"
                  className="block px-6 py-2 text-sm hover:bg-[#1A80AA] rounded transition"
                  onClick={() => setMenuOpen(false)}
                >
                  Users
                </Link>
                <Link
                  to="/salaries"
                  className="block px-6 py-2 text-sm hover:bg-[#1A80AA] rounded transition"
                  onClick={() => setMenuOpen(false)}
                >
                  Salaries
                </Link>
                <Link
                  to="/employees"
                  className="block px-6 py-2 text-sm hover:bg-[#1A80AA] rounded transition"
                  onClick={() => setMenuOpen(false)}
                >
                  Employees
                </Link>
                <Link
                  to="/accounts"
                  className="block px-6 py-2 text-sm hover:bg-[#1A80AA] rounded transition"
                  onClick={() => setMenuOpen(false)}
                >
                  Accounts
                </Link>
                <Link
                  to="/periods"
                  className="block px-6 py-2 text-sm hover:bg-[#1A80AA] rounded transition"
                  onClick={() => setMenuOpen(false)}
                >
                  Periods
                </Link>
                <Link
                  to="/reports"
                  className="block px-6 py-2 text-sm hover:bg-[#1A80AA] rounded transition"
                  onClick={() => setMenuOpen(false)}
                >
                  Reports
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
