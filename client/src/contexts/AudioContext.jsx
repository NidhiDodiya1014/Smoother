import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
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
  const wasPlayingBeforeInterrupt = useRef(false);
  const userPausedRef = useRef(false);

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

  // ── Media Session API (lock screen controls + background playback) ──
  const updateMediaSession = useCallback((song) => {
    if (!("mediaSession" in navigator) || !song) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title || "Unknown",
      artist: "Smoother",
      album: "My Library",
      artwork: [
        { src: "/logo.png", sizes: "192x192", type: "image/png" },
        { src: "/logo.png", sizes: "512x512", type: "image/png" }
      ]
    });
  }, []);

  // Update media session whenever current song changes
  useEffect(() => {
    updateMediaSession(currentSong);
  }, [currentSong, updateMediaSession]);

  // Set up media session action handlers
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const actionHandlers = {
      play: () => {
        const audio = audioRef.current;
        if (audio) {
          audio.play().catch(() => {});
          setIsPlaying(true);
          userPausedRef.current = false;
        }
      },
      pause: () => {
        const audio = audioRef.current;
        if (audio) {
          audio.pause();
          setIsPlaying(false);
          userPausedRef.current = true;
        }
      },
      previoustrack: () => {
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = Math.max(0, audio.currentTime - 10);
        }
      },
      nexttrack: () => {
        if (currentIndex !== null && currentIndex + 1 < queue.length) {
          setCurrentIndex(currentIndex + 1);
        }
      },
      seekbackward: (details) => {
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 10));
        }
      },
      seekforward: (details) => {
        const audio = audioRef.current;
        if (audio) {
          audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + (details.seekOffset || 10));
        }
      },
      seekto: (details) => {
        const audio = audioRef.current;
        if (audio && details.seekTime !== undefined) {
          audio.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      }
    };

    for (const [action, handler] of Object.entries(actionHandlers)) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (e) {
        // Some actions may not be supported
      }
    }

    return () => {
      for (const action of Object.keys(actionHandlers)) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch (e) {}
      }
    };
  }, [currentIndex, queue.length, setCurrentIndex]);

  // ── Auto-resume after phone call / interruption ──
  useEffect(() => {
    const handleVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio || !currentSong) return;

      if (document.hidden) {
        // Page going to background — remember if we were playing
        wasPlayingBeforeInterrupt.current = !audio.paused;
      } else {
        // Page coming back to foreground — resume if we were playing and user didn't manually pause
        if (wasPlayingBeforeInterrupt.current && !userPausedRef.current) {
          setTimeout(() => {
            if (audio.paused && !userPausedRef.current) {
              audio.play().catch(() => {});
              setIsPlaying(true);
            }
          }, 300);
        }
      }
    };

    // Handle audio interruption (phone call pauses audio externally)
    const handleAudioPause = () => {
      // If audio was paused but our state says it should be playing,
      // it was an external interruption (phone call, etc.)
      if (isPlaying && !userPausedRef.current) {
        wasPlayingBeforeInterrupt.current = true;
      }
    };

    const handleAudioPlay = () => {
      wasPlayingBeforeInterrupt.current = false;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener("pause", handleAudioPause);
      audio.addEventListener("play", handleAudioPlay);
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (audio) {
        audio.removeEventListener("pause", handleAudioPause);
        audio.removeEventListener("play", handleAudioPlay);
      }
    };
  }, [currentSong, isPlaying]);

  // Update media session playback state
  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [isPlaying]);

  // Update media session position state
  useEffect(() => {
    if ("mediaSession" in navigator && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: Math.min(currentTime, duration)
        });
      } catch (e) {}
    }
  }, [currentTime, duration]);

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
          if (currentIndex === 0 && queue.length === 1) {
            // Force reset and play for single-song loop
            audio.currentTime = 0;
            audio.play().catch(() => {});
          } else {
            setCurrentIndex(0);
          }
        } else {
          setCurrentIndex(null);
          setCurrentSong(null);
          setIsPlaying(false);
        }
      } else {
        // Song completed and not playing from queue
        setCurrentSong(null);
        setIsPlaying(false);
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
      currentSongRef.current = currentSong.id;

      // One-time handler: seek to saved position, then play if needed
      const onReady = () => {
        audio.removeEventListener("loadeddata", onReady);

        if (!hasLoadedInitially.current) {
          const savedTime = parseFloat(localStorage.getItem("currentTime") || "0");
          if (savedTime > 0 && savedTime < audio.duration) {
            audio.currentTime = savedTime;
          }
          hasLoadedInitially.current = true;
        }

        if (isPlaying) {
          audio.play().catch(() => {
            const once = () => {
              audio.play().catch(() => {});
              document.removeEventListener("pointerdown", once);
            };
            document.addEventListener("pointerdown", once);
          });
        }
      };

      audio.addEventListener("loadeddata", onReady);
      audio.load();
      return;
    }

    if (isPlaying) {
      audio.play().catch(() => {
        const once = () => {
          audio.play().catch(() => {});
          document.removeEventListener("pointerdown", once);
        };
        document.addEventListener("pointerdown", once);
      });
    } else {
      audio.pause();
    }
  }, [currentSong, isPlaying]);

  const playSong = (song, autoPlay = false) => {
    userPausedRef.current = false;
    setCurrentSong(song);
    setIsPlaying(autoPlay);
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch(() => {});
      setIsPlaying(true);
      userPausedRef.current = false;
    } else {
      audio.pause();
      setIsPlaying(false);
      userPausedRef.current = true;
    }
  };

  const stopSong = (clearQueueIndex = null) => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    userPausedRef.current = true;
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