
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const LoginSelection = () => {
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-md w-full px-8 py-10 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-800">
        <div className="space-y-8">
          <div className="flex gap-8 text-2xl font-medium border-b border-gray-800">
            <Link 
              to="/user-login" 
              className="pb-4 text-white border-b-2 border-netflix-red"
            >
              User Login
            </Link>
            <Link 
              to="/admin-login" 
              className="pb-4 text-gray-400 hover:text-white transition-colors"
            >
              Admin Login
            </Link>
          </div>
          
          <div className="space-y-6">
            <div className="flex flex-col space-y-2">
              <label className="text-gray-400">Access Token</label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Enter your access token"
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-netflix-red"
                />
                <button 
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showToken ? (
                    <EyeOff className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
            
            <button className="w-full bg-netflix-red hover:bg-netflix-red/90 text-white py-3 rounded-lg transition-colors">
              Login as User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSelection;
