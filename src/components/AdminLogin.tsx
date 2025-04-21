
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
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
          title: "Login Successful",
          description: "Welcome to the admin dashboard!",
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
    <div className="min-h-screen flex items-center justify-center bg-netflix-black netflix-gradient">
      <div className="max-w-md w-full px-6 py-8 bg-netflix-gray rounded-lg shadow-xl netflix-scale-in">
        <h1 className="text-3xl font-bold text-netflix-white text-center mb-6">Admin Login</h1>
        
        {error && (
          <div className="bg-netflix-red bg-opacity-30 text-netflix-white p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-netflix-white mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Admin username"
              className="netflix-input w-full"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-netflix-white mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className="netflix-input w-full"
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className="netflix-button w-full py-3"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
          
          <div className="text-center">
            <a 
              href="/" 
              className="text-netflix-white hover:text-netflix-red transition-colors"
            >
              Back to role selection
            </a>
          </div>

          <div className="text-center text-sm text-netflix-white opacity-60 mt-4">
            Default credentials: Admin@Akshay / Admin@Akshay
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
