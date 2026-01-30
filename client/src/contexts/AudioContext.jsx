import { createContext, useContext, useState, useRef, useEffect } from "react";
import { useQueue } from "./QueueContext";

const AudioContext = createContext();

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio must be used within AudioProvider");
  return context;
};

export const AudioProvider = ({ children }) => {
  const { queue, currentIndex, setCurrentIndex, isLooping } = useQueue();

  const [currentSong, setCurrentSong] = useState(() => {
    const saved = localStorage.getItem("currentSong");
    return saved ? JSON.parse(saved) : null;
  });

  const [isPlaying, setIsPlaying] = useState(
    () => localStorage.getItem("isPlaying") === "true"
  );

  const [currentTime, setCurrentTime] = useState(() =>
    parseFloat(localStorage.getItem("currentTime") || "0")
  );

  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);
  const shouldAutoPlayRef = useRef(false);

  /* ================= LOCAL STORAGE ================= */

  useEffect(() => {
    if (currentSong)
      localStorage.setItem("currentSong", JSON.stringify(currentSong));
    else localStorage.removeItem("currentSong");
  }, [currentSong]);

  useEffect(() => {
    localStorage.setItem("isPlaying", isPlaying.toString());
  }, [isPlaying]);

  useEffect(() => {
    localStorage.setItem("currentTime", currentTime.toString());
  }, [currentTime]);

  /* ================= AUDIO EVENTS ================= */

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleEnded = () => {
      if (currentIndex !== null && queue[currentIndex]) {
        if (currentIndex + 1 < queue.length) {
          setCurrentIndex(currentIndex + 1);
        } else if (isLooping && queue.length > 0) {
          setCurrentIndex(0);
        } else {
          setCurrentIndex(null);
          setCurrentSong(null);
          setIsPlaying(false);
        }
      } else {
        setCurrentSong(null);
        setIsPlaying(false);
      }
      setCurrentTime(0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);

      const savedTime = parseFloat(localStorage.getItem("currentTime") || "0");
      if (savedTime > 0 && savedTime < audio.duration) {
        audio.currentTime = savedTime;
      }

      if (shouldAutoPlayRef.current) {
        audio.play().catch(() => {});
        shouldAutoPlayRef.current = false;
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [queue, currentIndex, isLooping]);

  /* ================= MEDIA SESSION ================= */

  useEffect(() => {
    if (!currentSong || !("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: "Smoother",
    });

    navigator.mediaSession.setActionHandler("play", () =>
      audioRef.current?.play()
    );

    navigator.mediaSession.setActionHandler("pause", () =>
      audioRef.current?.pause()
    );
  }, [currentSong]);

  /* ================= FUNCTIONS ================= */

  const playSong = (song, autoPlay = false) => {
    setCurrentSong(song);
    shouldAutoPlayRef.current = autoPlay;
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (!audio.paused) audio.pause();
    else audio.play().catch(() => {});
  };

  const stopSong = (clearQueueIndex = null) => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    setIsPlaying(false);
    setCurrentSong(null);
    setCurrentTime(0);

    localStorage.removeItem("currentSong");
    localStorage.setItem("isPlaying", "false");
    localStorage.setItem("currentTime", "0");

    if (clearQueueIndex) clearQueueIndex();
  };

  return (
    <AudioContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        audioRef,
        playSong,
        togglePlayPause,
        stopSong,
        setCurrentTime,
      }}
    >
      {children}

      {/* ⭐ AUDIO ALWAYS MOUNTED */}
      <audio
        ref={audioRef}
        src={currentSong?.audioUrl || ""}
        preload="auto"
        playsInline
        crossOrigin="anonymous"
        style={{ display: "none" }}
      />
    </AudioContext.Provider>
  );
};
