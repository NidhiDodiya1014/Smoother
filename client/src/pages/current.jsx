import { useEffect, useRef, useState } from "react";
import { Card, Button, ListGroup } from "react-bootstrap";

function Current({ queue, removeFromQueue, clearQueue }) {
  const audioRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(null);

  useEffect(() => {
    if (currentIndex !== null && audioRef.current) {
      audioRef.current.play();
    }
  }, [currentIndex]);

  const playQueue = () => {
    if (queue.length === 0) return;
    setCurrentIndex(0);
  };

  const playNext = () => {
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(null);
    }
  };

  return (
    <Card className="m-3 shadow">
      <Card.Body>
        <Card.Title>🎶 Current Queue</Card.Title>

        {queue.length === 0 && <p>No songs selected</p>}

        <ListGroup className="mb-3">
          {queue.map((song, index) => (
            <ListGroup.Item
              key={song._id}
              active={index === currentIndex}
              className="d-flex justify-content-between align-items-center"
            >
              {song.title}
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => removeFromQueue(song._id)}
              >
                ✕
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>

        <div className="d-flex gap-2">
          <Button variant="success" onClick={playQueue}>
            ▶ Play
          </Button>
          <Button variant="secondary" onClick={clearQueue}>
            Clear
          </Button>
        </div>

        {currentIndex !== null && (
          <audio
            ref={audioRef}
            src={queue[currentIndex].audioUrl}
            onEnded={playNext}
            controls
            className="w-100 mt-3"
          />
        )}
      </Card.Body>
    </Card>
  );
}

export default Current;
