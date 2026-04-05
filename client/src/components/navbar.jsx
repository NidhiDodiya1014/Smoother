import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

function Navbar() {

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("token"));
    setUserName(localStorage.getItem("userName") || "");
  }, [location]);

  useEffect(() => {
    const handleNameChange = () => {
      setUserName(localStorage.getItem("userName") || "");
    };
    window.addEventListener("userNameChanged", handleNameChange);
    return () => window.removeEventListener("userNameChanged", handleNameChange);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentSong");
    localStorage.removeItem("isPlaying");
    localStorage.removeItem("currentTime");
    localStorage.removeItem("queue");
    localStorage.removeItem("queueIndex");
    localStorage.removeItem("userName");

    setIsAuthenticated(false);
    setUserName("");
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-custom">
      <div className="container-fluid" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>

        <Link 
          to="/" 
          className="navbar-brand-custom" 
          style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
          onClick={() => {
            window.dispatchEvent(new CustomEvent("resetHome"));
            setIsMenuOpen(false);
          }}
        >
          <img src="/logo.png" alt="Smoother Logo" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 15px rgba(139, 0, 255, 0.4)' }} />
          <div className="dancing-text-container">
            {"Smoother".split("").map((letter, index) => (
              <span key={index} className="dancing-letter">
                {letter}
              </span>
            ))}
          </div>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          aria-controls="navbarNav"
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsMenuOpen(!isMenuOpen);
          }}
        >
          <span style={{ color: 'var(--text-primary)' }}>☰</span>
        </button>

        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
          <div className="navbar-nav ms-auto">

            {!isAuthenticated && (
              <>
                <Link to="/login" className="nav-link-custom" onClick={() => setIsMenuOpen(false)}>Login</Link>
                <Link to="/register" className="nav-link-custom" onClick={() => setIsMenuOpen(false)}>Register</Link>
              </>
            )}

            {isAuthenticated && (
              <>
                <Link 
                  to="/" 
                  className="nav-link-custom"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("resetHome"));
                    setIsMenuOpen(false);
                  }}
                >
                  Home
                </Link>
                <Link to="/add-song" className="nav-link-custom" onClick={() => setIsMenuOpen(false)}>Add Song</Link>
                <Link to="/current" className="nav-link-custom" onClick={() => setIsMenuOpen(false)}>My Queue</Link>

                <div 
                  className="profile-dropdown-container" 
                  style={{ position: "relative", marginLeft: "auto", display: "flex", alignItems: "center" }}
                >
                  <div 
                    className="profile-badge" 
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "rgba(255,255,255,0.05)",
                      padding: "6px 12px",
                      borderRadius: "100px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "var(--accent-cyan)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#000",
                      fontWeight: "bold",
                      fontSize: "0.9rem"
                    }}>
                      {userName ? userName.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span style={{ fontSize: "0.95rem", fontWeight: "500", color: "var(--text-primary)" }}>
                      {userName || "User"}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginLeft: "4px" }}>▼</span>
                  </div>

                  {isProfileDropdownOpen && (
                    <div style={{
                      position: "absolute",
                      top: "120%",
                      right: 0,
                      background: "rgba(20, 20, 25, 0.95)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      padding: "8px 0",
                      minWidth: "160px",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                      zIndex: 1000,
                      display: "flex",
                      flexDirection: "column"
                    }}>
                      <Link 
                        to="/profile" 
                        style={{ padding: "10px 20px", color: "var(--text-primary)", textDecoration: "none", fontSize: "0.95rem", transition: "background 0.2s" }}
                        onClick={() => { setIsProfileDropdownOpen(false); setIsMenuOpen(false); }}
                        onMouseEnter={(e) => { e.target.style.background = "rgba(255, 255, 255, 0.1)"; }}
                        onMouseLeave={(e) => { e.target.style.background = "transparent"; }}
                      >
                        Show Profile
                      </Link>
                      <button 
                        onClick={() => { logout(); setIsProfileDropdownOpen(false); }} 
                        style={{ padding: "10px 20px", color: "#ef4444", textDecoration: "none", fontSize: "0.95rem", background: "transparent", border: "none", textAlign: "left", cursor: "pointer", transition: "background 0.2s" }}
                        onMouseEnter={(e) => { e.target.style.background = "rgba(239, 68, 68, 0.1)"; }}
                        onMouseLeave={(e) => { e.target.style.background = "transparent"; }}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;