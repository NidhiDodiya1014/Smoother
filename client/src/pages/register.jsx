import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../config/api";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

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
        navigate("/");
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
            <input
              type="password"
              placeholder="••••••••••••"
              className="input-neon"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
            />
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
      </div>
    </div>
  );
}

export default Register;