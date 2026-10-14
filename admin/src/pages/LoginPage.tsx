import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api/axios';

interface LoginPageProps {
  setAdminUser: (username: string) => void;
}

interface LoginResponse {
  message: string;
  username: string;
  role: 'admin' | 'customer';
}

const LoginPage: React.FC<LoginPageProps> = ({ setAdminUser }) => {
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-96">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Admin Portal</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to manage Provi Prints</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="identifier"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Username or Email
            </label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white p-2.5 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-semibold transition-colors mt-2"
          >
            {isSubmitting ? 'Authenticating...' : 'Authenticate'}
          </button>
        </form>

        {message && (
          <div
            role="alert"
            className="mt-4 p-3 bg-red-50 text-red-700 text-sm text-center rounded border border-red-100"
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;