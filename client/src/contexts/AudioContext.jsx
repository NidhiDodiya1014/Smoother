import { createContext, useContext, useState, useRef, useEffect } from 'react';

const AudioContext = createContext();

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};

export const AudioProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(() => {
    const saved = localStorage.getItem('currentSong');
    return saved ? JSON.parse(saved) : null;
  });
  const [isPlaying, setIsPlaying] = useState(() => {
    const saved = localStorage.getItem('isPlaying');
    return saved === 'true';
  });
  const [currentTime, setCurrentTime] = useState(() => {
    const saved = localStorage.getItem('currentTime');
    return saved ? parseFloat(saved) : 0;
  });
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (currentSong) {
      localStorage.setItem('currentSong', JSON.stringify(currentSong));
    } else {
      localStorage.removeItem('currentSong');
    }
  }, [currentSong]);

  useEffect(() => {
    localStorage.setItem('isPlaying', isPlaying.toString());
  }, [isPlaying]);

  useEffect(() => {
    localStorage.setItem('currentTime', currentTime.toString());
  }, [currentTime]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setCurrentSong(null);
      localStorage.removeItem('currentSong');
      localStorage.setItem('isPlaying', 'false');
      localStorage.setItem('currentTime', '0');
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      const savedTime = parseFloat(localStorage.getItem('currentTime') || '0');
      if (savedTime > 0 && savedTime < audio.duration) {
        audio.currentTime = savedTime;
      }
      const wasPlaying = localStorage.getItem('isPlaying') === 'true';
      if (wasPlaying) {
        audio.play().catch(err => console.error("Auto-resume failed:", err));
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', () => setIsPlaying(true));
      audio.removeEventListener('pause', () => setIsPlaying(false));
    };
  }, [currentSong]);

  useEffect(() => {
    if (currentSong && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
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
  }, [currentSong, isPlaying]);

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

  const playSong = (song, autoPlay = false) => {
    setCurrentSong(song);
    if (autoPlay && audioRef.current) {
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
  };

  const togglePlayPause = () => {
    if (!currentSong) {
      console.warn("togglePlayPause: No current song");
      return;
    }
    
    const audio = audioRef.current;
    if (!audio) {
      console.warn("togglePlayPause: Audio ref not available, retrying...");
      setTimeout(() => {
        const retryAudio = audioRef.current;
        if (retryAudio && currentSong) {
          const shouldPause = !retryAudio.paused;
          if (shouldPause) {
            retryAudio.pause();
            setIsPlaying(false);
            if ('mediaSession' in navigator) {
              navigator.mediaSession.playbackState = 'paused';
            }
          } else {
            retryAudio.play()
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
      }, 50);
      return;
    }

    const shouldPause = !audio.paused;
    if (shouldPause) {
      audio.pause();
      setIsPlaying(false);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    } else {
      const playPromise = audio.play();
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
  };

  const stopSong = (clearQueueIndex = null) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentSong(null);
    setCurrentTime(0);
    localStorage.removeItem('currentSong');
    localStorage.setItem('isPlaying', 'false');
    localStorage.setItem('currentTime', '0');
    if (clearQueueIndex) {
      clearQueueIndex();
    }
  };

  const value = {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    audioRef,
    playSong,
    togglePlayPause,
    stopSong,
    setCurrentTime,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
      {currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.audioUrl}
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
          onLoadedMetadata={() => {
            if (audioRef.current) {
              const savedTime = parseFloat(localStorage.getItem('currentTime') || '0');
              if (savedTime > 0 && savedTime < audioRef.current.duration) {
                audioRef.current.currentTime = savedTime;
              }
              const wasPlaying = localStorage.getItem('isPlaying') === 'true';
              if (wasPlaying) {
                audioRef.current.play().catch(err => console.error("Auto-resume failed:", err));
              }
            }
          }}
          preload="auto"
          playsInline
          crossOrigin="anonymous"
          style={{ display: 'none' }}
        />
      )}
    </AudioContext.Provider>
  );
};

