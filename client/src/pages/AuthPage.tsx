import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

interface AuthPageProps {
  setUser: (username: string) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ setUser }) => {
  const [identifier, setIdentifier] = useState(''); // Email or Username
  const [email, setEmail] = useState(''); // Used for registration
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      if (isLoginMode) {
        const response = await api.post('/auth/login', { identifier, password });
        setUser(response.data.username);
        navigate('/');
      } else {
        const response = await api.post('/auth/register', {
          username: identifier, // Map identifier to username for registration
          email,
          password
        });
        setMessage(response.data.message);
        setIsLoginMode(true);
      }
    } catch (error: any) {
      setMessage(error.response?.data?.error || "An error occurred");
    }
  };

  return (
    <div className="flex items-center justify-center my-20 px-4">
      <div className="bg-white dark:bg-[#1e293b] p-8 rounded-xl shadow-lg w-96 border border-gray-100 dark:border-slate-700/80 transition-colors duration-300">
        <h2 className="text-2xl font-serif font-bold mb-6 text-center text-gray-800 dark:text-[#fdfbf7]">
          {isLoginMode ? 'Login' : 'Create Account'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Identifier (Username/Email for Login, just Username for Register) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              {isLoginMode ? 'Username or Email' : 'Username'}
            </label>
            <input
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-1 block w-full p-2.5 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-slate-100 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#2c3e50] dark:focus:ring-[#e9c46a] focus:border-[#2c3e50] dark:focus:border-[#e9c46a] outline-none dark:scheme-dark transition-colors"
              required
            />
          </div>

          {/* Email field only shows during Registration */}
          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full p-2.5 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-slate-100 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#2c3e50] dark:focus:ring-[#e9c46a] focus:border-[#2c3e50] dark:focus:border-[#e9c46a] outline-none dark:scheme-dark transition-colors"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Password
            </label>
            <input
              type="password"
              autoComplete={isLoginMode ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full p-2.5 bg-white dark:bg-[#0f172a] text-gray-900 dark:text-slate-100 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#2c3e50] dark:focus:ring-[#e9c46a] focus:border-[#2c3e50] dark:focus:border-[#e9c46a] outline-none dark:scheme-dark transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#2c3e50] dark:bg-[#e9c46a] text-white dark:text-slate-900 p-2.5 rounded-lg hover:bg-[#e9c46a] hover:text-gray-900 dark:hover:bg-[#f4d58d] transition-colors font-semibold mt-2 shadow-sm"
          >
            {isLoginMode ? 'Sign In' : 'Register'}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400 font-medium">
            {message}
          </p>
        )}

        <p className="mt-5 text-center text-sm text-gray-600 dark:text-slate-400">
          {isLoginMode ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setMessage('');
              setIdentifier(''); // Clear fields on toggle
              setEmail('');
            }}
            className="text-blue-600 dark:text-[#e9c46a] hover:underline font-medium"
          >
            {isLoginMode ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;