import { useNavigate } from "react-router-dom";
import { useAudio } from "../contexts/AudioContext";
import { useQueue } from "../contexts/QueueContext";

function GlobalPlayer() {
  const navigate = useNavigate();

  const { currentSong, isPlaying, togglePlayPause, stopSong } = useAudio();
  const { queue, currentIndex, setCurrentIndex } = useQueue();

  if (!currentSong) return null;

  const isFromQueue =
    currentIndex !== null &&
    queue[currentIndex]?.id === currentSong.id;

  const handleStop = () => {
    stopSong(() => setCurrentIndex(null));
  };

  return (
    <div
      className="global-player"
      onClick={() => navigate("/", { state: { openSong: currentSong } })}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)" }}>
          {currentSong.title}
        </div>

        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
          {isPlaying ? "Playing" : "Paused"}
          {isFromQueue ? " • Queue" : ""}
        </div>
      </div>

      <button
        className="play-pause-btn"
        onClick={(e) => {
          e.stopPropagation();
          togglePlayPause();
        }}
      >
        {isPlaying ? (
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
        className="control-btn"
        onClick={(e) => {
          e.stopPropagation();
          handleStop();
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 6h12v12H6z"/>
        </svg>
      </button>
    </div>
  );
}

export default GlobalPlayer;