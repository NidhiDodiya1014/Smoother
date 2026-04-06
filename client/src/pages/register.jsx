import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../config/api";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill all fields");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await API.post("/user/register", {
        name: name.trim(),
        email: email.trim(),
        password: password.trim()
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userName", res.data.user.name);

      setSuccess("Registration successful! Redirecting to home...");

      setTimeout(() => {
        window.location.href = "/";
      }, 1200);

    } catch (err) {
      if (err.response) {
        setError(err.response?.data?.message || "Registration failed");
      } else {
        setError("Server not reachable");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "80vh" }}>
      <div className="glass-card" style={{ padding: "40px", maxWidth: "440px", margin: "0 auto", width: "100%" }}>
        <h1 className="page-title text-gradient">Create Account</h1>

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Full Name</label>
            <input
              type="text"
              placeholder="Nidhi Dodiya"
              className="input-neon"
              value={name}
              disabled={loading}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Email address</label>
            <input
              type="email"
              placeholder="example@gmail.com"
              className="input-neon"
              value={email}
              disabled={loading}
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
                disabled={loading}
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

          {error && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "12px", padding: "12px", marginBottom: "24px", color: "#ef4444", fontSize: "0.9rem" }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "12px", padding: "12px", marginBottom: "24px", color: "#10b981", fontSize: "0.9rem" }}>
              {success}
            </div>
          )}

          <button type="submit" className="btn-neon" disabled={loading} style={{ width: "100%", marginTop: "8px" }}>
            {loading ? "Registering..." : "Sign Up"}
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "0.95rem", color: "var(--text-secondary)" }}>
          Already a user? <Link to="/login" style={{ color: "var(--accent-cyan)", textDecoration: "none", fontWeight: "600" }}>Login here</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;