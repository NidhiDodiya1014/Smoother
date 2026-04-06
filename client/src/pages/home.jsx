import { useEffect, useState } from "react";
import API from "../config/api";
import { useAudio } from "../contexts/AudioContext";
import { useQueue } from "../contexts/QueueContext";
import { useLocation } from "react-router-dom";
import { cacheSong, uncacheSong, getCachedUrls, onSWMessage } from "../utils/offlineCache";

function Home() {
  const location = useLocation();
  const { addToQueue } = useQueue();

  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSong, setExpandedSong] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [addedToQueueIds, setAddedToQueueIds] = useState([]);
  const [buttonGreenQueueIds, setButtonGreenQueueIds] = useState([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [pickingColorFor, setPickingColorFor] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkColorPicking, setBulkColorPicking] = useState(false);
  const [cachedUrls, setCachedUrls] = useState([]);
  const [cachingUrl, setCachingUrl] = useState(null);

  const PALETTE_GRID = [
    ["#de677c", "#9463ae", "#4d7acd", "#2cb8e9", "#4ef4f5", "#a6fed5", "#fedbaa", "#d85b7e"],
    ["#fc7575", "#df56c8", "#b952c4", "#8b18a2", "#ec13b0", "#8e16cc", "#fea2f0", "#d1f6ff"],
    ["#708cfd", "#11ccfa", "#3fead7", "#c4e6db", "#ebc1ef", "#e38cfe", "#cc72fd", "#ae5cfc"],
    ["#061350", "#0c3b88", "#0b7190", "#10a56e", "#35d487", "#c1cbab", "#87abdf", "#0cf1f5"],
    ["#c9d0ff", "#aeb8fc", "#f0d5fd", "#d7beff", "#affcf5", "#92d5ef", "#ffadcf", "#cd8cfe"]
  ];

  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    audioRef,
    playSong,
    togglePlayPause,
    setCurrentTime
  } = useAudio();

  const [volume, setVolume] = useState(0.75);

  useEffect(() => {
    loadSongs();

    // Load cached URLs
    getCachedUrls().then(urls => setCachedUrls(urls));

    // Listen for SW cache events
    const cleanup = onSWMessage((event) => {
      if (event.data.type === "AUDIO_CACHED") {
        setCachedUrls(prev => [...prev, event.data.url]);
        setCachingUrl(null);
      } else if (event.data.type === "AUDIO_UNCACHED") {
        setCachedUrls(prev => prev.filter(u => u !== event.data.url));
      } else if (event.data.type === "CACHE_ERROR") {
        setCachingUrl(null);
      } else if (event.data.type === "ALL_CACHE_CLEARED") {
        setCachedUrls([]);
      }
    });
    const handleReset = () => {
      setExpandedSong(null);
      setAutoPlay(false);
      setPickingColorFor(null);
      setConfirmingDelete(null);
    };
    
    window.addEventListener("resetHome", handleReset);
    return () => {
      window.removeEventListener("resetHome", handleReset);
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioRef]);

  useEffect(() => {
    if (expandedSong && autoPlay) {
      playSong(expandedSong, true);
      setAutoPlay(false);
    }
  }, [expandedSong, autoPlay, playSong]);

  useEffect(() => {
    if (location.state?.openSong) {
      setExpandedSong(location.state.openSong);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadSongs = async () => {
    try {
      const res = await API.get("/songs");
      setSongs(res.data);
    } catch (err) {
      console.error("Failed to load songs", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSong = async (id) => {
    try {
      setProcessing(true);

      await API.delete(`/songs/${id}`);

      setSongs((prev) => prev.filter((song) => song.id !== id));

      if (expandedSong?.id === id) {
        setExpandedSong(null);
      }

    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setProcessing(false);
    }
  };

  const updateTitle = async () => {
    if (!newTitle.trim()) return;

    try {
      setProcessing(true);

      const songId = expandedSong.id;

      await API.post("/updateSong", {
        id: songId,
        title: newTitle
      });

      setExpandedSong((prev) => ({
        ...prev,
        title: newTitle
      }));

      setSongs((prev) =>
        prev.map((song) =>
          song.id === songId ? { ...song, title: newTitle } : song
        )
      );

      setEditingTitle(false);

    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setProcessing(false);
    }
  };

  const updateColor = async (color) => {
    try {
      const songId = pickingColorFor;

      await API.post("/updateSong", {
        id: songId,
        color: color
      });

      setExpandedSong((prev) => ({
        ...prev,
        color: color
      }));

      setSongs((prev) =>
        prev.map((song) =>
          song.id === songId ? { ...song, color: color } : song
        )
      );

      setPickingColorFor(null);
    } catch (err) {
      console.error("Color update failed", err);
    }
  };


  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const showAddedMessage = (id) => {
    setAddedToQueueIds((prev) => [...prev, id]);
    setButtonGreenQueueIds((prev) => [...prev, id]);

    setTimeout(() => {
      setAddedToQueueIds((prev) => prev.filter((item) => item !== id));
    }, 2000);

    setTimeout(() => {
      setButtonGreenQueueIds((prev) => prev.filter((item) => item !== id));
    }, 60000);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const bulkDelete = async () => {
    try {
      setProcessing(true);
      await Promise.all(selectedIds.map((id) => API.delete(`/songs/${id}`)));
      setSongs((prev) => prev.filter((s) => !selectedIds.includes(s.id)));
      setSelectedIds([]);
      setSelectMode(false);
    } catch (err) {
      console.error("Bulk delete failed", err);
    } finally {
      setProcessing(false);
    }
  };

  const bulkRecolor = async (color) => {
    try {
      await Promise.all(
        selectedIds.map((id) => API.post("/updateSong", { id, color }))
      );
      setSongs((prev) =>
        prev.map((s) => selectedIds.includes(s.id) ? { ...s, color } : s)
      );
      setBulkColorPicking(false);
      setSelectedIds([]);
      setSelectMode(false);
    } catch (err) {
      console.error("Bulk recolor failed", err);
    }
  };

  const bulkDownload = () => {
    const selectedSongs = songs.filter(s => selectedIds.includes(s.id));
    selectedSongs.forEach((song, i) => {
      setTimeout(() => {
        const safeTitle = song.title.replace(/[^a-zA-Z0-9\s_\-\(\)\[\]]/g, '').trim().replace(/\s+/g, '_');
        const url = song.audioUrl ? song.audioUrl.replace('/upload/', `/upload/fl_attachment:${safeTitle}/`) : '#';
        if (url !== '#') {
          const iframe = document.createElement("iframe");
          iframe.style.display = "none";
          iframe.src = url;
          document.body.appendChild(iframe);
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 10000);
        }
      }, i * 300);
    });
    setSelectMode(false);
    setSelectedIds([]);
  };

  const filteredSongs = songs.filter((song) => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (expandedSong) {
    const isExpandedSongPlaying =
      currentSong?.id === expandedSong.id && isPlaying;

    const expandedCurrentTime =
      currentSong?.id === expandedSong.id ? currentTime : 0;

    const expandedDuration =
      currentSong?.id === expandedSong.id ? duration : 0;

    return (
      <div className="page-container">
        <button
          className="back-button"
          onClick={() => {
            setExpandedSong(null);
            setAutoPlay(false);
            setConfirmingDelete(null);
          }}
        >
          <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>←</span> Back to all songs
        </button>

        <div 
          className="media-player-card"
          style={{
            position: "relative",
            overflow: "hidden",
            background: expandedSong.color && expandedSong.color !== "#15151a" 
              ? `linear-gradient(135deg, ${expandedSong.color.substring(0, 7)}33 0%, var(--player-gradient-end, rgba(20, 20, 25, 0.6)) 100%)` 
              : undefined,
            borderTopColor: expandedSong.color && expandedSong.color !== "#15151a" 
              ? `${expandedSong.color.substring(0, 7)}66`
              : "rgba(255, 255, 255, 0.08)"
          }}
        >
          {confirmingDelete === expandedSong.id && (
            <div style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              background: "var(--modal-bg-special, rgba(15, 15, 20, 0.85))",
              backdropFilter: "blur(8px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              zIndex: 10,
              borderRadius: "24px"
            }}>
              <div style={{ fontSize: "2rem", marginBottom: "-8px" }}>🥺</div>
              <div style={{ fontSize: "1.2rem", fontWeight: "600", color: "#fff", textAlign: "center", padding: "0 20px" }}>
                Are you sure you want to delete this?
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  className="btn-danger"
                  style={{ padding: "8px 24px", borderRadius: "100px", fontWeight: "600" }}
                  disabled={processing}
                  onClick={() => deleteSong(expandedSong.id)}
                >
                  {processing ? "Deleting..." : "Yes, delete"}
                </button>
                <button
                  className="btn-outline-neon"
                  style={{ padding: "8px 24px", borderRadius: "100px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                  disabled={processing}
                  onClick={() => setConfirmingDelete(null)}
                >
                  No, keep it
                </button>
              </div>
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            {editingTitle ? (
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="input-neon"
                style={{ textAlign: "center", marginBottom: "32px", fontSize: "1.25rem", fontWeight: "600" }}
              />
            ) : (
              <div className="song-title-large" style={{ marginBottom: "32px" }}>
                {expandedSong.title}
              </div>
            )}
          </div>

          <div className="progress-container">
            <input
              type="range"
              min="0"
              max={expandedDuration || 100}
              value={expandedCurrentTime || 0}
              step="0.01"
              className="slider slider-progress"
              onChange={(e) => {
                const newTime = parseFloat(e.target.value);
                if (audioRef.current && currentSong?.id === expandedSong.id) {
                  audioRef.current.currentTime = newTime;
                  setCurrentTime(newTime);
                }
              }}
              style={{
                background: `linear-gradient(to right, var(--text-primary) ${expandedDuration ? (expandedCurrentTime / expandedDuration) * 100 : 0}%, rgba(255, 255, 255, 0.1) ${expandedDuration ? (expandedCurrentTime / expandedDuration) * 100 : 0}%)`
              }}
            />

            <div className="progress-time">
              <span>{formatTime(expandedCurrentTime)}</span>
              <span>-{formatTime(expandedDuration - expandedCurrentTime)}</span>
            </div>
          </div>

          <div className="controls-row">
            <button
              className="control-btn"
              onClick={() => {
                if (audioRef.current && currentSong?.id === expandedSong.id) {
                  audioRef.current.currentTime =
                    Math.max(0, audioRef.current.currentTime - 10);
                }
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>

            <button
              className="play-pause-btn"
              onClick={() => {
                if (isExpandedSongPlaying) {
                  togglePlayPause();
                } else {
                  playSong(expandedSong, true);
                }
              }}
            >
              {isExpandedSongPlaying ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            <button
              className="control-btn"
              onClick={() => {
                if (audioRef.current && currentSong?.id === expandedSong.id) {
                  audioRef.current.currentTime =
                    Math.min(expandedDuration, audioRef.current.currentTime + 10);
                }
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          </div>

          <div className="volume-control">
            <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
              </svg>
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              className="slider slider-volume"
              onChange={(e) => {
                const newVolume = parseFloat(e.target.value);
                setVolume(newVolume);
                if (audioRef.current) {
                  audioRef.current.volume = newVolume;
                }
              }}
              style={{
                background: `linear-gradient(to right, var(--text-secondary) ${volume * 100}%, rgba(255, 255, 255, 0.1) ${volume * 100}%)`
              }}
            />
            <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "32px", justifyContent: "center" }}>
              <button
                className="btn-small btn-danger"
                disabled={processing}
                onClick={() => setConfirmingDelete(expandedSong.id)}
              >
                Delete
              </button>

              <a
                href={
                  expandedSong.audioUrl
                    ? expandedSong.audioUrl.replace(
                        '/upload/',
                        `/upload/fl_attachment:${expandedSong.title
                          .replace(/[^a-zA-Z0-9\s_\-\(\)\[\]]/g, '')
                          .trim()
                          .replace(/\s+/g, '_')}/`
                      )
                    : '#'
                }
                download={`${expandedSong.title}.mp3`}
                className="btn-small btn-outline-neon"
                style={{ color: "var(--accent-cyan)", borderColor: "var(--accent-cyan)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                Download
              </a>

            {!editingTitle ? (
              <button
                className="btn-small btn-outline-neon"
                style={{ color: "#facc15", borderColor: "#facc15" }}
                onClick={() => {
                  setEditingTitle(true);
                  setNewTitle(expandedSong.title);
                }}
              >
                Edit Title
              </button>
            ) : (
              <button
                className="btn-small btn-primary"
                onClick={updateTitle}
              >
                Save
              </button>
            )}

            <button
              className="btn-small btn-outline-neon"
              style={{ color: "var(--accent-cyan)", borderColor: "var(--accent-cyan)" }}
              onClick={() => setPickingColorFor(pickingColorFor === expandedSong.id ? null : expandedSong.id)}
            >
              Color
            </button>

            <button
              className="btn-small"
              style={buttonGreenQueueIds.includes(expandedSong.id) ? { background: "#10b981", color: "white", border: "1px solid #10b981" } : { background: "transparent", color: "var(--text-primary)", border: "1px solid rgba(255, 255, 255, 0.3)" }}
              onClick={() => {
                addToQueue(expandedSong);
                showAddedMessage(expandedSong.id);
              }}
            >
              {buttonGreenQueueIds.includes(expandedSong.id) ? "✓ Added" : "+ Queue"}
            </button>

            {expandedSong.audioUrl && (
              <button
                className="btn-small btn-outline-neon"
                style={{
                  color: cachedUrls.includes(expandedSong.audioUrl) ? "#10b981" : "#a78bfa",
                  borderColor: cachedUrls.includes(expandedSong.audioUrl) ? "#10b981" : "#a78bfa"
                }}
                disabled={cachingUrl === expandedSong.audioUrl}
                onClick={() => {
                  if (cachedUrls.includes(expandedSong.audioUrl)) {
                    uncacheSong(expandedSong.audioUrl);
                  } else {
                    setCachingUrl(expandedSong.audioUrl);
                    cacheSong(expandedSong.audioUrl);
                  }
                }}
              >
                {cachingUrl === expandedSong.audioUrl
                  ? "Saving..."
                  : cachedUrls.includes(expandedSong.audioUrl)
                    ? "✓ Offline"
                    : "📥 Save Offline"
                }
              </button>
            )}
          </div>

          {pickingColorFor === expandedSong.id && (
            <div className="color-palette-container" style={{ flexDirection: "column", alignItems: "center", gap: "6px" }}>
              <div style={{ marginBottom: "12px", fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: "500" }}>Select a custom shade:</div>
              <div className="color-grid">
                {PALETTE_GRID.map((row, rowIndex) => (
                  <div key={rowIndex} className="color-row" style={{ display: "flex", gap: "6px" }}>
                    {row.map((colorHex, colIndex) => {
                      const maskColor = colorHex + "2E";
                      return (
                        <div
                          key={colIndex}
                          className="color-swatch-small"
                          style={{
                            background: maskColor,
                            border: expandedSong.color === maskColor ? "2px solid #fff" : "1px solid rgba(255,255,255,0.05)"
                          }}
                          onClick={() => updateColor(maskColor)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
              <button
                className="btn-small"
                style={{ marginTop: "16px", background: "transparent", border: "1px solid rgba(255, 255, 255, 0.2)", color: "var(--text-secondary)" }}
                onClick={() => updateColor("#15151a")}
              >
                Reset to Default
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <h1 className="page-title text-gradient" style={{ margin: 0 }}>My Songs</h1>
        
        {songs.length > 0 && (
          <div style={{ position: "relative", flex: "1 1 200px", maxWidth: "300px" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input 
              type="text" 
              className="input-neon search-input-custom" 
              placeholder="Search library..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "36px", margin: 0 }}
            />
          </div>
        )}

        {songs.length > 0 && (
          <button
            className="btn-small btn-outline-neon"
            onClick={() => {
              setSelectMode(v => !v);
              setSelectedIds([]);
              setBulkColorPicking(false);
            }}
            style={{ color: selectMode ? "#ef4444" : "var(--text-secondary)", borderColor: selectMode ? "#ef4444" : "rgba(255,255,255,0.2)" }}
          >
            {selectMode ? "✕ Cancel" : "☑ Select"}
          </button>
        )}
      </div>

      {selectMode && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "12px",
          padding: "12px 20px",
          marginBottom: "24px",
          flexWrap: "wrap"
        }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", flexGrow: 1 }}>{selectedIds.length} song{selectedIds.length !== 1 ? 's' : ''} selected</span>
          <button
            className="btn-small btn-outline-neon"
            style={{ color: "var(--accent-cyan)", borderColor: "var(--accent-cyan)" }}
            onClick={() => {
              if (selectedIds.length === songs.length && songs.length > 0) {
                setSelectedIds([]);
              } else {
                setSelectedIds(songs.map(s => s.id));
              }
            }}
          >
            {selectedIds.length === songs.length && songs.length > 0 ? "☐ Deselect All" : "☑ Select All"}
          </button>
          
          {selectedIds.length > 0 && (
            <>
              <button
                className="btn-small btn-outline-neon"
                style={{ color: "var(--accent-cyan)", borderColor: "var(--accent-cyan)" }}
                onClick={bulkDownload}
              >
                ⬇ Download All
              </button>
              <button
                className="btn-small btn-outline-neon"
                style={{ color: "var(--accent-cyan)", borderColor: "var(--accent-cyan)" }}
                onClick={() => setBulkColorPicking(v => !v)}
              >
                🎨 Change Color
              </button>
              <button
                className="btn-small"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}
                disabled={processing}
                onClick={bulkDelete}
              >
                {processing ? "Deleting..." : "🗑 Delete All"}
              </button>
            </>
          )}
        </div>
      )}

      {bulkColorPicking && (
        <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "12px" }}>Pick a color for all {selectedIds.length} selected songs:</div>
          {PALETTE_GRID.map((row, rowIndex) => (
            <div key={rowIndex} style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
              {row.map((colorHex, colIndex) => {
                const maskColor = colorHex + "2E";
                return (
                  <div
                    key={colIndex}
                    onClick={() => bulkRecolor(maskColor)}
                    style={{
                      width: "28px", height: "28px",
                      borderRadius: "6px",
                      background: maskColor,
                      border: "1px solid rgba(255,255,255,0.08)",
                      cursor: "pointer"
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", marginTop: "60px" }}>
          <div className="spinner-neon"></div>
          <p style={{ color: "var(--text-secondary)" }}>
            Loading library...
          </p>
        </div>
      )}

      {!loading && songs.length === 0 && (
        <div className="empty-state">
          <p>No tracks added yet. Add some flavor to your library.</p>
        </div>
      )}

      {!loading && songs.length > 0 && filteredSongs.length === 0 && (
        <div className="empty-state">
          <p>No matches found for "{searchQuery}".</p>
        </div>
      )}

      {!loading && filteredSongs.length > 0 && (
        <div className="song-grid">
          {filteredSongs.map((song) => {
            const isCardPlaying = currentSong?.id === song.id && isPlaying;

            const handleCardClick = (e) => {
              if (selectMode) return;
              if (e.target.closest("button") || e.target.closest(".added-message")) return;

              setExpandedSong(song);
              setAutoPlay(false);
            };

            const handlePlayPause = (e) => {
              e.stopPropagation();

              if (isCardPlaying) {
                togglePlayPause();
              } else {
                playSong(song, true);
              }
            };

            const isSelected = selectedIds.includes(song.id);

            return (
              <div
                key={song.id}
                className={`song-card${isSelected ? " song-card-selected" : ""}`}
                style={{
                  backgroundColor: song.color && song.color !== "#15151a" ? song.color : "",
                  position: "relative",
                  outline: isSelected ? "2.5px solid #10b981" : selectMode ? "2px solid rgba(255,255,255,0.1)" : "none",
                  transition: "outline 0.15s ease, box-shadow 0.15s ease",
                  boxShadow: isSelected ? "0 0 12px rgba(16,185,129,0.35)" : undefined
                }}
                onClick={selectMode ? () => toggleSelect(song.id) : handleCardClick}
              >
                {selectMode && (
                  <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 5 }}>
                    <div style={{
                      width: "20px", height: "20px",
                      borderRadius: "6px",
                      border: `2px solid ${isSelected ? "#10b981" : "rgba(255,255,255,0.4)"}`,
                      background: isSelected ? "#10b981" : "rgba(0,0,0,0.5)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "13px", color: "#fff", fontWeight: "bold",
                      transition: "all 0.15s ease"
                    }}>
                      {isSelected ? "✓" : ""}
                    </div>
                  </div>
                )}
                <div className="song-card-info">
                  <div className="song-card-title">{song.title}</div>
                  
                  {addedToQueueIds.includes(song.id) && (
                    <div className="added-message" style={{ color: "#10b981", fontSize: "11px", fontWeight: "600", marginTop: "4px" }}>
                      ✓ Added to Queue
                    </div>
                  )}

                  {cachedUrls.includes(song.audioUrl) && (
                    <div style={{ color: "#a78bfa", fontSize: "10px", fontWeight: "600", marginTop: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a78bfa", display: "inline-block" }}></span>
                      Offline
                    </div>
                  )}
                </div>

                <div className="song-card-actions">
                  <button
                    className="control-btn"
                    style={{ width: "40px", height: "40px" }}
                    onClick={handlePlayPause}
                  >
                    {isCardPlaying ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>

                  <button
                    className="btn-small"
                    style={buttonGreenQueueIds.includes(song.id) ? { background: "#10b981", color: "white", border: "1px solid #10b981" } : { background: "transparent", color: "var(--text-primary)", border: "1px solid rgba(255, 255, 255, 0.3)" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      addToQueue(song);
                      showAddedMessage(song.id);
                    }}
                  >
                    {buttonGreenQueueIds.includes(song.id) ? "✓ Added" : "+ Queue"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Home;