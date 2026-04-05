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
        {isPlaying ? "⏸" : "▶"}
      </button>

      <button
        className="control-btn"
        onClick={(e) => {
          e.stopPropagation();
          handleStop();
        }}
      >
        ⏹
      </button>
    </div>
  );
}

export default GlobalPlayer;