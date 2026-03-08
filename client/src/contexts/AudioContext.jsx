import { createContext, useContext, useState, useRef, useEffect } from "react";
import { useQueue } from "./QueueContext";

const AudioContext = createContext();

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio must be used within AudioProvider");
  return context;
};

export const AudioProvider = ({ children }) => {
  const { queue, currentIndex, setCurrentIndex, isLooping, setQueue } = useQueue();

  const [currentSong, setCurrentSong] = useState(() => {
    const saved = localStorage.getItem("currentSong");
    return saved ? JSON.parse(saved) : null;
  });

  const [isPlaying, setIsPlaying] = useState(
    () => localStorage.getItem("isPlaying") === "true"
  );

  const [currentTime, setCurrentTime] = useState(
    () => parseFloat(localStorage.getItem("currentTime") || "0")
  );

  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);

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

  useEffect(() => {
    if (currentIndex !== null && queue[currentIndex]) {
      setCurrentSong(queue[currentIndex]);
      setIsPlaying(true);
    }
  }, [currentIndex, queue]);

  const hasLoadedInitially = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);

    const handleLoaded = () => {
      setDuration(audio.duration || 0);

      if (!hasLoadedInitially.current) {
        const savedTime = parseFloat(localStorage.getItem("currentTime") || "0");
        if (savedTime > 0 && savedTime < audio.duration) {
          audio.currentTime = savedTime;
        }
        hasLoadedInitially.current = true;
      }

      if (isPlaying) {
        audio.play().catch(() => {});
      }
    };

    const handleEnded = () => {
      if (currentIndex !== null && queue[currentIndex]) {
        const current = queue[currentIndex];

        if (current.played + 1 < current.repeat) {
          setQueue(prev => {
            const updated = [...prev];
            updated[currentIndex] = {
              ...updated[currentIndex],
              played: updated[currentIndex].played + 1
            };
            return updated;
          });

          audioRef.current.currentTime = 0;
          audioRef.current.play();
          return;
        }

        if (currentIndex + 1 < queue.length) {
          setCurrentIndex(currentIndex + 1);
        } else if (isLooping && queue.length > 0) {
          setCurrentIndex(0);
        } else {
          setCurrentIndex(null);
          setCurrentSong(null);
          setIsPlaying(false);
        }
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [queue, currentIndex, isLooping, isPlaying, setCurrentIndex, setQueue]);

  const currentSongRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (currentSongRef.current !== currentSong.id) {
      audio.src = currentSong.audioUrl;
      audio.load();
      currentSongRef.current = currentSong.id;
    }

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [currentSong, isPlaying]);

  const playSong = (song, autoPlay = false) => {
    setCurrentSong(song);
    setIsPlaying(autoPlay);
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch(() => {});
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const stopSong = (clearQueueIndex = null) => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    setCurrentSong(null);
    setIsPlaying(false);
    setCurrentTime(0);

    localStorage.removeItem("currentSong");

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
        setCurrentTime
      }}
    >
      {children}
      <audio ref={audioRef} preload="auto" style={{ display: "none" }} />
    </AudioContext.Provider>
  );
};