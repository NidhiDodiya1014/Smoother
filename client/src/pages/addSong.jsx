import { useState } from "react";
import axios from "axios";
import API_BASE_URL from "../config/api";

export default function AddSong() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isValidYouTubeUrl = (link) => {
    const regex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/;
    return regex.test(link);
  };

  const handleAddSong = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please enter a song name");
      return;
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/addSong`, {
        title: title.trim(),
        youtubeUrl: youtubeUrl.trim()
      });

      console.log("Song added successfully:", response.data);
      setSuccess("🎵 Song added successfully!");

      setTitle("");
      setYoutubeUrl("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 className="page-title">Add a Song</h1>

        {isLoading && (
          <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="spinner-neon" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
            <span style={{ color: 'var(--text-secondary)' }}>Processing song, please wait… This may take a few seconds 🎶</span>
          </div>
        )}

        <div className="glass-card" style={{ padding: '40px' }}>
          <form onSubmit={handleAddSong}>
            <div style={{ marginBottom: '24px' }}>
              <input
                type="text"
                placeholder="Enter song name"
                value={title}
                disabled={isLoading}
                onChange={(e) => setTitle(e.target.value)}
                className="input-neon"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <input
                type="text"
                placeholder="Enter YouTube song URL"
                value={youtubeUrl}
                disabled={isLoading}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="input-neon"
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(255, 0, 102, 0.2)',
                border: '1px solid rgba(255, 0, 102, 0.5)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                color: '#ff0066'
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                background: 'rgba(0, 255, 102, 0.2)',
                border: '1px solid rgba(0, 255, 102, 0.5)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                color: '#00ff66'
              }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              className="btn-neon"
              disabled={isLoading}
              style={{ width: '100%' }}
            >
              {isLoading ? (
                <>
                  <span style={{ display: 'inline-block', marginRight: '8px' }}>
                    <div className="spinner-neon" style={{ width: '20px', height: '20px', borderWidth: '2px', display: 'inline-block' }}></div>
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
    </div>
  );
}
