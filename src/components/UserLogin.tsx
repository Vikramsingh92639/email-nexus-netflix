
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";

const UserLogin = () => {
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
          title: "Login Successful",
          description: "Welcome to the Email Nexus dashboard!",
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
    <div className="min-h-screen flex items-center justify-center bg-netflix-black netflix-gradient">
      <div className="max-w-md w-full px-6 py-8 bg-netflix-gray rounded-lg shadow-xl netflix-scale-in">
        <h1 className="text-3xl font-bold text-netflix-white text-center mb-6">User Login</h1>
        
        {error && (
          <div className="bg-netflix-red bg-opacity-30 text-netflix-white p-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="accessToken" className="block text-netflix-white mb-2">
              Access Token
            </label>
            <input
              id="accessToken"
              type="text"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Enter your access token"
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
        </form>
      </div>
    </div>
  );
};

export default UserLogin;
