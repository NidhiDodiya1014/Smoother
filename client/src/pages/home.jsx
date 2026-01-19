import { useEffect, useState, useRef } from "react";
import axios from "axios";
import API_BASE_URL from "../config/api";

function Home({ addToQueue, queue }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [expandedSong, setExpandedSong] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [addedToQueueId, setAddedToQueueId] = useState(null);
  const [playingSongId, setPlayingSongId] = useState(null);
  const audioRef = useRef(null);
  const cardAudioRefs = useRef({});

  useEffect(() => {
    loadSongs();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && audioRef.current && isPlaying) {
        audioRef.current.play().catch(err => {
          console.error("Background play failed:", err);
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [expandedSong]);

  useEffect(() => {
    if (expandedSong && autoPlay && audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setAutoPlay(false);
          })
          .catch(error => {
            console.error("Auto-play failed:", error);
            setAutoPlay(false);
          });
      }
    }
  }, [expandedSong, autoPlay]);

  useEffect(() => {
    if (expandedSong && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: expandedSong.title,
        artist: 'Smoother',
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
          navigator.mediaSession.playbackState = 'playing';
        }
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
          navigator.mediaSession.playbackState = 'paused';
        }
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        if (audioRef.current) {
          audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
        }
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (audioRef.current) {
          audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
        }
      });

      if (audioRef.current) {
        const updatePlaybackState = () => {
          if (audioRef.current) {
            navigator.mediaSession.playbackState = audioRef.current.paused ? 'paused' : 'playing';
          }
        };
        audioRef.current.addEventListener('play', updatePlaybackState);
        audioRef.current.addEventListener('pause', updatePlaybackState);
        updatePlaybackState();
      }
    }
  }, [expandedSong, duration, isPlaying]);

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

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused';
        }
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
              }
            })
            .catch(error => {
              console.error("Play failed:", error);
            });
        }
      }
    }
  };

  const handleProgressClick = (e) => {
    if (audioRef.current && duration) {
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
    return (
      <div className="page-container">
        <button className="back-button" onClick={() => {
          setExpandedSong(null);
          setAutoPlay(false);
          setIsPlaying(false);
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
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
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <div className="progress-time">
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(duration - currentTime)}</span>
              </div>
            </div>

            <div className="controls-row">
              <button className="control-btn" onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
                }
              }}>
                ⏮
              </button>
              <button className="play-pause-btn" onClick={togglePlayPause}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button className="control-btn" onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
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

            <audio
              ref={audioRef}
              src={expandedSong.audioUrl}
              onPlay={() => {
                setIsPlaying(true);
                if ('mediaSession' in navigator) {
                  navigator.mediaSession.playbackState = 'playing';
                }
              }}
              onPause={() => {
                setIsPlaying(false);
                if ('mediaSession' in navigator) {
                  navigator.mediaSession.playbackState = 'paused';
                }
              }}
              preload="auto"
              playsInline
              crossOrigin="anonymous"
              style={{ display: 'none' }}
            />

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
            const isCardPlaying = playingSongId === song._id;
            if (!cardAudioRefs.current[song._id]) {
              cardAudioRefs.current[song._id] = { current: null };
            }

            const handleCardClick = (e) => {
              if (e.target.closest('button') || e.target.closest('.added-message')) {
                return;
              }
              setExpandedSong(song);
              setAutoPlay(false);
            };

            const handlePlayPause = (e) => {
              e.stopPropagation();
              const audio = cardAudioRefs.current[song._id]?.current;
              if (!audio) return;

              if (isCardPlaying) {
                audio.pause();
                setPlayingSongId(null);
              } else {
                Object.values(cardAudioRefs.current).forEach(ref => {
                  if (ref?.current && ref.current !== audio) {
                    ref.current.pause();
                  }
                });
                audio.play();
                setPlayingSongId(song._id);
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
                <audio
                  ref={(el) => {
                    if (cardAudioRefs.current[song._id]) {
                      cardAudioRefs.current[song._id].current = el;
                    }
                  }}
                  src={song.audioUrl}
                  onEnded={() => setPlayingSongId(null)}
                  preload="auto"
                  playsInline
                  crossOrigin="anonymous"
                  style={{ display: 'none' }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Home;
