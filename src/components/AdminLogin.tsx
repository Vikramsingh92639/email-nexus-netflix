
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required");
      return;
    }
    
    setIsLoading(true);
    setError("");

    try {
      console.log("Attempting admin login with:", { username, password });
      const success = await adminLogin(username, password);
      
      if (success) {
        toast({
          title: "Welcome to Unknown Household Access",
          description: "You have successfully logged in to the admin dashboard.",
          className: "top-0 left-0",
        });
        navigate("/admin/dashboard");
      } else {
        setError("Invalid username or password");
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
              className="pb-4 text-gray-400 hover:text-white transition-colors"
            >
              User Login
            </Link>
            <Link 
              to="/admin-login" 
              className="pb-4 text-white border-b-2 border-netflix-red"
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
              <label className="text-gray-400">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-netflix-red"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="text-gray-400">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-netflix-red"
                  disabled={isLoading}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
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
              {isLoading ? "Logging in..." : "Login as Admin"}
            </button>
            
            <div className="text-center text-sm text-gray-400 mt-4">
              Default credentials: Admin@Akshay / Admin@Akshay
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminLogin;
