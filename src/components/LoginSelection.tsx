
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";

const LoginSelection = () => {
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessToken.trim()) {
      toast({
        title: "Access Token Required",
        description: "Please enter your access token to continue.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await login(accessToken);
      
      if (success) {
        toast({
          title: "Welcome to Unknown Household Access",
          description: "You have successfully logged in to your dashboard.",
          className: "top-0 left-0",
        });
        navigate("/dashboard");
      }
      // Error toasts are handled in the login function
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-md w-full px-8 py-10 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-800 netflix-scale-in">
        <div className="space-y-8">
          <div className="flex gap-8 text-2xl font-medium border-b border-gray-800">
            <Link 
              to="/" 
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
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="flex flex-col space-y-2">
              <label className="text-gray-400">Access Token</label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Enter your access token"
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-netflix-red"
                  disabled={isLoading}
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
            
            <button 
              type="submit"
              className="w-full bg-netflix-red hover:bg-netflix-red/90 text-white py-3 rounded-lg transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login as User"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginSelection;
