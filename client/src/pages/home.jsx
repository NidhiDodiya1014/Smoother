import { useEffect, useState, useRef } from "react";
import axios from "axios";
import API_BASE_URL from "../config/api";
import { useAudio } from "../contexts/AudioContext";
import { useQueue } from "../contexts/QueueContext";

function Home() {
  const { addToQueue } = useQueue();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [expandedSong, setExpandedSong] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [addedToQueueId, setAddedToQueueId] = useState(null);
  const { currentSong, isPlaying, currentTime, duration, audioRef, playSong, togglePlayPause, setCurrentTime } = useAudio();

  useEffect(() => {
    loadSongs();
  }, []);

  const [volume, setVolume] = useState(0.75);

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

  const loadSongs = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/songs`);
      setSongs(res.data);
    } catch (err) {
      console.error("Failed to load songs", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSong = async (id) => {
    if (!window.confirm("Delete this song?")) return;

    try {
      setProcessing(true);
      await axios.delete(`${API_BASE_URL}/songs/${id}`);
      setSongs(prev => prev.filter(song => song._id !== id));
      if (expandedSong?._id === id) {
        setExpandedSong(null);
        setIsPlaying(false);
      }
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleProgressClick = (e) => {
    if (audioRef.current && duration && currentSong?._id === expandedSong?._id) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeClick = (e) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      setVolume(percentage);
      audioRef.current.volume = percentage;
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (expandedSong) {
    const isExpandedSongPlaying = currentSong?._id === expandedSong._id && isPlaying;
    const expandedCurrentTime = currentSong?._id === expandedSong._id ? currentTime : 0;
    const expandedDuration = currentSong?._id === expandedSong._id ? duration : 0;

    return (
      <div className="page-container">
        <button className="back-button" onClick={() => {
          setExpandedSong(null);
          setAutoPlay(false);
        }}>
          ← Back to all songs
        </button>

        <div className="media-player-card">
          <div className="media-player-content">
            <div className="song-title-large">{expandedSong.title}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>iPhone</div>

            <div className="progress-container">
              <div className="progress-bar-wrapper" onClick={handleProgressClick}>
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${expandedDuration ? (expandedCurrentTime / expandedDuration) * 100 : 0}%` }}
                />
              </div>
              <div className="progress-time">
                <span>{formatTime(expandedCurrentTime)}</span>
                <span>-{formatTime(expandedDuration - expandedCurrentTime)}</span>
              </div>
            </div>

            <div className="controls-row">
              <button className="control-btn" onClick={() => {
                if (audioRef.current && currentSong?._id === expandedSong._id) {
                  audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
                }
              }}>
                ⏮
              </button>
              <button className="play-pause-btn" onClick={() => {
                if (currentSong?._id === expandedSong._id) {
                  togglePlayPause();
                } else {
                  playSong(expandedSong, true);
                }
              }}>
                {isExpandedSongPlaying ? '⏸' : '▶'}
              </button>
              <button className="control-btn" onClick={() => {
                if (audioRef.current && currentSong?._id === expandedSong._id) {
                  audioRef.current.currentTime = Math.min(expandedDuration, audioRef.current.currentTime + 10);
                }
              }}>
                ⏭
              </button>
            </div>

            <div className="volume-control">
              <span style={{ color: 'var(--text-secondary)' }}>🔉</span>
              <div className="volume-slider" onClick={handleVolumeClick}>
                <div 
                  className="volume-slider-fill" 
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>🔊</span>
            </div>


            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button
                className="btn-small btn-danger"
                disabled={processing}
                onClick={() => deleteSong(expandedSong._id)}
              >
                {processing ? "Deleting..." : "Delete"}
              </button>

              <button
                className="btn-small btn-success"
                onClick={() => {
                  addToQueue(expandedSong);
                  setAddedToQueueId(expandedSong._id);
                  setTimeout(() => setAddedToQueueId(null), 2000);
                }}
              >
                Add to Queue
              </button>
              {addedToQueueId === expandedSong._id && (
                <div style={{
                  color: '#00ff66',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginTop: '12px',
                  textAlign: 'center',
                  animation: 'fadeIn 0.3s ease-in'
                }}>
                  ✓ Added to Queue
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">My Songs</h1>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner-neon"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading songs...</p>
        </div>
      )}

      {!loading && songs.length === 0 && (
        <div className="empty-state">
          <p>No songs added yet.</p>
        </div>
      )}

      {!loading && songs.length > 0 && (
        <div className="song-grid">
          {songs.map(song => {
            const isCardPlaying = currentSong?._id === song._id && isPlaying;

            const handleCardClick = (e) => {
              if (e.target.closest('button') || e.target.closest('.added-message')) {
                return;
              }
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

            return (
              <div key={song._id} className="song-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', width: '100%' }}>
                  <div className="song-card-title" style={{ flex: 1, marginBottom: 0, minWidth: 0 }}>🎵 {song.title}</div>
                  <div className="song-card-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button
                      className="control-btn"
                      style={{ width: '32px', height: '32px', fontSize: '14px' }}
                      onClick={handlePlayPause}
                    >
                      {isCardPlaying ? '⏸' : '▶'}
                    </button>
                    <button
                      className="btn-small btn-success"
                      style={{ fontSize: '12px', padding: '8px 12px', whiteSpace: 'nowrap' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToQueue(song);
                        setAddedToQueueId(song._id);
                        setTimeout(() => setAddedToQueueId(null), 2000);
                      }}
                    >
                      Add to Queue
                    </button>
                  </div>
                </div>
                {addedToQueueId === song._id && (
                  <div className="added-message" style={{
                    color: '#00ff66',
                    fontSize: '11px',
                    fontWeight: '600',
                    marginTop: '6px',
                    textAlign: 'left',
                    animation: 'fadeIn 0.3s ease-in'
                  }}>
                    ✓ Added to Queue
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Home;
