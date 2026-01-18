import { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Alert
} from "react-bootstrap";

function Home({ addToQueue, queue }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [expandedSong, setExpandedSong] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    try {
      const res = await axios.get("http://localhost:8080/songs");
      setSongs(res.data);
    } catch (err) {
      console.error("Failed to load songs", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSong = async (id) => {
    if (!window.confirm("Delete this song?")) return;

    try {
      setProcessing(true);
      await axios.delete(`http://localhost:8080/songs/${id}`);
      setSongs(prev => prev.filter(song => song._id !== id));
      setExpandedSong(null);
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setProcessing(false);
    }
  };

  /* =========================
     EXPANDED VIEW (single song)
  ========================= */
  if (expandedSong) {
    return (
      <Container className="mt-4">
        <Button
          variant="secondary"
          onClick={() => {
            setExpandedSong(null);
            setAutoPlay(false);
          }}
        >
          ← Back to all songs
        </Button>

        <Card className="mt-4 shadow">
          <Card.Body>
            <Card.Title>{expandedSong.title}</Card.Title>

            <audio
              controls
              autoPlay={autoPlay}
              src={expandedSong.audioUrl}
              className="w-100 mt-3"
            />

            <div className="d-flex gap-2 mt-3">
              <Button
                variant="danger"
                disabled={processing}
                onClick={() => deleteSong(expandedSong._id)}
              >
                {processing ? "Deleting..." : "Delete"}
              </Button>

              <Button
                variant="success"
                disabled={queue.some(q => q._id === expandedSong._id)}
                onClick={() => addToQueue(expandedSong)}
              >
                {queue.some(q => q._id === expandedSong._id)
                  ? "Already in Queue ✓"
                  : "Add to Queue"}
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  /* =========================
     GRID VIEW (compact cards)
  ========================= */
  return (
    <Container className="mt-4">
      <h2 className="mb-4">All Songs</h2>

      {loading && (
        <div className="text-center mt-5">
          <Spinner animation="border" />
          <p>Loading songs...</p>
        </div>
      )}

      {!loading && songs.length === 0 && (
        <Alert variant="secondary">No songs added yet.</Alert>
      )}

      <Row>
        {songs.map(song => (
          <Col
            key={song._id}
            xs={12}
            sm={6}
            md={4}
            lg={3}
            className="mb-3"
          >
            <Card className="h-100 shadow-sm">
              <Card.Body className="d-flex flex-column justify-content-between">
                <Card.Title
                  style={{
                    fontSize: "0.95rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}
                >
                  🎵 {song.title}
                </Card.Title>

                <div className="d-grid gap-2 mt-3">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => {
                      setExpandedSong(song);
                      setAutoPlay(true);
                    }}
                  >
                    ▶ Play
                  </Button>

                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      setExpandedSong(song);
                      setAutoPlay(false);
                    }}
                  >
                    View more
                  </Button>

                  <Button
                    variant="outline-success"
                    size="sm"
                    disabled={queue.some(q => q._id === song._id)}
                    onClick={() => addToQueue(song)}
                  >
                    {queue.some(q => q._id === song._id)
                      ? "Selected ✓"
                      : "Add to Queue"}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default Home;
