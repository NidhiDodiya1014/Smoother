import { useEffect, useRef, useState, useCallback } from "react";

function Current({ queue, removeFromQueue, clearQueue }) {
  const audioRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);

  const playNext = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev !== null && prev + 1 < queue.length) {
        return prev + 1;
      } else if (isLooping && queue.length > 0) {
        setIsPlaying(true);
        return 0;
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
        return null;
      }
    });
  }, [queue, isLooping]);

  useEffect(() => {
    if (currentIndex !== null && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [currentIndex]);

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
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      playNext();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', () => setIsPlaying(true));
      audio.removeEventListener('pause', () => setIsPlaying(false));
    };
  }, [currentIndex, queue]);

  useEffect(() => {
    if (currentIndex !== null && queue[currentIndex] && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: queue[currentIndex].title,
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
  }, [currentIndex, queue, duration, isPlaying]);

  const playQueue = () => {
    if (queue.length === 0) return;
    setCurrentIndex(0);
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

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-card" style={{ margin: '24px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
      <div style={{ padding: '32px' }}>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, var(--accent-magenta), var(--accent-blue))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🎶 Current Queue
        </h2>

        {queue.length === 0 && (
          <div className="empty-state">
            <p>No songs selected</p>
          </div>
        )}

        {queue.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            {queue.map((song, index) => (
              <div
                key={song._id}
                className={`queue-item ${index === currentIndex ? 'active' : ''}`}
              >
                <span style={{ flex: 1, color: index === currentIndex ? 'var(--accent-magenta)' : 'var(--text-primary)' }}>
                  {song.title}
                </span>
                <button
                  className="control-btn"
                  style={{ width: '36px', height: '36px', fontSize: '16px', marginLeft: '12px' }}
                  onClick={() => {
                    removeFromQueue(song._id);
                    if (index === currentIndex) {
                      playNext();
                    }
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button className="btn-neon" onClick={playQueue} disabled={queue.length === 0}>
            ▶ Play Queue
          </button>
          <button 
            className={isLooping ? "btn-neon btn-neon-blue" : "btn-outline-neon"}
            onClick={() => setIsLooping(!isLooping)}
            disabled={queue.length === 0}
            style={isLooping ? { boxShadow: '0 4px 15px rgba(0, 102, 255, 0.3)' } : {}}
          >
            {isLooping ? '🔁 Loop On' : '🔁 Loop Off'}
          </button>
          <button className="btn-outline-neon" onClick={clearQueue} disabled={queue.length === 0}>
            Clear
          </button>
        </div>

        {currentIndex !== null && queue[currentIndex] && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
                Now Playing: {queue[currentIndex].title}
              </div>
            </div>

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

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '20px' }}>
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

            <audio
              ref={audioRef}
              src={queue[currentIndex].audioUrl}
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
          </div>
        )}
      </div>
    </div>
  );
}

export default Current;
