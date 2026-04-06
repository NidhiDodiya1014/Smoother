import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { Home as HomeIcon, PlusCircle, ListMusic, LogOut, User, Settings, Search } from "lucide-react";

function Navbar() {

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);

  const themeDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const menuRef = useRef(null);
  const togglerRef = useRef(null);

  const { theme, setTheme, THEMES } = useTheme();

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target)) {
        setIsThemeDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(e.target) && togglerRef.current && !togglerRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

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
          ref={togglerRef}
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

        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav" ref={menuRef}>
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
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <HomeIcon size={18} /> Home
                </Link>
                <Link to="/add-song" className="nav-link-custom" onClick={() => setIsMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <PlusCircle size={18} /> Add Song
                </Link>
                <Link to="/current" className="nav-link-custom" onClick={() => setIsMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <ListMusic size={18} /> My Queue
                </Link>

                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginLeft: "auto", flexWrap: "wrap", justifyContent: "flex-end", marginTop: isMenuOpen ? "16px" : "0" }}>
                  
                  {/* Theme Dropdown */}
                  <div className="theme-dropdown-container" ref={themeDropdownRef} style={{ position: "relative" }}>
                    <div 
                      className="theme-badge" 
                      onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "rgba(255,255,255,0.05)",
                        padding: "6px 12px",
                        borderRadius: "100px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        cursor: "pointer",
                        color: "var(--text-primary)"
                      }}
                    >
                      <span style={{ fontSize: "1rem" }}>{THEMES.find(t => t.id === theme)?.icon}</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>▼</span>
                    </div>

                    {isThemeDropdownOpen && (
                      <div style={{
                        position: "absolute",
                        top: "120%",
                        right: 0,
                        background: "var(--dropdown-bg)",
                        backdropFilter: "blur(12px)",
                        border: `1px solid var(--glass-border)`,
                        borderRadius: "12px",
                        padding: "8px 0",
                        minWidth: "160px",
                        boxShadow: "var(--shadow-subtle)",
                        zIndex: 1000,
                        display: "flex",
                        flexDirection: "column"
                      }}>
                        {THEMES.map((t) => (
                          <button 
                            key={t.id}
                            onClick={() => { setTheme(t.id); setIsThemeDropdownOpen(false); }} 
                            style={{ 
                              padding: "10px 20px", 
                              color: theme === t.id ? "var(--accent-cyan)" : "var(--text-primary)", 
                              textDecoration: "none", 
                              fontSize: "0.95rem", 
                              background: theme === t.id ? "rgba(255,255,255,0.05)" : "transparent", 
                              border: "none", 
                              textAlign: "left", 
                              cursor: "pointer", 
                              transition: "all 0.2s",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontWeight: theme === t.id ? "600" : "400"
                            }}
                            onMouseEnter={(e) => { e.target.style.background = "var(--glass-bg-hover)"; }}
                            onMouseLeave={(e) => { e.target.style.background = theme === t.id ? "rgba(255,255,255,0.05)" : "transparent"; }}
                          >
                            <span style={{ pointerEvents: "none" }}>{t.icon}</span> 
                            <span style={{ pointerEvents: "none" }}>{t.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Profile Dropdown */}
                  <div 
                    className="profile-dropdown-container" 
                    ref={profileDropdownRef}
                    style={{ position: "relative", display: "flex", alignItems: "center" }}
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
                      background: "var(--dropdown-bg)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid var(--glass-border)",
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