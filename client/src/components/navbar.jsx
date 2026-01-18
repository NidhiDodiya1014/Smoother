import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-custom">
      <div className="container-fluid" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        <Link to="/" className="navbar-brand-custom">Smoother</Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <span style={{ color: 'white' }}>☰</span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
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
