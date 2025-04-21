import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-netflix-black netflix-gradient">
      <div className="text-center netflix-scale-in">
        <h1 className="text-6xl font-bold mb-4 text-netflix-red">404</h1>
        <p className="text-xl text-netflix-white mb-6">Oops! Page not found</p>
        <a 
          href="/" 
          className="netflix-button inline-block transition-all hover:scale-105"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
