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
    <div className="flex items-center justify-center my-20">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {isLoginMode ? 'Login' : 'Create Account'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Identifier (Username/Email for Login, just Username for Register) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
                {isLoginMode ? 'Username or Email' : 'Username'}
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          {/* Email field only shows during Registration */}
          {!isLoginMode && (
              <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#2c3e50] text-white p-2 rounded hover:bg-[#e9c46a] hover:text-gray-900 transition-colors font-semibold"
          >
            {isLoginMode ? 'Sign In' : 'Register'}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-sm text-red-600 font-medium">{message}</p>}

        <p className="mt-4 text-center text-sm text-gray-600">
          {isLoginMode ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setMessage('');
              setIdentifier(''); // Clear fields on toggle
              setEmail('');
            }}
            className="text-blue-600 hover:underline font-medium"
          >
            {isLoginMode ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;