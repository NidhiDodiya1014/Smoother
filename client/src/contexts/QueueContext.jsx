import { createContext, useContext, useState, useEffect } from "react";

const QueueContext = createContext();

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error("useQueue must be used within QueueProvider");
  }
  return context;
};

export const QueueProvider = ({ children }) => {

  const safeParse = (value, fallback) => {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const [queue, setQueue] = useState(() =>
    safeParse(localStorage.getItem("queue"), [])
  );

  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = localStorage.getItem("queueIndex");
    return saved !== null ? parseInt(saved, 10) : null;
  });

  const [isLooping, setIsLooping] = useState(
    () => localStorage.getItem("isLooping") === "true"
  );

  useEffect(() => {
    localStorage.setItem("queue", JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    if (currentIndex !== null) {
      localStorage.setItem("queueIndex", currentIndex.toString());
    } else {
      localStorage.removeItem("queueIndex");
    }
  }, [currentIndex]);

  useEffect(() => {
    localStorage.setItem("isLooping", isLooping.toString());
  }, [isLooping]);

  const addToQueue = (song) => {
    setQueue(prev => [
      ...prev,
      { ...song, repeat: 1, played: 0 }
    ]);
  };

  const updateRepeat = (index, value) => {
    setQueue(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], repeat: value };
      return updated;
    });
  };

  const removeFromQueue = (index) => {
    setQueue(prev => {
      const updated = prev.filter((_, i) => i !== index);

      if (currentIndex !== null) {
        if (index === currentIndex) {
          setCurrentIndex(null);
        } else if (index < currentIndex) {
          setCurrentIndex(currentIndex - 1);
        }
      }

      return updated;
    });
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentIndex(null);
    localStorage.removeItem("queue");
    localStorage.removeItem("queueIndex");
  };

  return (
    <QueueContext.Provider
      value={{
        queue,
        currentIndex,
        isLooping,
        setQueue,
        setCurrentIndex,
        setIsLooping,
        addToQueue,
        updateRepeat,
        removeFromQueue,
        clearQueue
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};