import { useState } from "react";
import API from "../config/api";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const EyeIcon = ({ open }) => open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await API.post("/user/login", {
        email,
        password
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userName", res.data.user.name);

      window.location.href = "/";
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "80vh" }}>
      <div className="glass-card" style={{ padding: "40px", maxWidth: "440px", margin: "0 auto", width: "100%" }}>
        <h1 className="page-title text-gradient">Welcome Back</h1>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Email address</label>
            <input
              type="email"
              placeholder="example@gmail.com"
              className="input-neon"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                className="input-neon"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: "44px" }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(p => !p)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {error && <p style={{ color: "#ef4444", marginBottom: "20px", fontSize: "0.9rem" }}>{error}</p>}

          <button className="btn-neon" type="submit" disabled={loading} style={{ width: "100%", marginTop: "8px" }}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "0.95rem", color: "var(--text-secondary)" }}>
          New to Smoother? <Link to="/register" style={{ color: "var(--accent-cyan)", textDecoration: "none", fontWeight: "600" }}>Register here</Link>
        </div>
      </div>
    </div>
  );
}