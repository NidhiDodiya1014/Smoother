import { useState, useEffect } from "react";
import API from "../config/api";
import { useToast } from "../contexts/ToastContext";
import { useNavigate } from "react-router-dom";

function Profile() {
  const { showToast, showRawToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: "", email: "" });
  
  const [editingField, setEditingField] = useState(null);
  
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/user/profile");
      setProfile({ name: res.data.name, email: res.data.email });
    } catch (err) {
      console.error(err);
      showToast("Failed to load profile", "error");
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNameUpdate = async (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    const oldName = profile.name;

    // Show "Saving..." for 1 second
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));

    // Update UI
    setProfile(prev => ({ ...prev, name: trimmed }));
    localStorage.setItem("userName", trimmed);
    window.dispatchEvent(new CustomEvent("userNameChanged"));
    setEditingField(null);
    setNewName("");
    setSaving(false);
    showRawToast("Name updated");

    // Fire API in the background
    API.put("/user/profile", { name: trimmed }).catch(err => {
      console.error("Name update error:", err);
      setProfile(prev => ({ ...prev, name: oldName }));
      localStorage.setItem("userName", oldName);
      window.dispatchEvent(new CustomEvent("userNameChanged"));
      showToast("Failed to update name", "error");
    });
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) return;

    // Show "Saving..." for 1 second
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));

    // Update UI optimistically
    setNewPassword("");
    setShowPassword(false);
    setEditingField(null);
    setSaving(false);
    showRawToast("Password updated");

    // Fire API in the background
    API.put("/user/profile", { password: newPassword }).catch(err => {
      console.error("Password update error:", err);
      showToast(err.response?.data?.message || "Failed to update password", "error");
    });
  };

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

  if (loading) {
    return (
      <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div className="spinner-neon"></div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 100px)", padding: "20px" }}>
      <div className="glass-card" style={{ maxWidth: "500px", width: "100%", padding: "40px", borderRadius: "24px" }}>
        <h2 className="text-gradient" style={{ textAlign: "center", marginBottom: "32px", fontSize: "2rem" }}>My Profile</h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Email - read only */}
          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", marginBottom: "8px", fontSize: "0.9rem" }}>Email</label>
            <div style={{ minHeight: "1.5em", fontSize: "1.1rem", color: "var(--text-primary)", background: "rgba(255,255,255,0.05)", padding: "12px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
              {profile.email}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", marginBottom: "8px", fontSize: "0.9rem" }}>Display Name</label>
            {editingField === "name" ? (
              <form onSubmit={handleNameUpdate} className="glass-card" style={{ padding: "20px", background: "rgba(0,0,0,0.4)" }}>
                <input 
                  type="text" 
                  className="input-neon" 
                  value={newName} 
                  autoComplete="off"
                  autoFocus
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter new name"
                  required 
                  style={{ marginBottom: "16px" }}
                />
                <div style={{ display: "flex", gap: "12px" }}>
                  <button type="submit" className="btn-neon" style={{ flex: 1 }}>
                    Save
                  </button>
                  <button type="button" className="btn-outline-neon" onClick={() => { setEditingField(null); setNewName(""); }}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.05)", padding: "12px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span style={{ fontSize: "1.1rem", color: "var(--text-primary)" }}>{profile.name}</span>
                <button className="btn-small btn-outline-neon" style={{ padding: "4px 12px", border: "none", color: "var(--accent-cyan)" }} onClick={() => { setEditingField("name"); setNewName(profile.name); }}>
                  Change Name
                </button>
              </div>
            )}
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", marginBottom: "8px", fontSize: "0.9rem" }}>Password</label>
            {editingField === "password" ? (
              <form onSubmit={handlePasswordUpdate} className="glass-card" style={{ padding: "20px", background: "rgba(0,0,0,0.4)" }}>
                <div style={{ position: "relative", marginBottom: "16px" }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="input-neon" 
                    value={newPassword} 
                    autoFocus
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required 
                    style={{ width: "100%", paddingRight: "44px", margin: 0 }}
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
                <div style={{ display: "flex", gap: "12px" }}>
                  <button type="submit" className="btn-neon" style={{ flex: 1 }} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button type="button" className="btn-outline-neon" onClick={() => { setEditingField(null); setNewPassword(""); setShowPassword(false); }} disabled={saving}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.05)", padding: "12px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span style={{ fontSize: "1.1rem", color: "var(--text-primary)", letterSpacing: "2px" }}>••••••••</span>
                <button className="btn-small btn-outline-neon" style={{ padding: "4px 12px", border: "none", color: "var(--accent-cyan)" }} onClick={() => { setEditingField("password"); setNewPassword(""); setShowPassword(false); }}>
                  Change Password
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default Profile;
