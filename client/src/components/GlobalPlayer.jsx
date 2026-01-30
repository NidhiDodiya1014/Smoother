import { useAudio } from '../contexts/AudioContext';
import { useQueue } from '../contexts/QueueContext';

function GlobalPlayer() {
  const { currentSong, isPlaying, togglePlayPause, stopSong } = useAudio();
  const { queue, currentIndex, setCurrentIndex } = useQueue();

  if (!currentSong) return null;

  const isFromQueue =
    currentIndex !== null &&
    queue[currentIndex]?._id === currentSong._id;

  const handleStop = () => {
    stopSong(() => setCurrentIndex(null));
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    if (currentSong) togglePlayPause();
  };

  return (
    <div
      className="global-player"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        padding: '16px 20px',
        boxShadow:
          '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 0, 255, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        minWidth: '280px',
        maxWidth: '400px',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Song Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '4px'
          }}
        >
          {currentSong.title}
        </div>

        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}
        >
          {isPlaying ? 'Playing' : 'Paused'}
          {isFromQueue ? ' • Queue' : ''}
        </div>
      </div>

      {/* Play Pause */}
      <button
        type="button"
        className="play-pause-btn"
        style={{
          width: '48px',
          height: '48px',
          fontSize: '18px',
          cursor: 'pointer',
          position: 'relative',
          zIndex: 1001
        }}
        onClick={handleToggle}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {/* Stop */}
      <button
        type="button"
        className="control-btn"
        style={{
          width: '36px',
          height: '36px',
          fontSize: '14px',
          cursor: 'pointer',
          position: 'relative',
          zIndex: 1001
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleStop();
        }}
        title="Stop"
      >
        ⏹
      </button>
    </div>
  );
}

export default GlobalPlayer;
