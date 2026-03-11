import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../config/api";
import { useToast } from "../contexts/ToastContext";

export default function AddSong() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [title, setTitle] = useState("");
  const [useCustomTitle, setCustomTitle] = useState(false);
  const [color, setColor] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeDownloads, setActiveDownloads] = useState([]);

  const { addToast } = useToast();
  const navigate = useNavigate();
  const prevDownloadsRef = useRef([]);
  // Track whether a session was ever started (to avoid redirecting on first load)
  const hadDownloadsRef = useRef(false);

  // 'random' | 'custom'
  const [colorMode, setColorMode] = useState("random");
  // 'random_all' | 'same_custom'
  const [playlistColorMode, setPlaylistColorMode] = useState("random_all");

  const isPlaylistUrl = youtubeUrl.includes("list=");

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const response = await API.get("/downloads/active");
        const current = response.data || [];

        const prev = prevDownloadsRef.current;
        const currentIds = new Set(current.map(t => t.id));

        // Songs that were in the previous poll but are now gone
        const disappeared = prev.filter(t => !currentIds.has(t.id));
        disappeared.forEach(t => {
          if (t.status === 'failed') {
            // Was already marked failed on the last poll → show error toast
            addToast(t.title, "error");
          } else {
            // Disappeared without a failed status → successfully saved to DB
            addToast(t.title, "success");
          }
        });

        // Songs newly marked as failed in this poll (not yet removed, but status changed)
        // We don't toast these yet — wait until they disappear so we don't double-toast.

        // Count only non-failed items as "real" active downloads
        const activeNonFailed = current.filter(t => t.status !== 'failed');
        const prevNonFailed = prev.filter(t => t.status !== 'failed');

        if (activeNonFailed.length > 0) hadDownloadsRef.current = true;

        const isStillWorking = current.some(t => ['queued', 'downloading', 'uploading'].includes(t.status));
        if (!isStillWorking) {
          setIsLoading(false);
        }

        // Redirect home only when all non-failed downloads are done
        if (hadDownloadsRef.current && activeNonFailed.length === 0 && prevNonFailed.length > 0) {
          hadDownloadsRef.current = false;
          setActiveDownloads([]);
          prevDownloadsRef.current = [];
          navigate("/");
          return;
        }

        prevDownloadsRef.current = current;
        setActiveDownloads(current);
      } catch (err) {
        // Silent fail for polling
      }
    };

    fetchDownloads();
    const interval = setInterval(fetchDownloads, 2500);
    return () => clearInterval(interval);
  }, [addToast, navigate]);

  // Custom curated palette based on image reference
  const PALETTE_GRID = [
    // Top Row: Pink/Orange/Blue/Cyan/Mint/Peach
    ["#de677c", "#9463ae", "#4d7acd", "#2cb8e9", "#4ef4f5", "#a6fed5", "#fedbaa", "#d85b7e"],
    // Second Row: Hot Pink/Fuchsia/Purple/Bright Pink/White-Blue
    ["#fc7575", "#df56c8", "#b952c4", "#8b18a2", "#ec13b0", "#8e16cc", "#fea2f0", "#d1f6ff"],
    // Third Row: Blue/Cyan/Mint/Lilac/Lavender/Light Purple
    ["#708cfd", "#11ccfa", "#3fead7", "#c4e6db", "#ebc1ef", "#e38cfe", "#cc72fd", "#ae5cfc"],
    // Fourth Row: Navy/Teal/Sea Green/Mint/Lilac/Cyan
    ["#061350", "#0c3b88", "#0b7190", "#10a56e", "#35d487", "#c1cbab", "#87abdf", "#0cf1f5"],
    // Bottom Row (Visible subset): Light/Lilac/Cyan/Pink/Purple
    ["#c9d0ff", "#aeb8fc", "#f0d5fd", "#d7beff", "#affcf5", "#92d5ef", "#ffadcf", "#cd8cfe"]
  ];

  const isValidYouTubeUrl = (link) => {
    return link.includes("youtube.com/watch?v=") || 
           link.includes("youtu.be/") || 
           link.includes("youtube.com/playlist?list=") ||
           link.includes("&list=");
  };

  const handleAddSong = async (e) => {
    e.preventDefault();

    const isPlaylistUrlLocal = youtubeUrl.includes("list=");

    if (useCustomTitle && !title.trim() && !isPlaylistUrlLocal) {
      setError("Please enter a custom track name, or uncheck the box.");
      return;
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    // Determine final color payload
    let finalColorMode = "random";
    let finalColor = "";

    if (isPlaylistUrlLocal) {
      finalColorMode = playlistColorMode;
      finalColor = playlistColorMode === "same_custom" ? color : "";
    } else {
      finalColorMode = colorMode;
      finalColor = colorMode === "custom" ? color : "";
    }

    if ((finalColorMode === "custom" || finalColorMode === "same_custom") && !finalColor) {
      setError("Please select a color from the palette, or change the mode to Random.");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const startTime = Date.now();

      const response = await API.post("/addSong", {
        title: useCustomTitle ? title.trim() : "",
        youtubeUrl: youtubeUrl.trim(),
        colorMode: finalColorMode,
        color: finalColor
      });

      const elapsedTime = Date.now() - startTime;
      const minimumDelay = 1500; // 1.5 seconds
      
      if (elapsedTime < minimumDelay) {
        await new Promise(resolve => setTimeout(resolve, minimumDelay - elapsedTime));
      }

      console.log("Response:", response.data);
      setSuccess(response.data.message || "🎵 Added successfully!");

      setTitle("");
      setYoutubeUrl("");
      setColor("");
    } catch (err) {
      console.error("Add song error:", err);

      if (err.response) {
        setError(
          err.response?.data?.error ||
            `Server error: ${err.response.status} ${err.response.statusText}`
        );
      } else {
        setError(
          "Cannot connect to server. Please check if the backend is running."
        );
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center", gap: "32px", alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ maxWidth: "640px", width: "100%", flex: "1 1 500px" }}>
        <h1 className="page-title text-gradient">Add a Track</h1>

        {isLoading && (
          <div
            className="glass-card"
            style={{
              padding: "20px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "16px"
            }}
          >
            <div
              className="spinner-neon"
              style={{ width: "40px", height: "40px", borderWidth: "3px" }}
            ></div>
            <span style={{ color: "var(--text-secondary)" }}>
              Processing song, please wait… This may take a few seconds 🎶
            </span>
          </div>
        )}

        <div className="glass-card" style={{ padding: "40px" }}>
          <form onSubmit={handleAddSong}>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", color: "var(--text-secondary)", fontSize: "0.9rem", cursor: "pointer" }}>
                <input 
                  type="checkbox" 
                  checked={useCustomTitle}
                  onChange={(e) => setCustomTitle(e.target.checked)}
                  disabled={isLoading}
                  style={{ accentColor: "var(--accent-cyan)", width: "16px", height: "16px" }}
                />
                Use Custom Track Name
              </label>

              {useCustomTitle && (
                <input
                  type="text"
                  placeholder="Enter song name..."
                  value={title}
                  disabled={isLoading}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-neon"
                  style={{ marginTop: "8px" }}
                />
              )}
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>YouTube URL</label>
              <input
                type="text"
                placeholder="Link to song or playlist..."
                value={youtubeUrl}
                disabled={isLoading}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="input-neon"
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Bubble Color Options</label>
              
              {!isPlaylistUrl ? (
                // Single Song Color Options
                <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fff", cursor: "pointer" }}>
                    <input 
                      type="radio" 
                      name="colorMode" 
                      value="random" 
                      checked={colorMode === "random"} 
                      onChange={() => setColorMode("random")}
                      style={{ accentColor: "var(--accent-cyan)", width: "16px", height: "16px" }}
                    />
                    Random Color
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fff", cursor: "pointer" }}>
                    <input 
                      type="radio" 
                      name="colorMode" 
                      value="custom" 
                      checked={colorMode === "custom"} 
                      onChange={() => setColorMode("custom")}
                      style={{ accentColor: "var(--accent-cyan)", width: "16px", height: "16px" }}
                    />
                    Select Custom Color
                  </label>
                </div>
              ) : (
                // Playlist Color Options
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px", background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fff", cursor: "pointer" }}>
                    <input 
                      type="radio" 
                      name="playlistColorMode" 
                      value="random_all" 
                      checked={playlistColorMode === "random_all"} 
                      onChange={() => setPlaylistColorMode("random_all")}
                      style={{ accentColor: "var(--accent-cyan)", width: "16px", height: "16px" }}
                    />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span>Random Colors</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Give every song in this playlist a different random glowing color</span>
                    </div>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fff", cursor: "pointer", marginTop: "8px" }}>
                    <input 
                      type="radio" 
                      name="playlistColorMode" 
                      value="same_custom" 
                      checked={playlistColorMode === "same_custom"} 
                      onChange={() => setPlaylistColorMode("same_custom")}
                      style={{ accentColor: "var(--accent-cyan)", width: "16px", height: "16px" }}
                    />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span>Same Custom Color</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Pick one custom color that all these songs will share</span>
                    </div>
                  </label>
                </div>
              )}

              {((!isPlaylistUrl && colorMode === "custom") || (isPlaylistUrl && playlistColorMode === "same_custom")) && (
                <div style={{ marginTop: "16px" }}>
                  {!showColorPicker ? (
                    <button
                      type="button"
                      className="btn-outline-neon"
                      style={{ width: "fit-content", padding: "8px 16px", fontSize: "0.9rem" }}
                      onClick={() => setShowColorPicker(true)}
                      disabled={isLoading}
                    >
                      {color ? "Change Color" : "Select Color"}
                    </button>
                  ) : (
                    <div className="color-palette-container" style={{ flexDirection: "column", gap: "6px" }}>
                      <div className="color-grid" style={{ pointerEvents: isLoading ? "none" : "auto", opacity: isLoading ? 0.5 : 1 }}>
                        {PALETTE_GRID.map((row, rowIndex) => (
                          <div key={rowIndex} className="color-row" style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                            {row.map((colorHex, colIndex) => {
                              const maskColor = colorHex + "2E";
                              return (
                                <div
                                  key={colIndex}
                                  className="color-swatch-small"
                                  style={{
                                    background: maskColor,
                                    border: color === maskColor ? "2px solid #fff" : "1px solid rgba(255,255,255,0.05)",
                                    cursor: "pointer",
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "4px"
                                  }}
                                  onClick={() => setColor(maskColor)}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                        <button
                          type="button"
                          className="btn-small"
                          style={{ background: "transparent", border: "1px solid rgba(255, 255, 255, 0.4)", color: "var(--text-primary)" }}
                          onClick={() => setShowColorPicker(false)}
                          disabled={isLoading}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
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

            <button
              type="submit"
              className="btn-neon"
              disabled={isLoading}
              style={{ width: "100%" }}
            >
              {isLoading ? (
                <>
                  <span style={{ display: "inline-block", marginRight: "8px" }}>
                    <div
                      className="spinner-neon"
                      style={{
                        width: "20px",
                        height: "20px",
                        borderWidth: "2px",
                        display: "inline-block"
                      }}
                    ></div>
                  </span>
                  Adding song…
                </>
              ) : (
                "Add Song"
              )}
            </button>
          </form>
        </div>
      </div>

      {activeDownloads.length > 0 && (
        <div 
          className="glass-card" 
          style={{ 
            width: "320px", 
            flexShrink: 0, 
            padding: "24px",
            position: "sticky",
            top: "100px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div className="spinner-neon" style={{ width: "24px", height: "24px", borderWidth: "2px", animationDuration: "1.5s" }}></div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#fff", fontWeight: "600", flex: 1 }}>Active Downloads</h3>
            <button
              onClick={async () => {
                setActiveDownloads(prev => prev.filter(t => t.status !== 'queued'));
                try {
                  await API.delete("/downloads/all");
                } catch (err) {
                  console.error("Stop all failed", err);
                }
              }}
              style={{
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.4)",
                color: "#ef4444",
                borderRadius: "8px",
                padding: "4px 10px",
                fontSize: "0.78rem",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
              title="Remove all queued downloads"
            >
              Stop All
            </button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {activeDownloads.map((task, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: "rgba(255,255,255,0.03)", 
                  border: "1px solid rgba(255,255,255,0.08)", 
                  borderRadius: "12px", 
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <div style={{ color: "#fff", fontSize: "0.95rem", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>
                    {task.title}
                  </div>
                  <button
                    onClick={async () => {
                      if (task.status !== 'queued') return;
                      setActiveDownloads(prev => prev.filter(t => t.id !== task.id));
                      try {
                        await API.delete(`/downloads/${task.id}`);
                      } catch (err) {
                        console.error("Cancel failed", err);
                      }
                    }}
                    disabled={task.status !== 'queued'}
                    title={task.status !== 'queued' ? "Can't cancel — already in progress" : "Remove from queue"}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: task.status === 'queued' ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)",
                      cursor: task.status === 'queued' ? "pointer" : "not-allowed",
                      fontSize: "1rem",
                      lineHeight: 1,
                      padding: "2px 4px",
                      borderRadius: "4px",
                      flexShrink: 0,
                      transition: "color 0.15s ease"
                    }}
                    onMouseEnter={e => { if (task.status === 'queued') e.currentTarget.style.color = "#ef4444"; }}
                    onMouseLeave={e => { if (task.status === 'queued') e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <span style={{ 
                    fontSize: "0.75rem", 
                    color: task.status === 'queued' ? "var(--text-secondary)" : task.status === 'downloading' ? "var(--accent-pink)" : task.status === 'failed' ? "#ef4444" : task.status === 'done' ? "#10b981" : "var(--accent-cyan)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    fontWeight: "600"
                  }}>
                    {task.status === 'queued' ? '⏳ Queued' : task.status === 'downloading' ? '⬇️ Downloading' : task.status === 'failed' ? '❌ Failed' : task.status === 'done' ? '✅ Added to Library' : '☁️ Uploading'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}