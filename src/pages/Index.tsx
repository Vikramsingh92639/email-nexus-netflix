import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login selection
    navigate("/");
  }, [navigate]);

  // This will only be shown momentarily during redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-netflix-black netflix-gradient">
      <div className="text-center netflix-fade-in">
        <h1 className="text-4xl font-bold mb-4 text-netflix-red">Email Nexus</h1>
        <p className="text-xl text-netflix-white">Loading...</p>
      </div>
    </div>
  );
};

export default Index;
