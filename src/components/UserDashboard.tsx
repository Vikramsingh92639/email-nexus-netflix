
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { Email } from "@/types";
import { useNavigate } from "react-router-dom";
import { Search, Eye, EyeOff, LogIn } from "lucide-react";

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const { emails, fetchEmails, toggleEmailVisibility } = useData();
  const navigate = useNavigate();

  const [searchEmail, setSearchEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // If not logged in, redirect to login
  useEffect(() => {
    if (!user) {
      navigate("/user-login");
    }
  }, [user, navigate]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchEmail.trim()) {
      setError("Email address is required");
      return;
    }
    
    setIsLoading(true);
    setError("");

    try {
      await fetchEmails(searchEmail);
    } catch (err) {
      setError("Failed to fetch emails. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVisibility = (id: string) => {
    toggleEmailVisibility(id);
  };

  return (
    <div className="min-h-screen bg-netflix-black text-netflix-white">
      {/* Header */}
      <header className="bg-netflix-gray py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-netflix-red">Email Nexus</h1>
        <button 
          onClick={logout}
          className="flex items-center text-netflix-white hover:text-netflix-red transition-colors"
        >
          <LogIn className="mr-2 h-5 w-5" />
          Logout
        </button>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 netflix-fade-in">
        <div className="max-w-4xl mx-auto">
          {/* Search Form */}
          <div className="bg-netflix-darkgray p-6 rounded-lg mb-8 netflix-scale-in">
            <h2 className="text-xl font-semibold mb-4">Search Emails</h2>
            
            {error && (
              <div className="bg-netflix-red bg-opacity-30 text-netflix-white p-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="Enter Gmail address"
                className="netflix-input flex-1"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                className="netflix-button flex items-center"
                disabled={isLoading}
              >
                <Search className="mr-2 h-5 w-5" />
                {isLoading ? "Searching..." : "Search"}
              </button>
            </form>
          </div>

          {/* Email List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              {emails.length ? "Search Results" : "No emails found"}
            </h2>
            
            {emails.filter(email => !email.isHidden).map((email, index) => (
              <div 
                key={email.id}
                className="bg-netflix-gray p-4 rounded-lg hover:bg-netflix-lightgray transition-colors netflix-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold">{email.subject}</div>
                  <button 
                    onClick={() => handleToggleVisibility(email.id)}
                    className="text-netflix-white p-1 hover:text-netflix-red transition-colors"
                    title="Hide email"
                  >
                    <EyeOff className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="text-sm text-gray-300 mb-2">
                  From: {email.from}
                </div>
                
                <div className="text-sm text-gray-400 mb-3">
                  {new Date(email.date).toLocaleString()}
                </div>
                
                <div className="text-sm border-t border-netflix-lightgray pt-3">
                  {email.body}
                </div>
              </div>
            ))}
            
            {/* Hidden Emails Section */}
            {emails.some(email => email.isHidden) && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Hidden Emails</h3>
                
                {emails.filter(email => email.isHidden).map((email, index) => (
                  <div 
                    key={email.id}
                    className="bg-netflix-gray bg-opacity-50 p-4 rounded-lg hover:bg-netflix-lightgray transition-colors netflix-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold opacity-70">{email.subject}</div>
                      <button 
                        onClick={() => handleToggleVisibility(email.id)}
                        className="text-netflix-white p-1 hover:text-netflix-red transition-colors"
                        title="Show email"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-400 mb-2">
                      From: {email.from}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
