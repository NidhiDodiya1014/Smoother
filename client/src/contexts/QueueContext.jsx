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
  const [queue, setQueue] = useState(() => {
    const saved = localStorage.getItem('queue');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = localStorage.getItem('queueIndex');
    return saved !== null ? parseInt(saved) : null;
  });
  const [isLooping, setIsLooping] = useState(() => {
    const saved = localStorage.getItem('isLooping');
    return saved === 'true';
  });

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

  const addToQueue = (song) => {
    setQueue(prev => {
      if (prev.find(s => s._id === song._id)) return prev;
      return [...prev, song];
    });
  };

  const removeFromQueue = (id) => {
    setQueue(prev => {
      const newQueue = prev.filter(song => song._id !== id);
      const removedIndex = prev.findIndex(s => s._id === id);
      if (removedIndex !== -1 && currentIndex !== null) {
        if (removedIndex < currentIndex) {
          setCurrentIndex(currentIndex - 1);
        } else if (removedIndex === currentIndex) {
          if (newQueue.length > 0 && currentIndex < newQueue.length) {
            setCurrentIndex(currentIndex);
          } else if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
          } else {
            setCurrentIndex(null);
          }
        }
      }
      return newQueue;
    });
  };

  const clearQueue = () => {
    setQueue([]);
    setCurrentIndex(null);
    localStorage.removeItem('queue');
    localStorage.removeItem('queueIndex');
  };

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

