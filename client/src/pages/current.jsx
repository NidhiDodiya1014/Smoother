import { useEffect, useCallback } from "react";
import { useAudio } from "../contexts/AudioContext";
import { useQueue } from "../contexts/QueueContext";

function Current() {
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

  const {
    queue,
    currentIndex,
    isLooping,
    setCurrentIndex,
    setIsLooping,
    removeFromQueue,
    clearQueue
  } = useQueue();

  const playNext = useCallback(() => {
    if (currentIndex !== null && currentIndex + 1 < queue.length) {
      setCurrentIndex(currentIndex + 1);
    } else if (isLooping && queue.length > 0) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex(null);
    }
  }, [currentIndex, queue.length, isLooping, setCurrentIndex]);

  useEffect(() => {
    if (
      currentIndex !== null &&
      queue[currentIndex] &&
      queue[currentIndex].id !== currentSong?.id
    ) {
      playSong(queue[currentIndex], true);
    }
  }, [currentIndex, queue, playSong, currentSong]);

  const playQueue = () => {
    if (!queue.length) return;

    if (currentIndex !== null && currentSong?.id === queue[currentIndex]?.id) {
      togglePlayPause();
    } else {
      const newIndex = currentIndex !== null && queue[currentIndex] ? currentIndex : 0;
      playSong(queue[newIndex], true);
      setCurrentIndex(newIndex);
    }
  };



  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isQueueSongPlaying =
    currentIndex !== null &&
    queue[currentIndex]?.id === currentSong?.id;

  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center" }}>
      <div className="glass-card" style={{ padding: "40px", maxWidth: "640px", width: "100%" }}>
        <h2 className="page-title text-gradient" style={{ textAlign: "left", fontSize: "2rem", marginBottom: "32px" }}>
          My Queue
        </h2>

        {queue.length === 0 && (
          <div className="empty-state">
            <p>No songs selected</p>
          </div>
        )}

        {queue.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            {queue.map((song, index) => {

              const isThisSongCurrent = currentSong?.id === song.id;
              const isThisSongPlaying = isThisSongCurrent && isPlaying;

              return (
                <div
                  key={index}
                  className={`queue-item ${currentIndex === index ? "active" : ""}`}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "12px",
                    backgroundColor: song.color && song.color !== "#15151a" ? song.color : "" 
                  }}
                >

                  <button
                    className="control-btn"
                    style={{ width: "32px", height: "32px", fontSize: "14px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isThisSongCurrent) togglePlayPause();
                      else {
                        playSong(song, true);
                        setCurrentIndex(index);
                      }
                    }}
                  >
                    {isThisSongPlaying ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>

                  <span style={{ flex: 1 }}>
                    {song.title}
                  </span>

                  <button
                    className="control-btn"
                    style={{ width: "32px", height: "32px" }}
                    onClick={() => removeFromQueue(index)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>

                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn-neon" onClick={playQueue} disabled={!queue.length}>
            {isQueueSongPlaying && isPlaying ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
                Pause Queue
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Play Queue
              </>
            )}
          </button>

          <button
            className={isLooping ? "btn-neon" : "btn-outline-neon"}
            onClick={() => setIsLooping(!isLooping)}
            disabled={!queue.length}
            style={!isLooping ? { display: "flex", alignItems: "center", gap: "8px" } : {}}
          >
            {isLooping ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                </svg>
                Loop On
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                </svg>
                Loop Off
              </>
            )}
          </button>

          <button className="btn-outline-neon" onClick={clearQueue} disabled={!queue.length}>
            Clear
          </button>
        </div>

        {isQueueSongPlaying && (
          <div>

            <div style={{ marginBottom: "16px", fontWeight: "600" }}>
              Now Playing: {queue[currentIndex].title}
            </div>

            <div className="progress-container">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime || 0}
                step="0.01"
                className="slider slider-progress"
                onChange={(e) => {
                  const newTime = parseFloat(e.target.value);
                  if (audioRef.current && queue[currentIndex]?.id === currentSong?.id) {
                    audioRef.current.currentTime = newTime;
                    setCurrentTime(newTime);
                  }
                }}
                style={{
                  background: `linear-gradient(to right, var(--text-primary) ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255, 255, 255, 0.1) ${duration ? (currentTime / duration) * 100 : 0}%)`
                }}
              />

              <div className="progress-time">
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(duration - currentTime)}</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default Current;