import { useEffect, useCallback } from "react";
import { useAudio } from "../contexts/AudioContext";
import { useQueue } from "../contexts/QueueContext";

function Current() {
  const { currentSong, isPlaying, currentTime, duration, audioRef, playSong, togglePlayPause, setCurrentTime } = useAudio();
  const { queue, currentIndex, isLooping, setCurrentIndex, setIsLooping, removeFromQueue, clearQueue } = useQueue();

  const playNext = useCallback(() => {
    if (currentIndex !== null && currentIndex + 1 < queue.length) {
      setCurrentIndex(currentIndex + 1);
    } else if (isLooping && queue.length > 0) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex(null);
    }
  }, [currentIndex, queue, isLooping, setCurrentIndex]);

  useEffect(() => {
    if (currentIndex !== null && queue[currentIndex]) {
      playSong(queue[currentIndex], true);
    }
  }, [currentIndex, queue, playSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    const handleEnded = () => {
      if (currentIndex !== null && queue[currentIndex]?._id === currentSong._id) {
        playNext();
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioRef, currentSong, currentIndex, queue, playNext]);

  const playQueue = () => {
    if (queue.length === 0) return;
    setCurrentIndex(0);
  };

  const handleProgressClick = (e) => {
    if (audioRef.current && duration && currentIndex !== null && queue[currentIndex]?._id === currentSong?._id) {
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

  const isQueueSongPlaying = currentIndex !== null && queue[currentIndex]?._id === currentSong?._id;

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
            {queue.map((song, index) => {
              const isThisSongCurrent = currentSong?._id === song._id;
              const isThisSongPlaying = isThisSongCurrent && isPlaying;
              return (
                <div
                  key={song._id}
                  className={`queue-item ${currentIndex === index ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <button
                    className="control-btn"
                    style={{ width: '32px', height: '32px', fontSize: '14px', flexShrink: 0, cursor: 'pointer', position: 'relative', zIndex: 10 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      
                      if (isThisSongCurrent) {
                        togglePlayPause();
                      } else {
                        setCurrentIndex(index);
                      }
                    }}
                  >
                    {isThisSongPlaying ? '⏸' : '▶'}
                  </button>
                  <span style={{ flex: 1, color: currentIndex === index ? 'var(--accent-magenta)' : 'var(--text-primary)' }}>
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
              );
            })}
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

        {isQueueSongPlaying && (
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
              <button 
                className="play-pause-btn" 
                style={{ cursor: 'pointer', position: 'relative', zIndex: 100, pointerEvents: 'auto' }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  
                  if (!isQueueSongPlaying) return;
                  
                  togglePlayPause();
                }}
              >
                {isPlaying && isQueueSongPlaying ? '⏸' : '▶'}
              </button>
              <button className="control-btn" onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
                }
              }}>
                ⏭
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Current;
