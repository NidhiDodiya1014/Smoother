import { useState } from "react";
import API from "../config/api";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
            <input
              type="password"
              placeholder="••••••••••••"
              className="input-neon"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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