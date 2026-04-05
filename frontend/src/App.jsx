import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import AcceptInvite from './pages/AcceptInvite';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Salaries from './pages/Salaries';
import Employees from './pages/Employees';
import Accounts from './pages/Accounts';
import Periods from './pages/Periods';
import Reports from './pages/Reports';
import Users from './pages/Users';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  // Public routes that don't need Navbar
  const publicRoutes = ['/login', '/accept-invite'];
  const isPublicRoute = publicRoutes.includes(window.location.pathname);

  return (
    <>
      {!isPublicRoute && <Navbar />}
      <div className={isPublicRoute ? '' : 'min-h-screen bg-slate-100'}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
          <Route path="/salaries" element={<PrivateRoute adminOnly><Salaries /></PrivateRoute>} />
          <Route path="/employees" element={<PrivateRoute adminOnly><Employees /></PrivateRoute>} />
          <Route path="/accounts" element={<PrivateRoute adminOnly><Accounts /></PrivateRoute>} />
          <Route path="/periods" element={<PrivateRoute adminOnly><Periods /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute adminOnly><Reports /></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute adminOnly><Users /></PrivateRoute>} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CurrencyProvider>
          <Toaster position="top-right" />
          <AppRoutes />
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
