
import React from 'react';
import { Link } from 'react-router-dom';

const LoginSelection = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-netflix-black netflix-gradient">
      <div className="max-w-md w-full px-6 py-8 netflix-scale-in">
        <h1 className="text-4xl font-bold text-netflix-white text-center mb-8">Email Nexus</h1>
        
        <div className="space-y-6">
          <Link to="/user-login" className="block w-full">
            <button className="netflix-button w-full py-3 text-lg stagger-delay-1 netflix-fade-in">
              User Login
            </button>
          </Link>
          
          <Link to="/admin-login" className="block w-full">
            <button className="netflix-button w-full py-3 text-lg stagger-delay-2 netflix-fade-in">
              Admin Login
            </button>
          </Link>
          
          <div className="text-netflix-white text-center mt-4 opacity-80 stagger-delay-3 netflix-fade-in">
            Choose your role to continue
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSelection;
