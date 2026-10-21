import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api/axios';

interface LoginPageProps {
  setAdminUser: (username: string) => void;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
}

interface LoginResponse {
  message: string;
  username: string;
  role: 'admin' | 'customer';
}

const LoginPage: React.FC<LoginPageProps> = ({
  setAdminUser,
  isDarkMode = false,
  toggleDarkMode,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        identifier: identifier.trim(),
        password,
      });

      // Strict role check: Do not allow standard customers into the admin portal
      if (response.data.role !== 'admin') {
        await api.post('/auth/logout').catch(() => {}); // Immediately revoke the token
        setMessage("Access denied: Admins only.");
        return;
      }

      setAdminUser(response.data.username);
      navigate('/', { replace: true });
    } catch (error: unknown) {
      if (axios.isAxiosError<{ error?: string }>(error)) {
        setMessage(error.response?.data?.error || "Invalid credentials");
      } else {
        setMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-neutral-950 flex items-center justify-center relative transition-colors">
      {toggleDarkMode && (
        <button
          type="button"
          onClick={toggleDarkMode}
          className="absolute top-6 right-6 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 text-sm font-medium shadow-sm hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          {isDarkMode ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-neutral-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>
      )}

      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-8 rounded-lg shadow-xl w-96 transition-colors">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-neutral-100">Admin Portal</h1>
          <p className="text-slate-500 dark:text-neutral-400 text-sm mt-1">
            Sign in to manage Provi Prints
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="identifier"
              className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1"
            >
              Username or Email
            </label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full p-2 bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 border border-slate-300 dark:border-neutral-700 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-neutral-500 focus:border-blue-500 dark:focus:border-neutral-500 outline-none dark:scheme-dark transition-colors"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 border border-slate-300 dark:border-neutral-700 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-neutral-500 focus:border-blue-500 dark:focus:border-neutral-500 outline-none dark:scheme-dark transition-colors"
              required
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:bg-neutral-200 dark:hover:bg-white dark:disabled:bg-neutral-600 text-white dark:text-neutral-900 p-2.5 rounded disabled:cursor-not-allowed font-semibold transition-colors mt-2"
          >
            {isSubmitting ? 'Authenticating...' : 'Authenticate'}
          </button>
        </form>

        {message && (
          <div
            role="alert"
            className="mt-4 p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-sm text-center rounded border border-red-100 dark:border-red-900/60"
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;