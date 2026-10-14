import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import api from './api/axios';

// Pages
import LoginPage from './pages/LoginPage';
import ProductsPage from './pages/ProductsPage';
import ProductEditPage from './pages/ProductEditPage';
import TownsPage from './pages/TownsPage';
import UsersPage from './pages/UsersPage';

interface AuthSessionResponse {
  id: number;
  username: string;
  role: 'admin' | 'customer';
}

const App: React.FC = () => {
  const [adminUser, setAdminUser] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const controller = new AbortController();

    const verifySession = async () => {
      try {
        const response = await api.get<AuthSessionResponse>('/auth/me', {
          signal: controller.signal,
        });
        if (response.data.role === 'admin') {
          setAdminUser(response.data.username);
        } else {
          // If a customer session cookie is present, revoke it immediately
          await api.post('/auth/logout').catch(() => {});
          setAdminUser(null);
        }
        setIsInitializing(false);
      } catch (error: unknown) {
        // Ignore abort errors caused by React StrictMode double-mounting in development
        if (axios.isCancel(error)) {
          return;
        }
        setAdminUser(null);
        setIsInitializing(false);
      }
    };

    verifySession();

    return () => {
      controller.abort();
    };
  }, []);

  // Wait for session verification before evaluating route guards
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-slate-600 font-medium animate-pulse">
          Verifying session...
        </div>
      </div>
    );
  }

  // If not logged in, force them to the login page (unless they are already there)
  if (!adminUser && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  // If already logged in and visiting the login page, redirect to the dashboard
  if (adminUser && location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  // If they are on the login page, just render the login page without the sidebar
  if (location.pathname === '/login') {
    return <LoginPage setAdminUser={setAdminUser} />;
  }

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error: unknown) {
      console.error("Logout failed", error);
    } finally {
      setAdminUser(null);
      navigate('/login', { replace: true });
    }
  };

  const navItemClass = (path: string): string => {
    const isActive =
      path === '/'
        ? location.pathname === '/'
        : location.pathname === path || location.pathname.startsWith(`${path}/`);

    return `block px-4 py-3 rounded-lg font-medium transition-colors ${
      isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
    }`;
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-800">Provi Admin</h1>
          <p className="text-xs text-slate-500 mt-1">Logged in as {adminUser}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link to="/" className={navItemClass('/')}>Dashboard</Link>
          <Link to="/products" className={navItemClass('/products')}>Products</Link>
          <Link to="/towns" className={navItemClass('/towns')}>Towns</Link>
          <Link to="/users" className={navItemClass('/users')}>Users</Link>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Routes>
          <Route
            path="/"
            element={
              <div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Dashboard</h1>
                <p className="text-slate-600">Select an entity from the sidebar to manage.</p>
              </div>
            }
          />

          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/new" element={<ProductEditPage />} />
          <Route path="/products/edit/:id" element={<ProductEditPage />} />

          <Route path="/towns" element={<TownsPage />} />
          <Route path="/users" element={<UsersPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;