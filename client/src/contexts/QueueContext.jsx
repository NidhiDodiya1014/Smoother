import { createContext, useContext, useState, useEffect } from 'react';

const QueueContext = createContext();

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within QueueProvider');
  }
  return context;
};

export const QueueProvider = ({ children }) => {

  /* ================= SAFE PARSE HELPERS ================= */

  const safeParse = (value, fallback) => {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  /* ================= STATE ================= */

  const [queue, setQueue] = useState(() =>
    safeParse(localStorage.getItem('queue'), [])
  );

  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = localStorage.getItem('queueIndex');
    return saved !== null ? parseInt(saved, 10) : null;
  });

  const [isLooping, setIsLooping] = useState(() =>
    localStorage.getItem('isLooping') === 'true'
  );

  /* ================= LOCAL STORAGE ================= */

  useEffect(() => {
    localStorage.setItem('queue', JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    if (currentIndex !== null) {
      localStorage.setItem('queueIndex', currentIndex.toString());
    } else {
      localStorage.removeItem('queueIndex');
    }
  }, [currentIndex]);

  useEffect(() => {
    localStorage.setItem('isLooping', isLooping.toString());
  }, [isLooping]);

  /* ================= QUEUE OPERATIONS ================= */

  const addToQueue = (song) => {
    setQueue(prev => {
      if (prev.find(s => s._id === song._id)) return prev;
      return [...prev, song];
    });
  };

  const removeFromQueue = (id) => {
    setQueue(prevQueue => {
      const removedIndex = prevQueue.findIndex(s => s._id === id);
      const newQueue = prevQueue.filter(song => song._id !== id);

      setCurrentIndex(prevIndex => {
        if (prevIndex === null || removedIndex === -1) return prevIndex;

        if (removedIndex < prevIndex) {
          return prevIndex - 1;
        }

        if (removedIndex === prevIndex) {
          if (newQueue.length > 0 && prevIndex < newQueue.length) {
            return prevIndex;
          }
          if (prevIndex > 0) {
            return prevIndex - 1;
          }
          return null;
        }

        return prevIndex;
      });

      return newQueue;
    });
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentIndex(null);
    localStorage.removeItem('queue');
    localStorage.removeItem('queueIndex');
  };

  /* ================= CONTEXT VALUE ================= */

  const value = {
    queue,
    currentIndex,
    isLooping,
    setQueue,
    setCurrentIndex,
    setIsLooping,
    addToQueue,
    removeFromQueue,
    clearQueue,
  };

  return (
    <QueueContext.Provider value={value}>
      {children}
    </QueueContext.Provider>
  );
};
