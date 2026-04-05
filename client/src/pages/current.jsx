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
                    {isThisSongPlaying ? "⏸" : "▶"}
                  </button>

                  <span style={{ flex: 1 }}>
                    {song.title}
                  </span>

                  <button
                    className="control-btn"
                    onClick={() => removeFromQueue(index)}
                  >
                    ✕
                  </button>

                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          <button className="btn-neon" onClick={playQueue} disabled={!queue.length}>
            {isQueueSongPlaying && isPlaying ? "⏸ Pause Queue" : "▶ Play Queue"}
          </button>

          <button
            className={isLooping ? "btn-neon" : "btn-outline-neon"}
            onClick={() => setIsLooping(!isLooping)}
            disabled={!queue.length}
          >
            {isLooping ? "🔁 Loop On" : "🔁 Loop Off"}
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