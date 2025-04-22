
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

const UserLogin = () => {
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessToken.trim()) {
      setError("Access token is required");
      return;
    }
    
    setIsLoading(true);
    setError("");

    try {
      console.log("Attempting user login with token:", accessToken);
      const success = await login(accessToken);
      
      if (success) {
        toast({
          title: "Welcome to Unknown Household Access",
          description: "You have successfully logged in to your dashboard.",
          className: "top-0 left-0",
        });
        navigate("/dashboard");
      } else {
        // Error will be shown by the toast in the login function
        setError("Invalid or blocked access token. Please check and try again.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Login failed: " + (err.message || "Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black to-gray-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="max-w-md w-full px-8 py-10 rounded-lg bg-black/40 backdrop-blur-sm border border-gray-800"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
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
          
          {error && (
            <div className="bg-netflix-red/10 border border-netflix-red/20 text-netflix-red p-3 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
      </motion.div>
    </motion.div>
  );
};

export default UserLogin;
