import { useState } from "react";
import { Container, Row, Col, Form, Button, Alert, Spinner } from "react-bootstrap";
import axios from "axios";

export default function AddSong() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isValidYouTubeUrl = (link) => {
    const regex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/;
    return regex.test(link);
  };

  const handleAddSong = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please enter a song name");
      return;
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:8080/addSong", {
        title: title.trim(),
        youtubeUrl: youtubeUrl.trim()
      });

      console.log("Song added successfully:", response.data);
      setSuccess("🎵 Song added successfully!");

      setTitle("");
      setYoutubeUrl("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Row>
        <Col>
          <h2 className="text-center mb-4">Add a Song</h2>

          {isLoading && (
            <Alert variant="info" className="d-flex align-items-center">
              <Spinner animation="border" size="sm" className="me-2" />
              Processing song, please wait… This may take a few seconds 🎶
            </Alert>
          )}

          <Form onSubmit={handleAddSong}>
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Enter song name"
                value={title}
                disabled={isLoading}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Enter YouTube song URL"
                value={youtubeUrl}
                disabled={isLoading}
                onChange={(e) => setYoutubeUrl(e.target.value)}
              />
            </Form.Group>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <div className="d-grid">
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner
                      animation="border"
                      size="sm"
                      className="me-2"
                    />
                    Adding song…
                  </>
                ) : (
                  "Add Song"
                )}
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
