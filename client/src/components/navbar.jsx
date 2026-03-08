import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

function Navbar() {

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("token"));
    setUserName(localStorage.getItem("userName") || "");
  }, [location]);

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
          onClick={() => window.dispatchEvent(new CustomEvent("resetHome"))}
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
                <Link to="/login" className="nav-link-custom">Login</Link>
                <Link to="/register" className="nav-link-custom">Register</Link>
              </>
            )}

            {isAuthenticated && (
              <>
                <Link 
                  to="/" 
                  className="nav-link-custom"
                  onClick={() => window.dispatchEvent(new CustomEvent("resetHome"))}
                >
                  Home
                </Link>
                <Link to="/add-song" className="nav-link-custom">Add Song</Link>
                <Link to="/current" className="nav-link-custom">My Queue</Link>

                <button className="nav-link-custom" onClick={logout} style={{ marginRight: "12px" }}>
                  Logout
                </button>

                <div className="profile-badge" style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.05)",
                  padding: "6px 12px",
                  borderRadius: "100px",
                  border: "1px solid rgba(255,255,255,0.1)"
                }}>
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