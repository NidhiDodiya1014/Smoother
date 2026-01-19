import { Link } from "react-router-dom";
import { useState } from "react";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <nav className="navbar navbar-expand-lg navbar-custom">
      <div className="container-fluid" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        <Link to="/" className="navbar-brand-custom">
          <svg className="music-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="noteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: '#8b00ff', stopOpacity: 1}} />
                <stop offset="50%" style={{stopColor: '#ff00ff', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: '#0066ff', stopOpacity: 1}} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <g transform="rotate(-12 50 50)">
              <path d="M 38 25 L 38 68 Q 38 78 28 78 Q 18 78 18 68 Q 18 58 28 58 Q 33 58 36 61 L 36 25 Z" fill="url(#noteGradient)" stroke="#5a00b3" strokeWidth="2.5" filter="url(#glow)"/>
              <path d="M 36 25 L 36 10 L 58 10 L 58 25 Z" fill="url(#noteGradient)" stroke="#5a00b3" strokeWidth="2.5" filter="url(#glow)"/>
              <g opacity="0.9">
                <circle cx="72" cy="28" r="4" fill="#8b00ff">
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
                </circle>
                <circle cx="77" cy="23" r="3" fill="#ff00ff">
                  <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite"/>
                </circle>
                <circle cx="67" cy="18" r="3.5" fill="#8b00ff">
                  <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite"/>
                </circle>
                <path d="M 74 21 L 76 19 M 76 21 L 74 19" stroke="#8b00ff" strokeWidth="2" opacity="0.8"/>
                <path d="M 70 25 L 72 23 M 72 25 L 70 23" stroke="#ff00ff" strokeWidth="2" opacity="0.8"/>
                <circle cx="80" cy="31" r="2" fill="#0066ff" opacity="0.7"/>
                <circle cx="64" cy="15" r="2" fill="#8b00ff" opacity="0.7"/>
                <path d="M 79 29 L 81 27 M 81 29 L 79 27" stroke="#0066ff" strokeWidth="1.5" opacity="0.6"/>
              </g>
            </g>
          </svg>
          Smoother
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
          <span style={{ color: 'white', pointerEvents: 'none', userSelect: 'none' }}>☰</span>
        </button>

        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
          <div className="navbar-nav ms-auto">
            <Link to="/add-song" className="nav-link-custom">Add Song</Link>
            <Link to="/current" className="nav-link-custom">Current</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
