
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { Email } from "@/types";
import { useNavigate } from "react-router-dom";
import { Search, Eye, EyeOff, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import EmailDetailSidebar from "./EmailDetailSidebar";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const { emails, toggleEmailVisibility } = useData();
  const navigate = useNavigate();

  const [searchEmail, setSearchEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const emailsPerPage = 10;

  useEffect(() => {
    if (!user) {
      navigate("/user-login");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      toast({
        title: "Welcome to Unknown Household Access",
        description: "You have successfully logged in to your dashboard.",
        className: "fixed top-4 left-4 z-50"
      });
    }
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    
    if (!searchEmail.trim()) {
      setError("Email address is required");
      return;
    }
    
    setIsLoading(true);
    setError("");
    setSearchResults([]);

    try {
      // Add retry mechanism with exponential backoff
      const maxRetries = 3;
      let retryCount = 0;
      let success = false;
      
      while (retryCount < maxRetries && !success) {
        try {
          const { data, error } = await supabase.functions.invoke('search-emails', {
            body: { searchEmail: searchEmail.trim() }
          });
          
          if (error) {
            throw new Error(error.message || "Failed to search emails");
          }
          
          if (data.error) {
            // Check if it's an authorization error
            if (data.error.includes("token expired") || data.error.includes("reauthorize")) {
              // Show a more user-friendly message
              toast({
                title: "Authorization needed",
                description: "Please contact an admin to refresh the Google authorization.",
                variant: "destructive"
              });
              throw new Error(data.error);
            } else {
              throw new Error(data.error);
            }
          }
          
          if (data.emails && Array.isArray(data.emails)) {
            const formattedEmails: Email[] = data.emails.map((email: any) => ({
              id: email.id,
              from: email.from,
              to: email.to,
              subject: email.subject,
              body: email.body,
              date: email.date,
              isRead: email.isRead,
              isHidden: false
            }));
            
            setSearchResults(formattedEmails);
            
            if (formattedEmails.length === 0) {
              toast({
                title: "No emails found",
                description: `No emails from ${searchEmail} were found.`,
              });
            } else {
              toast({
                title: "Emails retrieved",
                description: `Found ${formattedEmails.length} emails from ${searchEmail}.`,
              });
            }
          } else {
            setSearchResults([]);
            toast({
              title: "No emails found",
              description: data.message || `No emails from ${searchEmail} were found.`,
            });
          }
          
          success = true;
        } catch (retryError: any) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw retryError;
          }
          
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Show retry toast
          if (retryError.message.includes("token expired") || retryError.message.includes("reauthorize")) {
            // Don't show retry toast for auth errors as we've already shown a specific message
          } else {
            toast({
              title: `Retrying (${retryCount}/${maxRetries})`,
              description: "Trying to connect again...",
            });
          }
        }
      }
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || "Failed to search emails. Please try again.");
      toast({
        title: "Search failed",
        description: err.message || "Failed to search emails. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVisibility = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop event from bubbling up
    toggleEmailVisibility(id);
    setSearchResults(prev => 
      prev.map(email => 
        email.id === id ? { ...email, isHidden: !email.isHidden } : email
      )
    );
    
    toast({
      title: "Email visibility updated",
      description: "Email visibility has been toggled successfully.",
    });
  };

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    setIsSidebarOpen(true);
  };

  const displayEmails = searchResults.length > 0 ? searchResults : emails;
  const totalPages = Math.ceil(displayEmails.length / emailsPerPage);
  const indexOfLastEmail = currentPage * emailsPerPage;
  const indexOfFirstEmail = indexOfLastEmail - emailsPerPage;
  const currentEmails = displayEmails.slice(indexOfFirstEmail, indexOfLastEmail);

  // Generate page numbers for pagination
  const pageNumbers = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="min-h-screen bg-netflix-black text-netflix-white">
      <header className="bg-netflix-gray py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-netflix-red">Unknown Household Access</h1>
        <button 
          onClick={logout}
          className="flex items-center text-netflix-white hover:text-netflix-red transition-colors"
        >
          <LogIn className="mr-2 h-5 w-5" />
          Logout
        </button>
      </header>

      <main className="container mx-auto px-4 py-8 netflix-fade-in">
        <div className="max-w-4xl mx-auto">
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

          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {displayEmails.length ? 
                  `Showing ${indexOfFirstEmail + 1}-${Math.min(indexOfLastEmail, displayEmails.length)} of ${displayEmails.length} emails` 
                  : "No emails found"}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center px-4 py-2 bg-netflix-gray rounded hover:bg-netflix-lightgray transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center px-4 py-2 bg-netflix-gray rounded hover:bg-netflix-lightgray transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
            
            {currentEmails.map((email, index) => (
              <div 
                key={email.id}
                className={`bg-netflix-gray p-4 rounded-lg hover:bg-netflix-lightgray transition-colors netflix-slide-up relative ${
                  email.isHidden ? 'blur-[6px] hover:blur-[6px]' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => !email.isHidden && handleEmailClick(email)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold">{email.subject}</div>
                  <Button
                    onClick={(e) => handleToggleVisibility(email.id, e)}
                    variant="outline"
                    size="sm"
                    className={`absolute top-2 right-2 z-10 ${
                      email.isHidden 
                        ? 'bg-green-600 hover:bg-green-700 text-white border-green-500 blur-none'
                        : 'bg-red-600 hover:bg-red-700 text-white border-red-500'
                    }`}
                    title={email.isHidden ? "Show email" : "Hide email"}
                  >
                    {email.isHidden ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                    <span className="ml-2">{email.isHidden ? "Show" : "Hide"}</span>
                  </Button>
                </div>
                
                <div className="text-sm text-gray-300 mb-2">
                  From: {email.from}
                </div>
                
                <div className="text-sm text-gray-400 mb-3">
                  {new Date(email.date).toLocaleString()}
                </div>
              </div>
            ))}

            {displayEmails.length > emailsPerPage && (
              <div className="flex justify-center mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {startPage > 1 && (
                      <>
                        <PaginationItem>
                          <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
                        </PaginationItem>
                        {startPage > 2 && <PaginationEllipsis />}
                      </>
                    )}

                    {pageNumbers.map(number => (
                      <PaginationItem key={number}>
                        <PaginationLink
                          isActive={currentPage === number}
                          onClick={() => setCurrentPage(number)}
                          className="cursor-pointer"
                        >
                          {number}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    {endPage < totalPages && (
                      <>
                        {endPage < totalPages - 1 && <PaginationEllipsis />}
                        <PaginationItem>
                          <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    )}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </main>

      <EmailDetailSidebar
        email={selectedEmail}
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          setSelectedEmail(null);
        }}
      />
    </div>
  );
};

export default UserDashboard;
