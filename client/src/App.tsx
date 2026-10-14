import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import api from './api/axios';
import './App.css';

// Import our newly extracted pages
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';

const App: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      navigate('/auth'); 
    } catch (error) {
      console.error("Error logging out", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbf7] font-sans text-gray-800">
      
      {/* Header Section */}
      <header className="pt-12 pb-6 px-6 text-center shadow-sm bg-white">
        <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 tracking-tight mb-2">
          Provi-Prints
        </h1>
        <p className="text-xl text-gray-800 font-serif tracking-wide mt-3 mb-5">
          Providing <span className="text-base text-gray-400 italic font-light mx-1">for your</span> 
          Province <span className="text-base text-gray-400 italic font-light mx-1">through</span> 
          Prints
        </p>
        
        <div className="flex justify-center items-center gap-3 text-[10px] md:text-xs text-gray-400 uppercase tracking-[0.25em] font-semibold">
           <span className="h-[1px] w-8 md:w-16 bg-gray-200"></span>
           Vintage-Inspired Travel Posters of the UK
           <span className="h-[1px] w-8 md:w-16 bg-gray-200"></span>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-[#2c3e50] text-white sticky top-0 z-20 shadow-md">
        <ul className="flex justify-center items-center space-x-8 md:space-x-16 py-4 px-6 text-sm md:text-base uppercase tracking-wider font-semibold">
          <li>
            <Link to="/" className="hover:text-[#e9c46a] transition-colors duration-300 focus:outline-none pb-1 border-b-2 border-transparent hover:border-[#e9c46a]">
              Home
            </Link>
          </li>
          <li>
            <button className="hover:text-[#e9c46a] transition-colors duration-300 focus:outline-none pb-1 border-b-2 border-transparent hover:border-[#e9c46a]">
              Products
            </button>
          </li>
          <li>
            <button className="hover:text-[#e9c46a] transition-colors duration-300 focus:outline-none pb-1 border-b-2 border-transparent hover:border-[#e9c46a]">
              Information
            </button>
          </li>
          {user ? (
            <li>
              <button 
                onClick={handleLogout} 
                className="text-[#e9c46a] hover:text-white transition-colors duration-300 focus:outline-none pb-1 border-b-2 border-transparent hover:border-white"
              >
                Logout
              </button>
            </li>
          ) : (
            <li>
              <Link 
                to="/auth" 
                className="hover:text-[#e9c46a] transition-colors duration-300 focus:outline-none pb-1 border-b-2 border-transparent hover:border-[#e9c46a]"
              >
                Account
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Page Routing */}
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage setUser={setUser} />} />
        </Routes>
      </div>

      <footer className="bg-gray-100 py-8 text-center text-gray-500 text-sm mt-auto">
        <p>&copy; {new Date().getFullYear()} Provi Prints. All rights reserved.</p>
        <p className="mt-2">Bringing vintage charm to modern walls.</p>
      </footer>
    </div>
  );
};

export default App;